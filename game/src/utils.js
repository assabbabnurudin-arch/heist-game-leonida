// Small math and line-of-sight helpers shared by the player, guards, cameras
// and the renderer. All positions are in pixels; tiles are TILE px wide.

import { TILE } from './levels.js';

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// A random number in [lo, hi): for camera sweep phases and other variety.
export function randomInRange(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Angle from (ax, ay) to (bx, by), in radians.
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest absolute difference between two angles, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Is the tile at (tx, ty) a wall?
export function isWall(walls, tx, ty) {
  return walls.has(`${tx},${ty}`);
}

// Is the pixel point (x, y) inside a wall tile?
export function pointInWall(walls, x, y) {
  return isWall(walls, Math.floor(x / TILE), Math.floor(y / TILE));
}

// Line of sight: sample along the segment and report false if any sample
// lands inside a wall tile. Cheap and good enough for vision cones.
export function hasLineOfSight(walls, ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by);
  const steps = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInWall(walls, ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
  }
  return true;
}

// Distance from (ox, oy) along `angle` until a wall is hit (or maxRange).
export function raycastWall(walls, ox, oy, angle, maxRange) {
  const step = 6;
  for (let d = step; d <= maxRange; d += step) {
    const x = ox + Math.cos(angle) * d;
    const y = oy + Math.sin(angle) * d;
    if (pointInWall(walls, x, y)) return d - step;
  }
  return maxRange;
}

// Move a circle (radius r) by (dx, dy) with axis-separated wall sliding:
// try the full move, then each axis alone, so the circle slides along walls.
export function moveCircle(walls, pos, dx, dy, r) {
  const tryMove = (nx, ny) => {
    const corners = [
      [nx - r, ny - r], [nx + r, ny - r],
      [nx - r, ny + r], [nx + r, ny + r],
      [nx, ny - r], [nx, ny + r], [nx - r, ny], [nx + r, ny],
    ];
    return corners.every(([x, y]) => !pointInWall(walls, x, y));
  };
  if (tryMove(pos.x + dx, pos.y + dy)) { pos.x += dx; pos.y += dy; return; }
  if (tryMove(pos.x + dx, pos.y)) { pos.x += dx; return; }
  if (tryMove(pos.x, pos.y + dy)) { pos.y += dy; }
}
