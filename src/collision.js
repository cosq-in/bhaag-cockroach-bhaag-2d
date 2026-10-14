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
