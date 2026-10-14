import test from 'node:test';
import assert from 'node:assert/strict';
import { drawFrame } from '../src/render.js';
import { createGame, startRun, step } from '../src/game.js';
import { mulberry32 } from './rng.js';

function fakeCtx() {
  const store = {};
  return new Proxy(store, {
    get(t, k) {
      if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return (s) => ({ width: String(s).length * 8 });
      return k in t ? t[k] : () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

test('draws menu, play (both stages, boss, power-ups) and game over without throwing', () => {
  const ctx = fakeCtx();
  const g = createGame(mulberry32(5), 120);
  drawFrame(ctx, 800, 600, g);

  startRun(g);
  for (let i = 0; i < 60 * 5; i++) step(g, 1 / 60);
  g.powerups.banked = 'wifi';
  g.powerups.shieldT = 2;
  g.chaser.gap = 3;
  g.player.graceT = 0.5;
  drawFrame(ctx, 800, 600, g);
  drawFrame(ctx, 390, 844, g);

  g.distance = 2100; step(g, 1 / 60);
  drawFrame(ctx, 800, 600, g);
  g.distance = 3000; step(g, 1 / 60);
  drawFrame(ctx, 800, 600, g);

  g.state = 'over';
  drawFrame(ctx, 800, 600, g);
  assert.ok(true);
});

function recordingCtx() {
  const calls = [];
  const store = { font: '10px x', textAlign: 'center' };
  const size = () => Number(/(\d+(?:\.\d+)?)px/.exec(store.font)?.[1] ?? 10);
  const ctx = new Proxy(store, {
    get(t, k) {
      if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return (s) => ({ width: String(s).length * size() * 0.55 });
      if (k === 'fillText') return (s, x, y) => calls.push({ s: String(s), x, y, size: size(), align: t.textAlign });
      return k in t ? t[k] : () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return { ctx, calls };
}

const plain = (g) => JSON.stringify({
  state: g.state, distance: g.distance, score: g.score, popups: g.popups, events: g.events,
  mult: g.mult, touch: g.touch, lane: g.player.lane, gap: g.chaser.gap,
  meter: g.powerups.meter, banked: g.powerups.banked,
});

test('390x844 touch frame keeps text on screen and does not mutate game state', () => {
  const { ctx, calls } = recordingCtx();
  const g = createGame(mulberry32(9), 500);
  startRun(g);
  for (let i = 0; i < 60; i++) step(g, 1 / 60);
  g.touch = true;
  g.mult = 3;
  g.powerups.banked = 'shield';
  g.popups = [
    { text: 'Witness recorded: the whole street is watching the inspector tonight', t: 1 },
    { text: 'Another witness joins the petition against the long wall of forms', t: 1 },
  ];
  const before = plain(g);
  drawFrame(ctx, 390, 844, g);
  assert.equal(plain(g), before);
  const lines = calls.filter((c) => c.size > 18 && c.size < 20);
  assert.ok(lines.length >= 4, 'popups wrapped into several lines');
  for (const c of lines) {
    const wd = c.s.length * c.size * 0.55;
    assert.ok(c.x - wd / 2 >= 0 && c.x + wd / 2 <= 390, `overflow: ${c.s}`);
  }
  const ys = lines.map((c) => c.y);
  assert.equal(new Set(ys).size, ys.length, 'popup lines overlap');
  assert.ok(calls.find((c) => c.s === 'TAP').size >= 12);
});
