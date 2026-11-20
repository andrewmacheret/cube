// Layer-by-layer solver. Each stage looks at the cube and queues the moves for that step,
// so the cube has to be updated after every move before asking for the next one.

const STAGES = [
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
];

// white red orange green
// 0     1   2      3
const COLORS = {
  top: 'blue',
  bottom: 'yellow',
  sides: ['white', 'red', 'orange', 'green'],
  getNextSide(color) {
    return this.sides[(this.sides.indexOf(color) + 1) % 4];
  },
  getOppositeSide(color) {
    return this.sides[(this.sides.indexOf(color) + 2) % 4];
  },
  getPreviousSide(color) {
    return this.sides[(this.sides.indexOf(color) + 3) % 4];
  }
};

const FACES = {
  red: { axis: 'x', side: 'front' },
  green: { axis: 'x', side: 'back' },
  yellow: { axis: 'y', side: 'front' },
  blue: { axis: 'y', side: 'back' },
  orange: { axis: 'z', side: 'front' },
  white: { axis: 'z', side: 'back' }
};

// Play a move instantly, with no animation.
export function applyMove(cube, move) {
  cube.rotateFace(move);
  cube.finishRotation();
  cube.rotateFace({ ...move, rotation: 0 });
}

// Work out the whole solution without changing the cube, then drop the wasted moves.
// Planning it all first lets moves cancel out across solver stages.
export function planSolution(cube) {
  const colors = cube.getColors();
  const solver = new CubeSolver({ cube });
  solver.start();
  const moves = [];
  for (let move = solver.getNextMove(); move; move = solver.getNextMove()) {
    applyMove(cube, move);
    moves.push(move);
  }
  cube.setColors(colors);
  cube.selectFace();
  return simplifyMoves(moves);
}

// quarter turns as -1, 1 or 2, or 0 for no turn at all
function normalizeRotation(rotation) {
  const r = ((rotation % 4) + 4) % 4;
  return r === 3 ? -1 : r;
}

// Merge turns of the same face that end up next to each other, so a turn and its undo
// cancel out and two quarter turns become one half turn. Turns of the opposite face on
// the same axis don't touch this face, so they can be skipped over when looking back.
export function simplifyMoves(moves) {
  const result = [];
  for (const move of moves) {
    let rotation = normalizeRotation(move.rotation);
    if (!rotation) continue;

    let i = result.length - 1;
    while (i >= 0 && result[i].axis === move.axis && result[i].side !== move.side) i--;

    if (i >= 0 && result[i].axis === move.axis) {
      rotation = normalizeRotation(result[i].rotation + rotation);
      if (rotation) {
        result[i] = { ...result[i], rotation };
      } else {
        result.splice(i, 1);
      }
    } else {
      result.push({ ...move, rotation });
    }
  }
  return result;
}

export class CubeSolver {
  constructor({ cube }) {
    this.cube = cube;
    this.colors = COLORS;
    this.faces = FACES;
  }

  start() {
    this.stage = 0;
    this.moveQueue = [];
    this.centers = {};
    for (const color of ['red', 'white', 'blue', 'orange', 'yellow', 'green']) {
      this.centers[color] = this.cube.findCenter({ primary: color });
    }
  }

  // Returns {axis, side, rotation}, or null when the cube is solved.
  getNextMove() {
    do {
      if (this.moveQueue.length > 0) {
        return this.moveQueue.shift();
      }
    } while (this.queueNextMoves());

    return null;
  }

  warn(message) {
    console.warn(`cube solver stage ${this.stage}: ${message}`);
  }

  isColor({ face, color }) {
    const centerFace = this.centers[color];
    return centerFace.axis === face.axis && centerFace.side === face.side;
  }

  getFaceColor({ axis, side }) {
    for (const [color, face] of Object.entries(this.faces)) {
      if (face.axis === axis && face.side === side) {
        return color;
      }
    }
  }

  queueMove({ focus, from, to }) {
    const focusFace = this.faces[focus];
    this.moveQueue.push({
      axis: focusFace.axis,
      side: focusFace.side,
      rotation: this.cube.getRotations({ focus, from, to })
    });
  }

  queueNextMoves() {
    if (this.stage < 0 || this.stage >= STAGES.length) {
      return false;
    }
    const stageName = STAGES[this.stage];

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
    } else if (!this.cube.isSolved()) {
      this.warn('finished but the cube is not solved');
    }

