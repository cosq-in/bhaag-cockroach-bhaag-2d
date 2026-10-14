# Delhi Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Subway Surfers-style 3-lane endless runner in plain HTML canvas, themed on the 2026 CJP Jantar Mantar protests (satire), per `docs/superpowers/specs/2026-10-14-delhi-runner-design.md`.

**Architecture:** Pure-logic modules (`camera`, `player`, `collision`, `chaser`, `powerups`, `stages`, `spawner`, `input` helpers, `game`) are unit-tested with Node's built-in runner. `render.js`, `audio.js` and `main.js` are the DOM/canvas/WebAudio shell. Game state lives in `game.js` (`createGame`, `applyIntent`, `step`); `main.js` only runs the fixed-timestep loop and drains `game.events` into audio.

**Tech Stack:** Vanilla JS (ES modules), HTML canvas 2D, WebAudio, Node >= 18 for tests (`node --test`). No dependencies, no build step.

## Global Constraints

- Spec deviation 1: ES modules do not load over `file://` in most browsers, so run `npm start` (python static server on :8000) and open http://localhost:8000.
- Spec deviation 2: added `src/game.js` (state + tick) so game rules are testable; `main.js` is only the DOM loop.
- MOBILE FIRST: portrait phone is the primary target (design and test at 390x844), landscape/desktop must still work. Canvas uses `100dvh`, `viewport-fit=cover`, no zoom/scroll/pull-to-refresh/text-selection (`touch-action: none`, `overscroll-behavior: none`, `user-select: none`). Device pixel ratio capped at 2. Swipes fire on `touchmove` as soon as the threshold is crossed (once per gesture), not on release. Tap (no swipe) = start / use power-up; the tap handler must not double-fire from emulated mouse events. Haptics via `navigator.vibrate` (feature-detected). Game pauses stepping while `document.hidden`. Touch devices see touch instructions; HUD keeps a 24px bottom safe margin. Audio unlocks on the first touch/click/key.
- No real faces or likenesses; officials only as fictional stand-ins (none are drawn in v1).
- No Subway Surfers assets (music, art, name). Music is original WebAudio chiptune.
- Lanes are 0, 1, 2. Depth `z`: player at 0, horizon at `Z_FAR = 100`, items move toward `z < 0`.
- Fixed 60 Hz update step (`1/60`).
- High score in `localStorage`, every access wrapped in try/catch.
- Audio starts only after the first user input; if blocked, the game runs muted.
- Do not commit or `git init` unless the user asks.
- All commands run from `/Users/abcom/Desktop/cosq/delhi-runner`.

---

### Task 1: Scaffold and camera

**Files:**
- Create: `package.json`, `index.html`, `style.css`, `src/camera.js`
- Test: `tests/camera.test.js`

**Interfaces:**
- Produces: `Z_FAR` (100), `FOCAL` (20), `project(lane, z, w, h) -> {x, y, scale}`

- [ ] **Step 1: Write the scaffold files**

`package.json`:
```json
{
  "name": "delhi-runner",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "start": "python3 -m http.server 8000"
  }
}
```

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <meta name="theme-color" content="#1b1020">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Delhi Runner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

`style.css`:
```css
html, body {
  margin: 0; height: 100%; background: #1b1020; overflow: hidden;
  touch-action: none; overscroll-behavior: none;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
canvas { display: block; width: 100vw; height: 100vh; height: 100dvh; }
```

- [ ] **Step 2: Write the failing test** — `tests/camera.test.js`
```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `../src/camera.js`

- [ ] **Step 4: Implement** — `src/camera.js`
```js
export const Z_FAR = 100;
export const FOCAL = 20;
const HORIZON = 0.36;
const GROUND = 0.86;

