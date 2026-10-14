import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startRun, applyIntent, step } from '../src/game.js';
import { MAX_GAP } from '../src/chaser.js';
import { mulberry32 } from './rng.js';

const STEP = 1 / 60;
const run = (g, seconds) => { for (let i = 0; i < seconds * 60; i++) step(g, STEP); };
const ob = (kind, lane = 1) => ({ cat: 'obstacle', kind, label: kind, lane, z: 0, dead: false });

function started() {
  const g = createGame(mulberry32(7));
  startRun(g);
  g.spawner.cooldown = 1e9;
  return g;
}

test('menu does nothing until start, then play begins', () => {
  const g = createGame(mulberry32(1));
  step(g, STEP);
  assert.equal(g.distance, 0);
  applyIntent(g, 'start');
  assert.equal(g.state, 'play');
  run(g, 2);
  assert.ok(g.distance > 30);
  assert.ok(g.score > 0);
});

test('an idle player is eventually detained', () => {
  const g = createGame(mulberry32(7));
  startRun(g);
  run(g, 120);
  assert.equal(g.state, 'over');
  assert.ok(g.events.includes('caught'));
});

test('restart from game over needs a short delay', () => {
  const g = createGame(mulberry32(7));
  startRun(g);
  g.state = 'over';
  applyIntent(g, 'start');
  assert.equal(g.state, 'over');
  run(g, 1);
  applyIntent(g, 'start');
  assert.equal(g.state, 'play');
});

test('a block hit is a stumble: chaser closes, grace starts', () => {
  const g = started();
  g.spawner.items.push(ob('block'));
  step(g, STEP);
  assert.ok(g.chaser.close);
  assert.ok(g.player.graceT > 0);
  assert.ok(g.events.includes('stumble'));
  assert.equal(g.state, 'play');
});

test('second stumble while close ends the run', () => {
  const g = started();
  g.chaser.gap = 4;
  g.spawner.items.push(ob('block'));
  step(g, STEP);
  assert.equal(g.state, 'over');
});

test('wifi revive saves from detention once', () => {
  const g = started();
  g.chaser.gap = 4;
  g.powerups.banked = 'wifi';
  g.spawner.items.push(ob('block'));
  step(g, STEP);
  assert.equal(g.state, 'play');
  assert.equal(g.powerups.banked, null);
  assert.ok(g.chaser.gap >= MAX_GAP - 0.1);
  assert.ok(g.events.includes('revive'));
});

test('shield ignores obstacles', () => {
  const g = started();
  g.powerups.shieldT = 5;
  g.spawner.items.push(ob('block'));
  step(g, STEP);
  assert.ok(!g.chaser.close);
  assert.equal(g.state, 'play');
});

test('jumping clears a low obstacle', () => {
  const g = started();
  applyIntent(g, 'jump');
  g.spawner.items.push(ob('low'));
  step(g, STEP);
  assert.ok(!g.chaser.close);
});

test('pickups add score, combo and fill the witness meter', () => {
  const g = started();
  g.spawner.items.push({ cat: 'pickup', kind: 'witness', label: 'witness', lane: 1, z: 0, dead: false });
  step(g, STEP);
  assert.ok(g.combo === 1);
  assert.ok(g.powerups.meter > 0);
  assert.ok(g.popups.length >= 2);
  assert.ok(g.events.includes('pickup'));
});

test('power intent uses a banked meme drop', () => {
  const g = started();
  g.powerups.banked = 'meme';
  applyIntent(g, 'power');
  assert.ok(g.powerups.memeActive);
  assert.ok(g.events.includes('power'));
});

test('stage changes at 2400 and boss flag follows the window', () => {
  const g = started();
  g.distance = 2100;
  step(g, STEP);
  assert.equal(g.boss, true);
  g.distance = 2500;
  step(g, STEP);
  assert.equal(g.stage.id, 2);
  assert.equal(g.boss, false);
});
