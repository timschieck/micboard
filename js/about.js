"use strict";

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import '../css/colors.scss';
import '../css/about.scss';


$(document).ready(() => {
  document.getElementById('version').innerHTML = 'Micboard ' + VERSION;
});
