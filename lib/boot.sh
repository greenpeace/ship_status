#! /bin/bash
/usr/bin/echo `fortune -s` > /var/www/gauge/public/data/fortune.txt
[[ -s "/home/ro/.rvm/scripts/rvm" ]] && . "/home/ro/.rvm/scripts/rvm"
source /home/ro/.rvm/scripts/rvm
rvm use 2.4.1@gauge
touch /home/ro/bootscript.working
killall ruby
/home/ro/.rvm/rubies/ruby-2.4.1/bin/ruby /var/www/gauge/lib/socket.rb &
/home/ro/.rvm/gems/ruby-2.4.1@gauge/bin/pumactl -F /var/www/gauge/lib/puma.rb stop  > /dev/null 2>&1
sleep 1
/home/ro/.rvm/gems/ruby-2.4.1@gauge/bin/pumactl -F /var/www/gauge/lib/puma.rb start  > /dev/null 2>&1

