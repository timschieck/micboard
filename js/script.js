"use strict";

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import QRCode from 'qrcode'

import { updateGIFBackgrounds, uploadMode } from './gif.js'
import { randomDataGenerator, autoRandom } from './demodata.js'
import { settingsView } from './settings.js'
import { updateSlot, updateViewOnly } from './channelview.js'

import { updateAudioChart, updateRfChart, initChart, charts } from './chart-smoothie.js'


import '../css/style.css'
import '../node_modules/@ibm/plex/css/ibm-plex.css'
import '../node_modules/@json-editor/json-editor/dist/css/jsoneditor.min.css'

var dataURL = '/data';
// export var transmitters = {};
export var transmitters = [];

export var gif_list = {};

export var config = {};

var localURL = '';
let start_slot = parseInt(getUrlParameter('start_slot'))
let stop_slot = parseInt(getUrlParameter('stop_slot'))
let preset = getUrlParameter('preset')
let demo = getUrlParameter('demo')
let settings = getUrlParameter('settings')


export let displayList = []

$(document).ready(function() {

  if(demo && (isNaN(start_slot) || isNaN(stop_slot))) {
    start_slot = 1
    stop_slot = 12
  }

  if (window.location['href'].includes('amazonaws')) {
    dataURL = './static/data.json'
    demo = 'true'
  }
  if (demo == 'true') {
    for(var i = start_slot; i <= stop_slot; i++) {
      transmitters[i] = randomDataGenerator(i);
    }
    initialMap();
    autoRandom();
  }

  else {
    initialMap();
    setInterval(JsonUpdate, 1000);
    wsConnect();
  }
  if(settings) {
    setTimeout(settingsView, 50)
  }

  document.addEventListener("keydown", function(e) {
    if ( $('.settings').is(":visible")) {
      return
    }
    if (e.keyCode == 49) {
      window.location.href = demo ? '/?demo=true&preset=1' : '/?preset=1'
    }
    if (e.keyCode == 50) {
      window.location.href = demo ? '/?demo=true&preset=2' : '/?preset=2';
    }
    if (e.keyCode == 51) {
      window.location.href = demo ? '/?demo=true&preset=3' : '/?preset=3';
    }
    if (e.keyCode == 52) {
      window.location.href = demo ? '/?demo=true&preset=4' : '/?preset=4';
    }
    if (e.keyCode == 53) {
      window.location.href = demo ? '/?demo=true&preset=5' : '/?preset=5';
    }
    if (e.keyCode == 54) {
      window.location.href = demo ? '/?demo=true&preset=6' : '/?preset=6';
    }
    if (e.keyCode == 55) {
      window.location.href = demo ? '/?demo=true&preset=7' : '/?preset=7';
    }
    if (e.keyCode == 56) {
      window.location.href = demo ? '/?demo=true&preset=8' : '/?preset=8';
    }
    if (e.keyCode == 57) {
      window.location.href = demo ? '/?demo=true&preset=9' : '/?preset=9';
    }

    if (e.keyCode == 68) {
      if (preset) {
        window.location.href = demo ? '/?preset=' + preset : '/?demo=true&preset=' + preset
      }
      else {
        window.location.href = demo ? '/' : '/?demo=true'
      }
    }

    if (e.keyCode == 70) {
      toggleFullScreen();
    }

    if (e.keyCode == 71) {
      toggleBackgrounds();
    }

    if (e.keyCode == 73) {
      toggleInfoDrawer();
    }

    if (e.keyCode == 81) {
      generateQR();
      $('.modal').modal('toggle');
    }
    if (e.keyCode == 83) {
      settingsView(config);
    }

    if (e.keyCode == 85) {
      if(!document.getElementById("micboard").classList.contains("uploadmode")) {
        uploadMode();
      }
    }
  }, false);

});

function StartStopSlotList(start,stop) {
  let out = []
  for(let i = start; i <= stop; i++) {
    out.push(i)
  }
	return out
}

// enables info-drawer toggle for mobile clients
function infoToggle() {
  $('.col-sm').click(function() {
    if($(window).width() <= 980) {
      $(this).find(".info-drawer").toggle();
    }
  });
}

