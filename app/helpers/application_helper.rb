require 'open-uri'
require 'nokogiri'
require "execjs"

module ApplicationHelper

  def render_styles_from_url
    if params[:styles_url].present?
      Nokogiri::HTML(open(params[:styles_url])).at_xpath('//textarea').text.html_safe
    end
  end

  def password_strength
    #source = open("#{Rails.root}/app/assets/javascripts/frequency_lists.js").read
    #source << open("#{Rails.root}/app/assets/javascripts/adjacency_graphs.js").read
    #source << open("#{Rails.root}/app/assets/javascripts/scoring.js").read
    #source << open("#{Rails.root}/app/assets/javascripts/matching.js").read
    #source << open("#{Rails.root}/app/assets/javascripts/init.js").read
    source = File.open("#{Rails.root}/config/zxcvbn.js").read

    puts ExecJS.runtime.name
    context = ExecJS.compile(source)
    result = context.call("zxcvbn", 'pepe')
    result['score']
  end
end
