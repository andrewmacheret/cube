// One colored sticker on the cube. `square` is the invisible tile used for picking and turning,
// and `sticker` is the visible mesh inside it.
export class Unit {
  constructor({ square, sticker, color }) {
    this.square = square;
    this.sticker = sticker;
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
    this.sticker.material.color.setHex(color);
  }

  select() {
    const factor = 0.7;
    const r = Math.floor((0xff & (this.color >> 16)) * factor);
    const g = Math.floor((0xff & (this.color >> 8)) * factor);
    const b = Math.floor((0xff & this.color) * factor);
    this.sticker.material.color.setHex((r << 16) | (g << 8) | b);
    this.selected = true;
  }

  unselect() {
    this.sticker.material.color.setHex(this.color);
    this.selected = false;
  }

  isSelected() {
    return this.selected;
  }

  dispose() {
    for (const mesh of [this.square, this.sticker]) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  }

  toString() {
    return this.color.toString(16).padStart(6, '0') + (this.selected ? ' (selected)' : '');
  }
}
