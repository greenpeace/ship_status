var map, zoomInit, index, markercluster, fStatic, fDynamic, rw3, rw3raw, rw3s, warrow, carrow, harrow, wlin, wake, rot, angle, speed, weather, timedelta, POS, SVGdata, SVGdata2, edge;
var overlays = {};
var overids = {};
var fitBoundOpts = {animate:true};
var track = [];
var tws = {};
var basemap = L.tileLayer('/tiles/chart/{z}/{x}/{y}.png', {attribution: '', minZoom: 4, maxZoom: 18, });
//var openseamap = L.tileLayer.provider('OpenSeaMap', {minZoom: 4, maxZoom: 18, apikey:"819dee1c8f874141ad1f7cec78d2efc5"});

$.get("/img/rw3.svg",function(img) {
  rw3raw = img.rootElement.outerHTML;
})

Number.prototype.mod = function(n) {
  return ((this%n)+n)%n;
};

function initMap() {
  if (has_key(NMEA,"GGA")) {
    POS = L.latLng(parseFloat(NMEA.GGA.latitude),parseFloat(NMEA.GGA.longitude));
  } else {
    POS = [0,0]
  }
  rot = NMEA.HDT.true_heading_degrees
  map = L.map('map',{
    center: POS,
    zoom: 8,
    zoomSnap: 0.1,
    zoomDelta: 0.5,
  })

  basemap.addTo(map)
  //openseamap.addTo(map)

  map.removeControl(map.zoomControl)
  L.control.zoom({position: 'topright'}).addTo(map);
  map.removeControl(map.attributionControl)
  L.control.attribution({position: 'bottomright',prefix: '<strong>MY Rainbow Warrior</strong> | Strictly not for navigation'}).addTo(map);
  //L.control.attribution({position: 'bottomright',prefix: '<strong>MY Rainbow Warrior</strong> | <a href="//leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'}).addTo(map);

  map.addControl(new L.Control.ScaleNautic({
    position: "bottomright",
    metric: false,
    imperial: false,
    nautic: true
  }));

  var HomeButton = L.Control.extend({
    options: { position: 'topright' }, 
    onAdd: function (map) {
      var container = L.DomUtil.create('div', 'home-button leaflet-bar leaflet-control');
      L.DomEvent.addListener(container, 'click', getBack);
      return container;
    }
  });
  map.addControl(new HomeButton());
  $('.home-button').html('<a />')

  var icon = L.divIcon({
      className: 'rw3',
      iconSize: [16, 80],
    });

  rw3 = L.marker(POS,{
      icon: icon,
      rotationAngle: NMEA.HDT.true_heading_degrees,
      rotationOrigin: "center"
    }).addTo(map);

  map.on('zoomend',function(e){
    return
    if (map.getZoom() > 14 ){
      if (map.hasLayer(terrain)) { 
        map.removeLayer(terrain);
        map.addLayer(sat2009);
      }
    } else {
      if (map.hasLayer(sat2009)) { 
        map.removeLayer(sat2009);
        map.addLayer(terrain);
      }
    }
  })

  $.get(domain+"/data/track.csv?"+new Date().getTime(),function(data){
    track = $.map(data.split(/\n/).reverse(),function(e,i){
      a = e.split(/\s*,\s*/)
      if (e.length > 10) return [new L.LatLng(parseFloat(a[1]),parseFloat(a[2]))];
    });
    new_track = [parseFloat(track[0].lat.toFixed(track_precision)),parseFloat(track[0].lng.toFixed(track_precision))]
    POS = new_track;
    map.panTo(POS);
    map.invalidateSize();
    stps = 20;
    lngt = 1200
    wake = new L.Polyline(track.slice(0,lngt), {
      color: 'white',
      weight: 3,
      opacity: 0.85,
      smoothFactor: 1
    }).addTo(map);
    for (var i=1; i<stps; i++) {
      new L.Polyline(track.slice(i*lngt-1,i*lngt + lngt), {
        color: 'white',
        weight: 3,
        opacity: (stps-i)/stps,
        smoothFactor: 1
      }).addTo(map);
    }
      
  })

  window.setTimeout(graticule,1000);
  getBack();
}

