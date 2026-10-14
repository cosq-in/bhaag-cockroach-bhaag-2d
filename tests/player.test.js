import test from 'node:test';
import assert from 'node:assert/strict';
import { Player, JUMP_TIME } from '../src/player.js';

test('lane moves clamp to 0..2', () => {
  const p = new Player();
  p.moveLeft(); p.moveLeft(); p.moveLeft();
  assert.equal(p.lane, 0);
  p.moveRight(); p.moveRight(); p.moveRight();
  assert.equal(p.lane, 2);
});

test('jump is airborne then lands', () => {
  const p = new Player();
  p.jump();
  assert.ok(p.airborne);
  p.update(JUMP_TIME / 2);
  assert.ok(p.jumpHeight > 0.95);
  p.update(JUMP_TIME);
  assert.ok(!p.airborne);
  assert.equal(p.jumpHeight, 0);
});

test('slide cancels jump and expires', () => {
  const p = new Player();
  p.jump(); p.slide();
  assert.ok(p.sliding && !p.airborne);
  p.update(1);
  assert.ok(!p.sliding);
});

test('visual lane eases toward lane', () => {
  const p = new Player();
  p.moveRight();
  p.update(1 / 60);
  assert.ok(p.visualLane > 1 && p.visualLane < 2);
  for (let i = 0; i < 60; i++) p.update(1 / 60);
  assert.ok(Math.abs(p.visualLane - 2) < 0.01);
});

test('stumble starts grace period that decays', () => {
  const p = new Player();
  p.stumble();
  assert.ok(p.graceT > 0);
  p.update(5);
  assert.equal(p.graceT, 0);
});
