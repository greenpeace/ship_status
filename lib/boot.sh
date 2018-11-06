#! /bin/bash
/usr/bin/echo `fortune -s` > /var/www/gauge/public/data/fortune.txt
touch /home/ro1/bootscript.working
killall ruby
/home/ro1/.rbenv/shims/ruby /var/www/gauge/lib/socket.rb &
/home/ro1/.rbenv/shims/pumactl -F /var/www/gauge/lib/puma.rb stop  > /dev/null 2>&1
sleep 1
/home/ro1/.rbenv/shims/pumactl -F /var/www/gauge/lib/puma.rb start  > /dev/null 2>&1

