import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Cube } from '../src/cube/cube.js';
import { applyMove, CubeSolver, planSolution, simplifyMoves } from '../src/cube/solver.js';

// Run the solver one stage at a time, the way it worked before planSolution.
function solveStepByStep(cube) {
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

test('the step by step solver solves 500 shuffled cubes', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const cube = new Cube({ unitSize: 2 });
  for (let i = 0; i < 500; i++) {
    cube.shuffle({ times: 200 });
    solveStepByStep(cube);
    assert.ok(cube.isSolved(), `cube ${i} was not solved`);
  }
  assert.equal(warn.mock.callCount(), 0);
});

test('planSolution leaves the cube alone', () => {
  const cube = new Cube({ unitSize: 2 });
  cube.shuffle({ times: 200 });
  const before = cube.getColors();
  planSolution(cube);
  assert.deepEqual(cube.getColors(), before);
});

test('planSolution returns no moves for a solved cube', () => {
  assert.deepEqual(planSolution(new Cube({ unitSize: 2 })), []);
});

test('planned solutions solve 500 shuffled cubes with fewer moves', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const cube = new Cube({ unitSize: 2 });
  let before = 0;
  let after = 0;
  for (let i = 0; i < 500; i++) {
    cube.shuffle({ times: 200 });
    const colors = cube.getColors();
    before += solveStepByStep(cube);
    cube.setColors(colors);

    const moves = planSolution(cube);
    after += moves.length;
    for (const move of moves) applyMove(cube, move);
    assert.ok(cube.isSolved(), `cube ${i} was not solved`);

    for (let m = 1; m < moves.length; m++) {
      const sameFace = moves[m].axis === moves[m - 1].axis && moves[m].side === moves[m - 1].side;
      assert.ok(!sameFace, `cube ${i} has two turns of the same face in a row`);
    }
  }
  assert.equal(warn.mock.callCount(), 0);
  assert.ok(after < before);
  t.diagnostic(`average moves: ${(before / 500).toFixed(1)} before, ${(after / 500).toFixed(1)} after`);
});

test('simplifyMoves', async (t) => {
  const move = (axis, side, rotation) => ({ axis, side, rotation });

  await t.test('cancels a turn and its undo', () => {
    assert.deepEqual(simplifyMoves([move('x', 'front', 1), move('x', 'front', -1)]), []);
  });

  await t.test('cancels nested undos', () => {
    const moves = [move('x', 'front', 1), move('y', 'back', 1), move('y', 'back', -1), move('x', 'front', -1)];
    assert.deepEqual(simplifyMoves(moves), []);
  });

  await t.test('merges two quarter turns into a half turn', () => {
    assert.deepEqual(simplifyMoves([move('z', 'back', 1), move('z', 'back', 1)]), [move('z', 'back', 2)]);
  });

  await t.test('turns three quarter turns into one the other way', () => {
    const moves = [move('z', 'back', 1), move('z', 'back', 1), move('z', 'back', 1)];
    assert.deepEqual(simplifyMoves(moves), [move('z', 'back', -1)]);
  });

  await t.test('drops turns that do nothing', () => {
    assert.deepEqual(simplifyMoves([move('x', 'front', 0), move('y', 'front', 4)]), []);
  });

  await t.test('looks past the opposite face on the same axis', () => {
    const moves = [move('x', 'front', 1), move('x', 'back', 1), move('x', 'front', -1)];
    assert.deepEqual(simplifyMoves(moves), [move('x', 'back', 1)]);
  });

  await t.test('does not look past a different axis', () => {
    const moves = [move('x', 'front', 1), move('y', 'front', 1), move('x', 'front', -1)];
    assert.deepEqual(simplifyMoves(moves), moves);
  });
});
