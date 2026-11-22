// The Leonida Job — main game loop and state machine.
// States: title → playing ⇄ paused → levelclear → playing → win,
// playing → busted | lockdown (retry the level). Screenshot scenes from
// shots.js set the world up before the first frame.

import { LEVELS, TILE, parseMap } from './levels.js';
import { createInput } from './input.js';
import { createPlayer, updatePlayer, throwCoin, nearestLoot, GRAB_RANGE } from './player.js';
import { createGuard, updateGuard, sendGuardToInvestigate } from './guard.js';
import { createCamera, updateCamera } from './camera.js';
import { render, VIEW_W, VIEW_H } from './render.js';
import { readShotParam, applyPlayScene, applyAlarmScene } from './shots.js';
import {
  ensureAudio, playPickup, playSpotted, playLevelClear,
  playBusted, playCoin, startAlarmSound, stopAlarmSound, toggleMute,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput(canvas);

let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
  offsetX = (canvas.width - VIEW_W * scale) / 2;
  offsetY = (canvas.height - VIEW_H * scale) / 2;
}
window.addEventListener('resize', resize);
resize();

// Build a fresh world for level `index` (0-based).
function buildWorld(index) {
  const level = LEVELS[index];
  const { walls, start, exit } = parseMap(level.map);
  const player = createPlayer(start);
  player.coins = level.coins;
  const loot = level.loot.map(([tx, ty, kind, value]) => ({
    x: (tx + 0.5) * TILE,
    y: (ty + 0.5) * TILE,
    kind,
    value,
    taken: false,
  }));
  return {
    levelIndex: index,
    level,
    walls,
    exit,
    player,
    guards: level.guards.map(createGuard),
    cameras: level.cameras.map(createCamera),
    loot,
    lootValue: 0,
    totalScore: 0,
    totalLoot: 0,
    suspicion: 0,
    alarm: false,
    alarmTimer: level.alarmSeconds,
    popups: [],
    state: 'title',
    time: 0,
    spottedStingPlayed: false,
  };
}

let world = buildWorld(0);
let lastTime = performance.now();

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function addPopup(world, x, y, text) {
  world.popups.push({ x, y, text, ttl: 1 });
}

function startLevel(index) {
  const keepScore = world.totalScore;
  const keepLoot = world.totalLoot;
  world = buildWorld(index);
  world.totalScore = keepScore;
  world.totalLoot = keepLoot;
  world.state = 'playing';
  setStatus(`${world.level.name}. Grab $${world.level.target} of loot, then reach the exit.`);
}

function retryLevel() {
  startLevel(world.levelIndex);
}

function nextLevel() {
  if (world.levelIndex + 1 >= LEVELS.length) {
    world.state = 'win';
    playLevelClear();
    setStatus(`All three heists done. Final score ${world.totalScore}.`);
  } else {
    startLevel(world.levelIndex + 1);
  }
}

function raiseAlarm() {
  if (world.alarm) return;
  world.alarm = true;
  world.alarmTimer = world.level.alarmSeconds;
  startAlarmSound();
  playSpotted();
  setStatus('Alarm raised! Get to the exit before lockdown.');
}

