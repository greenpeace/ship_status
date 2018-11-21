require '/var/www/gauge/lib/util.rb'
require "nmea_plus"  
require "socket"
require "json"
require 'pp'  

$avg_period = 180

$decoder = NMEAPlus::Decoder.new
$streamSock = TCPSocket.new( "192.168.212.8", 7004 )  
$windSock = TCPSocket.new( "192.168.212.8", 7008 )  
$pos = []
$t0 = Time.now - 60
$rwa = []
$twa = []
$rws = []
$tws = []
$rtt = []
$sdp = []
$lss = []
$png = {}

File.open("/var/www/gauge/public/data/nmea.json","w"){|f|f<<"{}"} unless File.exists?("/var/www/gauge/public/data/nmea.json")

$dict = { 
          "HDM"=>"Heading - Magnetic Actual vessel heading in degrees Magnetic.",
          "GGA"=>"Global Positioning System Fix Data",
          "DTM"=>"Datum Reference",
          "HDT"=>"Heading - True Actual vessel heading in degrees True produced by any device or system producing true heading.",
          "ROT"=>"Rate Of Turn",
          "MWV-t"=>"True Wind Speed and Angle",
          "MWV-r"=>"Relative Wind Speed and Angle",
          "VHW"=>"Water speed and heading",
          "RMC"=>"Recommended Minimum Navigation Information",
          "VBW"=>"Dual Ground/Water Speed",
          "VTG"=>"Track made good and Ground speed",
          "ZDA"=>"Time & Date - UTC, day, month, year and local time zone.",
          "DBT"=>"Depth below transducer",
          "DPT"=>"Depth of Water",
          "VLW"=>"Distance Traveled through Water",
          "PNG"=>"Ping status of networks*",
          #"VDO"=>"Ownship Vessel Data Message - This message type thinly wraps AIS payloads.",
          #"VDM"=>"Vessel Data Message - This message type thinly wraps AIS payloads.",
        }

$res = $dict.keys.map{|x| [x,0]}.to_h

def parse_logs scope
  scope *= 60
  batch = (scope / 480.0).round
  batch == 0 ? batch = 1 : batch = batch
  speed = []
  angle = []
  smax = 0

  File.readlines("/var/www/gauge/public/data/log.csv").reverse[0..(scope-1)].map{|x| x.strip.split(/\s*,\s*/)}.each_slice(batch) do |a| 
    data = []
    sd = a.map{|x| x[13].to_f}.avg.round(2)
    avg = a.map{|x| x[11].to_f}.avg.round(2)
    gust = a.map{|x| x[12].to_f}.avg.round(2)
    smax = (smax > gust ? smax : gust)
    data << (avg - sd).round(2)
    data << (avg + sd).round(2)
    data << gust
    speed << data
    data = []
    sd = a.map{|x| x[17].to_f}.avg.round(2) * 12
    avg = a.map{|x| x[14].to_f}.avg.round(2)
    #data << a.map{|x| x[15].to_f}.avg.round(2)
    data << ((avg - sd).round(2) + 180 ) % 360 - 180
    data << ((avg + sd).round(2) + 180 ) % 360 - 180
    #data << a.map{|x| x[16].to_f}.avg.round(2)
    angle << data
  end

  File.open("/var/www/gauge/public/data/speed.csv","w") do |file|
    file << smax
    file << "\n"
    speed.each do |row|
      file << "#{row.join(",")}\n"
    end
  end

  File.open("/var/www/gauge/public/data/angle.csv","w") do |file|
    angle.each do |row|
      file << "#{row.join(",")}\n"
    end
  end

end

def log data
  precision = 3
  if data.has_key?("GGA")
    lat = data["GGA"]["latitude"].round(5)
    lon = data["GGA"]["longitude"].round(5)
  elsif data.has_key?("RMC")
    lat = data["RMC"]["latitude"].round(5)
    lon = data["RMC"]["longitude"].round(5)
  else
    return
  end
  header = ["time","lat","lon","hdg","cog","sog","stw","twa","tws","rwa","rws","avgs","gust","sds","avga","mina","maxa","sda","dpt"]
  row = [lat,lon]
  if row.map{|l|l.round(precision)} == $pos.map{|l|l.round(precision)}
    if Time.now - $t0 >= 60
      $t0 = $t0 + 60

      row << data["HDT"]["true_heading_degrees"].round(1)

      if data.has_key?("RMC")
        row << data["RMC"]["track_made_good_degrees_true"].round(1) 
        row << data["RMC"]["speed_over_ground_knots"].round(1)
      elsif data.has_key?("VTG")
        row << data["VTG"]["track_degrees_true"].round(1) 
        row << data["VTG"]["speed_knots"].round(1)
      else
        row << ""
        row << ""
      end
      if data.has_key?("VHW")
        row << data["VHW"]["water_speed_knots"].round(1) 
      else
        row << ""
      end

      row << data["MWV-t"]["wind_angle"].round(1)
      row << data["MWV-t"]["wind_speed"].round(1)
      row << data["MWV-r"]["wind_angle"].round(1)
      row << data["MWV-r"]["wind_speed"].round(1)

      row << data["MWV-t"]["average_speed"].round(2) #11
      row << data["MWV-t"]["gust_speed"].round(2)
      row << data["MWV-t"]["std_dev_speed"].round(3)
      row << data["MWV-t"]["average_angle"].round(2)
      row << data["MWV-t"]["min_angle"].round(2)
      row << data["MWV-t"]["max_angle"].round(2)
      row << data["MWV-t"]["std_dev_angle"].round(3)

