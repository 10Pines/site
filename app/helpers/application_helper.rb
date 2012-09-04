#require 'open-uri'
#require 'nokogiri'
require "execjs"

module ApplicationHelper

  #def render_styles_from_url
  #  if params[:styles_url].present?
  #    Nokogiri::HTML(open(params[:styles_url])).at_xpath('//textarea').text.html_safe
  #  end
  #end

  def password_strength
    source = File.open("#{Rails.root}/config/zxcvbn.js").read

    puts ExecJS.runtime.name
    puts source
    context = ExecJS.compile(source)
    result = context.call("zxcvbn", 'pepe')
    result['score']
  end
end
