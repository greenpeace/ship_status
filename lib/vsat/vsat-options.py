import telnetlib, csv, re

host = "192.168.10.1"
user = "admin"
password = "P@55w0rd!"
command = "options show"

tn = telnetlib.Telnet()
tn.open(host, 23, 12)

tn.read_until("Username:")
tn.write(user + "\n")

tn.read_until("Password: ")
tn.write(password + "\n")

tn.write(command + "\n")
tn.read_until("[SATELLITE", 1)
ls = str.split("[SATELLITE"+tn.read_until("[SECURITY", 1),"\r\n\r\n")[0:-1]

tn.write("exit\n")

header = ["id"]
for ln in str.split(ls[0],"\r\n"):
    ln = re.sub("^\s*","",ln)
    ln = re.sub("\s*=.*$","",ln)
    if ln[0] != "[":
        header.append(ln)

with open('./vsat-options.csv', 'wb') as csvfile:
    csv = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    csv.writerow(header)
    for sat in ls:
        row = []
        for ln in str.split(sat,"\r\n"):
            if ln[0] == "[":
                row.append(re.sub("\D","",ln))
            else:
                row.append(re.sub("^\s*\w+\s*=\s*","",ln))
        csv.writerow(row)



