# coding: UTF-8

import re, os, csv, json, math, ephem, datetime, subprocess, telnetlib

chosen = 0
host = "192.168.10.1"
user = "admin"
password = "P@55w0rd!"

try:
  tn = telnetlib.Telnet()
  tn.open(host, 23, 12)

  tn.read_until("Username:")
  tn.write(user + "\n")

  tn.read_until("Password: ")
  tn.write(password + "\n")

  tn.write("beamselector list\n")
  ls = tn.read_until(password, 1)
  tn.write("exit\n")

  for ln in str.split(ls,"\r\n"):
    if re.compile("Current Absolute Beams").search(ln):
      chosen = re.sub(r'\D',"",ln)
      break
except:
  print "RX failure"

dic = {"Koreasat 5":"KOREASAT 5", "NSS12":"NSS-12", "ST2":"ST-2",
"T11N":"TELSTAR 11N", "SM62KU":"", "Asiasat 4":"ASIASAT 9", "GE23":"",
"IS-21":"INTELSAT 21", "IS14":"INTELSAT 14", "NSS7_IOO":"NSS-7",
"IS20":"INTELSAT 20", "IS10":"INTELSAT 10", "IS22":"INTELSAT 22",
"E10A":"EUTELSAT 10A", "IS19":"INTELSAT 19", "IS34":"INTELSAT 34",
"APSTAR-9":"APSTAR 9", "JSAT":"", "T12Vantage":"TELSTAR 12V",
"IS10-02":"INTELSAT 10-02", "Galaxy-25":"GALAXY 25",
"JCSAT-110A":"N-SAT-110", "G25":"GALAXY 25", "IS907":"INTELSAT 907",
"G28":"GALAXY 28", "APSTAR9":"APSTAR 9"}

pos = str.split(subprocess.check_output("tail -n 1 /var/www/gauge/public/data/track.csv", shell=True).strip(),",")

rw = ephem.Observer()
rw.lat = pos[1]
rw.lon = pos[2]
rw.elevation = 5
treshold = 1
sats = []
errs = []

maxalt = 0

#os.system("curl -O https://celestrak.com/NORAD/elements/geo.txt")

def fpad(val,dig=8):
  return ("%.3f" % float(val)).rjust(dig)

def dd2dms(dd, dr):
  mnt,sec = divmod(float(dd)*3600,60)
  deg,mnt = divmod(mnt,60)
  drc = dr[0] if deg >= 0 else dr[1]
  return "%s %s'%s\"%s" % (abs(int(deg)),int(mnt),int(sec),drc)

with open('vsat-options.csv', 'rb') as data:
  reader = csv.reader(data)
  for row in reader:
    if row[8] != "name":
      if len(row[8]) > 0 and row[8] in dic and len(dic[row[8]]) > 0:
        try:
          tle = str.split(subprocess.check_output("cat geo.txt | grep -A 2 -P \"^"+dic[row[8]]+"\"", shell=True),"\r\n")
          sat = ephem.readtle(tle[0],tle[1],tle[2])
          sat.compute(rw)
          sublon = float(sat.sublong) / math.pi * 180
          sublat = float(sat.sublat) / math.pi * 180
          alt = sat.alt / math.pi * 180
          maxalt = alt if alt > maxalt else maxalt
          if str(chosen) == str(row[0]):
            active = 1 
          else:
            active = 0
          sats.append({
            "id": row[0],
            "satname": row[8],
            "beamname": row[1],
            "sublon": sublon,
            "sublat": sublat,
            "catlon": float(row[4]),
            "londelta": sublon - float(row[4]),
            "range": sat.range,
            "az": sat.az / math.pi * 180,
            "alt": alt,
            "active": active
            })
        except:
          errs.append(row[0])
      else:
        errs.append(row[0])

print ""
print "Satellite coverage report for RW on \033[0;33m"+dd2dms(pos[1],"NS")+" "+dd2dms(pos[2],"EW")+"\033[0;0m as of \033[0;33m"+str(datetime.datetime.now())[0:19]+"\033[0;0m"
str(datetime.datetime.fromtimestamp(float(pos[0])))

if len(errs) > 0:
  print "Could not locate beams \033[1;31m"+(", ").join(errs)+".\033[0;0m"

print ""
print " id       lon   (±delta)      lat     range    azimuth   altitude       name  beam_name"
print "======================================================================================="

sats.sort(key=lambda x: x["alt"], reverse=True)

with open("/var/www/gauge/public/data/sat.json","w") as file:
  json.dump(sats, file)

for sat in sats:
  color = "\033[1;%sm" % (32 if sat["alt"] == maxalt else (36 if sat["alt"] > 60 else (34 if sat["alt"] > 45 else (30 if sat["alt"] < 0 else 0))))
  print(" %s%s   %s%s (%s)%s  %s%s%s  %s  %s  %s  %s  %s\033[0;0m" % (
    color,
    sat["id"],
    fpad(sat["sublon"]),
    "\033[1;31m" if abs(sat["londelta"]) > treshold else "",
    re.sub(r"\s","+",fpad(sat["londelta"],6)),
    color,
    "\033[1;31m" if abs(sat["sublat"]) > treshold else "",
    fpad(sat["sublat"]), 
    color,
    fpad(sat["range"] / 10 ** 6),
    fpad(sat["az"]),
    fpad(sat["alt"]),
    sat["satname"].rjust(10),
    sat["beamname"]
    ))

print ""


