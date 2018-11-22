#! /bin/bash

d=$(date +%Y-%m-%d-%H%M)
b=$(cat /var/www/gauge/lib/vsat/active.json)
`/usr/bin/python2 /var/www/gauge/lib/vsat/speedtest.py > /var/www/gauge/lib/vsat/speedtests/$d-$b.txt`
