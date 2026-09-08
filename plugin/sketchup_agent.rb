require 'sketchup.rb'
require 'extensions.rb'

module RodrigoIbanezM
  module SketchupAgent
    EXTENSION = SketchupExtension.new('SketchUp Agent', 'sketchup_agent/main')
    EXTENSION.description = 'Bridge between SketchUp and the SketchUp Agent service.'
    EXTENSION.version = '0.1.0'
    EXTENSION.creator = 'Rodrigo Ibanez'
    Sketchup.register_extension(EXTENSION, true)
  end
end
