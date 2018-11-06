from ephem import *
from datetime import datetime,timedelta
import pytz
from tzwhere import tzwhere
import json

loc = open("/var/www/gauge/public/data/track.csv","r").readlines()[-1].strip().split(",")

def toMins(dec):
    dec = dec.split(".")
    base = dec[0]
    rest = int(round(float(dec[1]) / (10 ** len(dec[1])) * 60))
    return base+":"+str(rest)

lat = toMins(loc[1])
lon = toMins(loc[2])
elev = 8

tzw = tzwhere.tzwhere(forceTZ=True)
tzs = tzw.tzNameAt(float(loc[1]),float(loc[2]), forceTZ=True)
tz = pytz.timezone(tzs).utcoffset(datetime.utcnow(),is_dst=True)
tzc = pytz.timezone(tzs).tzname(datetime.utcnow(),is_dst=True)
#tz = timedelta(0,28800)
local = datetime.utcnow() + tz 
today = local.replace(hour=0,minute=0,second=0,microsecond=0) - tz
td = (tz.seconds / 3600.0) * hour

months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

print ''
normal = Observer()
normal.lat = lat
normal.lon = lon
normal.elevation = elev
normal.horizon = '0'
normal.date = today
nautical = Observer()
nautical.lat = lat
nautical.lon = lon
nautical.elevation = elev
nautical.horizon = '-17.7'
nautical.date = today
s = Sun()
m = Moon()

dawn = nautical.next_rising(s)
sunrise = normal.next_rising(s)

noon = normal.next_transit(s)
sunset = normal.next_setting(s)
dusk = nautical.next_setting(s)

moonrise = normal.next_rising(m)
moon = normal.next_transit(m)
moonset = normal.next_setting(m)

new_moon = next_new_moon(today)
full_moon = next_full_moon(today)

normal.date=sunrise
s.compute(normal)
sunrise_az = s.az

normal.date=noon
s.compute(normal)
noon_alt = s.alt

normal.date=sunset
s.compute(normal)
sunset_az = s.az

normal.date=moonrise
m.compute(normal)
moonrise_az = m.az

normal.date=moon
m.compute(normal)
moon_alt = m.alt
moon_phase = m.phase
normal.date=moon - 1
m.compute(normal)
waxing = m.phase < moon_phase

normal.date=moonset
m.compute(normal)
moonset_az = m.az

data = {}
data["dawn"] = "%s:%s" % (str(date(dawn+td).tuple()[3]).zfill(2), str(date(dawn+td).tuple()[4]).zfill(2))
data["sunrise"] = "%s:%s" % (str(date(sunrise+td).tuple()[3]).zfill(2), str(date(sunrise+td).tuple()[4]).zfill(2))
data["noon"] = "%s:%s" % (str(date(noon+td).tuple()[3]).zfill(2), str(date(noon+td).tuple()[4]).zfill(2))
data["sunset"] = "%s:%s" % (str(date(sunset+td).tuple()[3]).zfill(2), str(date(sunset+td).tuple()[4]).zfill(2))
data["dusk"] = "%s:%s" % (str(date(dusk+td).tuple()[3]).zfill(2), str(date(dusk+td).tuple()[4]).zfill(2))
data["moonrise"] = "%s:%s" % (str(date(moonrise+td).tuple()[3]).zfill(2), str(date(moonrise+td).tuple()[4]).zfill(2))
data["moon"] = "%s:%s" % (str(date(moon+td).tuple()[3]).zfill(2), str(date(moon+td).tuple()[4]).zfill(2))
data["moonset"] = "%s:%s" % (str(date(moonset+td).tuple()[3]).zfill(2), str(date(moonset+td).tuple()[4]).zfill(2))
nmd = date(new_moon+td).tuple()
data["new_moon"] = "%s %s, %s:%s" % (months[nmd[1]], str(nmd[2]), str(nmd[3]).zfill(2), str(nmd[4]).zfill(2))
fmd = date(full_moon+td).tuple()
data["full_moon"] = "%s %s, %s:%s" % (months[fmd[1]], str(fmd[2]), str(fmd[3]).zfill(2), str(fmd[4]).zfill(2))
data["phase"] = "%.2f" % moon_phase
data["waxing"] = waxing

data["sunrise_az"] = str(sunrise_az)
data["noon_alt"] = str(noon_alt)
data["sunset_az"] = str(sunset_az)
data["moonrise_az"] = str(moonrise_az)
data["moon_alt"] = str(moon_alt)
data["moonset_az"] = str(moonset_az)

data["timezone"] = tzs
data["timecode"] = tzc
data["timedelta"] = tz.seconds / 3600.0

with open("/var/www/gauge/public/data/sky.json","w") as file:
    json.dump(data, file)