function moveMarker() {
  if (has_key(NMEA,"GGA")) { POS = L.latLng(parseFloat(NMEA.GGA.latitude),parseFloat(NMEA.GGA.longitude)); }
  if (typeof rw3 == "object") {
    rw3.setLatLng(POS);
    var aR;
    aR = rot % 360;
    if ( aR < 0 ) { aR += 360; }
    if ( aR < 180 && (NMEA.HDT.true_heading_degrees > (aR + 180)) ) { rot -= 360; }
    if ( aR >= 180 && (NMEA.HDT.true_heading_degrees <= (aR - 180)) ) { rot += 360; }
    rot += (NMEA.HDT.true_heading_degrees - aR);
    rw3.setRotationAngle(rot)
  }
}


function rotateThis(nR) {
  var aR;
  rot = rot || 0; // if rot undefined or 0, make 0, else rot
  aR = rot % 360;
  if ( aR < 0 ) { aR += 360; }
  if ( aR < 180 && (nR > (aR + 180)) ) { rot -= 360; }
  if ( aR >= 180 && (nR <= (aR - 180)) ) { rot += 360; }
  rot += (nR - aR);
  rw3.setRotationAngle(rot)
}
function showAll() {
  map.setView(POS,12);
}

function zom(id){
  m = markers[id];
  var targetPoint = map.project(m.latlng, 17).subtract([($(".nav-mobile").width())/2, 0]),
      targetLatLng = map.unproject(targetPoint, 17);

  map.setView(targetLatLng, 17);
  //map.setView(m._latlng,17,{animate:true,paddingTopLeft:[0,$(".nav-mobile").width()]});
}

function getBack() {
  map.panTo(POS);
}

function graticule() {
  L.latlngGraticule({
    showLabel: true,
    zoomInterval: [
      {start: 2, end: 3, interval: 30},
      {start: 4, end: 5, interval: 10},
      {start: 6, end: 7, interval: 5},
      {start: 8, end: 20, interval: 1},
      {start: 11, end: 12, interval: 0.5},
      {start: 13, end: 18, interval: 0.1}
    ]
  }).addTo(map);
}

var track_precision = 3;
var window_focus = true;
var iteration = 0
var NMEA = {};
var new_track = []
function has_key(a,i) {
  return Object.keys(a).indexOf(i) >= 0
}
function render() {
  if (window_focus) window.setTimeout(render,1000);
  $.getJSON(domain+"/data/nmea.json?"+new Date().getTime(),function(data){
    NMEA = data;
  })
  //$("#nmea").html("<h2>"+iteration+"</h2>"+JSON.stringify(NMEA, null, 2));
  if (has_key(NMEA,"HDT"))   $("#HDG").html(NMEA.HDT.true_heading_degrees+"°");
  if (has_key(NMEA,"RMC")) {
    $("#COG").html(NMEA.RMC.track_made_good_degrees_true+"°");
    $("#SOG").html(NMEA.RMC.speed_over_ground_knots+"<small>kn</small>");
  } else if (has_key(NMEA,"VTG")) {
    $("#COG").html(NMEA.VTG.track_degrees_true+"°");
    $("#SOG").html(NMEA.VTG.speed_knots+"<small>kn</small>");
  }
  if (has_key(NMEA,"VHW"))   $("#STW").html(NMEA.VHW.water_speed_knots+"<small>kn</small>");
  if (has_key(NMEA,"MWV-t")) $("#TWA").html(NMEA["MWV-t"].wind_angle+"°");
  if (has_key(NMEA,"MWV-t")) $("#TWS").html(NMEA["MWV-t"].wind_speed+"<small>kn</small>");
  if (has_key(NMEA,"MWV-r")) $("#AWA").html(NMEA["MWV-r"].wind_angle+"°");
  if (has_key(NMEA,"MWV-r")) $("#AWS").html(NMEA["MWV-r"].wind_speed+"<small>kn</small>");
  if (has_key(NMEA,"DPT"))   $("#DPT").html(NMEA.DPT.depth_meters+"<small>m</small>");
  if (has_key(NMEA,"GGA") && new_track.length > 0 && parseFloat(NMEA.GGA.latitude.toFixed(track_precision)) == new_track[0] && parseFloat(NMEA.GGA.longitude.toFixed(track_precision)) == new_track[1]) {
    $("#LAT").text(deg_to_dms(NMEA.GGA.latitude,"NS"));
    $("#LON").text(deg_to_dms(NMEA.GGA.longitude,"EW"));
  } else {
    if (has_key(NMEA,"GGA")) {
      new_track = [parseFloat(NMEA.GGA.latitude.toFixed(track_precision)),parseFloat(NMEA.GGA.longitude.toFixed(track_precision))]
      track.unshift([parseFloat(NMEA.GGA.latitude.toFixed(5)),parseFloat(NMEA.GGA.longitude.toFixed(5))]);
    } else if (has_key(NMEA,"RMC")) {
      new_track = [parseFloat(NMEA.RMC.latitude.toFixed(track_precision)),parseFloat(NMEA.RMC.longitude.toFixed(track_precision))]
      track.unshift([parseFloat(NMEA.RMC.latitude.toFixed(5)),parseFloat(NMEA.RMC.longitude.toFixed(5))]);
    } else if (typeof POS != "undefined" && POS != [0,0]) {
      new_track = POS;
    }
    //if (wake) wake.setLatLngs(track);
  }
  drawGauge();
  moveMarker();
  iteration ++;
}
function has_key(obj,key) {
  return Object.keys(obj).indexOf(key) >= 0;
}








