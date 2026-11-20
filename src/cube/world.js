import {
  DirectionalLight,
  Group,
  Mesh,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShadowMaterial,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Cube } from './cube.js';
import { PointerTracker } from './pointer.js';
import { CubeSolver } from './solver.js';

const MOVE_MS = 450;
const SNAP_MS = 160;
const CAMERA_POSITION = new Vector3(0, 5, 19);
const CAMERA_TARGET = new Vector3(0, -0.6, 0);

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

// Owns the three.js scene, the render loop and pointer input for one cube.
export class World {
  constructor({ container, onSolvingChange }) {
    this.container = container;
    this.onSolvingChange = onSolvingChange;
    this.move = null;
    this.snap = null;
    this.dragging = false;

    // the canvas is see-through so the CSS background shows behind the cube
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    container.append(this.renderer.domElement);

    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
    this.camera = new PerspectiveCamera(40, 1, 0.1, 1000);

    this.scene = new Scene();
    this.initLights();

    // the cube spins inside this group, so the lights and floor stay put
    this.cube = new Cube({ unitSize: 2 });
    this.squares = this.cube.getSquares();
    this.cubeGroup = new Group();
    this.cubeGroup.add(...this.cube.getObjects());
    this.cubeGroup.rotation.x = Math.PI / 8;
    this.cubeGroup.rotation.y = Math.PI / 4;
    this.scene.add(this.cubeGroup);

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

  initLights() {
    // soft light from all around, which also gives the stickers their glossy reflections
    const pmrem = new PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = 0.6;

    const light = new DirectionalLight(0xffffff, 1.3);
    light.position.set(6, 12, 9);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = light.shadow.camera.bottom = -9;
    light.shadow.camera.right = light.shadow.camera.top = 9;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 40;
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
    light.shadow.radius = 4;
    this.scene.add(light);

    // an invisible floor that only shows the cube's shadow
    this.floor = new Mesh(new PlaneGeometry(60, 60), new ShadowMaterial({ opacity: 0.3 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -6;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.pointerTracker.dispose();
    this.cube.dispose();
    this.floor.geometry.dispose();
    this.floor.material.dispose();
    this.environment.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // true while the cube is animating on its own and shouldn't take input
  get busy() {
    return !!(this.move || this.snap);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    // back the camera up on narrow screens so the whole cube fits across
    this.camera.position.copy(CAMERA_POSITION).multiplyScalar(Math.max(1, 0.8 / this.camera.aspect));
    this.camera.lookAt(CAMERA_TARGET);
    this.camera.updateProjectionMatrix();
  }

  shuffle() {
    if (this.busy) return;
    this.cube.shuffle({ times: 200 });
  }

  restart() {
    if (this.busy) return;
    this.cube.restart();
  }

  solve() {
    if (this.busy) return;
    this.cube.selectFace();
    this.cubeSolver = new CubeSolver({ cube: this.cube });
    this.cubeSolver.start();
    this.move = this.cubeSolver.getNextMove();
    this.moveTime = null;
    this.onSolvingChange?.(!!this.move);
  }

  dragStart(position) {
    this.renderer.domElement.classList.add('grabbing');
    if (this.busy) return;
    this.dragging = true;
    this.cube.selectFace(this.getSquareAt(position));
  }

  drag(positions) {
    const face = this.cube.getSelectedFace();
    if (!face || this.busy) {
      // spin the whole cube
      this.cubeGroup.rotation.x += (positions.current.y - positions.last.y) / 100;
      this.cubeGroup.rotation.y += (positions.current.x - positions.last.x) / 100;
    } else {
      // turn the selected face
      const dx = positions.start.x - positions.last.x;
      const dy = positions.start.y - positions.last.y;
      this.cube.rotateFace({ axis: face.axis, side: face.side, rotation: -(dx + dy) / 100 });
    }
  }

  dragEnd() {
    this.renderer.domElement.classList.remove('grabbing');
    if (this.busy) return;
    if (this.dragging) {
      const face = this.cube.getSelectedFace();
      if (face) {
        // ease the face the rest of the way to the nearest quarter turn
        this.cube.selectFace();
        this.snap = { ...face, from: face.rotation, to: Math.round(face.rotation), start: null };
      }
    }
    this.dragging = false;
  }

  hover(position) {
    if (this.busy || this.dragging) return;
    this.cube.selectFace(this.getSquareAt(position));
  }

  getSquareAt(position) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((position.x - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((position.y - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.squares, false)[0]?.object;
  }

  // Turn a face from `from` to `to` quarter turns. Returns true once it has landed.
  animateFace({ axis, side, from, to }, start, duration, time) {
    const percent = Math.min((time - start) / duration, 1);
    this.cube.rotateFace({ axis, side, rotation: from + (to - from) * easeInOut(percent) });
    if (percent < 1) return false;
    this.cube.finishRotation();
    this.cube.rotateFace({ axis, side, rotation: 0 });
    return true;
  }

  render(time) {
    if (this.snap) {
      this.snap.start ??= time;
      if (this.animateFace(this.snap, this.snap.start, SNAP_MS, time)) {
        this.snap = null;
      }
    } else if (this.move) {
      this.moveTime ??= time;
      if (this.animateFace({ ...this.move, from: 0, to: this.move.rotation }, this.moveTime, MOVE_MS, time)) {
        this.move = this.cubeSolver.getNextMove();
        this.moveTime = time;
        if (!this.move) this.onSolvingChange?.(false);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
