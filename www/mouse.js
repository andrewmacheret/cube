"use strict";

var Mouse = function($options) {
  var $public = this;
  var $private = {
    positions: {
      start:   {x: 0, y: 0},
      last:    {x: 0, y: 0},
      current: {x: 0, y: 0}
    },

    init: function() {
      this.callbacks = {
        dragging: $options.dragging,
        dragStart: $options.dragStart,
        dragEnd: $options.dragEnd,
        hovering: $options.hovering
      };
      this.containerId = $options.containerId;

      this.initEvents();

      return this;
    },

    initEvents: function() {
      var container = $('#' + this.containerId);

      container.mousemove(function(event) {
        this.continueDragging(event);
      }.bind(this));
      container.on('touchmove', function(event) {
        this.continueDragging(event.originalEvent.changedTouches[0]);
      }.bind(this));

      container.mousedown(function(event) {
        this.startDragging(event);
      }.bind(this));
      container.on('touchstart', function(event) {
        this.startDragging(event.originalEvent.targetTouches[0]);
      }.bind(this));

      container.mouseup(function(event) {
        this.stopDragging(event);
      }.bind(this));
      container.on('touchend', function(event) {
        this.stopDragging(event.originalEvent.changedTouches[event.originalEvent.changedTouches.length-1]);
      }.bind(this));

      container.mouseleave(function(event) {
        //this.stopDragging(event);
      }.bind(this));
      container.on('touchleave', function(event) {
        //this.stopDragging(event);
      }.bind(this));
    },

    startDragging: function(event) {
      if (!this.dragging) {
        this.dragging = true;
        this.positions.last = this.positions.current = this.positions.start = {x: event.pageX, y: event.pageY};

        this.callbacks.dragStart && this.callbacks.dragStart(event, this.positions.current);
      }
    },

    continueDragging: function(event) {
      this.positions.current = {x: event.pageX, y: event.pageY};
      if (this.dragging) {
        this.callbacks.dragging && this.callbacks.dragging(event, this.positions);

        this.positions.last = this.positions.current;
      } else {
        this.callbacks.hovering && this.callbacks.hovering(event, this.positions.current);
      }
    },

    stopDragging: function(event) {
      this.continueDragging(event);
      this.dragging = false;

      this.callbacks.dragEnd && this.callbacks.dragEnd(event);
    }

  }.init();
};
