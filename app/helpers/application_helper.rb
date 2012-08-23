require 'open-uri'
require 'nokogiri'

module ApplicationHelper

  def render_styles_from_url
    if params[:styles_url].present?
      Nokogiri::HTML(open(params[:styles_url])).at_xpath('//textarea').text.html_safe
    end
  end
end
