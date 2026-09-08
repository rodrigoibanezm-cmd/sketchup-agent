require 'json'
require 'net/http'
require 'uri'

module RodrigoIbanezM
  module SketchupAgent
    module Bridge
      extend self

      DEFAULT_BASE_URL = 'https://sketchup-agent-tau.vercel.app'.freeze
      POLL_SECONDS = 2.0

      def start
        return if @timer
        @base_url = Sketchup.read_default('SketchupAgent', 'base_url', DEFAULT_BASE_URL)
        @session_id = Sketchup.read_default('SketchupAgent', 'session_id', nil)
        @session_id ||= "su-#{Time.now.to_i}-#{rand(100000..999999)}"
        Sketchup.write_default('SketchupAgent', 'session_id', @session_id)
        @timer = UI.start_timer(POLL_SECONDS, true) { poll_once }
        UI.messagebox("SketchUp Agent conectado.\nSession: #{@session_id}")
      end

      def stop
        return unless @timer
        UI.stop_timer(@timer)
        @timer = nil
      end

      def poll_once
        uri = URI("#{@base_url}/api/commands?session_id=#{URI.encode_www_form_component(@session_id)}")
        response = Net::HTTP.get_response(uri)
        return unless response.is_a?(Net::HTTPSuccess)

        payload = JSON.parse(response.body)
        command = payload['command']
        return unless command

        result = execute(command)
        post_result(command['command_id'], result)
      rescue => e
        puts("SketchUp Agent poll error: #{e.class}: #{e.message}")
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
    end

    unless file_loaded?(__FILE__)
      menu = UI.menu('Extensions').add_submenu('SketchUp Agent')
      menu.add_item('Start Bridge') { Bridge.start }
      menu.add_item('Stop Bridge') { Bridge.stop }
      file_loaded(__FILE__)
    end
  end
end
