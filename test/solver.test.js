import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Cube } from '../src/cube/cube.js';
import { CubeSolver } from '../src/cube/solver.js';

// Same steps World uses to play a move, minus the animation.
function applyMove(cube, move) {
  cube.rotateFace(move);
  cube.finishRotation();
  cube.rotateFace({ ...move, rotation: 0 });
}

function solve(cube) {
  const solver = new CubeSolver({ cube });
  solver.start();
  let moves = 0;
  for (let move = solver.getNextMove(); move; move = solver.getNextMove()) {
    applyMove(cube, move);
    assert.ok(++moves < 5000, 'solver did not finish');
  }
  return moves;
}

test('a new cube is solved', () => {
  assert.ok(new Cube({ unitSize: 2 }).isSolved());
});

test('restart puts the colors back', () => {
  const cube = new Cube({ unitSize: 2 });
  cube.shuffle({ times: 50 });
  assert.ok(!cube.isSolved());
  cube.restart();
  assert.ok(cube.isSolved());
});

test('four quarter turns of any face is a no-op', () => {
  const cube = new Cube({ unitSize: 2 });
  for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      cube.finishRotation({ axisIndex, sideIndex, rotations: 1 });
      assert.ok(!cube.isSolved());
      cube.finishRotation({ axisIndex, sideIndex, rotations: 3 });
      assert.ok(cube.isSolved());
    }
  }
});

test('the solver solves an already solved cube', () => {
  const cube = new Cube({ unitSize: 2 });
  solve(cube);
  assert.ok(cube.isSolved());
});

test('the solver solves 500 shuffled cubes', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const cube = new Cube({ unitSize: 2 });
  for (let i = 0; i < 500; i++) {
    cube.shuffle({ times: 200 });
    solve(cube);
    assert.ok(cube.isSolved(), `cube ${i} was not solved`);
  }
  assert.equal(warn.mock.callCount(), 0);
});
