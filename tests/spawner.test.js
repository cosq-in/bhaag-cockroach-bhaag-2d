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