function wspeed(v) {
  if ( v < 1 ) { tws[0].show(); wlin.hide(); } else { tws[0].hide(); wlin.show();}
  if ( v >= 50 ) { tws[50].show(); v -= 50; } else { tws[50].hide();}
  for ( var i=5; i < 50; i+=5 ) {
    if (v+5 > i) {
      tws[i].show();
    } else {
      tws[i].hide();
    }
  }
  if (v>1 && v <= 5) {
    tws[5].hide();
    tws[15].show();
  }
}


function drawGauge() {
  hdg = parseInt($("#HDG").text().replace(/[^\d\.]/,""));
  cog = parseInt($("#COG").text().replace(/[^\d\.]/,""));
  twa = parseInt($("#TWA").text().replace(/[^\d\.]/,""));
  if ($("#rw3").length == 0 ) {
    edge = $("#data-container").height() - 6;
    if (window.innerWidth < 666) {
      $("#gauge-container").removeClass("col");
      return false;
    }
      $("#gauge-container").addClass("col");
    $("#gauge-container").css("width",edge+6).css("height",edge+6).css("min-width",edge+6).css("min-height",edge+6).css("max-width",edge+6).css("max-height",edge+6);
    $("#gauge").html("").removeClass("hide");
    gauge = SVG("gauge").size(edge+6,edge+6);

    gg = gauge.group().center(edge/2+3,edge/2+3).scale(0.92);
    //gg.rect(edge,edge).center(0,0).fill("none").stroke("#999");
    harrow = gg.group();
    harrow.line(0,0,0,-edge*0.5).stroke({color:"#060",width:3,linecap:"round"})
    carrow = gg.group();
    carrow.line(0,0,0,-edge*0.5).stroke({color:"#c60",width:3,linecap:"round"})
    circles = 4
    for (var i=0; i <= circles; i++) {
      dt = edge * i / circles;
      gg.circle(dt).center(0,0).fill("none").stroke({color:"#06c",width:2});
    }
    for (var i=0; i < 360; i++) {
      gg.line(0,-edge*0.5,0,(i%15 == 0 ? -edge*0.46 : -edge*0.48)).stroke({color:"#06c",width:(i%5 == 0 ? 0.6 : 0.3) }).rotate(i,0,0);
    }
    lines = 4;
    fsize = edge * 0.04;
    for (var i=0; i < lines; i++) {
      gg.line(0,edge*0.5,0,-edge*0.5).center(0,0).stroke({color:"#06c",width:1.2}).rotate(180*i/lines,0,0);
      gg.text(pad(180*i/lines,3)).font({size:12,anchor:"center"}).fill("#06c").center(0,-edge*0.525).rotate(180*i/lines,0,0);
      gg.text(pad(180+180*i/lines,3)).font({size:12,anchor:"center"}).fill("#06c").center(0,-edge*0.525).rotate(180+180*i/lines,0,0);
    } 
    warrow = gg.group();
    wlin = warrow.line(0,0,0,-edge*0.4).fill("none").stroke({color:"#c00",width:3,linecap:"round"});
    warrow.rotate(parseInt($("#TWA").text().replace(/[^\d\.]/,"")),0,0);
    tws[0] = warrow.circle(edge*0.25).center(0,0).fill("none").stroke({color:"#c00",width:3});
    for (var i=10; i<=50; i+=10) {
      dt = edge * 0.002 * (i-10);
      tws[i-5] = warrow.line(0,-edge*0.4+dt,edge*0.04,-edge*0.41+dt).fill("none").stroke({color:"#c00",width:3,linecap:"round"});
      if (i < 50) tws[i] = warrow.line(edge*0.04,-edge*0.41+dt,edge*0.08,-edge*0.42+dt).fill("none").stroke({color:"#c00",width:3,linecap:"round"});
    }
    tws[50] = warrow.polygon("0,"+(-edge*0.4)+" 0,"+(-edge*0.47)+" "+edge*0.07+","+(-edge*0.48)).fill("#c00").stroke({color:"#c00",width:4,linecap:"round"});
    wspeed(parseFloat($("#TWS").text().replace(/[^\d\.]/,"")));

    gg.svg(rw3raw);
    rw3s = SVG.get("rw3");
    rw3s.center(0,0).scale(edge/200,0,0);
    //rw3s.center(0,0);
    rw3s.rotate(hdg,0,0);
    //$("#rw3").css("transform","rotate( "+hdg+"deg )")
    carrow.rotate(cog,0,0);
    harrow.rotate(hdg,0,0);
  } else {
    rw3s.rotate(hdg,0,0);
    carrow.rotate(cog,0,0);
    harrow.rotate(hdg,0,0);
    warrow.rotate(twa,0,0);
    wspeed(parseFloat($("#TWS").text().replace(/[^\d\.]/,"")));
    //rw3s.animate().rotate(hdg,0,0);
    //warrow.animate().rotate(twa,0,0);
  }
}






