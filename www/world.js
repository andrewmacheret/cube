"use strict";

function World($options) {
  var $public = this;
  var $private = {
    init: function() {
      this.containerId = $options.containerId;

      $public.render = this.render.bind(this);
      
      this.initRenderer();
      this.initCamera();
      this.initScene();
      this.initEvents();

      return this;
    },

    initRenderer: function() {
      var container = $('#' + this.containerId);
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setClearColor( 0x000000, 1 );
      this.renderer.setSize( container.width(), container.height() );
      container.append( this.renderer.domElement );

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
    },

    initCamera: function() {
      var size = this.renderer.getSize();
      this.camera = new THREE.PerspectiveCamera( 45, size.width / size.height, 0.1, 1000 );
      this.camera.position.z = 20;
    },

    initEvents: function() {
      $(window).resize(function() {
        var container = $('#' + this.containerId);
        this.renderer.setSize( container.width(), container.height() );
        var size = this.renderer.getSize();
        this.camera.aspect = size.width / size.height;
        this.camera.updateProjectionMatrix();
      }.bind(this));

      $('#shuffle').click(function() {
        if (this.move) return;
        this.cube.shuffle({times: 200});
      }.bind(this));

      $('#restart').click(function() {
        if (this.move) return;
        this.cube.restart();
      }.bind(this));

      $('#solve').click(function() {
        if (this.move) return;
        // over the course of 1 second, rotate a face slowly 0-100% of a rotation
        // after 1 second, finish the rotation
        // in 1 second after that, repeat again
        this.solve();
      }.bind(this));
    },

    initScene: function() {
      this.cube = new Cube({unitSize: 2});
      this.squares = this.cube.getSquares();
      
      this.scene = new THREE.Scene();
      $.each(this.squares, function(i, square) {
        this.scene.add(square);
      }.bind(this));

      new Mouse({
        containerId: this.containerId,
        dragStart: function(event, position) {
          if (this.move) return;
          this.dragging = true;

          var squares = this.getSquares(position);
          $.each(squares, function(i, square) {
            this.cube.selectFace(square.object);
          }.bind(this));
        }.bind(this),
        dragEnd: function(event) {
          if (this.move) return;
          if (this.dragging) {
            var face = this.cube.getSelectedFace();
            if (face) {
              this.cube.finishRotation();
              this.cube.rotateFace({axis: face.axis, side: face.side, rotation: 0});
              this.cube.selectFace();
            }
          }
          this.dragging = false;
        }.bind(this),
        dragging: function(event, positions) {
          var face = this.cube.getSelectedFace();
          if (!face || this.move) {
            var dx = positions.current.x - positions.last.x;
            var dy = positions.current.y - positions.last.y;
            this.scene.rotation.x += dy / 100;
            this.scene.rotation.y += dx / 100;
          } else {
            var dx = positions.start.x - positions.last.x;
            var dy = positions.start.y - positions.last.y;
            var rotation = -(dx + dy) / 100;
            this.cube.rotateFace({axis: face.axis, side: face.side, rotation: rotation});
          }
        }.bind(this),
        hovering: function(event, position) {
          if (this.move) return;
          if (this.dragging) return;
          var squares = this.getSquares(position);
          if (squares.length == 0) {
            this.cube.selectFace();
          } else {
            $.each(squares, function(i, square) {
              this.cube.selectFace(square.object);
            }.bind(this));
          }
        }.bind(this)
      });

      this.scene.rotation.x = Math.PI / 6;
      this.scene.rotation.y = Math.PI / 4;
    },

    solve: function() {
      this.cube.selectFace();
      this.cubeSolver = new CubeSolver({cube: this.cube});
      this.cubeSolver.start();
      this.move = this.cubeSolver.getNextMove();
      this.moveTime = new Date();
    },

    getSquares: function(position) {
      var rendererPosition = $(this.renderer.domElement).position();
      this.mouse.x = ( (position.x - rendererPosition.left) / this.renderer.domElement.width ) * 2 - 1;
      this.mouse.y = - ( (position.y - rendererPosition.top) / this.renderer.domElement.height ) * 2 + 1;

      this.raycaster.setFromCamera( this.mouse, this.camera );

      return this.raycaster.intersectObjects(this.squares);
    },

    render: function() {
      window.requestAnimationFrame(this.render.bind(this));

      if (this.move) {
        this.solveStarted = true;
        var percent = (new Date() - this.moveTime) / 500;
        var rotation = this.move.rotation;
        if (percent < 1) {
          this.cube.rotateFace({axis: this.move.axis, side: this.move.side, rotation: rotation * percent});
        } else {
          this.cube.rotateFace({axis: this.move.axis, side: this.move.side, rotation: rotation});
          this.cube.finishRotation();
          this.cube.rotateFace({axis: this.move.axis, side: this.move.side, rotation: 0});
          this.move = this.cubeSolver.getNextMove();
          this.moveTime = new Date();
        }
      }

      this.renderer.render( this.scene, this.camera );
    }
  }.init();
};
