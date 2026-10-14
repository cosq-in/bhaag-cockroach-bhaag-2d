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