function popSVG(type,data,max,period,elem) {
  period = period || 3;
  avgmin = "";
  avgmax = "";
  gust = "";
  if (type == "sog") console.log(data)
  if (max > 0) {
    ratio = 200 / parseFloat(max);
  } else {
    ratio = 1 / 1.8;
  }
  color = radial = {"hdg":"#06c","cog":"#0c6","sog":"#c60","stw":"#6c0","tws":"#c06","twa":"#60c","dpt":"#006"}[type]
  color == "#" ? color = "#000" : color = color;
  delta = ($("#nav-mobile").css("transform") == "matrix(1, 0, 0, 1, 0, 0)" ? 418 : 118);
  width = Math.max(window.innerWidth - delta, 480);
  k = width / (data.length-1)
  $.each(data,function(i,e){ 
    j = i * k - 1;
    if (e.length == 3) {
      avgmin += String(j) + "," + (240 - parseFloat(e[0]) * ratio) + " "
      avgmax += String(j) + "," + (240 - parseFloat(e[1]) * ratio) + " "
      gust += String(j) + "," + (240 - parseFloat(e[2]) * ratio) + " "
    } else if (e.length == 2) {
      avgmin += String(j) + "," + (140 - (parseFloat(e[0])) * ratio) + " "
      avgmax += String(j) + "," + (140 - (parseFloat(e[1])) * ratio) + " "
    } else if (e.length == 1 && type=="dpt") {
      avgmin += String(j) + "," + (255 + max - (parseFloat(e[0])) * ratio) + " "
    } else if (e.length == 1) {
      avgmin += String(j) + "," + (240 + ((parseFloat(e[0])+180)%360-180) * ratio) + " "
    }
  });
  bspd = Math.round(20000 / ratio) * 0.01;
  lns = (bspd - bspd % 5) / 5;
  lnh = 200 / bspd * 5;

  $("#"+elem).html("").removeClass("hide");
  svgelem = SVG(elem).size(Math.max(window.innerWidth - delta + 50, 550), 250);

  if (max > 0) {
    if (type == "dpt") {
      unit = "m";
      bspd = Math.round(20000 / ratio) * 0.01;
      lns = (bspd - bspd % 10) / 10;
      lnh = 200 / bspd * 10;
      svgelem.line("0,240 "+(width)+",240").stroke("#aaa").fill("none")
      //svgelem.text(bspd.toFixed(2)+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,232)
      for (var i=1; i<=lns; i++) {
        svgelem.line("0,"+(40+lnh*i)+" "+(width)+","+(40+lnh*i)).stroke({color:"#aaa",width:0.5}).fill("none")
        svgelem.text(i*10+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,lnh*i+32)
      }
      svgelem.line("0,40 "+(width)+",40").stroke("#aaa").fill("none")
      svgelem.text("0"+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,32)
    } else if (type == "rtt") {
      unit = "ms";
      lns = (bspd - bspd % 200) / 200;
      lnh = 200 / bspd * 200;
      svgelem.line("0,40 "+(width)+",40").stroke("#aaa").fill("none")
      svgelem.text(bspd+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,32)
      for (var i=1; i<=lns; i++) {
        svgelem.line("0,"+(240-lnh*i)+" "+(width)+","+(240-lnh*i)).stroke({color:"#aaa",width:0.5}).fill("none")
        svgelem.text(i*200+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,232-lnh*i)
      }
      svgelem.line("0,240 "+(width)+",240").stroke("#aaa").fill("none")
      svgelem.text("0000"+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,232)
    } else {
      unit = "kn";
      svgelem.line("0,40 "+(width)+",40").stroke("#aaa").fill("none")
      svgelem.text(bspd.toFixed(2)+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,32)
      for (var i=1; i<=lns; i++) {
        svgelem.line("0,"+(240-lnh*i)+" "+(width)+","+(240-lnh*i)).stroke({color:"#aaa",width:0.5}).fill("none")
        svgelem.text(i*5+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,232-lnh*i)
      }
      svgelem.line("0,240 "+(width)+",240").stroke("#aaa").fill("none")
      svgelem.text("0"+unit).font({size:12,anchor:"left"}).fill("#aaa").move(width+5,232)
    }
  } else {
    svgelem.line("0,40 "+(width)+",40").stroke("#aaa").fill("none")
    svgelem.text("180°").font({size:12,anchor:"left"}).fill("#aaa").move(width+5,32)
    svgelem.line("0,90 "+(width)+",90").stroke({color:"#aaa",width:0.5}).fill("none")
    svgelem.text("90°").font({size:12,anchor:"left"}).fill("#aaa").move(width+5,82)
    svgelem.line("0,140 "+(width)+",140").stroke({color:"#aaa",width:0.5}).fill("none")
    svgelem.text("000°").font({size:12,anchor:"left"}).fill("#aaa").move(width+5,132)
    svgelem.line("0,190 "+(width)+",190").stroke({color:"#aaa",width:0.5}).fill("none")
    svgelem.text("270°").font({size:12,anchor:"left"}).fill("#aaa").move(width+5,182)
    svgelem.line("0,240 "+(width)+",240").stroke("#aaa").fill("none")
    svgelem.text("180°").font({size:12,anchor:"left"}).fill("#aaa").move(width+5,232)
  }

  svgelem.text(type.toUpperCase()).font({size:32,anchor:"left",weight:"bold"}).fill("#aaa").move(8,200)

  if (type == "tws") {
    svgelem.polygon(avgmin + avgmax.split(" ").reverse().join(" ")).fill(color).stroke({color:color,width:0.2})
    svgelem.polyline(gust).stroke({color:"#060",width:0.3}).fill("none")
  } else if (type == "twa") {
    svgelem.polygon(avgmin + avgmax.split(" ").reverse().join(" ")).fill(color).stroke({color:color,width:0}).attr("fill-rule","evenodd")
  } else if (max > 0){
    svgelem.polyline(avgmin).stroke({color:color,width:2}).fill("none").flip("y",0).translate(0,380);
  } else {
    svgelem.polyline(avgmin).stroke({color:color,width:2}).fill("none").flip("y",0).translate(0,380);
  }

  s = (width) / period;
  for (var i=0; i<=period; i++) {
    vis = ((period <= 6) || (period <= 60 && (period - i) % 3 == 0) || (period <= 120 && (period - i) % 6 == 0) || (period <= 240 && (period - i) % 12 == 0) || ((period - i) % 24 == 0)) 
    vis ? width = 1 : width = 0.5;
    tx = (i == period ? "now" : ( (period - i) % 24 == 0 ) ? ((period - i ) / 24) + "d" : ((period - i) % 24)+ "h");
    dx = (i == 0 ? 0 : (i*s)-10);
    wgt = tx.match(/[wd]$/) ? "bold" : "normal";
    svgelem.line((i*s)+",30 "+(i*s)+",250").stroke({width:width,color:"#aaa"}).fill("none");
    if (vis && elem == "show") {
      svgelem.text(tx).font({size:12,anchor:"left",weight:wgt}).fill("#aaa").move(dx,12)
    }
  }

  if (elem == "show") {
    svgelem.translate(12,12);
  } else {
    svgelem.translate(12,-24);
  }
  $(".svgwrap").css("max-width",window.innerWidth - 48);
  $(".svgwrap").scrollLeft(500);
}






