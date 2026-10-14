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
