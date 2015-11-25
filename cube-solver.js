"use strict";

function CubeSolver($options) {
  var $public = this;
  var $private = {
    stages: [
      'top layer edges - 1st edge',
      'top layer edges - 2nd edge',
      'top layer edges - 3rd edge',
      'top layer edges - 4th edge',
      'top layer corners - 1st corner - remove from top',
      'top layer corners - 1st corner - move to top',
      'top layer corners - 1st corner - fix orientation',
      'top layer corners - 2nd corner - remove from top',
      'top layer corners - 2nd corner - move to top',
      'top layer corners - 2nd corner - fix orientation',
      'top layer corners - 3rd corner - remove from top',
      'top layer corners - 3rd corner - move to top',
      'top layer corners - 3rd corner - fix orientation',
      'top layer corners - 4th corner - remove from top',
      'top layer corners - 4th corner - move to top',
      'top layer corners - 4th corner - fix orientation',
      'middle layer - 1st edge - remove from middle row',
      'middle layer - 1st edge - move to middle row',
      'middle layer - 2nd edge - remove from middle row',
      'middle layer - 2nd edge - move to middle row',
      'middle layer - 3rd edge - remove from middle row',
      'middle layer - 3rd edge - move to middle row',
      'middle layer - 4th edge - remove from middle row',
      'middle layer - 4th edge - move to middle row',
      'bottom face edges - 1st try',
      'bottom face edges - 2nd try',
      'bottom face edges - 3rd try',
      'bottom face corners - 1st try',
      'bottom face corners - 2nd try',
      'bottom face corners - 3rd try',
      'bottom layer corners - 1st try',
      'bottom layer corners - 2nd try',
      'bottom layer edges - 1st try',
      'bottom layer edges - 2nd try',
      'bottom layer edges - 3rd try',
      'check if solved'
    ],

    colors: {
      top: 'blue',
      bottom: 'yellow',
      sides: ['white', 'red', 'orange', 'green'],
      getNextSide: function(color) {
        return this.sides[(this.sides.indexOf(color) + 1) % 4];
      },
      getOppositeSide: function(color) {
        return this.sides[(this.sides.indexOf(color) + 2) % 4];
      },
      getPreviousSide: function(color) {
        return this.sides[(this.sides.indexOf(color) + 3) % 4];
      }
    },

    faces: {
      red:    {axis: 'x', side: 'front'},
      green:  {axis: 'x', side: 'back' },
      yellow: {axis: 'y', side: 'front'},
      blue:   {axis: 'y', side: 'back' },
      orange: {axis: 'z', side: 'front'},
      white:  {axis: 'z', side: 'back' }
    },

    init: function() {
      this.cube = $options.cube;

      $public.getNextMove = this.getNextMove.bind(this);
      $public.start = this.start.bind(this);

      return this;
    },

    start: function() {
      this.stage = 0;

      this.moveQueue = [];

      this.centers = {};
      $.each(['red', 'white', 'blue', 'orange', 'yellow', 'green'], function(i, color) {
        this.centers[color] = this.cube.findCenter({primary: color});
      }.bind(this));
    },

    getNextMove: function() {
      do {
        if (this.moveQueue.length > 0) {
          return this.moveQueue.shift();
        }
      } while(this.queueNextMoves());

      return null;
    },

    isColor: function(options) {
      var face = options.face;
      var color = options.color;
      var centerFace = this.centers[color];
      return centerFace.axis == face.axis && centerFace.side == face.side;
    },

    getFaceColor: function(options) {
      var result;
      $.each(this.faces, function(color, face) {
        if (face.axis == options.axis && face.side == options.side) {
          result = color;
          return false;
        }
      }.bind(this));
      return result;
    },

    queueMove: function(options) {
      var focusFace = this.faces[options.focus];
      this.moveQueue.push({
        axis: focusFace.axis,
        side: focusFace.side,
        rotation: this.cube.getRotations({
          focus: options.focus,
          from: options.from,
          to: options.to
        })
      });
    },

    queueNextMoves: function() {
      if (this.stage < 0 || this.stage >= this.stages.length) {
        return false;
      }
      var stageName = this.stages[this.stage];

      if (stageName.startsWith('top layer edges')) {
        this.queuePart1();
      } else if (stageName.startsWith('top layer corners')) {
        this.queuePart2();
      } else if (stageName.startsWith('middle layer')) {
        this.queuePart3();
      } else if (stageName.startsWith('bottom face edges')) {
        this.queuePart4();
      } else if (stageName.startsWith('bottom face corners')) {
        this.queuePart5();
      } else if (stageName.startsWith('bottom layer corners')) {
        this.queuePart6();
      } else if (stageName.startsWith('bottom layer edges')) {
        this.queuePart7();
      } else {
        // test to make sure it's actually solved
        var isSolved = this.cube.isSolved();
        console.log('solved: ' + isSolved);
        if (!isSolved) {
          console.log('crap.');
        }
      }

      this.stage += 1;
      return true;
    },

    queuePart1: function() {
      var normalizedStage = this.stage - this.stages.indexOf('top layer edges - 1st edge');
      var goalColor = this.colors.sides[normalizedStage];
      var edgeFace = this.cube.findEdge({primary: this.colors.top, secondary: goalColor});
      //console.log(this.stage + '. edgeFace=' + JSON.stringify(edgeFace));

      if (this.isColor({face: edgeFace.secondary, color: this.colors.top})) {
        // top row
        console.log(this.stage + '. top row');

        var sideColor = this.getFaceColor(edgeFace.primary);
        var finalSideColor = this.colors.getPreviousSide(sideColor);

        if (this.stage != 0 && sideColor != goalColor) { 
          this.queueMove({
            focus: sideColor,
            from:  this.colors.top,
            to:    this.colors.bottom
          });
          this.queueMove({
            focus: this.colors.top,
            from:  goalColor,
            to:    sideColor
          });
          this.queueMove({
            focus: sideColor,
            from:  this.colors.bottom,
            to:    this.colors.top
          });
        }
        this.queueMove({
          focus: sideColor,
          from:  this.colors.top,
          to:    finalSideColor
        });
        if (this.stage != 0) { 
          this.queueMove({
            focus: this.colors.top,
            from:  sideColor,
            to:    finalSideColor
          });
        }
        this.queueMove({
          focus: finalSideColor,
          from:  sideColor,
          to:    this.colors.top
        });
        if (finalSideColor != goalColor) {
          this.queueMove({
            focus: this.colors.top,
            from:  finalSideColor,
            to:    goalColor
          });
        }

      } else if (this.isColor({face: edgeFace.secondary, color: this.colors.bottom})) {
        // bottom row
        console.log(this.stage + '. bottom row');

        var sideColor = this.getFaceColor(edgeFace.primary);
        var finalSideColor = this.colors.getPreviousSide(sideColor);

        if (this.stage != 0 && sideColor != goalColor) { 
          this.queueMove({
            focus: this.colors.top,
            from:  goalColor,
            to:    sideColor
          });
        }
        this.queueMove({
          focus: sideColor,
          from:  this.colors.bottom,
          to:    finalSideColor
        });
        if (this.stage != 0) { 
          this.queueMove({
            focus: this.colors.top,
            from:  sideColor,
            to:    finalSideColor
          });
        }
        this.queueMove({
          focus: finalSideColor,
          from:  sideColor,
          to:    this.colors.top
        });
        if (finalSideColor != goalColor) {
          this.queueMove({
            focus: this.colors.top,
            from:  finalSideColor,
            to:    goalColor
          });
        }

      } else if (this.isColor({face: edgeFace.primary, color: this.colors.bottom})) {
        // bottom face
        console.log(this.stage + '. bottom face');

        var finalSideColor = this.getFaceColor(edgeFace.secondary);

        if (this.stage != 0 && finalSideColor != goalColor) { 
          this.queueMove({
            focus: this.colors.top,
            from:  goalColor,
            to:    finalSideColor
          });
        }
        this.queueMove({
          focus: finalSideColor,
          from:  this.colors.bottom,
          to:    this.colors.top
        });
        if (finalSideColor != goalColor) {
          this.queueMove({
            focus: this.colors.top,
            from:  finalSideColor,
            to:    goalColor
          });
        }

      } else if (!this.isColor({face: edgeFace.primary, color: this.colors.top})) {
        // middle row
        console.log(this.stage + '. middle row');

        var sideColor = this.getFaceColor(edgeFace.primary);
        var finalSideColor = this.getFaceColor(edgeFace.secondary);

        if (this.stage != 0 && finalSideColor != goalColor) { 
          this.queueMove({
            focus: this.colors.top,
            from:  goalColor,
            to:    finalSideColor
          });
        }
        this.queueMove({
          focus: finalSideColor,
          from:  sideColor,
          to:    this.colors.top
        });
        if (finalSideColor != goalColor) {
          this.queueMove({
            focus: this.colors.top,
            from:  finalSideColor,
            to:    goalColor
          });
        }
      } else {
        // top face
        console.log(this.stage + '. top face');

        var finalSideColor = this.getFaceColor(edgeFace.secondary);

        if (finalSideColor != goalColor) {
          if (this.stage != 0) {
            this.queueMove({
              focus: finalSideColor,
              from:  this.colors.top,
              to:    this.colors.bottom
            });
            this.queueMove({
              focus: this.colors.top,
              from:  goalColor,
              to:    finalSideColor
            });
            this.queueMove({
              focus: finalSideColor,
              from:  this.colors.bottom,
              to:    this.colors.top
            });
          }

          this.queueMove({
            focus: this.colors.top,
            from:  finalSideColor,
            to:    goalColor
          });
        }
      }
    },

    queuePart2: function() {
      var topColor = this.colors.top;
      var bottomColor = this.colors.bottom;
      var normalizedStage = this.stage - this.stages.indexOf('top layer corners - 1st corner - remove from top');
      var goalIndex = Math.floor((normalizedStage) / 3);
      var checkTop = ((normalizedStage) % 3) == 0;
      var checkBottom = ((normalizedStage) % 3) == 1;
      var leftGoalColor = this.colors.sides[(goalIndex + 1) % 4]; // starts with red
      var rightGoalColor = this.colors.sides[(goalIndex + 0) % 4]; // starts with white

      var cornerFace = this.cube.findCorner({primary: topColor, secondary: rightGoalColor, tertiary: leftGoalColor});

      if (checkTop) {
        // top row
        var leftFace;
        var rightFace;
        if (this.isColor({face: cornerFace.primary, color: topColor})) {
          rightFace = cornerFace.secondary;
          leftFace = cornerFace.tertiary;
          console.log(this.stage + '. primary is on top');
        } else if (this.isColor({face: cornerFace.secondary, color: topColor})) {
          rightFace = cornerFace.tertiary;
          leftFace = cornerFace.primary;
          console.log(this.stage + '. secondary is on top');
        } else if (this.isColor({face: cornerFace.tertiary, color: topColor})) {
          rightFace = cornerFace.primary;
          leftFace = cornerFace.secondary;
          console.log(this.stage + '. tertiary is on top');
        } else {
          return;
        }
        console.log(this.stage + '. top row')

        var leftColor = this.getFaceColor(leftFace);
        var rightColor = this.getFaceColor(rightFace);
        console.log(this.stage + '. left=' + leftColor + ' right=' + rightColor);

        if (leftColor != leftGoalColor) {
          this.queueMove({
            focus: rightColor,
            from:  topColor,
            to:    leftColor
          });
          this.queueMove({
            focus: bottomColor,
            from:  leftColor,
            to:    rightColor
          });
          this.queueMove({
            focus: rightColor,
            from:  leftColor,
            to:    topColor
          });
        }

      } else if (checkBottom) {
        // bottom row
        var leftFace;
        var rightFace;
        if (this.isColor({face: cornerFace.primary, color: bottomColor})) {
          leftFace = cornerFace.secondary;
          rightFace = cornerFace.tertiary;
          console.log(this.stage + '. primary is on bottom');
        } else if (this.isColor({face: cornerFace.secondary, color: bottomColor})) {
          leftFace = cornerFace.tertiary;
          rightFace = cornerFace.primary;
          console.log(this.stage + '. secondary is on bottom');
        } else if (this.isColor({face: cornerFace.tertiary, color: bottomColor})) {
          leftFace = cornerFace.primary;
          rightFace = cornerFace.secondary;
          console.log(this.stage + '. tertiary is on bottom');
        } else {
          return;
        }
        console.log(this.stage + '. bottom row')

        var leftColor = this.getFaceColor(leftFace);
        var rightColor = this.getFaceColor(rightFace);
        console.log(this.stage + '. left=' + leftColor + ' right=' + rightColor);

        // 1. focus bottomColor, move rightColor to leftGoalColor - if not already there
        // 2. focus rightGoalColor, move topColor to leftGoalColor
        // 3. focus bottomColor, move leftGoalColor to rightGoalColor
        // 4. focus rightGoalColor, move leftGoalColor to topColor
        
        if (rightColor != leftGoalColor) {
          this.queueMove({
            focus: bottomColor,
            from:  rightColor,
            to:    leftGoalColor
          });
        }
        this.queueMove({
          focus: rightGoalColor,
          from:  topColor,
          to:    leftGoalColor
        });
        this.queueMove({
          focus: bottomColor,
          from:  leftGoalColor,
          to:    rightGoalColor
        });
        this.queueMove({
          focus: rightGoalColor,
          from:  leftGoalColor,
          to:    topColor
        });

      } else {
        // fix orientation

        var rotations;
        if (this.isColor({face: cornerFace.primary, color: topColor})) {
          console.log(this.stage + '. primary is on top');
          rotations = 0;
        } else if (this.isColor({face: cornerFace.secondary, color: topColor})) {
          console.log(this.stage + '. secondary is on top');
          rotations = 1;
        } else if (this.isColor({face: cornerFace.tertiary, color: topColor})) {
          console.log(this.stage + '. tertiary is on top');
          rotations = 2;
        } else {
          console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
          return;
        }
        console.log(this.stage + '. fix orientation')

        for (var r=0; r<rotations; r++) {
          this.queueMove({focus: rightGoalColor,  from: topColor,       to: leftGoalColor });
          this.queueMove({focus: bottomColor,     from: leftGoalColor,  to: rightGoalColor});
          this.queueMove({focus: rightGoalColor,  from: leftGoalColor,  to: topColor      });
          this.queueMove({focus: bottomColor,     from: rightGoalColor, to: leftGoalColor });
          this.queueMove({focus: rightGoalColor,  from: topColor,       to: leftGoalColor });
          this.queueMove({focus: bottomColor,     from: leftGoalColor,  to: rightGoalColor});
          this.queueMove({focus: rightGoalColor,  from: leftGoalColor,  to: topColor      });
        }
      }
    },

    queuePart3: function() {
      // orient upside down
      var topColor = this.colors.bottom;
      var bottomColor = this.colors.top;
      var normalizedStage = this.stage - this.stages.indexOf('middle layer - 1st edge - remove from middle row');
      var goalIndex = Math.floor((normalizedStage) / 2);
      var checkMiddle = ((normalizedStage) % 2) == 0;
      var leftGoalColor = this.colors.sides[(goalIndex + 0) % 4]; // starts with white
      var rightGoalColor = this.colors.sides[(goalIndex + 1) % 4]; // starts with red

      var edgeFace = this.cube.findEdge({primary: rightGoalColor, secondary: leftGoalColor});

      if (checkMiddle) {
        console.log(this.stage + '. remove from middle layer');

        if (this.isColor({face: edgeFace.primary, color: topColor})) {
          return;
        } else if (this.isColor({face: edgeFace.secondary, color: topColor})) {
          return;
        }

        var leftColor = this.getFaceColor(edgeFace.secondary);
        var rightColor = this.getFaceColor(edgeFace.primary);

        if (!(leftColor == leftGoalColor && rightColor == rightGoalColor)) {
          this.queueMove({focus: topColor,   from: rightColor, to: leftColor });
          this.queueMove({focus: rightColor, from: leftColor,  to: topColor  });
          this.queueMove({focus: topColor,   from: leftColor,  to: rightColor});
          this.queueMove({focus: rightColor, from: topColor,   to: leftColor });
          this.queueMove({focus: topColor,   from: leftColor,  to: rightColor});
          this.queueMove({focus: leftColor,  from: rightColor, to: topColor  });
          this.queueMove({focus: topColor,   from: rightColor, to: leftColor });
          this.queueMove({focus: leftColor,  from: topColor,   to: rightColor});
        }

      } else {
        console.log(this.stage + '. insert into middle layer');

        var currentColor;
        var leftColor;
        var rightColor;
        if (this.isColor({face: edgeFace.primary, color: topColor})) {
          // stick with it - right to left
          currentColor = this.getFaceColor(edgeFace.secondary);
          leftColor = leftGoalColor;
          rightColor = rightGoalColor;
        } else if (this.isColor({face: edgeFace.secondary, color: topColor})) {
          // swap - left to right
          currentColor = this.getFaceColor(edgeFace.primary);
          leftColor = rightGoalColor;
          rightColor = leftGoalColor;
        } else {
          return;
        }

        if (currentColor != leftColor) {
          this.queueMove({focus: topColor, from: currentColor, to: leftColor });
        }
        this.queueMove({focus: topColor,   from: rightColor, to: leftColor });
        this.queueMove({focus: rightColor, from: leftColor,  to: topColor  });
        this.queueMove({focus: topColor,   from: leftColor,  to: rightColor});
        this.queueMove({focus: rightColor, from: topColor,   to: leftColor });
        this.queueMove({focus: topColor,   from: leftColor,  to: rightColor});
        this.queueMove({focus: leftColor,  from: rightColor, to: topColor  });
        this.queueMove({focus: topColor,   from: rightColor, to: leftColor });
        this.queueMove({focus: leftColor,  from: topColor,   to: rightColor});
      }
    },

    queuePart4: function() {
      // orient upside down
      var topColor = this.colors.bottom;
      var bottomColor = this.colors.top;

      var orientations = [null, null, null, null];
      var numCorrect = 0;

      for (var i=0; i<this.colors.sides.length; i++) {
        var sideColor = this.colors.sides[i];
        var sideFace = this.cube.findEdge({primary: topColor, secondary: sideColor});
        var edgeColorPrimary = this.getFaceColor(sideFace.primary);
        var edgeColorSecondary = this.getFaceColor(sideFace.secondary);
        
        if (edgeColorPrimary == topColor) {
          orientations[this.colors.sides.indexOf(edgeColorSecondary)] = true;
          numCorrect += 1;
        } else if (edgeColorSecondary == topColor) {
          orientations[this.colors.sides.indexOf(edgeColorPrimary)] = false;
        } else {
          console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
          return;
        }
      }

      var leftColor = this.colors.sides[0]; // white
      var rightColor = this.colors.sides[1]; // red

      if (numCorrect == 0) {
        console.log(this.stage + '. zero edges correct');
        this.queueMove({focus: leftColor, from: topColor, to: rightColor});
        this.queueMove({focus: topColor, from: rightColor, to: leftColor});
        this.queueMove({focus: rightColor, from: leftColor, to: topColor});
        this.queueMove({focus: topColor, from: leftColor, to: rightColor});
        this.queueMove({focus: rightColor, from: topColor, to: leftColor});
        this.queueMove({focus: leftColor, from: rightColor, to: topColor});

      } else if (numCorrect == 2) {
        console.log(this.stage + '. two edges correct');

        // opposite sides
        // if it's white and orange, rotate once and start
        // if it's red and green, just start
        if ((orientations[0] && orientations[2]) || (orientations[1] && orientations[3])) {
          console.log(this.stage + '. opposite sides');

          if (orientations[0] && orientations[2]) {
            // rotate once
            this.queueMove({focus: topColor, from: this.colors.sides[2], to: this.colors.sides[1]});
          }

          this.queueMove({focus: leftColor, from: topColor, to: rightColor});
          this.queueMove({focus: rightColor, from: leftColor, to: topColor});
          this.queueMove({focus: topColor, from: rightColor, to: leftColor});
          this.queueMove({focus: rightColor, from: topColor, to: leftColor});
          this.queueMove({focus: topColor, from: leftColor, to: rightColor});
          this.queueMove({focus: leftColor, from: rightColor, to: topColor});

        } else {
          console.log(this.stage + '. adjacent sides');

          var backColor = this.colors.sides[3]; // green
          var currentColor;
          for (var i = 0; i < 4; i++) {
            if (orientations[i] && orientations[(i + 1) % 4]) {
              currentColor = this.colors.sides[(i + 1) % 4];
              break;
            }
          }

          if (currentColor != backColor) {
            this.queueMove({focus: topColor, from: currentColor, to: backColor});
          }

          this.queueMove({focus: leftColor, from: topColor, to: rightColor});
          this.queueMove({focus: rightColor, from: leftColor, to: topColor});
          this.queueMove({focus: topColor, from: rightColor, to: leftColor});
          this.queueMove({focus: rightColor, from: topColor, to: leftColor});
          this.queueMove({focus: topColor, from: leftColor, to: rightColor});
          this.queueMove({focus: leftColor, from: rightColor, to: topColor});
        }

      }
    },

    queuePart5: function() {
      // orient upside down
      var topColor = this.colors.bottom;
      var bottomColor = this.colors.top;

      var topLeftOrientations = [null, null, null, null];
      var numCorrect = 0;

      for (var i = 0; i < this.colors.sides.length; i++) {
        var sideColor = this.colors.sides[i];
        var nextSideColor = this.colors.sides[(i+1)%4];
        var cornerFace = this.cube.findCorner({primary: topColor, secondary: nextSideColor, tertiary: sideColor});
        var cornerColors = {
          primary: this.getFaceColor(cornerFace.primary),
          secondary: this.getFaceColor(cornerFace.secondary),
          tertiary: this.getFaceColor(cornerFace.tertiary)
        };
        
        if (cornerColors.primary == topColor) {
          topLeftOrientations[this.colors.sides.indexOf(cornerColors.secondary)] = 'top';
          numCorrect += 1;
        } else if (cornerColors.secondary == topColor) {
          topLeftOrientations[this.colors.sides.indexOf(cornerColors.tertiary)] = 'left';
        } else if (cornerColors.tertiary == topColor) {
          topLeftOrientations[this.colors.sides.indexOf(cornerColors.primary)] = 'right';
        } else {
          console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
          return;
        }
      }

      var leftColor;
      var rightColor;
      if (numCorrect == 0) {
        console.log(this.stage + '. 0 correct corners');
        if (topLeftOrientations[0] == 'left') {
          leftColor = this.colors.sides[0];
          rightColor = this.colors.sides[1];
        } else if (topLeftOrientations[0] == 'right') {
          leftColor = this.colors.sides[3];
          rightColor = this.colors.sides[2];
        } else {
          console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
          return;
        }
      } else if (numCorrect == 1) {
        console.log(this.stage + '. 1 correct corner');
        var sideIndex = topLeftOrientations.indexOf('top');
        leftColor = this.colors.sides[sideIndex];
        rightColor = this.colors.sides[(sideIndex + 1) % 4];
      } else if (numCorrect == 2) {
        console.log(this.stage + '. 2 correct corners');
        // first find one that isn't correct
        var sideIndex = Math.min(topLeftOrientations.indexOf('left'), topLeftOrientations.indexOf('right'));
        if (sideIndex < 0) {
          console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
          return;
        } else if (topLeftOrientations[sideIndex] == 'left') {
          leftColor = this.colors.sides[(sideIndex + 3) % 4];
          rightColor = this.colors.sides[(sideIndex + 2) % 4];
        } else if (topLeftOrientations[sideIndex] == 'right') {
          leftColor = this.colors.sides[sideIndex];
          rightColor = this.colors.sides[(sideIndex + 1) % 4];
        } else {
          console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
          return;
        }

      } else if (numCorrect == 4) {
        console.log(this.stage + '. 4 correct corners');
        return;
      } else {
        console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
        return;
      }

      this.queueMove({focus: rightColor, from: leftColor, to: topColor}); // r
      this.queueMove({focus: topColor, from: rightColor, to: leftColor}); // u
      this.queueMove({focus: rightColor, from: topColor, to: leftColor}); // ri
      this.queueMove({focus: topColor, from: rightColor, to: leftColor}); // u
      this.queueMove({focus: rightColor, from: leftColor, to: topColor}); // r
      this.queueMove({focus: topColor, from: rightColor, to: leftColor}); // u
      this.queueMove({focus: topColor, from: rightColor, to: leftColor}); // u
      this.queueMove({focus: rightColor, from: topColor, to: leftColor}); // ri

    },

    queuePart6: function() {
      // orient upside down
      var topColor = this.colors.bottom;
      var bottomColor = this.colors.top;

      var topLeftOrientations = [null, null, null, null];

      for (var twists = 0; twists < this.colors.sides.length; twists++) {
        var correct = [false, false, false, false];
        var numCorrect = 0;
        for (var i = 0; i < this.colors.sides.length; i++) {
          var sideColor = this.colors.sides[(i + twists) % 4];
          var nextSideColor = this.colors.sides[(i + twists + 1) % 4];
          var expectedTertiary = this.colors.sides[(i + 0) % 4];
          var expectedSecondary = this.colors.sides[(i + 1) % 4];
          var cornerFace = this.cube.findCorner({primary: topColor, secondary: nextSideColor, tertiary: sideColor});
          var cornerColors = {
            primary: this.getFaceColor(cornerFace.primary),
            secondary: this.getFaceColor(cornerFace.secondary),
            tertiary: this.getFaceColor(cornerFace.tertiary)
          };
          
          if (cornerColors.primary == topColor && cornerColors.secondary == expectedSecondary && cornerColors.tertiary == expectedTertiary) {
            correct[(i + twists) % 4] = true;
            numCorrect += 1;
          }
        }

        if (numCorrect == 2 || numCorrect == 4) {
          console.log(this.stage + '. ' + twists + ' twist(s) required');
          if (twists > 0) {
            this.queueMove({focus: topColor, from: this.colors.sides[0], to: this.colors.sides[twists]});
          }

          console.log(this.stage + '. ' + numCorrect + ' correct corner(s)');
          if (numCorrect == 2) {
            if (correct[0] && correct[2]) {
              console.log(this.stage + '. ' + numCorrect + ' diaganol type 1');
              this.queuePart6Move({topColor: topColor, frontIndex: 0});
            } else if (correct[1] && correct[3]) {
              console.log(this.stage + '. ' + numCorrect + ' diaganol type 2');
              this.queuePart6Move({topColor: topColor, frontIndex: 0});
            } else if (correct[0] && correct[1]) {
              console.log(this.stage + '. ' + numCorrect + ' adjacent type 1');
              this.queuePart6Move({topColor: topColor, frontIndex: 3});
            } else if (correct[1] && correct[2]) {
              console.log(this.stage + '. ' + numCorrect + ' adjacent type 2');
              this.queuePart6Move({topColor: topColor, frontIndex: 0});
            } else if (correct[2] && correct[3]) {
              console.log(this.stage + '. ' + numCorrect + ' adjacent type 3');
              this.queuePart6Move({topColor: topColor, frontIndex: 1});
            } else if (correct[3] && correct[0]) {
              console.log(this.stage + '. ' + numCorrect + ' adjacent type 4');
              this.queuePart6Move({topColor: topColor, frontIndex: 2});
            }
          }

          return;
        }
      }

      console.log(this.stage + '. could not find a solution');


    },

    queuePart6Move: function(options) {
      var top = options.topColor;
      var frontIndex = options.frontIndex;
      var front  = this.colors.sides[(frontIndex + 0) % 4];
      var right = this.colors.sides[(frontIndex + 1) % 4];
      var back  = this.colors.sides[(frontIndex + 2) % 4];
      var left  = this.colors.sides[(frontIndex + 3) % 4];

      this.queueMove({focus: right, from: top, to: front});  // ri
      this.queueMove({focus: front, from: top, to: right});  // f
      this.queueMove({focus: right, from: top, to: front});  // ri
      this.queueMove({focus: back, from: right, to: left});  // 2xb
      this.queueMove({focus: right, from: front, to: top});  // r
      this.queueMove({focus: front, from: right, to: top});  // fi
      this.queueMove({focus: right, from: top, to: front});  // ri
      this.queueMove({focus: back, from: right, to: left});  // 2xb
      this.queueMove({focus: right, from: front, to: back}); // 2xr
      this.queueMove({focus: top, from: front, to: right});  // u
    },

    queuePart7: function() {
      // orient upside down
      var topColor = this.colors.bottom;
      var bottomColor = this.colors.top;

      var orientations = [false, false, false, false];
      var numCorrect = 0;

      for (var i=0; i<this.colors.sides.length; i++) {
        var sideColor = this.colors.sides[i];
        var sideFace = this.cube.findEdge({primary: topColor, secondary: sideColor});
        var edgeColorSecondary = this.getFaceColor(sideFace.secondary);
        
        if (edgeColorSecondary == sideColor) {
          orientations[i] = true;
          numCorrect += 1;
        }
      }

      var frontIndex;
      if (numCorrect == 0) {
        console.log(this.stage + '. 0 edges correct');
        frontIndex = 0;
      } else if (numCorrect == 1) {
        console.log(this.stage + '. 1 edge correct');
        var correctIndex = orientations.indexOf(true);
        frontIndex = (correctIndex + 2) % 4;
      } else if (numCorrect == 4) {
        console.log(this.stage + '. 4 edges correct');
        return;
      } else {
        console.log(this.stage + '. ERROR: IMPOSSIBLE SITUATION');
        return;
      }

      this.queuePart7Move({topColor: topColor, frontIndex: frontIndex});
    },

    queuePart7Move: function(options) {
      var top = options.topColor;
      var frontIndex = options.frontIndex;
      var front = this.colors.sides[(frontIndex + 0) % 4];
      var right = this.colors.sides[(frontIndex + 1) % 4];
      var back  = this.colors.sides[(frontIndex + 2) % 4];
      var left  = this.colors.sides[(frontIndex + 3) % 4];

      this.queueMove({focus: front, from: left, to: right}); // 2xf
      this.queueMove({focus: top, from: right, to: front});  // u
      this.queueMove({focus: left, from: top, to: front});   // l
      this.queueMove({focus: right, from: top, to: front});  // ri
      this.queueMove({focus: front, from: left, to: right}); // 2xf
      this.queueMove({focus: left, from: front, to: top});   // li
      this.queueMove({focus: right, from: front, to: top});  // r
      this.queueMove({focus: top, from: right, to: front});  // u
      this.queueMove({focus: front, from: left, to: right}); // 2xf
    }

  }.init();

  // white red orange green
  // 0     1   2      3

};
