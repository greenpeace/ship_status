#!/bin/bash          

sass sass/materialize.scss > ../public/css/materialize.css

cd ../public/js/
cat jquery-2.2.4.min.js materialize.js leaflet.js leaflet.providers.js \
leaflet.rotatedmarker.js leaflet.nauticscale.js > all.js
java -jar ../../lib/yui.jar --type js all.js > main.js

cd ../css/
cat materialize.css leaflet.css leaflet-material.min.css weather-icons.min.css weather-icons-wind.min.css style.css > all.css
java -jar ../../lib/yui.jar --type css ./all.css > ./main.css

echo "css updated on `date`"


