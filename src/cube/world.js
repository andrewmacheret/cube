import { PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from 'three';
import { Cube } from './cube.js';
import { PointerTracker } from './pointer.js';
import { CubeSolver } from './solver.js';

const MOVE_MS = 500;
const CAMERA_DISTANCE = 20;

// Owns the three.js scene, the render loop and pointer input for one cube.
export class World {
  constructor({ container, onSolvingChange }) {
    this.container = container;
    this.onSolvingChange = onSolvingChange;
    this.move = null;
    this.dragging = false;

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);
    container.append(this.renderer.domElement);

    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
    this.camera = new PerspectiveCamera(45, 1, 0.1, 1000);

    this.cube = new Cube({ unitSize: 2 });
    this.squares = this.cube.getSquares();
    this.scene = new Scene();
    this.scene.add(...this.squares);
    this.scene.rotation.x = Math.PI / 6;
    this.scene.rotation.y = Math.PI / 4;

    this.pointerTracker = new PointerTracker({
      element: this.renderer.domElement,
      dragStart: (event, position) => this.dragStart(position),
      dragging: (event, positions) => this.drag(positions),
      dragEnd: () => this.dragEnd(),
      hovering: (event, position) => this.hover(position)
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.renderer.setAnimationLoop((time) => this.render(time));
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.pointerTracker.dispose();
    this.cube.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    // back the camera up on narrow screens so the whole cube fits across
    this.camera.position.z = CAMERA_DISTANCE / Math.min(this.camera.aspect, 1);
    this.camera.updateProjectionMatrix();
  }

  shuffle() {
    if (this.move) return;
    this.cube.shuffle({ times: 200 });
  }

  restart() {
    if (this.move) return;
    this.cube.restart();
  }

  solve() {
    if (this.move) return;
    this.cube.selectFace();
    this.cubeSolver = new CubeSolver({ cube: this.cube });
    this.cubeSolver.start();
    this.move = this.cubeSolver.getNextMove();
    this.moveTime = null;
    this.onSolvingChange?.(!!this.move);
  }

  dragStart(position) {
    if (this.move) return;
    this.dragging = true;
    this.cube.selectFace(this.getSquareAt(position));
  }

  drag(positions) {
    const face = this.cube.getSelectedFace();
    if (!face || this.move) {
      // spin the whole cube
      this.scene.rotation.x += (positions.current.y - positions.last.y) / 100;
      this.scene.rotation.y += (positions.current.x - positions.last.x) / 100;
    } else {
      // turn the selected face
      const dx = positions.start.x - positions.last.x;
      const dy = positions.start.y - positions.last.y;
      this.cube.rotateFace({ axis: face.axis, side: face.side, rotation: -(dx + dy) / 100 });
    }
  }

  dragEnd() {
    if (this.move) return;
    if (this.dragging) {
      const face = this.cube.getSelectedFace();
      if (face) {
        this.cube.finishRotation();
        this.cube.rotateFace({ axis: face.axis, side: face.side, rotation: 0 });
        this.cube.selectFace();
      }
    }
    this.dragging = false;
  }

  hover(position) {
    if (this.move || this.dragging) return;
    this.cube.selectFace(this.getSquareAt(position));
  }

  getSquareAt(position) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((position.x - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((position.y - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.squares)[0]?.object;
  }

  render(time) {
    if (this.move) {
      this.moveTime ??= time;
      const percent = (time - this.moveTime) / MOVE_MS;
      const { axis, side, rotation } = this.move;
      if (percent < 1) {
        this.cube.rotateFace({ axis, side, rotation: rotation * percent });
      } else {
        this.cube.rotateFace({ axis, side, rotation });
        this.cube.finishRotation();
        this.cube.rotateFace({ axis, side, rotation: 0 });
        this.move = this.cubeSolver.getNextMove();
        this.moveTime = time;
        if (!this.move) this.onSolvingChange?.(false);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
