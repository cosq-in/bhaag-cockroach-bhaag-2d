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
    this.lastOpen = undefined;
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
      this.cooldown = Math.max(speed, 10) * Math.max(0.7, 1.3 - 0.6 * difficulty);
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
    const choices = this.lastOpen === undefined ? lanes : lanes.filter((l) => Math.abs(l - this.lastOpen) <= 1);
    const open = choices[Math.floor(this.rng() * choices.length)];
    const others = lanes.filter((l) => l !== open);
    const r = this.rng();
    if (r < 0.25) {
      for (const l of others) this.#add(stage, 'obstacle', 'block', l, 0);
      this.lastOpen = open;
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
      this.lastOpen = open;
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
