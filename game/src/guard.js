// Guards: patrol waypoints, vision cones, suspicion and the alarm chase.
// A guard is calm on patrol, suspicious while it can see the thief, and
// hunting once the alarm is raised. Detection is fair: sneaking, distance
// and walls all matter, and the meter drains when the thief breaks sight.

import { TILE } from './levels.js';
import { angleDiff, angleTo, clamp, dist, hasLineOfSight, moveCircle } from './utils.js';

export const GUARD_RADIUS = 13;

export function createGuard(def) {
  const wps = def.waypoints.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
  return {
    waypoints: wps,
    waypointIndex: 0,
    x: wps[0].x,
    y: wps[0].y,
    facing: 0,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    state: 'patrol', // patrol | suspicious | investigate | chase
    pauseTimer: 0,
    investigateTarget: null,
    investigateTimer: 0,
    lastSeen: null,
    // 0..1 suspicion contributed by this guard; the game sums them.
    suspicion: 0,
  };
}

// Can this guard see the thief right now? Inside the cone, in range, and
// with a clear line of sight.
export function guardCanSee(guard, player) {
  const d = dist(guard.x, guard.y, player.x, player.y);
  if (d > guard.range) return false;
  if (angleDiff(angleTo(guard.x, guard.y, player.x, player.y), guard.facing) > guard.halfAngle) return false;
  return true;
}

// How fast suspicion grows while seen: closer is worse, running is worse,
// sneaking is safer. Returns a per-second rate.
function detectionRate(guard, player, walls) {
  const d = dist(guard.x, guard.y, player.x, player.y);
  let rate = 1.15 - (d / guard.range) * 0.55; // 0.6..1.15 per second
  if (player.moving && !player.sneaking) rate *= 1.45;
  if (player.sneaking) rate *= 0.55;
  if (!hasLineOfSight(walls, guard.x, guard.y, player.x, player.y)) return 0;
  return rate;
}

export function updateGuard(guard, player, walls, dt, alarm) {
  const sees = guardCanSee(guard, player) && detectionRate(guard, player, walls) > 0;
  if (sees) {
    guard.suspicion = clamp(guard.suspicion + detectionRate(guard, player, walls) * dt, 0, 1);
    guard.state = guard.suspicion > 0.55 ? 'suspicious' : guard.state === 'patrol' ? 'suspicious' : guard.state;
    // Remember where the thief was last seen: if sight is lost, the guard
    // walks over to check that spot instead of instantly forgetting.
    if (guard.suspicion > 0.5) guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.suspicion = clamp(guard.suspicion - dt * 0.35, 0, 1);
    if (guard.state === 'suspicious' && guard.suspicion <= 0.05) {
      guard.state = 'patrol';
      if (guard.lastSeen) {
        guard.investigateTarget = guard.lastSeen;
        guard.investigateTimer = 2.5;
        guard.lastSeen = null;
      }
    }
  }

  if (alarm) {
    // Alarm: converge on the thief, faster than patrol.
    guard.state = 'chase';
    const a = angleTo(guard.x, guard.y, player.x, player.y);
    guard.facing = a;
    const sp = guard.speed * 1.55;
    moveCircle(walls, guard, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, GUARD_RADIUS);
    return;
  }

  if (guard.investigateTarget) {
    guard.state = 'investigate';
    const t = guard.investigateTarget;
    const d = dist(guard.x, guard.y, t.x, t.y);
    if (d < 14) {
      guard.investigateTimer -= dt;
      guard.facing += dt * 2.2; // look around, puzzled
      if (guard.investigateTimer <= 0) {
        guard.investigateTarget = null;
        guard.state = 'patrol';
      }
    } else {
      const a = angleTo(guard.x, guard.y, t.x, t.y);
      guard.facing = a;
      moveCircle(walls, guard, Math.cos(a) * guard.speed * dt, Math.sin(a) * guard.speed * dt, GUARD_RADIUS);
    }
    return;
  }

  // Patrol: walk to the next waypoint, pause and look around at each one.
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    guard.facing += Math.sin(performance.now() / 500 + guard.x) * dt * 0.4;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const d = dist(guard.x, guard.y, target.x, target.y);
  if (d < 8) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseTimer = 0.9;
    return;
  }
  const a = angleTo(guard.x, guard.y, target.x, target.y);
  guard.facing = a;
  moveCircle(walls, guard, Math.cos(a) * guard.speed * dt, Math.sin(a) * guard.speed * dt, GUARD_RADIUS);
}

// Send a guard to investigate a noise (a thrown coin).
export function sendGuardToInvestigate(guard, x, y) {
  if (guard.state === 'chase') return;
  guard.investigateTarget = { x, y };
  guard.investigateTimer = 3.5;
}
