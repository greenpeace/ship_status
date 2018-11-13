
### Ruby
To install `rbenv` to manage ruby versions follow [this](https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-centos-7) guide:


### Python
Install python libs:
```
tzwhere
pytz
pyephem  # needs python-devel
```

### Apache

`yum install mod_proxy_html`

After restarts you may need to `/usr/sbin/setsebool httpd_can_network_connect 1`.

