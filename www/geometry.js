"use strict";

var Geometry = new function() {
  var $public = this;
  var $private = {
    init: function() {
      $public.makeQuad = this.makeQuad.bind(this);
      $public.makeShape = this.makeShape.bind(this);

      return this;
    },  

    getMaterial: function(color) {
      return new THREE.MeshBasicMaterial( { color: color } );
    },

    makeQuad: function(corners, color) {
      var vertexPositions = [ corners[0], corners[1], corners[2], corners[3], corners[0], corners[2] ];
      return $public.makeShape(vertexPositions, color)
    },

    makeShape: function(vertexPositions, color) {
      var geometry = new THREE.BufferGeometry();
      var vertices = new Float32Array( vertexPositions.length * 3 );
      for ( var i = 0; i < vertexPositions.length; i++ ) {
        vertices[ i*3 + 0 ] = vertexPositions[i][0];
        vertices[ i*3 + 1 ] = vertexPositions[i][1];
        vertices[ i*3 + 2 ] = vertexPositions[i][2];
      }
      geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
      var material = this.getMaterial(color);
      var shape = new THREE.Mesh(geometry, material);
      return shape;
    }
  }.init();
};