=begin
      row << data["PNG"]["rtt"].to_i
      row << data["PNG"]["sdp"].to_i
      row << data["PNG"]["lss"].round(2)
=end

      if (data.has_key?("DPT") and data["DPT"].has_key?("depth_meters")) 
        row << (data["DPT"]["depth_meters"] + 2.1).round(1)
      else
        row << nil
      end

=begin
      row << data["PNG"]["alt"].round(2)
      row << data["PNG"]["ber"].round(2)
      row << data["PNG"]["bem"].to_i
=end

      row.unshift Time.now.to_i
      File.open("/var/www/gauge/public/data/log.csv","a") do |file|
        file << "#{row.join(",")}\n"
      end
    end
  else
    $pos = row.dup
    row.unshift Time.now.to_i
    File.open("/var/www/gauge/public/data/track.csv","a") do |file|
      file << "#{row.join(",")}\n"
    end
  end
  parse_logs 3
end

def receive_gps
  raw = $streamSock.recv(4096)
  cut = raw.match(/\r\n$/).nil?
  sentences = raw.split(/\r\n/)
  sentences.pop if cut
  tres = {}
  begin
    res = JSON.parse(File.read("/var/www/gauge/public/data/nmea.json"))
  rescue
    res = {}
  end
  res[:ts] = Time.now.to_i
  sparehdt = ""
  sentences.reverse.each_with_index do |sentence|
    begin
      msg = $decoder.parse(sentence)
      next if msg.talker == "AI"
      mt = msg.message_type
      if mt == "HDT"
        #next unless msg.talker == "HE"
      end
      $res[mt] += 1
      if tres.has_key?(mt)
        next
      else
        res[mt] = {'desc' => $dict[mt]}
        tres[mt] = true
      end
      #puts
      #puts "#{mt}: #{$dict[mt]}"
      msg.methods.each do |method|
        break if method == :message_type
        #puts "#{method}: #{eval("msg.#{method}")}"
        res[mt][method.to_s] = eval("msg.#{method}")
      end
    rescue => e
      #puts "\e[31mParse error: #{sentence}\e[0m"
    end
  end
  if res.has_key?("GGA")
    begin
      File.open("/var/www/gauge/public/data/nmea.json","w") do |file|
        file << res.to_json
      end
    rescue
    end
  end
end

