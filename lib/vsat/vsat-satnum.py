import telnetlib, re

host = "192.168.10.1"
user = "admin"
password = "P@55w0rd!"
command = "beamselector list"

tn = telnetlib.Telnet()

try:
  tn.open(host, 23, 12)

  tn.read_until("Username:")
  tn.write(user + "\n")

  tn.read_until("Password: ")
  tn.write(password + "\n")

  tn.write(command + "\n")
  ls = tn.read_until(password, 1)
  tn.write("exit\n")

  for ln in str.split(ls,"\r\n"):
    if re.compile("Current Absolute Beams").search(ln):
      print re.sub(r'\D',"",ln)
      break
except:
  print "000"
