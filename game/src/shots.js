// Screenshot scenes: deterministic game states for `?shot=...`, so the
// screenshots are real renders of the game's own code in fixed, readable
// moments. The game reads the query string once at boot and hands the
// requested scene to main.js before the first frame.
//
//   ?shot=start  — title screen over the gallery
//   ?shot=play   — mid-heist: thief near loot, guards and cones in frame
//   ?shot=alarm  — alarm raised, guards converging, lockdown timer running
//   ?shot=win    — the win screen after all three heists
//
// The scene is applied by positioning the player and guards and by setting
// suspicion; nothing here edits pixels or composites images.

export function readShotParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

// Place the thief and guards for a readable mid-heist frame: the thief
// crouched between two loot piles while a guard's cone sweeps past.
export function applyPlayScene(world) {
  const { player, guards, loot } = world;
  player.x = 9.5 * 40;
  player.y = 6.5 * 40;
  player.sneaking = true;
  player.facing = -Math.PI / 2;
  const g0 = guards[0];
  g0.x = 9.5 * 40; g0.y = 3.5 * 40; g0.facing = Math.PI / 2;
  g0.state = 'suspicious'; g0.suspicion = 0.62;
  const g1 = guards[1];
  g1.x = 17.5 * 40; g1.y = 8.5 * 40; g1.facing = Math.PI;
  g1.state = 'patrol'; g1.suspicion = 0.1;
  // Pretend two loot piles are already pocketed so the HUD shows progress,
  // with the pickup popup still floating over the last grab.
  loot[0].taken = true;
  loot[3].taken = true;
  world.lootValue = loot[0].value + loot[3].value;
  world.totalScore = world.lootValue;
  world.popups.push({ x: loot[3].x, y: loot[3].y - 10, text: `+$${loot[3].value}`, ttl: 0.9 });
}

// Alarm frame: full alarm, guards chasing, lockdown timer ticking.
export function applyAlarmScene(world) {
  applyPlayScene(world);
  world.alarm = true;
  world.alarmTimer = 21;
  world.suspicion = 1;
  for (const guard of world.guards) {
    guard.state = 'chase';
    guard.suspicion = 1;
    guard.facing = Math.atan2(world.player.y - guard.y, world.player.x - guard.x);
  }
  for (const cam of world.cameras) cam.suspicion = 0.9;
}