// https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
function toggleFullScreen() {
  if (!document.webkitFullscreenElement) {
      document.documentElement.webkitRequestFullscreen();
  } else {
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}


function swapClass(selector, currentClass, newClass) {
  selector.classList.remove(currentClass)
  selector.classList.add(newClass)
}


function toggleInfoDrawer() {
  let selector = document.getElementById("micboard")

  if(selector.classList.contains("elinfo00")) {
    swapClass(selector,"elinfo00","elinfo01")
  }

  else if(selector.classList.contains("elinfo01")) {
    swapClass(selector,"elinfo01","elinfo10")
  }

  else if(selector.classList.contains("elinfo10")) {
    swapClass(selector,"elinfo10","elinfo11")
  }

  else if(selector.classList.contains("elinfo11")) {
    swapClass(selector,"elinfo11","elinfo00")
  }

  if (selector.classList.contains("uploadmode")) {
    showDivSize();
  }
}


function toggleBackgrounds() {
  let selector = document.getElementById("micboard")

  if(selector.classList.contains("bg-std")) {
    swapClass(selector,"bg-std","bg-gif")
    updateGIFBackgrounds()
  }
  else if(selector.classList.contains("bg-gif")) {
    swapClass(selector,"bg-gif","bg-img")
    $("#micboard .mic_name").css('background-image', '');
    $("#micboard .mic_name").css('background-size', '');
  }
  else if(selector.classList.contains("bg-img")){
    swapClass(selector,"bg-img","bg-std")

    $("#micboard .mic_name").css('background-image', '');
    $("#micboard .mic_name").css('background-size', '');
  }
}

function generateQR(){
  const qrOptions = {
    width: 600
  };

  let url = localURL + location.pathname + location.search;
  document.getElementById('largelink').href = url;
  document.getElementById('largelink').innerHTML = url;
  QRCode.toCanvas(document.getElementById('qrcode'), url, qrOptions, function (error) {
    if (error) console.error(error)
    console.log('success!');
  })
}


function ActivateErrorBoard(){
  $('#micboard').hide()
  $('.settings').hide()
  $('.server-error').show();
}


function wsConnect(){
  let loc = window.location, new_uri;
  if (loc.protocol === "https:") {
    new_uri = "wss:";
  } else {
    new_uri = "ws:";
  }
  new_uri += "//" + loc.host;
  new_uri +=  "/ws";
  let socket = new WebSocket(new_uri);

  socket.onmessage = function(msg){
    let mic_data = JSON.parse(msg.data)['update'];
    for (var i in mic_data) {
      updateSlot(mic_data[i])
    }
    // updateSlot(mic_data);
  };

  socket.onclose = function(event){
    ActivateErrorBoard();
  };

  socket.onerror = function(event){
    ActivateErrorBoard();
  };
}

// https://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
// var getUrlParameter = function getUrlParameter(sParam) {
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function JsonUpdate(){
  fetch(dataURL)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    for(var i in data.receivers) {
      for (var j in data.receivers[i].tx) {
        updateSlot(data.receivers[i].tx[j]);
      }
    }
  });
}





function dataFilterFromList(data){
  for(var i in data.receivers){
    for (var j in data.receivers[i].tx){
      var tx = data.receivers[i].tx[j];
      tx.ip = data.receivers[i].ip;
      tx.type = data.receivers[i].type;
      if (displayList.includes(tx.slot)) {
        transmitters[tx.slot] = tx;
      }
    }
  }
}


function displayListChooser(data) {
  if (!isNaN(preset)) {
    let plist = []
    for (var p in data['config']['displays']) {
      plist[data['config']['displays'][p]['preset']] = data['config']['displays'][p]['slots']
    }

    return plist[preset]
  }
  else if (!isNaN(start_slot) && !isNaN(stop_slot)) {
    if (start_slot < stop_slot) {
      return StartStopSlotList(start_slot,stop_slot)
    }
  }
  else {
    let slot = data['config']['slots']
    console.log(slot)
    let out = []
    for(var i = 0; i < slot.length; i++) {
      out.push(slot[i]['slot'])
    }
    return out
  }
}

function initialMap() {
  fetch(dataURL)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    gif_list = data['gif']
    localURL = data['url']
    config = data['config']
    displayList = displayListChooser(data)
    console.log(displayList)


    if (getUrlParameter('demo') !== 'true') {

      dataFilterFromList(data)
    }

    document.getElementById("micboard").innerHTML = ""

    var tx = transmitters;
    for(let i in displayList) {
      let j = displayList[i]
      var t = document.getElementById("column-template").content.cloneNode(true);
      t.querySelector('div.col-sm').id = 'slot-' + tx[j].slot;
      updateViewOnly(t,tx[j])
      charts[tx[j].slot] = initChart(t);
      document.getElementById('micboard').appendChild(t);
    }
    infoToggle();
    flexFix();
  });
}


// https://medium.com/developedbyjohn/equal-width-flex-items-a5ba1bfacb77
// Shouldn't be fixing this with js, yet here I am.
function flexFix () {
  var flexFixHTML =   `<div class="col-sm flexfix"></div>
                       <div class="col-sm flexfix"></div>
                       <div class="col-sm flexfix"></div>
                       <div class="col-sm flexfix"></div>`;
  $("#micboard").append(flexFixHTML);
}
