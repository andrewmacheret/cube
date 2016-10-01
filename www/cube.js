"use strict";

var Cube = function($options) {
  var $public = this;
  var $private = {
    colors: {
      red: 0xff0000,
      yellow: 0xffff00,
      orange: 0xffa500,
      green: 0x00ff00,
      blue: 0x0000ff,
      white: 0xffffff
    },
    corners: [
      {x:0, y:0},
      {x:2, y:0},
      {x:2, y:2},
      {x:0, y:2}
    ],
    edges: [
      {x:1, y:0},
      {x:2, y:1},
      {x:1, y:2},
      {x:0, y:1}
    ],

    selectedFace: null,

    init: function() {
      this.unitSize = $options.unitSize;

      $public.getSquares = this.getSquares.bind(this);
      $public.getFace = this.getFace.bind(this);
      $public.rotateFace = this.rotateFace.bind(this);
      $public.selectFace = this.selectFace.bind(this);
      $public.getSelectedFace = this.getSelectedFace.bind(this);
      $public.finishRotation = this.finishRotation.bind(this);
      $public.shuffle = this.shuffle.bind(this);
      $public.restart = this.restart.bind(this);
      $public.findCenter = this.findCenter.bind(this);
      $public.findEdge = this.findEdge.bind(this);
      $public.findCorner = this.findCorner.bind(this);
      $public.getRotations = this.getRotations.bind(this);
      $public.isSolved = this.isSolved.bind(this);

      this.colorNames = $.keys(this.colors);

      this.initData();

      return this;
    },

    initData: function() {
      var data = [];
      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        var axis = [];
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          var color = this.getColor(axisIndex, sideIndex);
          var side = [];
          for (var i=0; i<3; i++) {
            var sidePart = []
            for (var j=0; j<3; j++) {
              var unit = this.makeUnit(axisIndex, sideIndex, i, j, color);
              sidePart.push(unit);
            }
            side.push(sidePart);
          }
          axis.push(side);
        }
        data.push(axis);
      }

      this.data = data;
    },

    getColor: function(axisIndex, sideIndex) {
      var colorIndex = sideIndex * 3 + axisIndex;
      var color = this.colorNames[colorIndex];
      return this.colors[color];
    },

    getSelectedColor: function(color) {
      var factor = 0.7;
      var r = Math.floor((0xff & (color >> 16)) * factor);
      var g = Math.floor((0xff & (color >> 8)) * factor);
      var b = Math.floor((0xff & color) * factor);
      return (r << 16) | (g << 8) | b;
    },

    makeUnit: function(axisIndex, sideIndex, i, j, color) {
      var unitSize = this.unitSize;
      var unitStart = 1.5 * unitSize;
      var unitBuffer = 0.02 * unitSize;

      var a1 = -unitStart + unitSize*i + unitBuffer;
      var a2 = -unitStart + unitSize*(i+1) - unitBuffer;
      var b1 = -unitStart + unitSize*j + unitBuffer;
      var b2 = -unitStart + unitSize*(j+1) - unitBuffer;
      var c1 = -unitStart;// + unitBuffer;
      var c2 = unitStart;// - unitBuffer;

      // if axisIndex == 0 (x) then c, a, b
      // if axisIndex == 1 (y) then b, c, a
      // if axisIndex == 2 (z) then a, b, c
      var coords;
      if (axisIndex == 0) {
        if (sideIndex == 0) {
          coords = [[c1, a1, b1], [c1, a1, b2], [c1, a2, b2], [c1, a2, b1]];
        } else {
          coords = [[c2, a1, b1], [c2, a2, b1], [c2, a2, b2], [c2, a1, b2]];
        }
      } else if (axisIndex == 1) {
        if (sideIndex == 0) {
          coords = [[b1, c1, a1], [b2, c1, a1], [b2, c1, a2], [b1, c1, a2]];
        } else {
          coords = [[b1, c2, a1], [b1, c2, a2], [b2, c2, a2], [b2, c2, a1]];
        }
      } else { //if (axisIndex == 2) {
        if (sideIndex == 0) {
          coords = [[a1, b1, c1], [a1, b2, c1], [a2, b2, c1], [a2, b1, c1]];
        } else {
          coords = [[a1, b1, c2], [a2, b1, c2], [a2, b2, c2], [a1, b2, c2]];
        }
      }

      return new Unit({square: Geometry.makeQuad(coords, color)});
    },

    getSquares: function() {
      var squares = [];

      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
              var square = this.data[axisIndex][sideIndex][i][j].getSquare();
              squares.push(square);
            }
          }
        }
      }

      return squares;
    },

    getUnits: function(options) {
      var axisIndex = options.axisIndex;
      var sideIndex = options.sideIndex;

      var units = [];
      for (var i=0; i<3; i++) {
        for (var j=0; j<3; j++) {
          units.push( this.data[axisIndex][sideIndex][i][j] );
        }
      }
      for (var otherAxisIndex=0; otherAxisIndex<3; otherAxisIndex++) {
        if (otherAxisIndex != axisIndex) {
          for (var otherSideIndex=0; otherSideIndex<2; otherSideIndex++) {
            var topLeft = this.getTopLeft({
              axisIndex: axisIndex,
              sideIndex: sideIndex,
              otherAxisIndex: otherAxisIndex,
              otherSideIndex: otherSideIndex
            });

            for (var i=0; i<3; i++) {
              var unit = this.data[otherAxisIndex][otherSideIndex][topLeft.x + i * topLeft.dx][topLeft.y + i * topLeft.dy];
              units.push(unit);
            }
          }
        }
      }
      return units;
    },

    getTopLeft: function(options) {
      var axisIndex = options.axisIndex;
      var sideIndex = options.sideIndex;
      var otherAxisIndex = options.otherAxisIndex; // should not equal axisIndex
      var otherSideIndex = options.otherSideIndex;

      var result = {};
      var isNextAxis = otherAxisIndex == ((axisIndex + 1) % 3);
      var isSameSide = otherSideIndex == sideIndex;
      result[!isNextAxis ? 'x'  : 'y' ] = sideIndex * 2;
      result[isNextAxis  ? 'x'  : 'y' ] = (!isNextAxis ^ isSameSide) * 2;
      result[isNextAxis  ? 'dx' : 'dy'] = 1 - result[isNextAxis ? 'x' : 'y'];
      result[!isNextAxis ? 'dx' : 'dy'] = 0;
      return result;
    },

    getFace: function(options) {
      var square = options.square;
      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
              if (square == this.data[axisIndex][sideIndex][i][j].getSquare()) {
                return {
                  axis: ['x', 'y', 'z'][axisIndex],
                  side: ['front', 'back'][sideIndex]
                }
              }
            }
          }
        }
      }
    },

    shuffle: function(options) {
      var times = options.times;
      for (var t = 0; t < times; t++) {
        var axisIndex = Math.floor(Math.random() * 3);
        var sideIndex = Math.floor(Math.random() * 2);
        var rotations = Math.floor(Math.random() * 3);

        this.finishRotation({
          axisIndex: axisIndex,
          sideIndex: sideIndex,
          rotations: rotations
        });
      }
    },

    restart: function() {
      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          var color = this.getColor(axisIndex, sideIndex);
          for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
              this.data[axisIndex][sideIndex][i][j].setColor(color);
            }
          }
        }
      }
    },

    rotateFace: function(options) {
      var axis = options.axis;
      var axisIndex = ['x', 'y', 'z'].indexOf(axis);
      var sideIndex = ['front', 'back'].indexOf(options.side);
      var rotation = options.rotation;

      var units = this.getUnits({
        axisIndex: axisIndex,
        sideIndex: sideIndex
      });
      $.each(units, function(i, unit) {
        unit.getSquare().rotation[axis] = ((sideIndex == 0 ? 1 : -1) * rotation) * (Math.PI / 2);
      }.bind(this));

      this.selectedFace = {
        axisIndex: axisIndex,
        sideIndex: sideIndex,
        rotation: rotation
      };
    },

    finishRotation: function(options) {
      var axisIndex, sideIndex, rotations;
      if (options) {
        axisIndex = options.axisIndex;
        sideIndex = options.sideIndex;
        rotations = options.rotations;
      } else {
        axisIndex = this.selectedFace.axisIndex;
        sideIndex = this.selectedFace.sideIndex;
        rotations = (Math.round(this.selectedFace.rotation) % 4 + 4) % 4;
      }

      var face = this.data[axisIndex][sideIndex];

      //console.log('axisIndex=' + axisIndex + ' sideIndex=' + sideIndex + ' rotations=' + rotations + ' unit=' + face[1][1]);

      for (var r = 0; r < rotations; r++) {

        // rotate corners and edges
        var tempColors = null;
        var lastUnits = null;
        for (var i=0; i<this.corners.length; i++) {
          var j = sideIndex != 0 ? i : this.corners.length - i - 1;
          var corner = face[this.corners[j].x][this.corners[j].y];
          var edge = face[this.edges[j].x][this.edges[j].y];
          if (tempColors == null) {
            tempColors = {
              corner: corner.getColor(),
              edge: edge.getColor()
            };
          } else {
            lastUnits.corner.setColor(corner.getColor());
            lastUnits.edge.setColor(edge.getColor());
          }
          lastUnits = {
            corner: corner,
            edge: edge
          };
        }
        lastUnits.corner.setColor(tempColors.corner);
        lastUnits.edge.setColor(tempColors.edge);

        // rotate other axes
        tempColors = null;
        lastUnits = null;
        for (var otherSideIndex=1; otherSideIndex>=0; otherSideIndex--) {
          for (var otherAxisIndex=2; otherAxisIndex>=0; otherAxisIndex--) {
            var actualAxisIndex = ((sideIndex == 0) ^ (axisIndex == 1)) ? otherAxisIndex : 2 - otherAxisIndex;
            var actualSideIndex = otherSideIndex;
            if (actualAxisIndex != axisIndex) {
              var topLeft = this.getTopLeft({
                axisIndex: axisIndex,
                sideIndex: sideIndex,
                otherAxisIndex: actualAxisIndex,
                otherSideIndex: actualSideIndex
              });

              var units = [];
              for (var i=0; i<3; i++) {
                units.push( this.data[actualAxisIndex][actualSideIndex][topLeft.x + topLeft.dx * i][topLeft.y + topLeft.dy * i] );
              }

              if (tempColors == null) {
                tempColors = [];
                for (var i=0; i<3; i++) {
                  tempColors.push(units[i].getColor());
                }
              } else {
                for (var i=0; i<3; i++) {
                  lastUnits[i].setColor(units[i].getColor());
                }
              }

              lastUnits = units;
            }
          }
        }
        for (var i=0; i<3; i++) {
          lastUnits[i].setColor(tempColors[i]);
        }
      }
    },

    selectFace: function(square) {
      this.selectedFace = null;
      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
              var unit = this.data[axisIndex][sideIndex][i][j];
              if (unit.getSquare() == square) {
                this.selectedFace = {
                  axisIndex: axisIndex,
                  sideIndex: sideIndex,
                  rotation: 0
                }
              }

              unit.unselect();
            }
          }
        }
      }

      if (this.selectedFace) {
        var units = this.getUnits(this.selectedFace);
        $.each(units, function(i, unit) {
          unit.select();
        }.bind(this));
      }
    },

    getSelectedFace: function() {
      if (!this.selectedFace) return null;
      return {
        axis: ['x', 'y', 'z'][this.selectedFace.axisIndex],
        side: ['front', 'back'][this.selectedFace.sideIndex],
        rotation: this.selectedFace.rotation
      }
    },

    findCenter: function(options) {
      var primary = this.colors[options.primary];

      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          var center = this.data[axisIndex][sideIndex][1][1].getColor();
          if (center != primary) continue;

          return {
            axis: ['x', 'y', 'z'][axisIndex],
            side: ['front', 'back'][sideIndex],
          };
        }
      }
      return null;
    },

    findEdge: function(options) {
      var primary = this.colors[options.primary];
      var secondary = this.colors[options.secondary];

      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          for (var otherAxisIndex=0; otherAxisIndex<3; otherAxisIndex++) {
            if (axisIndex != otherAxisIndex) {
              for (var otherSideIndex=0; otherSideIndex<2; otherSideIndex++) {
                var topLeft1 = this.getTopLeft({
                  axisIndex: axisIndex,
                  sideIndex: sideIndex,
                  otherAxisIndex: otherAxisIndex,
                  otherSideIndex: otherSideIndex
                });
                var edge1 = this.data[otherAxisIndex][otherSideIndex][topLeft1.x + topLeft1.dx][topLeft1.y + topLeft1.dy].getColor();
                if (edge1 != secondary) continue;

                var topLeft2 = this.getTopLeft({
                  axisIndex: otherAxisIndex,
                  sideIndex: otherSideIndex,
                  otherAxisIndex: axisIndex,
                  otherSideIndex: sideIndex
                });
                var edge2 = this.data[axisIndex][sideIndex][topLeft2.x + topLeft2.dx][topLeft2.y + topLeft2.dy].getColor();
                if (edge2 != primary) continue;

                return {
                  primary: {
                    axis: ['x', 'y', 'z'][axisIndex],
                    side: ['front', 'back'][sideIndex]
                  },
                  secondary: {
                    axis: ['x', 'y', 'z'][otherAxisIndex],
                    side: ['front', 'back'][otherSideIndex]
                  }
                };
              }
            }
          }
        }
      }
      return null;
    },

    findCorner: function(options) {
      var primary = this.colors[options.primary];
      var secondary = this.colors[options.secondary];
      var tertiary = this.colors[options.tertiary];

      for (var primaryAxisIndex=0; primaryAxisIndex<3; primaryAxisIndex++) {
        for (var secondaryAxisIndex=0; secondaryAxisIndex<3; secondaryAxisIndex++) {
          if (primaryAxisIndex != secondaryAxisIndex) {
            for (var primarySideIndex=0; primarySideIndex<2; primarySideIndex++) {
              for (var secondarySideIndex=0; secondarySideIndex<2; secondarySideIndex++) {

                var v1 = [
                  primaryAxisIndex == 0 ? primarySideIndex * 2 - 1 : 0,
                  primaryAxisIndex == 1 ? primarySideIndex * 2 - 1 : 0,
                  primaryAxisIndex == 2 ? primarySideIndex * 2 - 1 : 0
                ];
                var v2 = [
                  secondaryAxisIndex == 0 ? secondarySideIndex * 2 - 1 : 0,
                  secondaryAxisIndex == 1 ? secondarySideIndex * 2 - 1 : 0,
                  secondaryAxisIndex == 2 ? secondarySideIndex * 2 - 1 : 0
                ];
                var crossProduct = [
                  v1[1] * v2[2] - v1[2] * v2[1],
                  v1[2] * v2[0] - v1[0] * v2[2],
                  v1[0] * v2[1] - v1[1] * v2[0]
                ];
                var tertiaryAxisIndex = Math.max(crossProduct.indexOf(-1), crossProduct.indexOf(1));
                var tertiarySideIndex = Math.floor((1 - (crossProduct[0] | crossProduct[1] | crossProduct[2]) + 1) / 2);

                var topLeft1 = this.getTopLeft({
                  axisIndex: secondaryAxisIndex,
                  sideIndex: secondarySideIndex,
                  otherAxisIndex: primaryAxisIndex,
                  otherSideIndex: primarySideIndex
                });
                var edge1 = this.data[primaryAxisIndex][primarySideIndex][topLeft1.x][topLeft1.y].getColor();
                if (edge1 != primary) continue;

                var topLeft2 = this.getTopLeft({
                  axisIndex: tertiaryAxisIndex,
                  sideIndex: tertiarySideIndex,
                  otherAxisIndex: secondaryAxisIndex,
                  otherSideIndex: secondarySideIndex
                });
                var edge2 = this.data[secondaryAxisIndex][secondarySideIndex][topLeft2.x][topLeft2.y].getColor();
                if (edge2 != secondary) continue;

                var topLeft3 = this.getTopLeft({
                  axisIndex: primaryAxisIndex,
                  sideIndex: primarySideIndex,
                  otherAxisIndex: tertiaryAxisIndex,
                  otherSideIndex: tertiarySideIndex
                });
                var edge3 = this.data[tertiaryAxisIndex][tertiarySideIndex][topLeft3.x][topLeft3.y].getColor();
                if (edge3 != tertiary) continue;

                return {
                  primary: {
                    axis: ['x', 'y', 'z'][primaryAxisIndex],
                    side: ['front', 'back'][primarySideIndex]
                  },
                  secondary: {
                    axis: ['x', 'y', 'z'][secondaryAxisIndex],
                    side: ['front', 'back'][secondarySideIndex]
                  },
                  tertiary: {
                    axis: ['x', 'y', 'z'][tertiaryAxisIndex],
                    side: ['front', 'back'][tertiarySideIndex]
                  }
                };

              }
            }
          }
        }
      }
    },

    getRotations: function(options) {
      var primary = this.colors[options.focus];
      var secondary = this.colors[options.from];
      var tertiary = this.colors[options.to];

      var primaryFace;
      var secondaryFace;
      var tertiaryFace;
      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          var center = this.data[axisIndex][sideIndex][1][1].getColor();
          if (center == primary) {
            primaryFace = {
              axisIndex: axisIndex,
              sideIndex: sideIndex
            };
          } else if (center == secondary) {
            secondaryFace = {
              axisIndex: axisIndex,
              sideIndex: sideIndex
            };
          } else if (center == tertiary) {
            tertiaryFace = {
              axisIndex: axisIndex,
              sideIndex: sideIndex
            };
          }
        }
      }

      var topLeftSecondary = this.getTopLeft({
        axisIndex: secondaryFace.axisIndex,
        sideIndex: secondaryFace.sideIndex,
        otherAxisIndex: primaryFace.axisIndex,
        otherSideIndex: primaryFace.sideIndex
      });
      var topLeftTertiary = this.getTopLeft({
        axisIndex: tertiaryFace.axisIndex,
        sideIndex: tertiaryFace.sideIndex,
        otherAxisIndex: primaryFace.axisIndex,
        otherSideIndex: primaryFace.sideIndex
      });

      var secondaryIndex;
      var tertiaryIndex;
      for (var i=0; i<this.corners.length; i++) {
        if (this.corners[i].x == topLeftSecondary.x && this.corners[i].y == topLeftSecondary.y) {
          secondaryIndex = i;
        }
        if (this.corners[i].x == topLeftTertiary.x && this.corners[i].y == topLeftTertiary.y) {
          tertiaryIndex = i;
        }
      }

      var distance = ((tertiaryIndex - secondaryIndex) % 4 + 4) % 4;
      if (primaryFace.sideIndex != 0) distance = 4 - distance;
      if (distance == 3) distance = -1;

      return distance;
    },

    isSolved: function() {
      for (var axisIndex=0; axisIndex<3; axisIndex++) {
        for (var sideIndex=0; sideIndex<2; sideIndex++) {
          for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
              if (this.data[axisIndex][sideIndex][i][j].getColor() != this.data[axisIndex][sideIndex][1][1].getColor()) {
                return false;
              }
            }
          }
        }
      }
      return true;
    }


  }.init();
};
