import test from 'node:test';
import assert from 'node:assert/strict';
import { project, Z_FAR } from '../src/camera.js';

test('player depth: middle lane is centred, scale 1', () => {
  const p = project(1, 0, 800, 600);
  assert.equal(p.x, 400);
  assert.equal(p.scale, 1);
  assert.equal(p.y, 600 * 0.86);
});

test('lanes are ordered left to right', () => {
  const l = project(0, 0, 800, 600), r = project(2, 0, 800, 600);
  assert.ok(l.x < 400 && r.x > 400);
});

test('farther objects are smaller, higher and closer to centre', () => {
  const near = project(0, 0, 800, 600), far = project(0, Z_FAR, 800, 600);
  assert.ok(far.scale < near.scale);
  assert.ok(far.y < near.y);
  assert.ok(Math.abs(far.x - 400) < Math.abs(near.x - 400));
});

test('depth behind the player is clamped, not exploding', () => {
  assert.ok(project(1, -500, 800, 600).scale <= 1 / (1 - 2 / 20) + 1e-9);
});
