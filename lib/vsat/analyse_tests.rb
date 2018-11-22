require "json"
require "csv"
stdout = [["Time","Beam","RTT(ms)","Download(Mbit/s)","Upload(Mbit/s)"]]
sheet = [["Beam","Date","Time","RTT(ms)","Download(kbit/s)","Upload(kbit/s)"]]
Dir.foreach("#{Dir.pwd}/speedtests/").sort.each do |f|
  next unless f.match(/\.txt$/)
  line = [f.match(/^\d{4}-\d{2}-\d{2}-\d{4}/)[0],f.split(/\./)[0].split(/-/)[-1]]
  row = [f.split(/\./)[0].split(/-/)[-1],f.match(/^\d{4}-\d{2}-\d{2}/)[0],f.split(/\./)[0].split(/-/)[-2]]
  file = File.read("#{Dir.pwd}/speedtests/#{f}").split(/\n/)
  begin
    line << file[4].match(/\d+\.\d+\s*ms\s*$/)[0]
    row << file[4].match(/\d+\.\d+\s*ms\s*$/)[0].gsub(/[^\d\.]*/,"")
  rescue
    line << ""
    row << nil
  end
  begin
    line << file[6].sub(/^\.*Download:\ /,"")
    row << file[6].sub(/^\.*Download:\ /,"").gsub(/[^\d\.]*/,"").to_f * 1024
  rescue
    line << ""
    row << nil
  end
  begin
    line << file[8].sub(/^\.*Upload:\ /,"")
    row << file[8].sub(/^\.*Upload:\ /,"").gsub(/[^\d\.]*/,"").to_f * 1024
  rescue
    line << ""
    row << nil
  end
  stdout << line
  sheet << row
end

stdout.each {|s| p s}
CSV.open("./analysis.csv","w") {|csv| sheet.each {|s| csv << s}}
