"use strict";

$(function() {
  console.log('Loading...');

  var world = new World({containerId: 'canvas-container'});
  world.render();

  console.log('Loaded.');
});