function update(dt) {
  world.time += dt;

  // Screenshot scenes freeze their moment: render the scene, no simulation.
  if (world.state === 'shot') return;

  if (world.state === 'title') {
    if (input.wasPressed('confirm') || input.wasPressed('click')) {
      ensureAudio();
      world.state = 'playing';
      setStatus(`${world.level.name}. Grab $${world.level.target} of loot, then reach the exit.`);
    }
    return;
  }

  if (world.state === 'paused') {
    if (input.wasPressed('pause') || input.wasPressed('back')) world.state = 'playing';
    return;
  }

  if (world.state === 'levelclear' || world.state === 'win' || world.state === 'busted' || world.state === 'lockdown') {
    if (input.wasPressed('confirm') || input.wasPressed('click')) {
      ensureAudio();
      if (world.state === 'levelclear') nextLevel();
      else if (world.state === 'win') { world = buildWorld(0); world.state = 'title'; }
      else retryLevel();
    }
    return;
  }

  // ---- playing ----
  if (input.wasPressed('pause')) { world.state = 'paused'; return; }
  if (input.wasPressed('mute')) {
    const nowMuted = toggleMute();
    setStatus(nowMuted ? 'Sound muted (M to unmute).' : 'Sound on.');
  }

  updatePlayer(world.player, input, world.walls, dt, VIEW_W, VIEW_H);

  // Grab loot with E.
  if (input.wasPressed('grab')) {
    const item = nearestLoot(world.player, world.loot);
    if (item) {
      item.taken = true;
      world.lootValue += item.value;
      world.totalScore += item.value;
      world.totalLoot += item.value;
      addPopup(world, item.x, item.y - 10, `+$${item.value}`);
      playPickup();
      setStatus(`Grabbed ${item.value ? `$${item.value} of loot` : 'loot'}. Loot $${world.lootValue} of $${world.level.target}.`);
    }
  }

  // Toss a coin with Q / Space / click: guards investigate the noise.
  // Click coordinates arrive in CSS pixels; convert them to world pixels
  // with the same scale/offset the renderer uses (in CSS-pixel terms).
  const coinKey = input.wasPressed('coin');
  const clicked = input.wasPressed('click');
  if (coinKey || clicked) {
    const dpr = window.devicePixelRatio || 1;
    const scaleCss = scale / dpr;
    const offXC = offsetX / dpr;
    const offYC = offsetY / dpr;
    const wx = (input.mouse.clickX - offXC) / scaleCss;
    const wy = (input.mouse.clickY - offYC) / scaleCss;
    const tx = clicked ? wx : world.player.x + Math.cos(world.player.facing) * 120;
    const ty = clicked ? wy : world.player.y + Math.sin(world.player.facing) * 120;
    if (throwCoin(world.player, tx, ty, VIEW_W, VIEW_H)) {
      playCoin();
      for (const guard of world.guards) sendGuardToInvestigate(guard, world.player.coin.x, world.player.coin.y);
      setStatus('Coin tossed — the guards go to check the noise.');
    }
  }

  // Guards and cameras build suspicion; any full meter raises the alarm.
  let peak = 0;
  for (const guard of world.guards) {
    updateGuard(guard, world.player, world.walls, dt, world.alarm);
    peak = Math.max(peak, guard.suspicion);
  }
  for (const cam of world.cameras) {
    updateCamera(cam, world.player, world.walls, dt, world.time);
    peak = Math.max(peak, cam.suspicion);
  }
  world.suspicion = peak;
  if (peak >= 1 && !world.alarm) raiseAlarm();
  if (peak > 0.6 && !world.spottedStingPlayed) {
    world.spottedStingPlayed = true;
    playSpotted();
  }
  if (peak < 0.3) world.spottedStingPlayed = false;

  // Alarm countdown: lockdown when it runs out.
  if (world.alarm) {
    world.alarmTimer -= dt;
    if (world.alarmTimer <= 0) {
      world.state = 'lockdown';
      stopAlarmSound();
      playBusted();
      setStatus('Lockdown! The alarm ran out the clock.');
    }
  }

  // Caught: a guard touches the thief.
  for (const guard of world.guards) {
    if (Math.hypot(guard.x - world.player.x, guard.y - world.player.y) < 24) {
      world.state = 'busted';
      stopAlarmSound();
      playBusted();
      setStatus('Busted! A guard caught you.');
      return;
    }
  }

  // Exit: only once the loot target is met.
  const exitPx = world.exit.x * TILE;
  const exitPy = world.exit.y * TILE;
  if (world.lootValue >= world.level.target &&
      Math.hypot(world.player.x - exitPx, world.player.y - exitPy) < 26) {
    const timeBonus = world.alarm ? 0 : 500;
    world.totalScore += timeBonus;
    world.state = 'levelclear';
    stopAlarmSound();
    playLevelClear();
    setStatus(`${world.level.name} cleared. Loot $${world.lootValue}.`);
  }

  // Fade popups.
  for (const pop of world.popups) pop.ttl -= dt * 0.9;
  world.popups = world.popups.filter((p) => p.ttl > 0);
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  input.endFrame();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  render(ctx, world, world.time);
  requestAnimationFrame(frame);
}

// Debug handle for local playtesting (headless browser checks): lets a test
// read the world and drive state transitions without touching the game code.
window.__leonida = {
  get world() { return world; },
  get state() { return world.state; },
  startLevel,
  raiseAlarm,
};

// ---- Screenshot scenes: fixed, readable moments of the real game ----
const shot = readShotParam();
if (shot === 'start') {
  world.state = 'title';
} else if (shot === 'play') {
  world.state = 'playing';
  applyPlayScene(world);
  world.state = 'shot';
} else if (shot === 'alarm') {
  world.state = 'playing';
  applyAlarmScene(world);
  world.state = 'shot';
} else if (shot === 'win') {
  // Show the win screen over the final job's floor, with its target met.
  world = buildWorld(2);
  world.totalScore = 24800;
  world.totalLoot = 24800;
  world.lootValue = world.level.target;
  world.state = 'win';
}

requestAnimationFrame(frame);