def receive_wind
  raw = $windSock.recv(4096)
  cut = raw.match(/\r\n$/).nil?
  sentences = raw.split(/\r\n/)
  sentences.pop if cut
  tres = {}
  begin
    res = JSON.parse(File.read("/var/www/gauge/public/data/nmea.json"))
  rescue
    res = {}
  end
  res[:ts] = Time.now.to_i
  sentences.reverse.each_with_index do |sentence|
    begin
      msg = $decoder.parse(sentence)
      next if msg.talker == "AI"
      mt = msg.message_type
      if mt == "MWV"
        mt = "MWV-r"
        res[mt] = {'desc' => $dict[mt]}
        #$rws << (msg.wind_speed * 1.944).round(1)
        $rws << (msg.wind_speed).round(1)
        $rwa << msg.wind_angle
        $rws.shift while $rws.length > $avg_period
        $rwa.shift while $rwa.length > $avg_period
        $res[mt] += 1
        if res.has_key?("HDT")
          mt = "MWV-t"
          res[mt] = {'desc' => $dict[mt]}
          #$tws << (msg.wind_speed * 1.944).round(1)
          if res.has_key?("VTG")
            $tws << add_polar_vectors([[msg.wind_angle,msg.wind_speed], [res["VTG"]["track_degrees_true"]-180, res["VTG"]["speed_knots"]]])[1].round(1)
          else
            $tws << msg.wind_angle
          end
          $twa << ((msg.wind_angle + res["HDT"]["true_heading_degrees"]) % 360).to_i
          p $tws
          p $twa
          $tws.shift while $tws.length > $avg_period
          $twa.shift while $twa.length > $avg_period
          $res[mt] += 1
        end
      end
      #puts
      #puts "#{mt}: #{$dict[mt]}"
      msg.methods.each do |method|
        break if method == :message_type
        #puts "#{method}: #{eval("msg.#{method}")}"
        res[mt][method.to_s] = eval("msg.#{method}")
      end
    rescue => e
      #puts "Parse error: #{sentence}"
    end
  end

  res["MWV-t"]["wind_speed"] = $tws.last.to_i
  res["MWV-t"]["average_speed"] = $tws.avg
  res["MWV-t"]["gust_speed"] = $tws.max
  res["MWV-t"]["std_dev_speed"] = $tws.std_dev
  res["MWV-t"]["wind_angle"] = $twa.last
  res["MWV-t"]["average_angle"] = $twa.avg(true) % 360
  res["MWV-t"]["min_angle"] = $twa.min
  res["MWV-t"]["max_angle"] = $twa.max
  res["MWV-t"]["std_dev_angle"] = $twa.std_dev(true)

  res["MWV-r"]["wind_speed"] = $rws.last
  res["MWV-r"]["average_speed"] = $rws.avg
  res["MWV-r"]["gust_speed"] = $rws.max
  res["MWV-r"]["std_dev_speed"] = $rws.std_dev
  res["MWV-r"]["wind_angle"] = $rwa.last
  res["MWV-r"]["average_angle"] = $rwa.avg(true) % 360
  res["MWV-r"]["min_angle"] = $rwa.min
  res["MWV-r"]["max_angle"] = $rwa.max
  res["MWV-r"]["std_dev_angle"] = $rwa.std_dev(true)

=begin
  $rtt << $png["vsat"]["rtt"]
  $sdp << $png["vsat"]["sdp"]
  $lss << $png["vsat"]["lss"]
  $rtt.shift while $rtt.length > 60
  $sdp.shift while $sdp.length > 60
  $lss.shift while $lss.length > 60
  res["PNG"] = {} unless res.has_key?("PNG")
  res["PNG"]["rtt"] = $rtt.avg
  res["PNG"]["sdp"] = $sdp.avg
  res["PNG"]["lss"] = $lss.avg

  sats = JSON.parse(File.read("/var/www/gauge/public/data/sat.json"))
  sat = (sats.map {|s| s["active"] == 1 ? s : nil} - [nil])[0]
  res["PNG"]["alt"] = sat["alt"].round(2)
  res["PNG"]["ber"] = (sat["az"].to_f - res["HDT"]["true_heading_degrees"] + 360 ).round(2) % 360
  res["PNG"]["bem"] = sat["id"].to_i
=end

  if res.has_key?("MWV-r")
    begin
      File.open("/var/www/gauge/public/data/nmea.json","w") do |file|
        file << res.to_json
      end
      log res
    rescue => e
      puts e.backtrace
      log res
    end
  end
end

def polar2cart a, r=nil
  a, r = *a unless r
  x = Math.cos( a / 180.0 * Math::PI ) * r
  y = Math.sin( a / 180.0 * Math::PI ) * r
  [x,y]
end

def cart2polar x, y=nil
  x, y = *x unless y
  a = Math.atan2(y, x) * 180.0 / Math::PI
  r = ( x * x + y * y ) ** 0.5
  [a,r]
end

def add_polar_vectors a
  x, y = 0, 0
  a.each do |v|
    c = polar2cart v
    x += c[0]
    y += c[1]
  end
  cart2polar [x,y]
end

loop do
  begin
=begin
    pings = `ssh root@router.myez.gl3 -C "/usr/local/sbin/pfSsh.php playback gatewaystatus" | grep -P "none$"`.split(/[\r\n]+/)
    pings.each do |line|
      next unless line.match(/^(3G|VSAT_Ku)\s+/)
      png = line.split(/\s+/)
      $png[png[0]] = {
        "rtt"  => png[3].gsub(/\D/,"").to_i,
        "sdp"   => png[4].gsub(/\D/,"").to_i,
        "lss" => png[5].gsub(/\D/,"").to_f
      }
    end
=end
    sleep 1
    receive_gps
    receive_wind
  rescue SystemExit, Interrupt
=begin
    print "\r"
    pp $res
    puts
    p $rwa
    p $twa
    p $rws
    p $tws
=end
    exit 0
  end
end

$streamSock.close  
$windSock.close  

