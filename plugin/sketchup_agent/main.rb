require 'json'
require 'net/http'
require 'uri'

module RodrigoIbanezM
  module SketchupAgent
    module Bridge
      extend self

      DEFAULT_BASE_URL = 'https://sketchup-agent-tau.vercel.app'.freeze
      POLL_SECONDS = 2.0
      SNAPSHOT_SECONDS = 10.0
      MAX_ENTITY_DEPTH = 12

      def start
        return if @timer
        @base_url = Sketchup.read_default('SketchupAgent', 'base_url', DEFAULT_BASE_URL)
        @session_id = Sketchup.read_default('SketchupAgent', 'session_id', nil)
        @session_id ||= "su-#{Time.now.to_i}-#{rand(100000..999999)}"
        Sketchup.write_default('SketchupAgent', 'session_id', @session_id)
        @snapshot_version = 0
        @last_snapshot_at = nil
        @timer = UI.start_timer(POLL_SECONDS, true) { poll_once }
        post_model_snapshot
        UI.messagebox("SketchUp Agent conectado.\nSession: #{@session_id}")
      end

      def stop
        return unless @timer
        UI.stop_timer(@timer)
        @timer = nil
      end

      def poll_once
        maybe_post_model_snapshot

        uri = URI("#{@base_url}/api/commands?session_id=#{URI.encode_www_form_component(@session_id)}")
        response = Net::HTTP.get_response(uri)
        return unless response.is_a?(Net::HTTPSuccess)

        payload = JSON.parse(response.body)
        command = payload['command']
        return unless command

        result = execute(command)
        post_result(command['command_id'], result)
        post_model_snapshot if result['ok']
      rescue => e
        puts("SketchUp Agent poll error: #{e.class}: #{e.message}")
      end

      def maybe_post_model_snapshot
        return post_model_snapshot unless @last_snapshot_at
        post_model_snapshot if (Time.now - @last_snapshot_at) >= SNAPSHOT_SECONDS
      end

      def post_model_snapshot
        model = Sketchup.active_model
        @snapshot_version = (@snapshot_version || 0) + 1
        snapshot = build_model_snapshot(model)

        uri = URI("#{@base_url}/api/model-state")
        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/json'
        request.body = JSON.generate(snapshot)
        response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') { |http| http.request(request) }
        raise "Model snapshot HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)
        @last_snapshot_at = Time.now
      rescue => e
        puts("SketchUp Agent snapshot error: #{e.class}: #{e.message}")
      end

      def build_model_snapshot(model)
        entities = []
        collect_entities(model.entities, nil, entities, 0)

        selection = model.selection.to_a.select { |entity| supported_context_entity?(entity) }.map(&:persistent_id)
        units_code = model.options['UnitsOptions']['LengthUnit'] rescue nil

        {
          'session_id' => @session_id,
          'snapshot_version' => @snapshot_version,
          'captured_at' => Time.now.utc.iso8601,
          'model' => {
            'title' => model.title,
            'path' => model.path,
            'guid' => safe_model_guid(model),
            'modified' => model.modified?,
            'units' => unit_name(units_code)
          },
          'selection' => selection,
          'entities' => entities,
          'materials' => model.materials.map(&:name),
          'tags' => model.layers.map(&:name),
          'scenes' => model.pages.map { |page| { 'name' => page.name } }
        }
      end

      def collect_entities(collection, parent_id, output, depth)
        return if depth > MAX_ENTITY_DEPTH

        collection.each do |entity|
          next unless supported_context_entity?(entity)

          record = entity_record(entity, parent_id)
          output << record
          child_collection = entity.is_a?(Sketchup::Group) ? entity.entities : entity.definition.entities
          collect_entities(child_collection, entity.persistent_id, output, depth + 1)
        end
      end

      def supported_context_entity?(entity)
        entity.is_a?(Sketchup::Group) || entity.is_a?(Sketchup::ComponentInstance)
      end

      def entity_record(entity, parent_id)
        bounds = entity.bounds
        record = {
          'persistent_id' => entity.persistent_id,
          'parent_id' => parent_id,
          'type' => entity.is_a?(Sketchup::Group) ? 'group' : 'component_instance',
          'name' => entity.name.to_s,
          'tag' => entity.layer ? entity.layer.name : nil,
          'material' => entity.material ? entity.material.name : nil,
          'bbox_mm' => [
            mm_number(bounds.min.x), mm_number(bounds.min.y), mm_number(bounds.min.z),
            mm_number(bounds.max.x), mm_number(bounds.max.y), mm_number(bounds.max.z)
          ],
          'transform' => transformation_payload(entity.transformation)
        }
        record['definition_name'] = entity.definition.name.to_s if entity.is_a?(Sketchup::ComponentInstance)
        record
      end

      def transformation_payload(transformation)
        values = transformation.to_a.map(&:to_f)
        values[12] = mm_number(values[12])
        values[13] = mm_number(values[13])
        values[14] = mm_number(values[14])
        values
      end

      def safe_model_guid(model)
        model.respond_to?(:guid) ? model.guid : nil
      rescue
        nil
      end

      def unit_name(code)
        {
          0 => 'inches',
          1 => 'feet',
          2 => 'millimeters',
          3 => 'centimeters',
          4 => 'meters',
          5 => 'yards'
        }[code] || 'unknown'
      end

      def execute(command)
        model = Sketchup.active_model
        action = command['action']
        args = command['args'] || {}

        model.start_operation("SketchUp Agent: #{action}", true)
        result = case action
        when 'create_box'
          create_box(model, args)
        when 'move_entity'
          move_entity(model, args)
        when 'set_material'
          set_material(model, args)
        else
          raise ArgumentError, "Unsupported action: #{action}"
        end
        model.commit_operation
        { 'ok' => true, 'result' => result }
      rescue => e
        model.abort_operation if model
        { 'ok' => false, 'error' => e.message, 'error_type' => e.class.name }
      end

      def create_box(model, args)
        width = mm(args.fetch('width_mm'))
        depth = mm(args.fetch('depth_mm'))
        height = mm(args.fetch('height_mm'))
        origin = args.fetch('origin_mm', [0, 0, 0]).map { |v| mm(v) }

        group = model.active_entities.add_group
        x, y, z = origin
        pts = [
          [x, y, z], [x + width, y, z], [x + width, y + depth, z], [x, y + depth, z]
        ]
        face = group.entities.add_face(pts)
        raise 'Could not create face' unless face
        face.reverse! if face.normal.z < 0
        face.pushpull(height)
        group.name = args['name'] if args['name']
        { 'persistent_id' => group.persistent_id, 'name' => group.name }
      end

      def move_entity(model, args)
        entity = find_entity(model, args.fetch('persistent_id'))
        delta = args.fetch('delta_mm').map { |v| mm(v) }
        transformation = Geom::Transformation.translation(delta)
        entity.transform!(transformation)
        { 'persistent_id' => entity.persistent_id }
      end

      def set_material(model, args)
        entity = find_entity(model, args.fetch('persistent_id'))
        name = args.fetch('material_name')
        color = args['color_rgb']
        material = model.materials[name] || model.materials.add(name)
        material.color = Sketchup::Color.new(*color) if color
        entity.material = material
        { 'persistent_id' => entity.persistent_id, 'material' => material.name }
      end

      def find_entity(model, persistent_id)
        entity = model.find_entity_by_persistent_id(Integer(persistent_id))
        raise "Entity not found: #{persistent_id}" unless entity
        entity
      end

      def post_result(command_id, result)
        uri = URI("#{@base_url}/api/results")
        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/json'
        request.body = JSON.generate({ session_id: @session_id, command_id: command_id, result: result })
        Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') { |http| http.request(request) }
      end

      def mm(value)
        Float(value).mm
      end

      def mm_number(value)
        (Float(value) * 25.4).round(4)
      end
    end

    unless file_loaded?(__FILE__)
      menu = UI.menu('Extensions').add_submenu('SketchUp Agent')
      menu.add_item('Start Bridge') { Bridge.start }
      menu.add_item('Stop Bridge') { Bridge.stop }
      file_loaded(__FILE__)
    end
  end
end
