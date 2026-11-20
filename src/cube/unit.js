// One colored sticker on the cube.
export class Unit {
  constructor({ square, color }) {
    this.square = square;
    this.color = color;
    this.selected = false;
  }

  getSquare() {
    return this.square;
  }

  getColor() {
    return this.color;
  }

  setColor(color) {
    this.color = color;
    this.selected = false;
    this.square.material.color.setHex(color);
  }

  select() {
    const factor = 0.7;
    const r = Math.floor((0xff & (this.color >> 16)) * factor);
    const g = Math.floor((0xff & (this.color >> 8)) * factor);
    const b = Math.floor((0xff & this.color) * factor);
    this.square.material.color.setHex((r << 16) | (g << 8) | b);
    this.selected = true;
  }

  unselect() {
    this.square.material.color.setHex(this.color);
    this.selected = false;
  }

  isSelected() {
    return this.selected;
  }

  toString() {
    return this.color.toString(16).padStart(6, '0') + (this.selected ? ' (selected)' : '');
  }
}
