// Mouse, touch and pen input through Pointer Events. Positions are client coordinates.
// Only the first pointer down is tracked, so a second finger is ignored.
export class PointerTracker {
  constructor({ element, dragStart, dragging, dragEnd, hovering }) {
    this.element = element;
    this.callbacks = { dragStart, dragging, dragEnd, hovering };
    this.pointerId = null;
    this.positions = {
      start: { x: 0, y: 0 },
      last: { x: 0, y: 0 },
      current: { x: 0, y: 0 }
    };

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
  }

  onPointerDown(event) {
    if (this.pointerId !== null || event.button > 0) return;
    this.pointerId = event.pointerId;
    // keep getting move and up events even if the pointer leaves the canvas
    this.element.setPointerCapture(event.pointerId);

    const position = { x: event.clientX, y: event.clientY };
    this.positions = { start: position, last: position, current: position };
    this.callbacks.dragStart?.(event, position);
  }

  onPointerMove(event) {
    if (this.pointerId === null) {
      if (event.pointerType === 'mouse') {
        this.callbacks.hovering?.(event, { x: event.clientX, y: event.clientY });
      }
      return;
    }
    if (event.pointerId !== this.pointerId) return;

    this.positions.current = { x: event.clientX, y: event.clientY };
    this.callbacks.dragging?.(event, this.positions);
    this.positions.last = this.positions.current;
  }

  onPointerUp(event) {
    if (event.pointerId !== this.pointerId) return;
    this.onPointerMove(event);
    this.pointerId = null;
    this.callbacks.dragEnd?.(event);
  }
}
