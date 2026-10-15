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
  const fs = Math.max(16, 22 * u);
  text(ctx, `Score ${Math.floor(g.score)}`, 14, 12, fs, '#fff', 'left');
  text(ctx, `Best ${Math.floor(g.hi)}`, w - 14, 12, fs, '#ffd27a', 'right');
  const row2 = 12 + fs * 1.3;
  text(ctx, `Stage ${g.stage.id}: ${g.stage.name}`, w / 2, row2, fs * 0.9, '#fff');
  if (g.mult > 1) text(ctx, `x${g.mult}`, 14, row2, fs, '#7CFC9A', 'left');

  const bw = 150 * u;
  const bh = 10 * u;
  const by = h - SAFE_BOTTOM - bh;
  const lab = Math.max(12, 12 * u);
  text(ctx, 'INSPECTOR', 14, by - 20 * u, lab, '#fff', 'left');
  bar(ctx, 14, by, bw, bh, 1 - g.chaser.gap / MAX_GAP, '#e74c3c');
  text(ctx, 'WITNESS', w - 14 - bw, by - 20 * u, lab, '#fff', 'left');
  bar(ctx, w - 14 - bw, by, bw, bh, g.powerups.meter / 100, '#4fc3f7');
  if (g.powerups.banked) {
    const iconSize = 34 * u;
    const iconY = by - 64 * u;
    text(ctx, BANKED_ICON[g.powerups.banked], w - 14, iconY, iconSize, '#fff', 'right');
    if (g.touch) text(ctx, 'TAP', w - 14, iconY + iconSize * 1.2, lab, '#ffd27a', 'right');
  }

  let py = h * 0.22;
  const psize = fs * 1.1;
  for (const p of g.popups) {
    ctx.globalAlpha = Math.min(1, p.t);
    ctx.font = `${Math.max(4, psize)}px ${FONT}`;
    for (const ln of wrap(ctx, p.text, w - 32)) {
      text(ctx, ln, w / 2, py, psize, '#fff');
      py += psize * 1.3;
    }
    py += psize * 0.3;
  }
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
  for (const [s, size, color, min = 4] of lines) {
    const px = Math.max(min, size * u);
    ctx.font = `${px}px ${FONT}`;
    const parts = ctx.measureText(s).width > w - 24 ? wrap(ctx, s, w - 24) : [s];
    for (const part of parts) {
      text(ctx, part, w / 2, y, px, color);
      y += px * 1.5;
    }
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
      ['BHAAG COCKROACH BHAAG', 44, '#ffd27a'],
      ['Resign kar yaar.', 22, '#ff9f6b'],
      ['Cockroach Janta Party edition (fan satire)', 20, '#fff'],
      g.touch
        ? ['Swipe left/right to change lane,', 16, '#ddd', 14]
        : ['Arrows / WASD to run. Space for power-ups.', 16, '#ddd', 14],
      g.touch
        ? ['up to jump, down to slide. Tap = power-up.', 16, '#ddd', 14]
        : ['Up jumps, down slides.', 16, '#ddd', 14],
      ['Dodge the inspector. Collect witnesses.', 16, '#ddd', 14],
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
