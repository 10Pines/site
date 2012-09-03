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
    source = open("#{Rails.root}/app/assets/javascripts/frequency_lists.js").read
    source << open("#{Rails.root}/app/assets/javascripts/adjacency_graphs.js").read
    source << open("#{Rails.root}/app/assets/javascripts/scoring.js").read
    source << open("#{Rails.root}/app/assets/javascripts/matching.js").read
    source << open("#{Rails.root}/app/assets/javascripts/init.js").read

    puts source
    context = ExecJS.compile(source)
    result = context.call("zxcvbn", params[:password], :bare => true)
    result['score']
  end
end