export function project(lane, z, w, h) {
  const zc = Math.max(z, -2);
  const scale = 1 / (1 + zc / FOCAL);
  const horizonY = h * HORIZON;
  const groundY = h * GROUND;
  const laneW = Math.min(w * 0.3, h * 0.42);
  return {
    x: w / 2 + (lane - 1) * laneW * scale,
    y: horizonY + (groundY - horizonY) * scale,
    scale,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: 4 tests pass.

---

### Task 2: Player and collision

**Files:**
- Create: `src/player.js`, `src/collision.js`
- Test: `tests/player.test.js`, `tests/collision.test.js`

**Interfaces:**
- Produces: `Player` with fields `lane, visualLane, jumpT, slideT, graceT`; methods `reset() moveLeft() moveRight() jump() slide() stumble() update(dt)`; getters `airborne, sliding, jumpHeight` (0..1..0). Constants `JUMP_TIME, SLIDE_TIME, STUMBLE_GRACE`.
- Produces: `hitsObstacle(player, item) -> bool`, `collectsPickup(player, item) -> bool`, `HIT_DEPTH` (1.2). Items are `{cat: 'obstacle'|'pickup', kind, lane, z, dead}`; obstacle kinds `low | high | block | gas`.

- [ ] **Step 1: Write the failing tests**

`tests/player.test.js`:
```js
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
```

`tests/collision.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL, cannot find `player.js` / `collision.js`

- [ ] **Step 3: Implement**

`src/player.js`:
```js
export const JUMP_TIME = 0.6;
export const SLIDE_TIME = 0.6;
export const STUMBLE_GRACE = 1.0;

export class Player {
  constructor() { this.reset(); }

  reset() {
    this.lane = 1;
    this.visualLane = 1;
    this.jumpT = 0;
    this.slideT = 0;
    this.graceT = 0;
  }

  moveLeft() { this.lane = Math.max(0, this.lane - 1); }
  moveRight() { this.lane = Math.min(2, this.lane + 1); }

  jump() {
    if (this.jumpT <= 0) { this.jumpT = JUMP_TIME; this.slideT = 0; }
  }

  slide() {
    if (this.slideT <= 0) { this.slideT = SLIDE_TIME; this.jumpT = 0; }
  }

  stumble() { this.graceT = STUMBLE_GRACE; }

  update(dt) {
    this.jumpT = Math.max(0, this.jumpT - dt);
    this.slideT = Math.max(0, this.slideT - dt);
    this.graceT = Math.max(0, this.graceT - dt);
    this.visualLane += (this.lane - this.visualLane) * Math.min(1, dt * 14);
  }

  get airborne() { return this.jumpT > 0; }
  get sliding() { return this.slideT > 0; }

  get jumpHeight() {
    if (this.jumpT <= 0) return 0;
    return Math.sin((1 - this.jumpT / JUMP_TIME) * Math.PI);
  }
}
```

`src/collision.js`:
```js
export const HIT_DEPTH = 1.2;

const sameLane = (a, b) => Math.abs(a - b) < 0.5;
const inDepth = (z) => Math.abs(z) < HIT_DEPTH;

function cleared(player, item) {
  if (item.kind === 'low') return player.airborne;
  if (item.kind === 'high') return player.sliding;
  return false;
}

export function hitsObstacle(player, item) {
  return item.cat === 'obstacle' && !item.dead && inDepth(item.z)
    && sameLane(player.lane, item.lane) && !cleared(player, item);
}

export function collectsPickup(player, item) {
  return item.cat === 'pickup' && !item.dead && inDepth(item.z)
    && sameLane(player.lane, item.lane);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all tests pass (camera, player, collision).

---

### Task 3: Chaser and power-ups

**Files:**
- Create: `src/chaser.js`, `src/powerups.js`
- Test: `tests/chaser.test.js`, `tests/powerups.test.js`

**Interfaces:**
- Produces: `Chaser` with `gap`, getter `close`, `stumble() -> 'closing'|'caught'`, `push(n)`, `update(dt)`, `reset()`. Constants `MAX_GAP` (8), `CLOSE_GAP` (5).
- Produces: `PowerUps(rng)` with `meter` (0..100), `banked` (`'meme'|'wifi'|'shield'|null`), `memeT`, `shieldT`; `addWitness()`, `use() -> kind|null` (wifi is passive, returns null), `consumeRevive() -> bool`, `update(dt)`, `reset()`; getters `memeActive`, `shieldActive`. Constant `KINDS = ['meme','wifi','shield']`.

- [ ] **Step 1: Write the failing tests**

`tests/chaser.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { Chaser, MAX_GAP } from '../src/chaser.js';

test('starts at max gap and not close', () => {
  const c = new Chaser();
  assert.equal(c.gap, MAX_GAP);
  assert.ok(!c.close);
});

test('first stumble closes in, second while close catches', () => {
  const c = new Chaser();
  assert.equal(c.stumble(), 'closing');
  assert.ok(c.close);
  assert.equal(c.stumble(), 'caught');
});

test('clean running recovers the gap, so a later stumble is a first one again', () => {
  const c = new Chaser();
  c.stumble();
  for (let i = 0; i < 60 * 10; i++) c.update(1 / 60);
  assert.ok(!c.close);
  assert.equal(c.stumble(), 'closing');
});

test('push is capped at max gap', () => {
  const c = new Chaser();
  c.push(100);
  assert.equal(c.gap, MAX_GAP);
});
```

`tests/powerups.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PowerUps } from '../src/powerups.js';

const fill = (p) => { for (let i = 0; i < 4; i++) p.addWitness(); };

test('four witness tokens bank a power-up and reset the meter', () => {
  const p = new PowerUps(() => 0);
  fill(p);
  assert.equal(p.banked, 'meme');
  assert.equal(p.meter, 0);
});

test('meme drop activates then expires', () => {
  const p = new PowerUps(() => 0);
  fill(p);
  assert.equal(p.use(), 'meme');
  assert.ok(p.memeActive && p.banked === null);
  p.update(4.1);
  assert.ok(!p.memeActive);
});

test('shield activates then expires', () => {
  const p = new PowerUps(() => 0.9);
  fill(p);
  assert.equal(p.banked, 'shield');
  assert.equal(p.use(), 'shield');
  assert.ok(p.shieldActive);
  p.update(5.1);
  assert.ok(!p.shieldActive);
});

test('wifi is passive: use does nothing, revive consumes it', () => {
  const p = new PowerUps(() => 0.5);
  fill(p);
  assert.equal(p.banked, 'wifi');
  assert.equal(p.use(), null);
  assert.equal(p.banked, 'wifi');
  assert.ok(p.consumeRevive());
  assert.equal(p.banked, null);
  assert.ok(!p.consumeRevive());
});

test('meter waits full while a power-up is banked', () => {
  const p = new PowerUps(() => 0);
  fill(p);
  fill(p);
  assert.equal(p.meter, 100);
  p.use();
  p.update(0.01);
  assert.ok(p.banked);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL, cannot find `chaser.js` / `powerups.js`

- [ ] **Step 3: Implement**

`src/chaser.js`:
```js
export const MAX_GAP = 8;
export const CLOSE_GAP = 5;
const CLOSE_TO = 3;
const RECOVER = 0.25;

export class Chaser {
  constructor() { this.gap = MAX_GAP; }
  get close() { return this.gap <= CLOSE_GAP; }

  stumble() {
    if (this.close) return 'caught';
    this.gap = CLOSE_TO;
    return 'closing';
  }

  push(n) { this.gap = Math.min(MAX_GAP, this.gap + n); }
  update(dt) { this.push(RECOVER * dt); }
  reset() { this.gap = MAX_GAP; }
}
```

`src/powerups.js`:
```js
export const KINDS = ['meme', 'wifi', 'shield'];
const DURATION = { meme: 4, shield: 5 };
const WITNESS_GAIN = 25;

export class PowerUps {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.meter = 0;
    this.banked = null;
    this.memeT = 0;
    this.shieldT = 0;
  }

  get memeActive() { return this.memeT > 0; }
  get shieldActive() { return this.shieldT > 0; }

  addWitness() {
    this.meter = Math.min(100, this.meter + WITNESS_GAIN);
    this.#bank();
  }

  #bank() {
    if (this.meter >= 100 && !this.banked) {
      this.banked = KINDS[Math.floor(this.rng() * KINDS.length)];
      this.meter = 0;
    }
  }

  use() {
    const kind = this.banked;
    if (kind === 'meme') this.memeT = DURATION.meme;
    else if (kind === 'shield') this.shieldT = DURATION.shield;
    else return null;
    this.banked = null;
    return kind;
  }

  consumeRevive() {
    if (this.banked !== 'wifi') return false;
    this.banked = null;
    return true;
  }

  update(dt) {
    this.memeT = Math.max(0, this.memeT - dt);
    this.shieldT = Math.max(0, this.shieldT - dt);
    this.#bank();
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all tests pass.

---

### Task 4: Stages and spawner

**Files:**
- Create: `src/stages.js`, `src/spawner.js`
- Test: `tests/stages.test.js`, `tests/spawner.test.js`, `tests/rng.js` (helper, not a test file)

**Interfaces:**
- Consumes: `Z_FAR` from `camera.js`.
- Produces: `STAGES[]` (`{id, name, boss, length, bossStart, bossLen, palette{sky[2],sun,building,ground,road,edge}, hazards{low[],high[],block[],gas[]}, slogans[]}`), `locate(distance) -> {stage, local, boss}`.
- Produces: `Spawner(rng)` with `items[]`, `update(dt, speed, stage, difficulty, memeActive)`, `spawnPattern(stage, difficulty)`, `reset()`. Items: `{cat, kind, label, lane, z, dead, drift?}`; pickup kinds `petition | witness | chai`.

- [ ] **Step 1: Write the failing tests**

`tests/rng.js`:
```js
export function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`tests/stages.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, locate } from '../src/stages.js';

test('stage 1 at start, no boss', () => {
  const l = locate(0);
  assert.equal(l.stage.id, 1);
  assert.equal(l.boss, false);
});

test('boss window at end of stage 1, then stage 2', () => {
  assert.equal(locate(2000).boss, true);
  assert.equal(locate(2399).stage.id, 1);
  assert.equal(locate(2400).stage.id, 2);
});

test('stage 2 is endless and has its own boss window', () => {
  assert.equal(locate(1e6).stage.id, 2);
  assert.equal(locate(2400 + 1600).boss, true);
  assert.equal(locate(2400 + 600).boss, false);
});

test('every stage defines hazards for all obstacle kinds and slogans', () => {
  for (const s of STAGES) {
    for (const k of ['low', 'high', 'block', 'gas']) assert.ok(s.hazards[k].length > 0, `${s.name} ${k}`);
    assert.ok(s.slogans.length >= 3);
  }
});
```

`tests/spawner.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { Spawner } from '../src/spawner.js';
import { STAGES } from '../src/stages.js';
import { Z_FAR } from '../src/camera.js';
import { mulberry32 } from './rng.js';

const stage = STAGES[0];

test('first update spawns a pattern at the horizon', () => {
  const s = new Spawner(mulberry32(1));
  s.update(1 / 60, 30, stage, 0, false);
  assert.ok(s.items.length > 0);
  assert.ok(s.items.every((it) => it.z <= Z_FAR + 13 && it.z > Z_FAR - 1));
});

test('items move toward the player and are culled once behind', () => {
  const s = new Spawner(mulberry32(2));
  s.update(1 / 60, 30, stage, 0, false);
  const z0 = s.items[0].z;
  s.update(1 / 60, 30, stage, 0, false);
  assert.ok(s.items.find((it) => it.z < z0));
  for (let i = 0; i < 60 * 30; i++) s.update(1 / 60, 30, stage, 0, false);
  assert.ok(s.items.every((it) => it.z > -6));
});

test('no pattern ever blocks a whole row with solid blocks', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = new Spawner(mulberry32(seed));
    for (let n = 0; n < 15; n++) {
      const before = s.items.length;
      s.spawnPattern(stage, n / 14);
      const rows = new Map();
      for (const it of s.items.slice(before)) {
        if (it.cat !== 'obstacle') continue;
        const key = it.z.toFixed(4);
        rows.set(key, [...(rows.get(key) ?? []), it]);
      }
      for (const row of rows.values()) {
        assert.ok(row.length <= 3);
        assert.ok(row.filter((it) => it.kind === 'block').length < 3, 'row of 3 blocks');
        if (row.length === 3) assert.ok(row.some((it) => it.kind !== 'block'));
      }
    }
  }
});