function update(element) {
  switch(element) {

    case "#chart":
      console.log(element)
      $(".top-nav .nav-wrapper h5").text("Chart");
      map.invalidateSize();
    break;

    case "#nmea":
      $(".top-nav .nav-wrapper h5").text("Status");
      period = 6
      type = $("select#reading option:selected").val();
      type2 = $("select#reading2 option:selected").val();
      period = $("#period").val();
      $.getJSON(domain+"/csv/"+type+"/"+period+"?"+new Date().getTime(),function(data){
        SVGdata = [type,data.data, data.max, period];
        popSVG(type,data.data, data.max, period, "show");
        if (type2 != "") {
          $.getJSON(domain+"/csv/"+type2+"/"+period+"?"+new Date().getTime(),function(data2){
            SVGdata2 = [type2,data2.data, data2.max, period];
            popSVG(type2,data2.data, data2.max, period, "show2");
          })
        } else {
          $("#show2").html("").addClass("hide");
        }
      })
    break;

    case "#sky":
      console.log(element)
      $(".top-nav .nav-wrapper h5").text("Sky");
    break;

    case "#weather":
      console.log(element)
      $(".top-nav .nav-wrapper h5").text("Weather");
    break;

    case "#board":
      console.log(element)
      $(".top-nav .nav-wrapper h5").text("Whiteboard");
      $.get(domain+"/data/board.txt?"+new Date().getTime(),function(data){
        $(".board").html(data);
      });
    break;
  }
}

