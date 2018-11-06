#coding: utf-8

require 'sinatra'
require 'sinatra/content_for'
require 'unicode_utils'
require 'unidecoder'
require 'json'
require 'haml'
require 'csv'
require 'pp'
require './lib/util.rb'

$session = nil

get "/?" do 
  haml :index
end

get "/csv/:type/:period/?" do 
  parse_csv params[:type], params[:period].to_i
end

post "/board/?" do 
  File.open("#{Dir.pwd}/public/data/board.txt","a") do |file|
    file << "<hr/><p>#{params['text']}</p>"
  end
  return "ok"
end

not_found do 
  redirect to "/"
end

error do 
  return haml :error
end

$content = []
$cats = {}
$cnms = {}
$sitename = "MYEZ"
$title = $sitename
$domain = "//watch.myez.gl3"
$description = "Let the crew know \"where the fuck they are!\""



["time","lat","lon","hdg","cog","sog","stw","twa","tws","rwa","rws","avgs","gust","sds","avga","mina","maxa","sda","rtt","sdp","lss","dpt","alt","ber","bem"]
["  0 "," 1 "," 2 "," 3 "," 4 "," 5 "," 6 "," 7 "," 8 "," 9 "," 10"," 11 "," 12 "," 13"," 14 "," 15 "," 16 "," 17"," 18"," 19"," 20"," 21"," 22"," 23"," 24"]


def parse_csv type, period
  type.downcase!
  radial = {"hdg"=>3,"cog"=>4,"alt"=>22,"ber"=>23}
  scalar = {"sog"=>5,"stw"=>6,"tws"=>8,"rtt"=>18,"lss"=>20,"dpt"=>21}
  scope = period * 60
  batch = (scope / 480.0).round
  batch == 0 ? batch = 1 : batch = batch
  result = []
  max = scalar.keys.include?(type) ? 0 : nil

  File.readlines("/var/www/gauge/public/data/log.csv").reverse[0..(scope-1)].map{|x| x.strip.split(/\s*,\s*/)}.each_slice(batch) do |a| 
    data = []
    if type == "tws"
      sd = a.map{|x| x[13].to_f}.avg.round(2)
      avg = a.map{|x| x[11].to_f}.avg.round(2)
      gust = a.map{|x| x[12].to_f}.avg.round(2)
      max = (max > gust ? max : gust)
      data << (avg - sd).round(2)
      data << (avg + sd).round(2)
      data << gust
    elsif scalar.keys.include? type
      data << a.map{|x| x[scalar[type]].to_f}.avg.round(2)
      max = (max > data.last ? max : data.last)
    elsif type == "twa"
      sd = a.map{|x| x[17].to_f}.avg.round(2) * 12
      avg = a.map{|x| x[14].to_f}.avg.round(2)
      data << ((avg - sd + 180 ) % 360 - 180).round(2)
      data << ((avg + sd + 180 ) % 360 - 180).round(2)
    elsif radial.keys.include? type
      data << a.map{|x| x[radial[type]].to_f}.avg.round(2)
    end
    result << data
  end

  {:max=>max,:data=>result.reverse}.to_json

end

