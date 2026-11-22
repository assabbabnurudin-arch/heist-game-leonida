// Security cameras: fixed mounts that sweep a vision cone back and forth.
// A camera that catches the thief raises suspicion faster than a guard does,
// but cameras never move — learn the sweep and slip past.

import { TILE } from './levels.js';
import { angleDiff, angleTo, clamp, dist, hasLineOfSight, randomInRange } from './utils.js';

export function createCamera(def) {
  return {
    x: (def.x + 0.5) * TILE,
    y: (def.y + 0.5) * TILE,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    phase: randomInRange(0, Math.PI * 2),
    angle: def.baseAngle,
    suspicion: 0,
  };
}

// Sweep the camera's aim; return whether it currently sees the thief.
export function updateCamera(cam, player, walls, dt, time) {
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
  const d = dist(cam.x, cam.y, player.x, player.y);
  const inCone = d <= cam.range && angleDiff(angleTo(cam.x, cam.y, player.x, player.y), cam.angle) <= 0.6;
  const seen = inCone && hasLineOfSight(walls, cam.x, cam.y, player.x, player.y);
  if (seen) {
    let rate = 1.5 - (d / cam.range) * 0.5;
    if (player.sneaking) rate *= 0.6;
    cam.suspicion = clamp(cam.suspicion + rate * dt, 0, 1);
  } else {
    cam.suspicion = clamp(cam.suspicion - dt * 0.3, 0, 1);
  }
  return seen;
}