$(document).ready(function(){
  $('ul.tabs').tabs({
    onShow: function(e){
      window.location.hash = e.selector;
      update(e.selector)
    }
  });
  $('select').material_select();
  $("main").show();

  $(window).on("resize",function(){
    $("#gauge").html("").removeClass("hide");
    $(".mapwrapper, #map").css("height", window.innerHeight -48);
    map.invalidateSize();

    mW = Math.min(window.innerWidth - 56, 300);
    $('.button-collapse').sideNav({ menuWidth: mW });
    $('.button-collapse').sideNav('hide',function(){
      $('.button-collapse').sideNav('show');
    });
    if ( SVGdata.length == 4 ) { popSVG(SVGdata[0],SVGdata[1], SVGdata[2], SVGdata[3], "show"); }
    if ( SVGdata2.length == 4 ) { popSVG(SVGdata2[0],SVGdata2[1], SVGdata2[2], SVGdata2[3], "show2"); }
    if ( SVGdata3.length == 4 ) { popSVG(SVGdata2[0],SVGdata2[1], SVGdata2[2], SVGdata2[3], "show3"); }
  })

  $("#update").on("click", function(event) {
    type = $("select#reading option:selected").val();
    type2 = $("select#reading2 option:selected").val();
    period = $("#period").val();
    $.getJSON(domain+"/csv/"+type+"/"+period+"?"+new Date().getTime(),function(data){
      SVGdata = [type,data.data, data.max, period];
      popSVG(type,data.data, data.max, period, "show");
      if (type2 != "") {
        $.getJSON(domain+"/csv/"+type2+"/"+period+"?"+new Date().getTime(),function(data2){
          SVGdata2 = [type2,data2.data, data2.max, period];
          popSVG(type2,data2.data, data2.max, period, "show2");
        })
      } else {
        $("#show2").html("").addClass("hide");
      }
    })
  })

  $.getJSON(domain+"/data/sat.json?"+new Date().getTime(),function(data){
    tb = $("#sky tbody");
    tb.html("");
    $.each(data,function(k,v){
      dist = String(parseInt(v["range"]/1000));
      vv = [v["id"],v["satname"],/*v["beamname"],*/v["sublat"].toFixed(2),v["sublon"].toFixed(2)+" ("+v["catlon"]+")",v["alt"].toFixed(2),v["az"].toFixed(2),dist.substr(0,2)+","+dist.substr(2,3)]
      cls = [];
      v["alt"] <= 00 ? cls.push("below") : 0;
      v["alt"] >= 45 ? cls.push("high") : 0;
      v["alt"] >= 60 ? cls.push("higher") : 0;
      v["active"] == 1 ? cls.push("active") : 0;
      cl = (cls.length > 0 ? " class='"+cls.join(" ")+"'" : "");
      tr = "<tr"+cl+"><td>"+vv.join("</td><td>")+"</td></tr>";
      tb.append(tr);
    })
    period = 1;
    $.getJSON(domain+"/csv/rtt/"+period+"?"+new Date().getTime(),function(data){
      SVGdata3 = ["rtt",data.data, data.max, period];
      popSVG("rtt",data.data, data.max, period, "show3");
    })
  })

  $.getJSON(domain+"/data/sky.json?"+new Date().getTime(),function(data){
    timedelta = data.timedelta;
    $.each(data,function(k,v){
        if(k.match(/_a[ltz]+$/)) {
          a = v.split(":")
          $(".sky #"+k).text(k.split("_")[1]+" "+a[0]+"°"+a[1]+"'"+a[2]+'"')
        } else if (k == "waxing") {
          $(".sky #"+k).text(waxing ? "Waxing" : "Waning")
        } else if (k.match(/^(new_|full_)/)) {
          console.log(v)
          $(".sky #"+k).text(v)
        } else {
          $(".sky #"+k).text(v)
        }
    })
  })

  $.getJSON(domain+"/data/nmea.json?"+new Date().getTime(),function(data){

    NMEA = data;
    render();
    initMap();
    $(".mapwrapper, #map").css("height", window.innerHeight - 48);
    map.invalidateSize();

    $(window).focus(function() {
      window_focus = true;
      render();
      getBack();
    }).blur(function() {
      window_focus = false;
    });

    mW = Math.min(window.innerWidth - 56, 300);
    $('.button-collapse').sideNav({
      edge: 'left',
      menuWidth: mW,
      draggable: true,
      closeOnClick: true,
    });
    $('.button-collapse').on('click',function(){
      localStorage.sidenav = true;
    })
    update(window.location.hash);
  })

  $.getJSON(domain+"/data/weather.json?"+new Date().getTime(),function(data){
    weather = data
    time = new Date(data.dt * 1000)
    delta = time.getTimezoneOffset()
    wtime = new Date(data.dt * 1000 + (timedelta * 60 + delta) * 60000);
    html = "<div class='flex-grid'>"
    html += "<div class='col nobg'>&nbsp;</div>\n"
    html += "<div class='col2 nobg'>\n"
    html += "<p class='leftie'>"+data.name+", "+data.sys.country+"<br/>\n"
    html += "<b>"+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][wtime.getDay()]+" "+["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][wtime.getMonth()]+"&nbsp;"+wtime.getDate()+", </b>\n"
    html += "<b>"+wtime.getHours()+":"+(wtime.getMinutes() == 0 ? "00" : wtime.getMinutes())+"</b><br/><small class='attr'>openweathermap.org</small></p>\n"
    html += "</div>\n"
    html += "<div class='col2'>\n"
    html += "<p><br/><i class='huge wi wi-owm-"+data.weather[0].id+"'></i><br/><span style='margin-top:12px;display:block;'>"+data.weather[0].description+"</span></p>"
    html += "</div>\n"
    html += "<div class='col2'>\n"
    html += "<p class='middle'><br/><b class='temp'>"+Math.round(data.main.temp)+"°C</b><br/>"+Math.round(data.main.pressure)+"<span>hPa</span>\n"
    html += "<br/><i title='Cloud cover' class='midicon wi wi-cloud'></i>: "+Math.round(data.clouds.all)+"%</small><br/><i style='margin-left:-6px;' title='Visibility' class='midicon material-icons'>remove_red_eye</i>: "+(Math.round(data.visibility/100)/10)+"<span>km</span></p>\n"
    html += "</div>\n"
    html += "<div class='col2'>\n"
    html += "<p><br/><i title='Winds from "+Math.round(data.wind.deg)+"°' class='windicon wi wi-wind from-"+Math.round(data.wind.deg)+"-deg'></i><br/><span class='wind' style='margin:-4px 0;display:block;'>"+Math.round(data.wind.deg)+"°</span class='wind'><br/><span class='wind' style='margin-top:-14px;display:block;'>"+Math.round(data.wind.speed*1.944)+"kn</span class='wind'></p>\n"
    html += "</div>\n"
    //html += "<div class='col nobg'>&nbsp;</div>\n"
    html += "</div>\n"
    $("#weather .current").html(html);
  })

  $.getJSON(domain+"/data/forecast.json?"+new Date().getTime(),function(data){
    day = 0;
    html = "<div>";
    hour = 0
    $.each(data.list,function(i,e){
      time = new Date(e.dt * 1000)
      delta = time.getTimezoneOffset()
      //console.log(delta)
      wtime = new Date(e.dt * 1000 + (timedelta * 60 + delta) * 60000);
      if (day != wtime.getDate()) {
        gap = 0;
        if (day == 0) {
          gap = ((wtime.getHours() + 24 - timedelta) % 24) / 3 + (Math.floor(timedelta / 3))
        }
        day = wtime.getDate();
        html += "</div>\n"
        html += "<div class='flex-grid'>\n"
        html += "<div class='col nobg'><p style='text-align: right;font-size:125%;line-height: 100%;'>"+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][wtime.getDay()]+"<br/>"+wtime.getDate()+"/"+(wtime.getMonth()+1)+"</p></div>";
        for (i=0; i<gap; i++) { html += "<div class='col nobg'>&nbsp;</div\n>"; }
        hour = 0
      }

      html += "<div class='col'>\n"
      html += "<p><b style='text-align:center;'>"+wtime.getHours()+"</b><b class='hide-on-small'>:00</b></p>\n"
      html += "<p><i title='"+e.weather[0].description+"' class='wi wi-owm-"+e.weather[0].id+"'></i></p>"
      html += "<p style='margin:-12px 0 -6px;'>"+Math.round(e.main.temp)+"°<small class='hide-on-small'>C</small></p>\n"
      html += "<p style='margin: 0 -6px;'><small>"+Math.round(e.main.pressure)+"<small class='hide-on-small'>hPa</small></small></p>\n"
      html += "<p><i title='Winds from "+Math.round(e.wind.deg)+"°' class='wi wi-wind from-"+Math.round(e.wind.deg)+"-deg'></i><br/><span style='margin-top:-6px;display:block;'>"+Math.round(e.wind.speed*1.944)+"kn</span></p>\n"
      html += "</div>\n"
      hour += 1

      if (day != wtime.getDate()) {
        day = wtime.getDate();
        html += "</div>\n"
      }
    });
    for (i=0; i<(8-hour); i++) { html += "<div class='col nobg'>&nbsp;</div\n>"; }
    $("#weather .forecast").html(html);
  })

  $.get(domain+"/data/board.txt?"+new Date().getTime(),function(data){
    $(".board").html(data)
    $(".write button").on("click",function(){
      $(this).prop("disabled",true);
      text = $(".write textarea").val().trim().replace(/\n/g,"<br/>");
      if (text.length > 0) {
        $.post("/board",{text:text},function(data){
          if (data == "ok") {
            $(".write button").prop("disabled",false);
            $(".write textarea").val("");
            update("#board")
          }
        })
      }
    })
  })

});

function deg_to_dms (deg,dir) {
   var a = 0;
   if (deg < 0) { a = 1; deg *= -1;}
   var d = Math.floor (deg);
   var minfloat = (deg-d)*60;
   var m = Math.floor(minfloat);
   var secfloat = (minfloat-m)*60;
   var s = Math.round(secfloat);
   if (s==60) {
     m++;
     s=0;
   }
   if (m==60) {
     d++;
     m=0;
   }
   return ("" + d + "°" + pad(m,2) + "'" + pad(s,2) + "\"" + dir[a]);
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

