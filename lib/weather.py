import urllib2
import json

loc = open("/var/www/gauge/public/data/track.csv","r").readlines()[-1].strip().split(",")

w = urllib2.urlopen("http://api.openweathermap.org/data/2.5/weather?lat="+loc[1]+"&lon="+loc[2]+"&APPID=3d6d04edb0fc084dd68b3a3d5e8c4ba6&units=metric").read()
w = json.loads(w)

fd = open('/var/www/gauge/public/data/weather.csv','a')
fd.write(",".join(str(x) for x in [
        w["dt"],
        w["name"],
        w["weather"][0]["description"],
        w["main"]["temp"],
        w["main"]["pressure"],
        w["wind"]["speed"],
        w["wind"]["deg"],
        w["clouds"]["all"]
    ]))
fd.write("\n")
fd.close()

with open("/var/www/gauge/public/data/weather.json","w") as file:
    json.dump(w, file)

with open("/var/www/gauge/public/data/forecast.json","w") as file:
    w = urllib2.urlopen("http://api.openweathermap.org/data/2.5/forecast?lat="+loc[1]+"&lon="+loc[2]+"&APPID=3d6d04edb0fc084dd68b3a3d5e8c4ba6&units=metric").read()
    json.dump(json.loads(w), file)

