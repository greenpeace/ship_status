require "json"
require "pp"

hour = (Time.now().hour + JSON.parse(File.read("/var/www/gauge/public/data/sky.json"))["timedelta"]).floor
File.open("/var/www/gauge/public/data/test.txt","a") {|file| file << "#{hour}\n"}

if hour == 0
  File.open("/var/www/gauge/public/data/board.txt","w") do |file|
    file << "<p style='margin-bottom:-12px;'>Thought of the day:<blockquote>#{`fortune -s`.gsub(/\n/,"<br/>")}</blockquote></p>"
  end
end
 

