// The thief: movement, sneaking, loot grabs and the coin-toss distraction.
// The player knows the walls and the input; the game owns loot and scoring.

import { TILE } from './levels.js';
import { clamp, moveCircle } from './utils.js';

export const PLAYER_RADIUS = 13;
export const WALK_SPEED = 150;
export const SNEAK_SPEED = 78;
export const GRAB_RANGE = 34;

export function createPlayer(startTile) {
  return {
    x: startTile.x * TILE,
    y: startTile.y * TILE,
    facing: 0, // radians; where the thief is looking (last move direction)
    sneaking: false,
    moving: false,
    coins: 0,
    // A thrown coin: { x, y, ttl } — guards walk to it while it rings.
    coin: null,
    coinCooldown: 0,
  };
}

export function updatePlayer(player, input, walls, dt, width, height) {
  const mv = input.moveVector();
  player.moving = mv.x !== 0 || mv.y !== 0;
  player.sneaking = input.isSneaking();
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  if (player.moving) {
    player.facing = Math.atan2(mv.y, mv.x);
    moveCircle(walls, player, mv.x * speed * dt, mv.y * speed * dt, PLAYER_RADIUS);
  }
  player.x = clamp(player.x, PLAYER_RADIUS, width - PLAYER_RADIUS);
  player.y = clamp(player.y, PLAYER_RADIUS, height - PLAYER_RADIUS);
  if (player.coinCooldown > 0) player.coinCooldown -= dt;
  if (player.coin) {
    player.coin.ttl -= dt;
    if (player.coin.ttl <= 0) player.coin = null;
  }
}

// Throw a coin toward (tx, ty) in world pixels. Returns true if thrown.
// The landing spot is clamped inside the building so a click on the wall
// never sends the coin (or the guards) out of bounds.
export function throwCoin(player, tx, ty, width, height) {
  if (player.coins <= 0 || player.coinCooldown > 0) return false;
  player.coins -= 1;
  player.coinCooldown = 0.6;
  const d = Math.hypot(tx - player.x, ty - player.y) || 1;
  const range = Math.min(d, 150);
  player.coin = {
    x: clamp(player.x + ((tx - player.x) / d) * range, 20, width - 20),
    y: clamp(player.y + ((ty - player.y) / d) * range, 20, height - 20),
    ttl: 5,
  };
  return true;
}

// Nearest un-grabbed loot within grab range, or null.
export function nearestLoot(player, loot) {
  let best = null;
  let bestD = GRAB_RANGE;
  for (const item of loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - player.x, item.y - player.y);
    if (d < bestD) { best = item; bestD = d; }
  }
  return best;
}
