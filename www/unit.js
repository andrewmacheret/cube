"use strict";

var Unit = function($options) {
  var $public = this;
  var $private = {
    init: function() {
      this.square = $options.square;
      this.color = this.square.material.color.getHex();

      $public.getSquare = this.getSquare.bind(this);
      $public.getColor = this.getColor.bind(this);
      $public.setColor = this.setColor.bind(this);
      $public.select = this.select.bind(this);
      $public.unselect = this.unselect.bind(this);
      $public.isSelected = this.isSelected.bind(this);
      $public.toString = this.toString.bind(this);

      return this;
    },

    getSquare: function() {
      return this.square;
    },

    getColor: function() {
      return this.color;
    },

    setColor: function(color) {
      this.color = color;
      this.selected = false;
      return this.square.material.color.setHex(color);
    },

    select: function() {
      var factor = 0.7;
      var r = Math.floor((0xff & (this.color >> 16)) * factor);
      var g = Math.floor((0xff & (this.color >> 8)) * factor);
      var b = Math.floor((0xff & this.color) * factor);
      var selectionColor = (r << 16) | (g << 8) | b;
      this.square.material.color.setHex(selectionColor);
      this.selected = true;
    },

    unselect: function() {
      this.square.material.color.setHex(this.color);
      this.selected = false;
    },

    isSelected: function() {
      return this.selected;
    },

    toString: function() {
      var colorHex = this.color.toString(16);
      colorHex = '000000'.substring(0, '000000'.length - colorHex.length) + colorHex;
      return colorHex + (this.selected ? ' (selected)' : '');
    }
  }.init();
};