test('obstacle labels come from the stage hazards', () => {
  const s = new Spawner(mulberry32(3));
  for (let n = 0; n < 50; n++) s.spawnPattern(stage, 1);
  for (const it of s.items.filter((i) => i.cat === 'obstacle')) {
    assert.ok(stage.hazards[it.kind].includes(it.label), `${it.kind}:${it.label}`);
  }
});

test('gas drifts across lanes unless meme drop is active', () => {
  const s = new Spawner(() => 0.95);
  s.items.push({ cat: 'obstacle', kind: 'gas', label: 'tear gas', lane: 1, z: 50, dead: false, drift: 1.5 });
  s.cooldown = 1e9;
  s.update(0.1, 0, stage, 0, true);
  assert.equal(s.items[0].lane, 1);
  s.update(0.1, 0, stage, 0, false);
  assert.ok(s.items[0].lane > 1);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL, cannot find `stages.js` / `spawner.js`

- [ ] **Step 3: Implement**

`src/stages.js` (slogans are tone placeholders; swap in real ones from the user's refs):
```js
export const STAGES = [
  {
    id: 1,
    name: 'Paper Leak',
    boss: 'Exam Hall',
    length: 2400,
    bossStart: 2000,
    bossLen: 400,
    palette: {
      sky: ['#ff9a56', '#c0392b'], sun: '#ffd27a', building: '#4a2b45',
      ground: '#3a2f3d', road: '#4b4150', edge: '#f4d35e',
    },
    hazards: {
      low: ['barricade', 'rubble'],
      high: ['banner'],
      block: ['van', 'bus'],
      gas: ['tear gas'],
    },
    slogans: [
      'Resign already, I have to leave for Panvel tomorrow',
      'Paper leak hua, future leak mat karo',
      'Cockroaches never quit',
      'Chai piyo, sawal pucho',
      'Exam hall se aaya hu, ghar jaane do',
    ],
  },
  {
    id: 2,
    name: 'Voter Roll',
    boss: 'Election Bhawan',
    length: Infinity,
    bossStart: 1500,
    bossLen: 500,
    palette: {
      sky: ['#5b6bbf', '#2a1f4d'], sun: '#cfd8ff', building: '#1d1535',
      ground: '#251c3a', road: '#3a3350', edge: '#9bb1ff',
    },
    hazards: {
      low: ['barricade', 'metro gate'],
      high: ['banner'],
      block: ['van', 'water cannon', 'SIR form'],
      gas: ['tear gas'],
    },
    slogans: [
      'Name kata? Check kar',
      'Voter list mein hu ya nahi?',
      'SIR, ye form kaun bharega?',
      'Lockdown se lock nahi hoga sawal',
      'Ginti poori, awaaz poori',
    ],
  },
];

export function locate(distance) {
  let start = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const end = start + stage.length;
    if (distance < end || i === STAGES.length - 1) {
      const local = distance - start;
      return { stage, local, boss: local >= stage.bossStart && local < stage.bossStart + stage.bossLen };
    }
    start = end;
  }
}
```

`src/spawner.js`:
```js
import { Z_FAR } from './camera.js';

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export class Spawner {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.items = [];
    this.cooldown = 0;
  }

  update(dt, speed, stage, difficulty, memeActive) {
    const dz = speed * dt;
    for (const it of this.items) {
      it.z -= dz;
      if (it.drift && !memeActive) {
        it.lane += it.drift * dt;
        if (it.lane < 0 || it.lane > 2) {
          it.drift = -it.drift;
          it.lane = Math.max(0, Math.min(2, it.lane));
        }
      }
    }
    this.items = this.items.filter((it) => it.z > -6 && !it.dead);
    this.cooldown -= dz;
    if (this.cooldown <= 0) {
      this.spawnPattern(stage, difficulty);
      this.cooldown = 38 - 20 * difficulty;
    }
  }

  #add(stage, cat, kind, lane, dz, extra = {}) {
    const label = cat === 'obstacle' ? pick(this.rng, stage.hazards[kind]) : kind;
    this.items.push({ cat, kind, label, lane, z: Z_FAR + dz, dead: false, ...extra });
  }

  #coins(stage, lane, n, startDz) {
    for (let i = 0; i < n; i++) {
      const r = this.rng();
      const kind = i === 0 ? (r < 0.35 ? 'witness' : r < 0.45 ? 'chai' : 'petition') : 'petition';
      this.#add(stage, 'pickup', kind, lane, startDz + i * 3);
    }
  }

  spawnPattern(stage, difficulty) {
    const lanes = [0, 1, 2];
    const open = Math.floor(this.rng() * 3);
    const others = lanes.filter((l) => l !== open);
    const r = this.rng();
    if (r < 0.25) {
      for (const l of others) this.#add(stage, 'obstacle', 'block', l, 0);
      this.#coins(stage, open, 4, 0);
    } else if (r < 0.45) {
      for (const l of lanes) this.#add(stage, 'obstacle', 'low', l, 0);
      this.#coins(stage, 1, 3, 6);
    } else if (r < 0.65) {
      for (const l of lanes) this.#add(stage, 'obstacle', 'high', l, 0);
      this.#coins(stage, 1, 3, 6);
    } else if (r < 0.85) {
      this.#add(stage, 'obstacle', 'block', others[0], 0);
      this.#add(stage, 'obstacle', this.rng() < 0.5 ? 'low' : 'high', others[1], 0);
      this.#coins(stage, open, 4, 0);
    } else if (difficulty > 0.2) {
      const lane = Math.floor(this.rng() * 3);
      const drift = (this.rng() < 0.5 ? -1 : 1) * 1.5;
      this.#add(stage, 'obstacle', 'gas', lane, 0, { drift });
    } else {
      this.#coins(stage, open, 6, 0);
    }
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all tests pass.

---

### Task 5: Input helpers

**Files:**
- Create: `src/input.js`
- Test: `tests/input.test.js`

**Interfaces:**
- Produces: `keyIntent(code) -> string|null` (`left right jump slide power start mute`), `swipeIntent(dx, dy, threshold=30) -> string|null`, `SwipeTracker(threshold=30)` with `start(x, y)`, `move(x, y) -> intent|null` (fires at most once per gesture, as soon as the threshold is crossed), `end() -> 'tap'|null` (`'tap'` only if no swipe fired), `attachInput(target, onIntent)` where `onIntent` receives the intents above plus `'tap'`.

- [ ] **Step 1: Write the failing test** — `tests/input.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { keyIntent, swipeIntent, SwipeTracker } from '../src/input.js';

test('swipe fires once as soon as the threshold is crossed, not on release', () => {
  const t = new SwipeTracker(30);
  t.start(100, 100);
  assert.equal(t.move(110, 100), null);
  assert.equal(t.move(60, 102), 'left');
  assert.equal(t.move(0, 100), null);
  assert.equal(t.end(), null);
});

test('a touch without a swipe ends as a tap', () => {
  const t = new SwipeTracker(30);
  t.start(100, 100);
  t.move(105, 103);
  assert.equal(t.end(), 'tap');
  assert.equal(t.end(), null);
});

test('a new gesture can swipe again after the previous one', () => {
  const t = new SwipeTracker(30);
  t.start(0, 200); assert.equal(t.move(0, 150), 'jump'); t.end();
  t.start(0, 200); assert.equal(t.move(0, 250), 'slide');
});

test('keys map to intents', () => {
  assert.equal(keyIntent('ArrowLeft'), 'left');
  assert.equal(keyIntent('KeyD'), 'right');
  assert.equal(keyIntent('KeyW'), 'jump');
  assert.equal(keyIntent('ArrowDown'), 'slide');
  assert.equal(keyIntent('Space'), 'power');
  assert.equal(keyIntent('Enter'), 'start');
  assert.equal(keyIntent('KeyM'), 'mute');
  assert.equal(keyIntent('KeyQ'), null);
});

test('swipes use the dominant axis and a threshold', () => {
  assert.equal(swipeIntent(-60, 10), 'left');
  assert.equal(swipeIntent(60, -10), 'right');
  assert.equal(swipeIntent(5, -80), 'jump');
  assert.equal(swipeIntent(5, 80), 'slide');
  assert.equal(swipeIntent(10, 10), null);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL, cannot find `input.js`

- [ ] **Step 3: Implement** — `src/input.js`
```js
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump',
  ArrowDown: 'slide', KeyS: 'slide',
  Space: 'power', Enter: 'start', KeyM: 'mute',
};

export function keyIntent(code) {
  return KEYS[code] ?? null;
}

export function swipeIntent(dx, dy, threshold = 30) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < threshold) return null;
  if (ax > ay) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'jump' : 'slide';
}

export class SwipeTracker {
  constructor(threshold = 30) {
    this.threshold = threshold;
    this.origin = null;
    this.fired = false;
  }

  start(x, y) {
    this.origin = { x, y };
    this.fired = false;
  }

  move(x, y) {
    if (!this.origin || this.fired) return null;
    const intent = swipeIntent(x - this.origin.x, y - this.origin.y, this.threshold);
    if (intent) this.fired = true;
    return intent;
  }

  end() {
    if (!this.origin) return null;
    const tap = this.fired ? null : 'tap';
    this.origin = null;
    this.fired = false;
    return tap;
  }
}

export function attachInput(target, onIntent) {
  window.addEventListener('keydown', (e) => {
    const intent = keyIntent(e.code);
    if (!intent) return;
    e.preventDefault();
    if (!e.repeat) onIntent(intent);
  });

  const swipe = new SwipeTracker();
  target.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    swipe.start(t.clientX, t.clientY);
    onIntent('touch');
  }, { passive: false });
  target.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const intent = swipe.move(t.clientX, t.clientY);
    if (intent) onIntent(intent);
  }, { passive: false });
  target.addEventListener('touchend', (e) => {
    e.preventDefault();
    const tap = swipe.end();
    if (tap) onIntent(tap);
  }, { passive: false });
  target.addEventListener('touchcancel', () => swipe.end());
  target.addEventListener('mousedown', () => onIntent('tap'));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all tests pass.

---

### Task 6: Game state and tick

**Files:**
- Create: `src/game.js`
- Test: `tests/game.test.js`

**Interfaces:**
- Consumes: `Player`, `Chaser`, `PowerUps`, `Spawner`, `locate`, `hitsObstacle`, `collectsPickup`.
- Produces: `createGame(rng, hi) -> game`, `startRun(game)`, `applyIntent(game, intent)`, `step(game, dt)`, `BASE_SPEED` (30), `MAX_SPEED` (70). Game fields: `state ('menu'|'play'|'over'), player, chaser, powerups, spawner, distance, speed, slow, boostT, score, combo, mult, hi, popups[{text,t}], events[string], stage, boss, overT, t`. Event names pushed to `game.events`: `pickup stumble caught revive power`.

- [ ] **Step 1: Write the failing test** — `tests/game.test.js`
```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL, cannot find `game.js`

- [ ] **Step 3: Implement** — `src/game.js`
```js
import { Player } from './player.js';
import { Chaser } from './chaser.js';
import { PowerUps } from './powerups.js';
import { Spawner } from './spawner.js';
import { locate } from './stages.js';
import { hitsObstacle, collectsPickup } from './collision.js';

export const BASE_SPEED = 30;
export const MAX_SPEED = 70;

export function createGame(rng = Math.random, hi = 0) {
  return {
    rng,
    state: 'menu',
    player: new Player(),
    chaser: new Chaser(),
    powerups: new PowerUps(rng),
    spawner: new Spawner(rng),
    distance: 0, speed: BASE_SPEED, slow: 1, boostT: 0,
    score: 0, combo: 0, mult: 1, hi, touch: false,
    popups: [], events: [],
    stage: locate(0).stage, boss: false, overT: 0, t: 0,
  };
}

function popup(g, text) { g.popups.push({ text, t: 2.2 }); }
function emit(g, name) { g.events.push(name); }

export function startRun(g) {
  g.player.reset(); g.chaser.reset(); g.powerups.reset(); g.spawner.reset();
  Object.assign(g, {
    state: 'play', distance: 0, speed: BASE_SPEED, slow: 1, boostT: 0,
    score: 0, combo: 0, mult: 1, popups: [], boss: false, overT: 0,
  });
  g.stage = locate(0).stage;
  popup(g, `Stage ${g.stage.id}: ${g.stage.name}`);
}

export function applyIntent(g, intent) {
  if (g.state !== 'play') {
    const wantsStart = intent === 'start' || intent === 'tap' || intent === 'power';
    if (wantsStart && (g.state === 'menu' || g.overT > 0.8)) startRun(g);
    return;
  }
  switch (intent) {
    case 'left': g.player.moveLeft(); break;
    case 'right': g.player.moveRight(); break;
    case 'jump': g.player.jump(); break;
    case 'slide': g.player.slide(); break;
    case 'power':
    case 'tap': {
      const used = g.powerups.use();
      if (used) {
        emit(g, 'power');
        popup(g, used === 'meme' ? 'MEME DROP!' : 'CROWD SURGE!');
      }
      break;
    }
    default: break;
  }
}

function onStumble(g) {
  emit(g, 'stumble');
  g.combo = 0;
  g.mult = 1;
  g.slow = 0.6;
  g.player.stumble();
  if (g.chaser.stumble() === 'caught') {
    if (g.powerups.consumeRevive()) {
      g.chaser.reset();
      emit(g, 'revive');
      popup(g, 'WiFi revive! Back in the crowd');
    } else {
      g.state = 'over';
      g.overT = 0;
      g.hi = Math.max(g.hi, Math.floor(g.score));
      emit(g, 'caught');
    }
  }
}

function onPickup(g, it) {
  emit(g, 'pickup');
  g.combo += 1;
  g.mult = 1 + Math.min(4, Math.floor(g.combo / 10));
  g.chaser.push(0.5);
  if (it.kind === 'petition') g.score += 10 * g.mult;
  if (it.kind === 'witness') {
    g.score += 25 * g.mult;
    g.powerups.addWitness();
    popup(g, g.stage.slogans[Math.floor(g.rng() * g.stage.slogans.length)]);
  }
  if (it.kind === 'chai') {
    g.score += 25 * g.mult;
    g.boostT = 2;
    g.chaser.push(1);
    popup(g, 'Chai boost!');
  }
}

export function step(g, dt) {
  g.t += dt;
  g.popups = g.popups.map((p) => ({ ...p, t: p.t - dt })).filter((p) => p.t > 0);
  if (g.state === 'over') { g.overT += dt; return; }
  if (g.state !== 'play') return;

  const loc = locate(g.distance);
  if (loc.stage.id !== g.stage.id) {
    g.stage = loc.stage;
    popup(g, `Stage ${loc.stage.id}: ${loc.stage.name}`);
  }
  if (loc.boss && !g.boss) popup(g, `BOSS: ${loc.stage.boss}`);
  g.boss = loc.boss;

  const difficulty = Math.min(1, g.distance / 4000 + (loc.boss ? 0.3 : 0));
  g.speed = Math.min(MAX_SPEED, BASE_SPEED + g.distance * 0.012);
  g.slow = Math.min(1, g.slow + 0.4 * dt);
  g.boostT = Math.max(0, g.boostT - dt);
  const meme = g.powerups.memeActive;
  const worldSpeed = g.speed * g.slow * (meme ? 0.6 : 1) * (g.boostT > 0 ? 1.25 : 1);

  g.distance += worldSpeed * dt;
  g.score += worldSpeed * dt * 0.1;
  g.player.update(dt);
  g.powerups.update(dt);
  g.chaser.update(dt);
  if (meme) g.chaser.push(2 * dt);
  g.spawner.update(dt, worldSpeed, loc.stage, difficulty, meme);

  for (const it of g.spawner.items) {
    if (collectsPickup(g.player, it)) {
      it.dead = true;
      onPickup(g, it);
    } else if (g.powerups.shieldActive && hitsObstacle(g.player, it)) {
      it.dead = true;
      g.score += 5;
    } else if (g.player.graceT <= 0 && hitsObstacle(g.player, it)) {
      it.dead = true;
      onStumble(g);
      if (g.state === 'over') return;
    }
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all tests pass. If "an idle player is eventually detained" fails, raise its run time before changing game rules.

---

### Task 7: Renderer

**Files:**
- Create: `src/render.js`
- Test: `tests/render.test.js` (smoke test with a no-op canvas context, catches runtime errors in every state)

**Interfaces:**
- Consumes: a `game` from `createGame` (all fields from Task 6), `project`, `Z_FAR`, `MAX_GAP`.
- Produces: `drawFrame(ctx, w, h, game)`; draws menu, play and over states.

- [ ] **Step 1: Write the failing smoke test** — `tests/render.test.js`
```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL, cannot find `render.js`

- [ ] **Step 3: Implement** — `src/render.js`
```js
import { project, Z_FAR } from './camera.js';
import { MAX_GAP } from './chaser.js';

const FONT = '"Permanent Marker","Marker Felt","Comic Sans MS",cursive';
const EMOJI = {
  barricade: '🚧', rubble: '🪨', van: '🚐', bus: '🚌', 'water cannon': '🚒',
  'SIR form': '📄', 'metro gate': '🚪', 'tear gas': '☁️',
  petition: '📜', witness: '📱', chai: '☕',
};
const BANKED_ICON = { meme: '😂', wifi: '📶', shield: '🛡️' };
const PROP_SPACING = 14;
const SAFE_BOTTOM = 24;
const SKYLINE = Array.from({ length: 26 }, (_, i) => ({
  x: i * 0.058, w: 0.05, h: 0.05 + (((i * 37) % 11) / 11) * 0.13,
}));

function emoji(ctx, ch, x, y, size) {
  ctx.font = `${Math.max(4, size)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#000';
  ctx.fillText(ch, x, y);
}

function text(ctx, s, x, y, size, color = '#fff', align = 'center', base = 'top') {
  ctx.font = `${Math.max(4, size)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.lineWidth = Math.max(1, size / 7);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function wrap(ctx, s, maxW) {
  const lines = [];
  let line = '';
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawSky(ctx, w, h, pal, distance) {
  const hy = h * 0.36;
  const grad = ctx.createLinearGradient(0, 0, 0, hy);
  grad.addColorStop(0, pal.sky[0]);
  grad.addColorStop(1, pal.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, hy + 1);
  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(w * 0.72, hy * 0.7, hy * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.building;
  for (const b of SKYLINE) {
    const x = (((b.x - distance * 0.0002) % 1.5) + 1.5) % 1.5 - 0.2;
    ctx.fillRect(x * w, hy - b.h * h, b.w * w, b.h * h + 1);
  }
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, hy, w, h - hy);
}

function poly(ctx, pts, fill) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawRoad(ctx, w, h, pal, distance) {
  const pts = [-0.5, 2.5].flatMap((lane) => [project(lane, Z_FAR, w, h), project(lane, -2, w, h)]);
  poly(ctx, [pts[0], pts[2], pts[3], pts[1]], pal.road);
  ctx.strokeStyle = pal.edge;
  for (const lane of [-0.5, 2.5]) {
    const a = project(lane, Z_FAR, w, h);
    const b = project(lane, -2, w, h);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  for (const lane of [0.5, 1.5]) {
    for (let z = -(distance % 10); z < Z_FAR; z += 10) {
      const a = project(lane, Math.max(z, -2), w, h);
      const b = project(lane, Math.min(z + 5, Z_FAR), w, h);
      ctx.lineWidth = Math.max(1, 6 * a.scale);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
}

function drawProp(ctx, w, h, u, g, d) {
  const p = project(d.side ? 3.1 : -1.1, d.z, w, h);
  const pw = 150 * u * p.scale;
  const ph = 100 * u * p.scale;
  const x = p.x - pw / 2;
  const y = p.y - ph * 1.6;
  ctx.strokeStyle = '#5b4636';
  ctx.lineWidth = Math.max(1, 5 * u * p.scale);
  ctx.beginPath(); ctx.moveTo(p.x, y + ph); ctx.lineTo(p.x, p.y); ctx.stroke();
  ctx.fillStyle = d.idx % 2 ? '#d9b382' : '#f5f1e6';
  ctx.fillRect(x, y, pw, ph);
  if (p.scale < 0.3) return;
  const slogans = g.stage.slogans;
  const size = 15 * u * p.scale;
  ctx.font = `${size}px ${FONT}`;
  const lines = wrap(ctx, slogans[d.idx % slogans.length], pw * 0.9).slice(0, 4);
  lines.forEach((ln, i) => text(ctx, ln, p.x, y + ph * 0.1 + i * size * 1.15, size, '#222', 'center', 'top'));
}

function drawItem(ctx, w, h, u, g, it) {
  const p = project(it.lane, it.z, w, h);
  ctx.globalAlpha = Math.max(0, Math.min(1, it.z > 80 ? (100 - it.z) / 20 : 1));
  const s = p.scale * u;
  if (it.kind === 'high') {
    const bw = 170 * s;
    const bh = 40 * s;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(p.x - bw / 2, p.y - 190 * s, bw, bh);
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(p.x - bw / 2 - 4 * s, p.y - 190 * s, 4 * s, 190 * s);
    ctx.fillRect(p.x + bw / 2, p.y - 190 * s, 4 * s, 190 * s);
    if (p.scale > 0.3) text(ctx, 'ORDER ORDER', p.x, p.y - 190 * s + bh * 0.2, 18 * s, '#fff');
  } else if (it.cat === 'pickup') {
    const bob = Math.sin(g.t * 6 + it.z) * 6 * s;
    emoji(ctx, EMOJI[it.label], p.x, p.y - 30 * s + bob, 64 * s);
  } else {
    const size = it.kind === 'block' ? 150 : it.kind === 'gas' ? 170 : 90;
    emoji(ctx, EMOJI[it.label] || '🚧', p.x, p.y, size * s);
  }
  ctx.globalAlpha = 1;
}

function drawScene(ctx, w, h, u, g) {
  const list = [];
  const base = Math.floor(g.distance / PROP_SPACING);
  const off = g.distance % PROP_SPACING;
  for (let k = 0; k <= Math.ceil(Z_FAR / PROP_SPACING); k++) {
    const z = k * PROP_SPACING - off;
    if (z < -2 || z > Z_FAR) continue;
    for (const side of [0, 1]) list.push({ z, prop: true, side, idx: base + k + side * 3 });
  }
  for (const it of g.spawner.items) list.push({ z: it.z, it });
  list.sort((a, b) => b.z - a.z);
  for (const d of list) {
    if (d.prop) drawProp(ctx, w, h, u, g, d);
    else drawItem(ctx, w, h, u, g, d.it);
  }
}

function drawPlayer(ctx, w, h, u, g) {
  const pl = g.player;
  const p = project(pl.visualLane, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 45 * u, 12 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(p.x, p.y - pl.jumpHeight * 110 * u);
  if (pl.sliding) ctx.scale(1, 0.55);
  if (pl.graceT > 0 && Math.floor(g.t * 20) % 2) ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(-30 * u, -70 * u); ctx.lineTo(30 * u, -70 * u); ctx.lineTo(0, -8 * u);
  ctx.closePath();
  ctx.fill();
  emoji(ctx, '🪳', 0, 0, 100 * u);
  if (g.powerups.shieldActive) {
    ctx.strokeStyle = 'rgba(120,220,255,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -45 * u, 70 * u, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawInspector(ctx, w, h, u, g) {
  const c = 1 - g.chaser.gap / MAX_GAP;
  const p = project(g.player.visualLane, 0, w, h);
  const size = (110 + 90 * c) * u;
  const x = p.x + Math.sin(g.t * 8) * 6 * u;
  const y = h * (1.12 - 0.2 * c);
  emoji(ctx, '👮', x, y, size);
  ctx.strokeStyle = '#6b3d1a';
  ctx.lineWidth = 8 * u;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.3, y - size * 0.5);
  ctx.lineTo(x + size * 0.55 + Math.sin(g.t * 10) * 12 * u, y - size * 0.95);
  ctx.stroke();
}

function bar(ctx, x, y, bw, bh, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, bw * Math.max(0, Math.min(1, frac)), bh);
}

function drawHud(ctx, w, h, u, g) {
  const fs = 22 * u;
  text(ctx, `Score ${Math.floor(g.score)}`, 14, 12, fs, '#fff', 'left');
  text(ctx, `Best ${Math.floor(g.hi)}`, w - 14, 12, fs, '#ffd27a', 'right');
  text(ctx, `Stage ${g.stage.id}: ${g.stage.name}`, w / 2, 12, fs * 0.9, '#fff');
  if (g.mult > 1) text(ctx, `x${g.mult}`, 14, 12 + fs * 1.3, fs, '#7CFC9A', 'left');

  const bw = 150 * u;
  const bh = 10 * u;
  const by = h - SAFE_BOTTOM - bh;
  text(ctx, 'INSPECTOR', 14, by - 20 * u, 12 * u, '#fff', 'left');
  bar(ctx, 14, by, bw, bh, 1 - g.chaser.gap / MAX_GAP, '#e74c3c');
  text(ctx, 'WITNESS', w - 14 - bw, by - 20 * u, 12 * u, '#fff', 'left');
  bar(ctx, w - 14 - bw, by, bw, bh, g.powerups.meter / 100, '#4fc3f7');
  if (g.powerups.banked) {
    text(ctx, BANKED_ICON[g.powerups.banked], w - 14, by - 64 * u, 34 * u, '#fff', 'right');
    if (g.touch) text(ctx, 'TAP', w - 14, by - 26 * u - 38 * u, 12 * u, '#ffd27a', 'right');
  }

  g.popups.forEach((p, i) => {
    ctx.globalAlpha = Math.min(1, p.t);
    text(ctx, p.text, w / 2, h * 0.22 + i * fs * 1.5, fs * 1.1, '#fff');
  });
  ctx.globalAlpha = 1;
  if (g.boss) {
    const pulse = 1 + Math.sin(g.t * 8) * 0.06;
    text(ctx, `BOSS: ${g.stage.boss}`, w / 2, h * 0.12, fs * 1.4 * pulse, '#ff6b6b');
  }
}

function overlay(ctx, w, h, u, lines) {
  ctx.fillStyle = 'rgba(10,5,20,0.65)';
  ctx.fillRect(0, 0, w, h);
  let y = h * 0.3;
  for (const [s, size, color] of lines) {
    text(ctx, s, w / 2, y, size * u, color);
    y += size * u * 1.5;
  }
}

export function drawFrame(ctx, w, h, g) {
  const u = Math.min(w / 500, h / 700);
  const pal = g.stage.palette;
  drawSky(ctx, w, h, pal, g.distance);
  drawRoad(ctx, w, h, pal, g.distance);
  drawScene(ctx, w, h, u, g);
  drawPlayer(ctx, w, h, u, g);
  drawInspector(ctx, w, h, u, g);
  drawHud(ctx, w, h, u, g);
  if (g.state === 'menu') {
    overlay(ctx, w, h, u, [
      ['DELHI RUNNER', 54, '#ffd27a'],
      ['Cockroach Janta Party edition (fan satire)', 20, '#fff'],
      g.touch
        ? ['Swipe left/right to change lane,', 16, '#ddd']
        : ['Arrows / WASD to run. Space for power-ups.', 16, '#ddd'],
      g.touch
        ? ['up to jump, down to slide. Tap = power-up.', 16, '#ddd']
        : ['Up jumps, down slides.', 16, '#ddd'],
      ['Dodge the inspector. Collect witnesses.', 16, '#ddd'],
      [g.touch ? 'Tap to start' : 'Tap or press Enter to start', 26, '#7CFC9A'],
    ]);
  } else if (g.state === 'over') {
    overlay(ctx, w, h, u, [
      ['DETAINED!', 54, '#ff6b6b'],
      [`Score ${Math.floor(g.score)}   Best ${Math.floor(g.hi)}`, 26, '#fff'],
      [g.touch ? 'Tap to run again' : 'Tap or press Enter to run again', 24, '#7CFC9A'],
    ]);
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all tests pass, including the render smoke test.

---

### Task 8: Audio and main loop

**Files:**
- Create: `src/audio.js`, `src/main.js`

**Interfaces:**
- Consumes: `createGame, applyIntent, step`, `drawFrame`, `attachInput`.
- Produces: `initAudio()`, `sfx(name)` (`pickup stumble caught revive power`), `toggleMute() -> bool`. `main.js` is the browser entry.

- [ ] **Step 1: Write `src/audio.js`**
```js
let ctx = null;
let muted = false;
let step = 0;

const SCALE = [0, 3, 5, 7, 10];
const MELODY = [5, 7, 6, 5, 4, 2, 3, 4, 5, 7, 8, 7, 6, 4, 5, 3];
const freqOf = (deg) => 220 * 2 ** ((SCALE[deg % 5] + 12 * Math.floor(deg / 5)) / 12);

function tone(freq, dur, type = 'square', vol = 0.04, delay = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function tick() {
  tone(freqOf(MELODY[step % MELODY.length]), 0.16, 'square', 0.025);
  if (step % 4 === 0) tone(110, 0.3, 'triangle', 0.05);
  step += 1;
}

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    setInterval(tick, 200);
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function sfx(name) {
  switch (name) {
    case 'pickup': tone(880, 0.08); tone(1320, 0.1, 'square', 0.04, 0.06); break;
    case 'stumble': tone(140, 0.25, 'sawtooth', 0.07); break;
    case 'caught': [440, 330, 220, 110].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.06, i * 0.15)); break;
    case 'revive': [330, 440, 660, 880].forEach((f, i) => tone(f, 0.15, 'square', 0.05, i * 0.08)); break;
    case 'power': [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, i * 0.07)); break;
    default: break;
  }
}
```

- [ ] **Step 2: Write `src/main.js`**
```js
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
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!document.hidden) acc += dt;
  while (acc >= STEP) { step(game, STEP); acc -= STEP; }
  drainEvents();
  drawFrame(ctx, w, h, game);
  requestAnimationFrame(frame);
}

(document.fonts?.load(`20px "Permanent Marker"`) ?? Promise.resolve())
  .catch(() => {})
  .finally(() => requestAnimationFrame(frame));
```

- [ ] **Step 3: Syntax-check the browser-only files**

Run: `node --check src/audio.js && node --check src/main.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all tests pass, 0 failures.

- [ ] **Step 5: Manual play-test**

Run: `npm start`, then open http://localhost:8000.
Checklist:
- On a phone (same Wi-Fi, open `http://<laptop-ip>:8000`) or Chrome DevTools device mode at 390x844: no page scroll, zoom or pull-to-refresh; swipes respond the moment the finger moves; a plain tap starts the game and uses power-ups; touch instructions show; HUD bars clear the bottom edge; phone vibrates on stumble.
- Menu shows; Enter or click starts; first input enables music.
- Arrows/WASD change lane, jump, slide; on a phone, swipes work.
- Jumping clears barricades/rubble; sliding clears banners; vans/buses/SIR forms need a lane change.
- Hitting something makes the inspector peek in; a second hit while he is close shows DETAINED!.
- Witness pickups show a slogan popup and fill the WITNESS bar; Space/tap uses the banked power-up; a banked WiFi icon saves you once.
- At distance ~2000 the BOSS banner shows; at 2400 the palette and slogans switch to Stage 2.
- Best score survives a page reload; M mutes.

Report any feel problems (speed ramp, hit window, spawn density). The constants to tune are `BASE_SPEED/MAX_SPEED` in `src/game.js`, `HIT_DEPTH` in `src/collision.js`, and the cooldown formula in `src/spawner.js`.

---

## Self-review

- **Spec coverage:** controls, perspective, speed/score/combo, lathi-inspector chaser (two-stumble rule), all obstacle kinds, collectibles, three power-ups, two stages with boss windows and palettes, original audio, high score, fixed timestep, muted-audio fallback, tests for pure logic, manual play-test: all mapped to Tasks 1–8. Real-slogan swap-in is flagged in the `stages.js` task.
- **Placeholders:** none; every code step has complete code.
- **Type consistency:** `Player` fields/getters, `Chaser.stumble()` return strings, `PowerUps` method names, item shape `{cat, kind, label, lane, z, dead, drift?}`, and event names (`pickup stumble caught revive power`) match across `game.js`, `render.js`, `audio.js` and `main.js`.
