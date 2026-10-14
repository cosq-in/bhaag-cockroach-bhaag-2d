import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player.js';
import { hitsObstacle, collectsPickup } from '../src/collision.js';

const ob = (kind, lane = 1, z = 0) => ({ cat: 'obstacle', kind, lane, z, dead: false });
const pk = (lane = 1, z = 0) => ({ cat: 'pickup', kind: 'petition', lane, z, dead: false });

test('block in same lane and depth hits', () => {
  assert.ok(hitsObstacle(new Player(), ob('block')));
});

test('different lane or far depth does not hit', () => {
  const p = new Player();
  assert.ok(!hitsObstacle(p, ob('block', 0)));
  assert.ok(!hitsObstacle(p, ob('block', 1, 5)));
});

test('low is cleared by jumping, high by sliding, block never', () => {
  const p = new Player();
  p.jump();
  assert.ok(!hitsObstacle(p, ob('low')));
  assert.ok(hitsObstacle(p, ob('high')));
  assert.ok(hitsObstacle(p, ob('block')));
  p.slide();
  assert.ok(!hitsObstacle(p, ob('high')));
  assert.ok(hitsObstacle(p, ob('low')));
});

test('drifting gas hits when within half a lane', () => {
  const p = new Player();
  assert.ok(hitsObstacle(p, ob('gas', 1.4)));
  assert.ok(!hitsObstacle(p, ob('gas', 1.6)));
});

test('dead items are ignored; pickups are collected not hit', () => {
  const p = new Player();
  const dead = ob('block'); dead.dead = true;
  assert.ok(!hitsObstacle(p, dead));
  assert.ok(collectsPickup(p, pk()));
  assert.ok(!hitsObstacle(p, pk()));
  assert.ok(!collectsPickup(p, ob('block')));
});
