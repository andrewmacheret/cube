import { makeQuad } from './geometry.js';
import { Unit } from './unit.js';

const COLORS = {
  red: 0xff0000,
  yellow: 0xffff00,
  orange: 0xffa500,
  green: 0x00ff00,
  blue: 0x0000ff,
  white: 0xffffff
};
const COLOR_NAMES = Object.keys(COLORS);

const AXES = ['x', 'y', 'z'];
const SIDES = ['front', 'back'];

const CORNERS = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 }
];
const EDGES = [
  { x: 1, y: 0 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: 1 }
];

// data[axisIndex][sideIndex][i][j] is the sticker at row i, column j of that face.
export class Cube {
  constructor({ unitSize }) {
    this.unitSize = unitSize;
    this.selectedFace = null;
    this.initData();
  }

  initData() {
    const data = [];
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      const axis = [];
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        const color = this.getColor(axisIndex, sideIndex);
        const side = [];
        for (let i = 0; i < 3; i++) {
          const sidePart = [];
          for (let j = 0; j < 3; j++) {
            sidePart.push(this.makeUnit(axisIndex, sideIndex, i, j, color));
          }
          side.push(sidePart);
        }
        axis.push(side);
      }
      data.push(axis);
    }
    this.data = data;
  }

  getColor(axisIndex, sideIndex) {
    return COLORS[COLOR_NAMES[sideIndex * 3 + axisIndex]];
  }

  makeUnit(axisIndex, sideIndex, i, j, color) {
    const unitSize = this.unitSize;
    const unitStart = 1.5 * unitSize;
    const unitBuffer = 0.02 * unitSize;

    const a1 = -unitStart + unitSize * i + unitBuffer;
    const a2 = -unitStart + unitSize * (i + 1) - unitBuffer;
    const b1 = -unitStart + unitSize * j + unitBuffer;
    const b2 = -unitStart + unitSize * (j + 1) - unitBuffer;
    const c1 = -unitStart;
    const c2 = unitStart;

    // if axisIndex == 0 (x) then c, a, b
    // if axisIndex == 1 (y) then b, c, a
    // if axisIndex == 2 (z) then a, b, c
    let coords;
    if (axisIndex === 0) {
      if (sideIndex === 0) {
        coords = [[c1, a1, b1], [c1, a1, b2], [c1, a2, b2], [c1, a2, b1]];
      } else {
        coords = [[c2, a1, b1], [c2, a2, b1], [c2, a2, b2], [c2, a1, b2]];
      }
    } else if (axisIndex === 1) {
      if (sideIndex === 0) {
        coords = [[b1, c1, a1], [b2, c1, a1], [b2, c1, a2], [b1, c1, a2]];
      } else {
        coords = [[b1, c2, a1], [b1, c2, a2], [b2, c2, a2], [b2, c2, a1]];
      }
    } else {
      if (sideIndex === 0) {
        coords = [[a1, b1, c1], [a1, b2, c1], [a2, b2, c1], [a2, b1, c1]];
      } else {
        coords = [[a1, b1, c2], [a2, b1, c2], [a2, b2, c2], [a1, b2, c2]];
      }
    }

    return new Unit({ square: makeQuad(coords, color), color });
  }

  *allUnits() {
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            yield { axisIndex, sideIndex, unit: this.data[axisIndex][sideIndex][i][j] };
          }
        }
      }
    }
  }

  getSquares() {
    return Array.from(this.allUnits(), ({ unit }) => unit.getSquare());
  }

  dispose() {
    for (const { unit } of this.allUnits()) {
      const square = unit.getSquare();
      square.geometry.dispose();
      square.material.dispose();
    }
  }

  // The 9 stickers on a face plus the 12 stickers around its edge.
  getUnits({ axisIndex, sideIndex }) {
    const units = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        units.push(this.data[axisIndex][sideIndex][i][j]);
      }
    }
    for (let otherAxisIndex = 0; otherAxisIndex < 3; otherAxisIndex++) {
      if (otherAxisIndex === axisIndex) continue;
      for (let otherSideIndex = 0; otherSideIndex < 2; otherSideIndex++) {
        const topLeft = this.getTopLeft({ axisIndex, sideIndex, otherAxisIndex, otherSideIndex });
        for (let i = 0; i < 3; i++) {
          units.push(this.data[otherAxisIndex][otherSideIndex][topLeft.x + i * topLeft.dx][topLeft.y + i * topLeft.dy]);
        }
      }
    }
    return units;
  }

  // otherAxisIndex should not equal axisIndex
  getTopLeft({ axisIndex, sideIndex, otherAxisIndex, otherSideIndex }) {
    const result = {};
    const isNextAxis = otherAxisIndex === (axisIndex + 1) % 3;
    const isSameSide = otherSideIndex === sideIndex;
    result[!isNextAxis ? 'x' : 'y'] = sideIndex * 2;
    result[isNextAxis ? 'x' : 'y'] = (!isNextAxis ^ isSameSide) * 2;
    result[isNextAxis ? 'dx' : 'dy'] = 1 - result[isNextAxis ? 'x' : 'y'];
    result[!isNextAxis ? 'dx' : 'dy'] = 0;
    return result;
  }

  getFace({ square }) {
    for (const { axisIndex, sideIndex, unit } of this.allUnits()) {
      if (unit.getSquare() === square) {
        return { axis: AXES[axisIndex], side: SIDES[sideIndex] };
      }
    }
  }

  shuffle({ times }) {
    for (let t = 0; t < times; t++) {
      this.finishRotation({
        axisIndex: Math.floor(Math.random() * 3),
        sideIndex: Math.floor(Math.random() * 2),
        rotations: Math.floor(Math.random() * 3)
      });
    }
  }

  restart() {
    for (const { axisIndex, sideIndex, unit } of this.allUnits()) {
      unit.setColor(this.getColor(axisIndex, sideIndex));
    }
  }

  // Turn a face part way (for animation). rotation is in quarter turns.
  rotateFace({ axis, side, rotation }) {
    const axisIndex = AXES.indexOf(axis);
    const sideIndex = SIDES.indexOf(side);

    for (const unit of this.getUnits({ axisIndex, sideIndex })) {
      unit.getSquare().rotation[axis] = (sideIndex === 0 ? 1 : -1) * rotation * (Math.PI / 2);
    }

    this.selectedFace = { axisIndex, sideIndex, rotation };
  }

  // Snap the selected face to the nearest quarter turn and move the colors to match.
  finishRotation(options) {
    let axisIndex, sideIndex, rotations;
    if (options) {
      ({ axisIndex, sideIndex, rotations } = options);
    } else {
      ({ axisIndex, sideIndex } = this.selectedFace);
      rotations = ((Math.round(this.selectedFace.rotation) % 4) + 4) % 4;
    }

    const face = this.data[axisIndex][sideIndex];

    for (let r = 0; r < rotations; r++) {
      // rotate corners and edges
      let tempColors = null;
      let lastUnits = null;
      for (let i = 0; i < CORNERS.length; i++) {
        const j = sideIndex !== 0 ? i : CORNERS.length - i - 1;
        const corner = face[CORNERS[j].x][CORNERS[j].y];
        const edge = face[EDGES[j].x][EDGES[j].y];
        if (tempColors === null) {
          tempColors = { corner: corner.getColor(), edge: edge.getColor() };
        } else {
          lastUnits.corner.setColor(corner.getColor());
          lastUnits.edge.setColor(edge.getColor());
        }
        lastUnits = { corner, edge };
      }
      lastUnits.corner.setColor(tempColors.corner);
      lastUnits.edge.setColor(tempColors.edge);

      // rotate other axes
      tempColors = null;
      lastUnits = null;
      for (let otherSideIndex = 1; otherSideIndex >= 0; otherSideIndex--) {
        for (let otherAxisIndex = 2; otherAxisIndex >= 0; otherAxisIndex--) {
          const actualAxisIndex = (sideIndex === 0) !== (axisIndex === 1) ? otherAxisIndex : 2 - otherAxisIndex;
          const actualSideIndex = otherSideIndex;
          if (actualAxisIndex === axisIndex) continue;

          const topLeft = this.getTopLeft({
            axisIndex,
            sideIndex,
            otherAxisIndex: actualAxisIndex,
            otherSideIndex: actualSideIndex
          });

          const units = [];
          for (let i = 0; i < 3; i++) {
            units.push(this.data[actualAxisIndex][actualSideIndex][topLeft.x + topLeft.dx * i][topLeft.y + topLeft.dy * i]);
          }

          if (tempColors === null) {
            tempColors = units.map((unit) => unit.getColor());
          } else {
            for (let i = 0; i < 3; i++) {
              lastUnits[i].setColor(units[i].getColor());
            }
          }
          lastUnits = units;
        }
      }
      for (let i = 0; i < 3; i++) {
        lastUnits[i].setColor(tempColors[i]);
      }
    }
  }

  // Highlight the face that contains this square. Call with no square to clear.
  selectFace(square) {
    this.selectedFace = null;
    for (const { axisIndex, sideIndex, unit } of this.allUnits()) {
      if (square && unit.getSquare() === square) {
        this.selectedFace = { axisIndex, sideIndex, rotation: 0 };
      }
      unit.unselect();
    }

    if (this.selectedFace) {
      for (const unit of this.getUnits(this.selectedFace)) {
        unit.select();
      }
    }
  }

  getSelectedFace() {
    if (!this.selectedFace) return null;
    return {
      axis: AXES[this.selectedFace.axisIndex],
      side: SIDES[this.selectedFace.sideIndex],
      rotation: this.selectedFace.rotation
    };
  }

  findCenter({ primary }) {
    const color = COLORS[primary];
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        if (this.data[axisIndex][sideIndex][1][1].getColor() === color) {
          return { axis: AXES[axisIndex], side: SIDES[sideIndex] };
        }
      }
    }
    return null;
  }

  findEdge(options) {
    const primary = COLORS[options.primary];
    const secondary = COLORS[options.secondary];

    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        for (let otherAxisIndex = 0; otherAxisIndex < 3; otherAxisIndex++) {
          if (axisIndex === otherAxisIndex) continue;
          for (let otherSideIndex = 0; otherSideIndex < 2; otherSideIndex++) {
            const topLeft1 = this.getTopLeft({ axisIndex, sideIndex, otherAxisIndex, otherSideIndex });
            const edge1 = this.data[otherAxisIndex][otherSideIndex][topLeft1.x + topLeft1.dx][topLeft1.y + topLeft1.dy].getColor();
            if (edge1 !== secondary) continue;

            const topLeft2 = this.getTopLeft({
              axisIndex: otherAxisIndex,
              sideIndex: otherSideIndex,
              otherAxisIndex: axisIndex,
              otherSideIndex: sideIndex
            });
            const edge2 = this.data[axisIndex][sideIndex][topLeft2.x + topLeft2.dx][topLeft2.y + topLeft2.dy].getColor();
            if (edge2 !== primary) continue;

            return {
              primary: { axis: AXES[axisIndex], side: SIDES[sideIndex] },
              secondary: { axis: AXES[otherAxisIndex], side: SIDES[otherSideIndex] }
            };
          }
        }
      }
    }
    return null;
  }

  findCorner(options) {
    const primary = COLORS[options.primary];
    const secondary = COLORS[options.secondary];
    const tertiary = COLORS[options.tertiary];

    for (let primaryAxisIndex = 0; primaryAxisIndex < 3; primaryAxisIndex++) {
      for (let secondaryAxisIndex = 0; secondaryAxisIndex < 3; secondaryAxisIndex++) {
        if (primaryAxisIndex === secondaryAxisIndex) continue;
        for (let primarySideIndex = 0; primarySideIndex < 2; primarySideIndex++) {
          for (let secondarySideIndex = 0; secondarySideIndex < 2; secondarySideIndex++) {
            const v1 = [0, 1, 2].map((a) => (primaryAxisIndex === a ? primarySideIndex * 2 - 1 : 0));
            const v2 = [0, 1, 2].map((a) => (secondaryAxisIndex === a ? secondarySideIndex * 2 - 1 : 0));
            const crossProduct = [
              v1[1] * v2[2] - v1[2] * v2[1],
              v1[2] * v2[0] - v1[0] * v2[2],
              v1[0] * v2[1] - v1[1] * v2[0]
            ];
            const tertiaryAxisIndex = Math.max(crossProduct.indexOf(-1), crossProduct.indexOf(1));
            const tertiarySideIndex = Math.floor((1 - (crossProduct[0] | crossProduct[1] | crossProduct[2]) + 1) / 2);

            const topLeft1 = this.getTopLeft({
              axisIndex: secondaryAxisIndex,
              sideIndex: secondarySideIndex,
              otherAxisIndex: primaryAxisIndex,
              otherSideIndex: primarySideIndex
            });
            const edge1 = this.data[primaryAxisIndex][primarySideIndex][topLeft1.x][topLeft1.y].getColor();
            if (edge1 !== primary) continue;

            const topLeft2 = this.getTopLeft({
              axisIndex: tertiaryAxisIndex,
              sideIndex: tertiarySideIndex,
              otherAxisIndex: secondaryAxisIndex,
              otherSideIndex: secondarySideIndex
            });
            const edge2 = this.data[secondaryAxisIndex][secondarySideIndex][topLeft2.x][topLeft2.y].getColor();
            if (edge2 !== secondary) continue;

            const topLeft3 = this.getTopLeft({
              axisIndex: primaryAxisIndex,
              sideIndex: primarySideIndex,
              otherAxisIndex: tertiaryAxisIndex,
              otherSideIndex: tertiarySideIndex
            });
            const edge3 = this.data[tertiaryAxisIndex][tertiarySideIndex][topLeft3.x][topLeft3.y].getColor();
            if (edge3 !== tertiary) continue;

            return {
              primary: { axis: AXES[primaryAxisIndex], side: SIDES[primarySideIndex] },
              secondary: { axis: AXES[secondaryAxisIndex], side: SIDES[secondarySideIndex] },
              tertiary: { axis: AXES[tertiaryAxisIndex], side: SIDES[tertiarySideIndex] }
            };
          }
        }
      }
    }
  }

  // How many quarter turns of the `focus` face move the `from` face's side onto the `to` face.
  getRotations(options) {
    const primary = COLORS[options.focus];
    const secondary = COLORS[options.from];
    const tertiary = COLORS[options.to];

    let primaryFace, secondaryFace, tertiaryFace;
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        const center = this.data[axisIndex][sideIndex][1][1].getColor();
        if (center === primary) {
          primaryFace = { axisIndex, sideIndex };
        } else if (center === secondary) {
          secondaryFace = { axisIndex, sideIndex };
        } else if (center === tertiary) {
          tertiaryFace = { axisIndex, sideIndex };
        }
      }
    }

    const topLeftSecondary = this.getTopLeft({
      axisIndex: secondaryFace.axisIndex,
      sideIndex: secondaryFace.sideIndex,
      otherAxisIndex: primaryFace.axisIndex,
      otherSideIndex: primaryFace.sideIndex
    });
    const topLeftTertiary = this.getTopLeft({
      axisIndex: tertiaryFace.axisIndex,
      sideIndex: tertiaryFace.sideIndex,
      otherAxisIndex: primaryFace.axisIndex,
      otherSideIndex: primaryFace.sideIndex
    });

    let secondaryIndex, tertiaryIndex;
    for (let i = 0; i < CORNERS.length; i++) {
      if (CORNERS[i].x === topLeftSecondary.x && CORNERS[i].y === topLeftSecondary.y) {
        secondaryIndex = i;
      }
      if (CORNERS[i].x === topLeftTertiary.x && CORNERS[i].y === topLeftTertiary.y) {
        tertiaryIndex = i;
      }
    }

    let distance = (((tertiaryIndex - secondaryIndex) % 4) + 4) % 4;
    if (primaryFace.sideIndex !== 0) distance = 4 - distance;
    if (distance === 3) distance = -1;

    return distance;
  }

  isSolved() {
    for (const { axisIndex, sideIndex, unit } of this.allUnits()) {
      if (unit.getColor() !== this.data[axisIndex][sideIndex][1][1].getColor()) {
        return false;
      }
    }
    return true;
  }
}
