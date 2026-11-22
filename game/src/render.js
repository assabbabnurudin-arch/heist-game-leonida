// Canvas rendering for The Leonida Job: the floor plan, vision cones, loot,
// characters and HUD, plus the title / win / busted screens. All art is
// drawn with canvas shapes — no image files, everything original.

import { TILE, COLS, ROWS, LOOT_KINDS } from './levels.js';
import { raycastWall } from './utils.js';

export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 600

// Draw a vision cone clipped by walls: sample rays across the arc and join
// their endpoints into a polygon, so walls visibly cut the cone short.
function drawCone(ctx, walls, ox, oy, angle, halfAngle, range, color) {
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const r = raycastWall(walls, ox, oy, a, range);
    ctx.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLoot(ctx, item, time) {
  const bob = Math.sin(time * 2.4 + item.x) * 2;
  const y = item.y + bob;
  const kind = LOOT_KINDS[item.kind];
  ctx.save();
  ctx.translate(item.x, y);
  // Glow so loot reads at a glance.
  ctx.shadowColor = kind.color;
  ctx.shadowBlur = 12;
  if (item.kind === 'painting') {
    ctx.fillStyle = '#6b4a1f';
    ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = kind.color;
    ctx.fillRect(-11, -7, 22, 14);
    ctx.fillStyle = '#2c4a6b';
    ctx.fillRect(-7, -4, 8, 8);
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath(); ctx.arc(6, 2, 3, 0, Math.PI * 2); ctx.fill();
  } else if (item.kind === 'gold') {
    ctx.fillStyle = kind.color;
    ctx.fillRect(-12, -4, 10, 8);
    ctx.fillRect(-2, -7, 10, 8);
    ctx.fillRect(4, -3, 10, 8);
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(-12, 2, 10, 2);
    ctx.fillRect(-2, -1, 10, 2);
  } else if (item.kind === 'jewel') {
    ctx.fillStyle = kind.color;
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(9, 0); ctx.lineTo(0, 11); ctx.lineTo(-9, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(4, -3); ctx.lineTo(-4, -3);
    ctx.closePath(); ctx.fill();
  } else if (item.kind === 'cash') {
    ctx.fillStyle = kind.color;
    ctx.fillRect(-11, -7, 22, 5);
    ctx.fillRect(-11, -1, 22, 5);
    ctx.fillRect(-11, 5, 22, 5);
    ctx.fillStyle = '#2f6b2f';
    ctx.fillRect(-3, -7, 6, 17);
  } else { // vase
    ctx.fillStyle = kind.color;
    ctx.beginPath();
    ctx.moveTo(-6, -10); ctx.lineTo(6, -10); ctx.lineTo(9, 0); ctx.lineTo(5, 10);
    ctx.lineTo(-5, 10); ctx.lineTo(-9, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-6, -6, 3, 10);
  }
  ctx.restore();
  // Value tag under the loot, on a dark chip so it stays readable.
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  const label = `$${item.value}`;
  const w = ctx.measureText(label).width + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(item.x - w / 2, item.y + 14, w, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(label, item.x, item.y + 25);
}

function drawGuard(ctx, guard, time) {
  const alert = guard.state === 'chase';
  const wary = guard.state === 'suspicious' || guard.state === 'investigate';
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = alert ? '#ff3b30' : wary ? '#ff9500' : '#3a6ea5';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim shows facing.
  ctx.rotate(guard.facing);
  ctx.fillStyle = '#1d2b3a';
  ctx.fillRect(4, -7, 10, 14);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(2, 0, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Suspicion ring above the guard.
  if (guard.suspicion > 0.03) {
    ctx.save();
    ctx.translate(guard.x, guard.y - 24);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-14, -4, 28, 7);
    ctx.fillStyle = guard.suspicion > 0.7 ? '#ff3b30' : '#ffcc00';
    ctx.fillRect(-13, -3, 26 * guard.suspicion, 5);
    ctx.restore();
  }
  // "!" when the guard has spotted the thief.
  if (guard.state === 'suspicious' && guard.suspicion > 0.55) {
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('!', guard.x, guard.y - 28);
  }
}

function drawCamera(ctx, cam, time) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.fillStyle = '#222';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.strokeStyle = cam.suspicion > 0.5 ? '#ff3b30' : '#9aa5b1';
  ctx.lineWidth = 2;
  ctx.strokeRect(-8, -8, 16, 16);
  ctx.rotate(cam.angle);
  ctx.fillStyle = '#c8d2dc';
  ctx.fillRect(0, -4, 14, 8);
  // Recording light blinks; solid red while the camera is onto the thief.
  const blink = cam.suspicion > 0.5 ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(time * 3 + cam.x));
  ctx.globalAlpha = blink;
  ctx.fillStyle = cam.suspicion > 0.5 ? '#ff3b30' : '#ff2d55';
  ctx.beginPath(); ctx.arc(14, 0, 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPlayer(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.sneaking) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Hooded thief: dark cloak, pale hood, facing tick.
  ctx.fillStyle = '#1f2430';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(player.facing);
  ctx.fillStyle = '#f5d76e';
  ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(4, -5); ctx.lineTo(4, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawHud(ctx, world) {
  const { level, lootValue, totalScore, alarm, alarmTimer, player } = world;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(8,10,16,0.88)';
  ctx.fillRect(0, 0, VIEW_W, 44);
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 12, 19);
  ctx.fillStyle = '#9aa5b1';
  ctx.font = '12px monospace';
  ctx.fillText(level.subtitle, 12, 36);
  // Loot progress.
  const lootText = `LOOT $${lootValue} / $${level.target}`;
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = lootValue >= level.target ? '#8be26b' : '#ffd94a';
  ctx.textAlign = 'right';
  ctx.fillText(lootText, VIEW_W - 220, 19);
  ctx.fillStyle = '#9aa5b1';
  ctx.font = '12px monospace';
  ctx.fillText(`SCORE ${totalScore}   COINS ${player.coins}`, VIEW_W - 220, 36);
  // Alarm meter.
  const ax = VIEW_W - 200;
  ctx.textAlign = 'left';
  ctx.fillStyle = alarm ? '#ff3b30' : '#9aa5b1';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(alarm ? `LOCKDOWN ${Math.ceil(alarmTimer)}s` : 'ALARM', ax, 19);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(ax, 26, 180, 8);
  ctx.fillStyle = alarm ? '#ff3b30' : '#ffcc00';
  ctx.fillRect(ax, 26, 180 * world.suspicion, 8);
  ctx.restore();
  // Bottom hint bar.
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,16,0.8)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = '#c8d2dc';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  const exitReady = lootValue >= level.target;
  ctx.fillText(
    exitReady
      ? 'TARGET MET — reach the green EXIT door!   •   WASD/arrows move · Shift sneak · E grab · Q / click toss a coin'
      : 'WASD / arrows move · Shift sneak · E grab loot · Q / click toss a coin to distract guards',
    VIEW_W / 2, VIEW_H - 9,
  );
  ctx.restore();
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,7,12,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px monospace';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 70);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '17px monospace';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 20 + i * 28));
  ctx.restore();
}

// Main render entry: draws the whole frame for the given world state.
export function render(ctx, world, time) {
  const { level, walls, exit, player, guards, cameras, loot, state } = world;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#141821';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Floor tiles.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (walls.has(`${tx},${ty}`)) continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#1b2130' : '#181d29';
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }

  // Exit door: a glowing green doorway, with a lock until the target is met.
  const ex = exit.x * TILE;
  const ey = exit.y * TILE;
  const exitReady = world.lootValue >= level.target;
  ctx.save();
  ctx.shadowColor = exitReady ? '#39d353' : '#888';
  ctx.shadowBlur = exitReady ? 18 : 4;
  ctx.fillStyle = exitReady ? '#2ea043' : '#4a5568';
  ctx.fillRect(ex - 16, ey - 16, 32, 32);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex, ey + 4);
  if (!exitReady) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '10px monospace';
    ctx.fillText('LOCKED', ex, ey + 28);
  }

  // Walls.
  for (const key of walls) {
    const [tx, ty] = key.split(',').map(Number);
    ctx.fillStyle = '#2e3850';
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    ctx.fillStyle = '#46536e';
    ctx.fillRect(tx * TILE, ty * TILE, TILE, 3);
  }

  // Vision cones under everything that moves.
  for (const cam of cameras) {
    const color = cam.suspicion > 0.5 ? 'rgba(255,59,48,0.20)' : 'rgba(127,231,255,0.13)';
    drawCone(ctx, walls, cam.x, cam.y, cam.angle, 0.6, cam.range, color);
  }
  for (const guard of guards) {
    const color =
      guard.state === 'chase' ? 'rgba(255,59,48,0.28)'
      : guard.state === 'suspicious' ? 'rgba(255,149,0,0.25)'
      : 'rgba(255,204,0,0.16)';
    drawCone(ctx, walls, guard.x, guard.y, guard.facing, guard.halfAngle, guard.range, color);
  }

  // Loot, coin, characters.
  for (const item of loot) if (!item.taken) drawLoot(ctx, item, time);
  if (player.coin) {
    const pulse = 6 + Math.sin(time * 6) * 2;
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.coin.x, player.coin.y, pulse + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(player.coin.x, player.coin.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  for (const cam of cameras) drawCamera(ctx, cam, time);
  for (const guard of guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, player, time);

  // Floating score popups.
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  for (const pop of world.popups) {
    ctx.globalAlpha = Math.max(0, pop.ttl);
    ctx.fillStyle = '#ffd94a';
    ctx.fillText(pop.text, pop.x, pop.y - (1 - pop.ttl) * 30);
  }
  ctx.globalAlpha = 1;

  drawHud(ctx, world);

  // Alarm flash at the screen edges.
  if (world.alarm) {
    const pulse = 0.10 + 0.08 * Math.sin(time * 8);
    ctx.fillStyle = `rgba(255,59,48,${pulse})`;
    ctx.fillRect(0, 0, VIEW_W, 6);
    ctx.fillRect(0, VIEW_H - 6, VIEW_W, 6);
    ctx.fillRect(0, 0, 6, VIEW_H);
    ctx.fillRect(VIEW_W - 6, 0, 6, VIEW_H);
  }

  // Screens.
  if (state === 'title') {
    drawOverlay(ctx, 'THE LEONIDA JOB', [
      'A top-down stealth heist in three buildings.',
      'Sneak past the guards. Dodge the cameras. Grab the loot.',
      'Reach the green EXIT once you hit the target — before the alarm locks you in.',
      '',
      'WASD / arrows — move      Shift — sneak      E — grab loot',
      'Q or click — toss a coin to distract a guard      P — pause',
      '',
      'Press ENTER or click to start the first heist.',
    ], '#f5d76e');
  } else if (state === 'paused') {
    drawOverlay(ctx, 'PAUSED', ['Press P to keep sneaking.'], '#9aa5b1');
  } else if (state === 'levelclear') {
    drawOverlay(ctx, 'CLEAN GETAWAY!', [
      `${level.name} — loot secured: $${world.lootValue}.`,
      `Total score: ${world.totalScore}`,
      '',
      'Press ENTER for the next job.',
    ], '#8be26b');
  } else if (state === 'win') {
    drawOverlay(ctx, 'THE LEONIDA JOB — DONE', [
      'All three heists pulled off. The crew retires rich.',
      `Final score: ${world.totalScore}   •   Total loot: $${world.totalLoot}`,
      '',
      'Press ENTER to run it back from the gallery.',
    ], '#f5d76e');
  } else if (state === 'busted') {
    drawOverlay(ctx, 'BUSTED!', [
      'A guard got hands on you. The crew leaves no one behind —',
      'but this job is blown.',
      '',
      'Press ENTER to retry this level.',
    ], '#ff3b30');
  } else if (state === 'lockdown') {
    drawOverlay(ctx, 'LOCKDOWN!', [
      'The alarm ran out the clock. Steel shutters, sirens,',
      'and a very long walk to the cells.',
      '',
      'Press ENTER to retry this level.',
    ], '#ff3b30');
  }
}
