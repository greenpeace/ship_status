from ephem import *
from datetime import datetime
import json, math

loc = open("/var/www/gauge/public/data/track.csv","r").readlines()[-1].strip().split(",")

def toMins(dec):
    dec = dec.split(".")
    base = dec[0]
    rest = int(round(float(dec[1]) / (10 ** len(dec[1])) * 60))
    return base+":"+str(rest)

lat = toMins(loc[1])
lon = toMins(loc[2])
elev = 8

normal = Observer()
normal.lat = lat
normal.lon = lon
normal.elevation = elev
normal.horizon = '0'
normal.date = datetime.utcnow()
print normal.date
s = Sun(normal)
m = Moon(normal)

data = {
  "sun": {
    "alt":s.alt / math.pi * 180,
    "az":s.az / math.pi * 180
    },
  "moon": {
    "alt":m.alt / math.pi * 180,
    "az":m.az / math.pi * 180
    }
  }

with open("/var/www/gauge/public/data/sunmoon.json","w") as file:
    json.dump(data, file)

