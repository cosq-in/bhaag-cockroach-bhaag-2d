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
