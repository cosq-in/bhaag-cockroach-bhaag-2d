import { createGame, applyIntent, step } from './game.js';
import { drawFrame } from './render.js';
import { attachInput } from './input.js';
import { initAudio, sfx, toggleMute } from './audio.js';

const HI_KEY = 'delhiRunnerHi';
const STEP = 1 / 60;

function loadHi() {
  try { return Number(localStorage.getItem(HI_KEY)) || 0; } catch { return 0; }
}
function saveHi(v) {
  try { localStorage.setItem(HI_KEY, String(v)); } catch { /* storage unavailable */ }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let w = 0;
let h = 0;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const game = createGame(Math.random, loadHi());

window.addEventListener('orientationchange', resize);

attachInput(canvas, (intent) => {
  initAudio();
  if (intent === 'touch') { game.touch = true; return; }
  if (intent === 'mute') { toggleMute(); return; }
  applyIntent(game, intent);
});

const VIBRATE = { stumble: 40, caught: [60, 40, 120], revive: 30, power: 20 };

function buzz(name) {
  try { if (VIBRATE[name]) navigator.vibrate?.(VIBRATE[name]); } catch { /* unsupported */ }
}

function drainEvents() {
  for (const name of game.events) {
    sfx(name);
    buzz(name);
    if (name === 'caught') saveHi(game.hi);
  }
  game.events.length = 0;
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  if (!document.hidden) acc += dt;
  while (acc >= STEP) { step(game, STEP); acc -= STEP; }
  drainEvents();
  drawFrame(ctx, w, h, game);
  requestAnimationFrame(frame);
}

let started = false;
function startLoop() {
  if (started) return;
  started = true;
  requestAnimationFrame(frame);
}

const fontLoad = document.fonts?.load(`20px "Permanent Marker"`) ?? Promise.resolve();
Promise.race([
  fontLoad.catch(() => {}),
  new Promise((r) => setTimeout(r, 1500)),
]).then(startLoop);