    this.stage += 1;
    return true;
  }

  queuePart1() {
    const normalizedStage = this.stage - STAGES.indexOf('top layer edges - 1st edge');
    const goalColor = this.colors.sides[normalizedStage];
    const edgeFace = this.cube.findEdge({ primary: this.colors.top, secondary: goalColor });

    if (this.isColor({ face: edgeFace.secondary, color: this.colors.top })) {
      // top row
      const sideColor = this.getFaceColor(edgeFace.primary);
      const finalSideColor = this.colors.getPreviousSide(sideColor);

      if (this.stage !== 0 && sideColor !== goalColor) {
        this.queueMove({ focus: sideColor, from: this.colors.top, to: this.colors.bottom });
        this.queueMove({ focus: this.colors.top, from: goalColor, to: sideColor });
        this.queueMove({ focus: sideColor, from: this.colors.bottom, to: this.colors.top });
      }
      this.queueMove({ focus: sideColor, from: this.colors.top, to: finalSideColor });
      if (this.stage !== 0) {
        this.queueMove({ focus: this.colors.top, from: sideColor, to: finalSideColor });
      }
      this.queueMove({ focus: finalSideColor, from: sideColor, to: this.colors.top });
      if (finalSideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: finalSideColor, to: goalColor });
      }
    } else if (this.isColor({ face: edgeFace.secondary, color: this.colors.bottom })) {
      // bottom row
      const sideColor = this.getFaceColor(edgeFace.primary);
      const finalSideColor = this.colors.getPreviousSide(sideColor);

      if (this.stage !== 0 && sideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: goalColor, to: sideColor });
      }
      this.queueMove({ focus: sideColor, from: this.colors.bottom, to: finalSideColor });
      if (this.stage !== 0) {
        this.queueMove({ focus: this.colors.top, from: sideColor, to: finalSideColor });
      }
      this.queueMove({ focus: finalSideColor, from: sideColor, to: this.colors.top });
      if (finalSideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: finalSideColor, to: goalColor });
      }
    } else if (this.isColor({ face: edgeFace.primary, color: this.colors.bottom })) {
      // bottom face
      const finalSideColor = this.getFaceColor(edgeFace.secondary);

      if (this.stage !== 0 && finalSideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: goalColor, to: finalSideColor });
      }
      this.queueMove({ focus: finalSideColor, from: this.colors.bottom, to: this.colors.top });
      if (finalSideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: finalSideColor, to: goalColor });
      }
    } else if (!this.isColor({ face: edgeFace.primary, color: this.colors.top })) {
      // middle row
      const sideColor = this.getFaceColor(edgeFace.primary);
      const finalSideColor = this.getFaceColor(edgeFace.secondary);

      if (this.stage !== 0 && finalSideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: goalColor, to: finalSideColor });
      }
      this.queueMove({ focus: finalSideColor, from: sideColor, to: this.colors.top });
      if (finalSideColor !== goalColor) {
        this.queueMove({ focus: this.colors.top, from: finalSideColor, to: goalColor });
      }
    } else {
      // top face
      const finalSideColor = this.getFaceColor(edgeFace.secondary);

      if (finalSideColor !== goalColor) {
        if (this.stage !== 0) {
          this.queueMove({ focus: finalSideColor, from: this.colors.top, to: this.colors.bottom });
          this.queueMove({ focus: this.colors.top, from: goalColor, to: finalSideColor });
          this.queueMove({ focus: finalSideColor, from: this.colors.bottom, to: this.colors.top });
        }
        this.queueMove({ focus: this.colors.top, from: finalSideColor, to: goalColor });
      }
    }
  }

  queuePart2() {
    const topColor = this.colors.top;
    const bottomColor = this.colors.bottom;
    const normalizedStage = this.stage - STAGES.indexOf('top layer corners - 1st corner - remove from top');
    const goalIndex = Math.floor(normalizedStage / 3);
    const checkTop = normalizedStage % 3 === 0;
    const checkBottom = normalizedStage % 3 === 1;
    const leftGoalColor = this.colors.sides[(goalIndex + 1) % 4]; // starts with red
    const rightGoalColor = this.colors.sides[(goalIndex + 0) % 4]; // starts with white

    const cornerFace = this.cube.findCorner({ primary: topColor, secondary: rightGoalColor, tertiary: leftGoalColor });

    if (checkTop) {
      // top row
      let leftFace, rightFace;
      if (this.isColor({ face: cornerFace.primary, color: topColor })) {
        rightFace = cornerFace.secondary;
        leftFace = cornerFace.tertiary;
      } else if (this.isColor({ face: cornerFace.secondary, color: topColor })) {
        rightFace = cornerFace.tertiary;
        leftFace = cornerFace.primary;
      } else if (this.isColor({ face: cornerFace.tertiary, color: topColor })) {
        rightFace = cornerFace.primary;
        leftFace = cornerFace.secondary;
      } else {
        return;
      }

      const leftColor = this.getFaceColor(leftFace);
      const rightColor = this.getFaceColor(rightFace);

      if (leftColor !== leftGoalColor) {
        this.queueMove({ focus: rightColor, from: topColor, to: leftColor });
        this.queueMove({ focus: bottomColor, from: leftColor, to: rightColor });
        this.queueMove({ focus: rightColor, from: leftColor, to: topColor });
      }
    } else if (checkBottom) {
      // bottom row
      let leftFace, rightFace;
      if (this.isColor({ face: cornerFace.primary, color: bottomColor })) {
        leftFace = cornerFace.secondary;
        rightFace = cornerFace.tertiary;
      } else if (this.isColor({ face: cornerFace.secondary, color: bottomColor })) {
        leftFace = cornerFace.tertiary;
        rightFace = cornerFace.primary;
      } else if (this.isColor({ face: cornerFace.tertiary, color: bottomColor })) {
        leftFace = cornerFace.primary;
        rightFace = cornerFace.secondary;
      } else {
        return;
      }

      const rightColor = this.getFaceColor(rightFace);

      // 1. focus bottomColor, move rightColor to leftGoalColor - if not already there
      // 2. focus rightGoalColor, move topColor to leftGoalColor
      // 3. focus bottomColor, move leftGoalColor to rightGoalColor
      // 4. focus rightGoalColor, move leftGoalColor to topColor
      if (rightColor !== leftGoalColor) {
        this.queueMove({ focus: bottomColor, from: rightColor, to: leftGoalColor });
      }
      this.queueMove({ focus: rightGoalColor, from: topColor, to: leftGoalColor });
      this.queueMove({ focus: bottomColor, from: leftGoalColor, to: rightGoalColor });
      this.queueMove({ focus: rightGoalColor, from: leftGoalColor, to: topColor });
    } else {
      // fix orientation
      let rotations;
      if (this.isColor({ face: cornerFace.primary, color: topColor })) {
        rotations = 0;
      } else if (this.isColor({ face: cornerFace.secondary, color: topColor })) {
        rotations = 1;
      } else if (this.isColor({ face: cornerFace.tertiary, color: topColor })) {
        rotations = 2;
      } else {
        this.warn('top corner is not on the top layer');
        return;
      }

      for (let r = 0; r < rotations; r++) {
        this.queueMove({ focus: rightGoalColor, from: topColor, to: leftGoalColor });
        this.queueMove({ focus: bottomColor, from: leftGoalColor, to: rightGoalColor });
        this.queueMove({ focus: rightGoalColor, from: leftGoalColor, to: topColor });
        this.queueMove({ focus: bottomColor, from: rightGoalColor, to: leftGoalColor });
        this.queueMove({ focus: rightGoalColor, from: topColor, to: leftGoalColor });
        this.queueMove({ focus: bottomColor, from: leftGoalColor, to: rightGoalColor });
        this.queueMove({ focus: rightGoalColor, from: leftGoalColor, to: topColor });
      }
    }
  }

  queuePart3() {
    // orient upside down
    const topColor = this.colors.bottom;
    const normalizedStage = this.stage - STAGES.indexOf('middle layer - 1st edge - remove from middle row');
    const goalIndex = Math.floor(normalizedStage / 2);
    const checkMiddle = normalizedStage % 2 === 0;
    const leftGoalColor = this.colors.sides[(goalIndex + 0) % 4]; // starts with white
    const rightGoalColor = this.colors.sides[(goalIndex + 1) % 4]; // starts with red

    const edgeFace = this.cube.findEdge({ primary: rightGoalColor, secondary: leftGoalColor });

    let currentColor, leftColor, rightColor;
    if (checkMiddle) {
      // remove from middle layer
      if (this.isColor({ face: edgeFace.primary, color: topColor })) {
        return;
      } else if (this.isColor({ face: edgeFace.secondary, color: topColor })) {
        return;
      }

      leftColor = this.getFaceColor(edgeFace.secondary);
      rightColor = this.getFaceColor(edgeFace.primary);

      if (leftColor === leftGoalColor && rightColor === rightGoalColor) {
        return;
      }
    } else {
      // insert into middle layer
      if (this.isColor({ face: edgeFace.primary, color: topColor })) {
        // stick with it - right to left
        currentColor = this.getFaceColor(edgeFace.secondary);
        leftColor = leftGoalColor;
        rightColor = rightGoalColor;
      } else if (this.isColor({ face: edgeFace.secondary, color: topColor })) {
        // swap - left to right
        currentColor = this.getFaceColor(edgeFace.primary);
        leftColor = rightGoalColor;
        rightColor = leftGoalColor;
      } else {
        return;
      }

      if (currentColor !== leftColor) {
        this.queueMove({ focus: topColor, from: currentColor, to: leftColor });
      }
    }

    this.queueMove({ focus: topColor, from: rightColor, to: leftColor });
    this.queueMove({ focus: rightColor, from: leftColor, to: topColor });
    this.queueMove({ focus: topColor, from: leftColor, to: rightColor });
    this.queueMove({ focus: rightColor, from: topColor, to: leftColor });
    this.queueMove({ focus: topColor, from: leftColor, to: rightColor });
    this.queueMove({ focus: leftColor, from: rightColor, to: topColor });
    this.queueMove({ focus: topColor, from: rightColor, to: leftColor });
    this.queueMove({ focus: leftColor, from: topColor, to: rightColor });
  }

  queuePart4() {
    // orient upside down
    const topColor = this.colors.bottom;

    const orientations = [null, null, null, null];
    let numCorrect = 0;

    for (const sideColor of this.colors.sides) {
      const sideFace = this.cube.findEdge({ primary: topColor, secondary: sideColor });
      const edgeColorPrimary = this.getFaceColor(sideFace.primary);
      const edgeColorSecondary = this.getFaceColor(sideFace.secondary);

      if (edgeColorPrimary === topColor) {
        orientations[this.colors.sides.indexOf(edgeColorSecondary)] = true;
        numCorrect += 1;
      } else if (edgeColorSecondary === topColor) {
        orientations[this.colors.sides.indexOf(edgeColorPrimary)] = false;
      } else {
        this.warn('bottom edge is not on the bottom layer');
        return;
      }
    }

    const leftColor = this.colors.sides[0]; // white
    const rightColor = this.colors.sides[1]; // red

    if (numCorrect === 0) {
      this.queueMove({ focus: leftColor, from: topColor, to: rightColor });
      this.queueMove({ focus: topColor, from: rightColor, to: leftColor });
      this.queueMove({ focus: rightColor, from: leftColor, to: topColor });
      this.queueMove({ focus: topColor, from: leftColor, to: rightColor });
      this.queueMove({ focus: rightColor, from: topColor, to: leftColor });
      this.queueMove({ focus: leftColor, from: rightColor, to: topColor });
    } else if (numCorrect === 2) {
      if ((orientations[0] && orientations[2]) || (orientations[1] && orientations[3])) {
        // opposite sides
        // if it's white and orange, rotate once and start
        // if it's red and green, just start
        if (orientations[0] && orientations[2]) {
          this.queueMove({ focus: topColor, from: this.colors.sides[2], to: this.colors.sides[1] });
        }
      } else {
        // adjacent sides
        const backColor = this.colors.sides[3]; // green
        let currentColor;
        for (let i = 0; i < 4; i++) {
          if (orientations[i] && orientations[(i + 1) % 4]) {
            currentColor = this.colors.sides[(i + 1) % 4];
            break;
          }
        }

        if (currentColor !== backColor) {
          this.queueMove({ focus: topColor, from: currentColor, to: backColor });
        }
      }

      this.queueMove({ focus: leftColor, from: topColor, to: rightColor });
      this.queueMove({ focus: rightColor, from: leftColor, to: topColor });
      this.queueMove({ focus: topColor, from: rightColor, to: leftColor });
      this.queueMove({ focus: rightColor, from: topColor, to: leftColor });
      this.queueMove({ focus: topColor, from: leftColor, to: rightColor });
      this.queueMove({ focus: leftColor, from: rightColor, to: topColor });
    }
  }

  queuePart5() {
    // orient upside down
    const topColor = this.colors.bottom;

    const topLeftOrientations = [null, null, null, null];
    let numCorrect = 0;

    for (let i = 0; i < this.colors.sides.length; i++) {
      const sideColor = this.colors.sides[i];
      const nextSideColor = this.colors.sides[(i + 1) % 4];
      const cornerFace = this.cube.findCorner({ primary: topColor, secondary: nextSideColor, tertiary: sideColor });
      const cornerColors = {
        primary: this.getFaceColor(cornerFace.primary),
        secondary: this.getFaceColor(cornerFace.secondary),
        tertiary: this.getFaceColor(cornerFace.tertiary)
      };

      if (cornerColors.primary === topColor) {
        topLeftOrientations[this.colors.sides.indexOf(cornerColors.secondary)] = 'top';
        numCorrect += 1;
      } else if (cornerColors.secondary === topColor) {
        topLeftOrientations[this.colors.sides.indexOf(cornerColors.tertiary)] = 'left';
      } else if (cornerColors.tertiary === topColor) {
        topLeftOrientations[this.colors.sides.indexOf(cornerColors.primary)] = 'right';
      } else {
        this.warn('bottom corner is not on the bottom layer');
        return;
      }
    }

    let leftColor, rightColor;
    if (numCorrect === 0) {
      if (topLeftOrientations[0] === 'left') {
        leftColor = this.colors.sides[0];
        rightColor = this.colors.sides[1];
      } else if (topLeftOrientations[0] === 'right') {
        leftColor = this.colors.sides[3];
        rightColor = this.colors.sides[2];
      } else {
        this.warn('unexpected bottom corner orientation');
        return;
      }
    } else if (numCorrect === 1) {
      const sideIndex = topLeftOrientations.indexOf('top');
      leftColor = this.colors.sides[sideIndex];
      rightColor = this.colors.sides[(sideIndex + 1) % 4];
    } else if (numCorrect === 2) {
      // first find one that isn't correct
      const sideIndex = Math.min(topLeftOrientations.indexOf('left'), topLeftOrientations.indexOf('right'));
      if (sideIndex < 0) {
        this.warn('unexpected bottom corner orientation');
        return;
      } else if (topLeftOrientations[sideIndex] === 'left') {
        leftColor = this.colors.sides[(sideIndex + 3) % 4];
        rightColor = this.colors.sides[(sideIndex + 2) % 4];
      } else {
        leftColor = this.colors.sides[sideIndex];
        rightColor = this.colors.sides[(sideIndex + 1) % 4];
      }
    } else if (numCorrect === 4) {
      return;
    } else {
      this.warn(`${numCorrect} bottom corners are oriented, which is impossible`);
      return;
    }

    this.queueMove({ focus: rightColor, from: leftColor, to: topColor }); // r
    this.queueMove({ focus: topColor, from: rightColor, to: leftColor }); // u
    this.queueMove({ focus: rightColor, from: topColor, to: leftColor }); // ri
    this.queueMove({ focus: topColor, from: rightColor, to: leftColor }); // u
    this.queueMove({ focus: rightColor, from: leftColor, to: topColor }); // r
    this.queueMove({ focus: topColor, from: rightColor, to: leftColor }); // u
    this.queueMove({ focus: topColor, from: rightColor, to: leftColor }); // u
    this.queueMove({ focus: rightColor, from: topColor, to: leftColor }); // ri
  }

  queuePart6() {
    // orient upside down
    const topColor = this.colors.bottom;

    for (let twists = 0; twists < this.colors.sides.length; twists++) {
      const correct = [false, false, false, false];
      let numCorrect = 0;
      for (let i = 0; i < this.colors.sides.length; i++) {
        const sideColor = this.colors.sides[(i + twists) % 4];
        const nextSideColor = this.colors.sides[(i + twists + 1) % 4];
        const expectedTertiary = this.colors.sides[(i + 0) % 4];
        const expectedSecondary = this.colors.sides[(i + 1) % 4];
        const cornerFace = this.cube.findCorner({ primary: topColor, secondary: nextSideColor, tertiary: sideColor });
        const cornerColors = {
          primary: this.getFaceColor(cornerFace.primary),
          secondary: this.getFaceColor(cornerFace.secondary),
          tertiary: this.getFaceColor(cornerFace.tertiary)
        };

        if (
          cornerColors.primary === topColor &&
          cornerColors.secondary === expectedSecondary &&
          cornerColors.tertiary === expectedTertiary
        ) {
          correct[(i + twists) % 4] = true;
          numCorrect += 1;
        }
      }

      if (numCorrect === 2 || numCorrect === 4) {
        if (twists > 0) {
          this.queueMove({ focus: topColor, from: this.colors.sides[0], to: this.colors.sides[twists] });
        }

        if (numCorrect === 2) {
          if (correct[0] && correct[2]) {
            // diagonal type 1
            this.queuePart6Move({ topColor, frontIndex: 0 });
          } else if (correct[1] && correct[3]) {
            // diagonal type 2
            this.queuePart6Move({ topColor, frontIndex: 0 });
          } else if (correct[0] && correct[1]) {
            this.queuePart6Move({ topColor, frontIndex: 3 });
          } else if (correct[1] && correct[2]) {
            this.queuePart6Move({ topColor, frontIndex: 0 });
          } else if (correct[2] && correct[3]) {
            this.queuePart6Move({ topColor, frontIndex: 1 });
          } else if (correct[3] && correct[0]) {
            this.queuePart6Move({ topColor, frontIndex: 2 });
          }
        }

        return;
      }
    }

    this.warn('could not place the bottom corners');
  }

  queuePart6Move({ topColor: top, frontIndex }) {
    const front = this.colors.sides[(frontIndex + 0) % 4];
    const right = this.colors.sides[(frontIndex + 1) % 4];
    const back = this.colors.sides[(frontIndex + 2) % 4];
    const left = this.colors.sides[(frontIndex + 3) % 4];

    this.queueMove({ focus: right, from: top, to: front }); // ri
    this.queueMove({ focus: front, from: top, to: right }); // f
    this.queueMove({ focus: right, from: top, to: front }); // ri
    this.queueMove({ focus: back, from: right, to: left }); // 2xb
    this.queueMove({ focus: right, from: front, to: top }); // r
    this.queueMove({ focus: front, from: right, to: top }); // fi
    this.queueMove({ focus: right, from: top, to: front }); // ri
    this.queueMove({ focus: back, from: right, to: left }); // 2xb
    this.queueMove({ focus: right, from: front, to: back }); // 2xr
    this.queueMove({ focus: top, from: front, to: right }); // u
  }

  queuePart7() {
    // orient upside down
    const topColor = this.colors.bottom;

    const orientations = [false, false, false, false];
    let numCorrect = 0;

    for (let i = 0; i < this.colors.sides.length; i++) {
      const sideColor = this.colors.sides[i];
      const sideFace = this.cube.findEdge({ primary: topColor, secondary: sideColor });
      if (this.getFaceColor(sideFace.secondary) === sideColor) {
        orientations[i] = true;
        numCorrect += 1;
      }
    }

    let frontIndex;
    if (numCorrect === 0) {
      frontIndex = 0;
    } else if (numCorrect === 1) {
      frontIndex = (orientations.indexOf(true) + 2) % 4;
    } else if (numCorrect === 4) {
      return;
    } else {
      this.warn(`${numCorrect} bottom edges are placed, which is impossible`);
      return;
    }

    this.queuePart7Move({ topColor, frontIndex });
  }

  queuePart7Move({ topColor: top, frontIndex }) {
    const front = this.colors.sides[(frontIndex + 0) % 4];
    const right = this.colors.sides[(frontIndex + 1) % 4];
    const left = this.colors.sides[(frontIndex + 3) % 4];

    this.queueMove({ focus: front, from: left, to: right }); // 2xf
    this.queueMove({ focus: top, from: right, to: front }); // u
    this.queueMove({ focus: left, from: top, to: front }); // l
    this.queueMove({ focus: right, from: top, to: front }); // ri
    this.queueMove({ focus: front, from: left, to: right }); // 2xf
    this.queueMove({ focus: left, from: front, to: top }); // li
    this.queueMove({ focus: right, from: front, to: top }); // r
    this.queueMove({ focus: top, from: right, to: front }); // u
    this.queueMove({ focus: front, from: left, to: right }); // 2xf
  }
}
