# The Leonida Job — a top-down stealth heist game

[![make.fun — best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/assabbabnurudin-arch/heist-game-leonida/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/assabbabnurudin-arch/heist-game-leonida/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

**Sneak in. Grab the loot. Get out before the alarm locks you in.**

The Leonida Job is an original top-down stealth heist game that runs in a
desktop browser from static files — no build step, no network. You play a
thief working three jobs across Leonida: a quiet museum gallery, a bank vault
floor, and a penthouse full of things that do not belong to their owner.
Every building is a floor plan you have to study: guards patrol with vision
cones, cameras sweep the halls, and the loot is never where it is safe.

## How to play

1. **Study the room.** Guards walk fixed patrols and their vision cones are
   drawn on the floor — yellow while calm, orange while suspicious, red once
   the alarm is up. Cameras sweep back and forth; their cones are pale blue.
   Walls block sight, so plan your route behind cover.
2. **Sneak.** Hold **Shift** to move slowly and quietly — guards spot a
   sneaking thief much more slowly. Running across an open floor in front of
   a guard is a fast way to raise the alarm.
3. **Grab the loot.** Walk up to a painting, gold bars, jewels, cash or a
   vase and press **E**. Every piece has a dollar value, and the exit stays
   locked until you hit the level's target.
4. **Distract.** Press **Q** (or click) to toss a coin. Guards nearby walk
   over to investigate the noise — use it to slip past a patrol. Coins are
   limited, so spend them where they open a route.
5. **Get out.** Once the target is met, reach the green **EXIT** door. If a
   guard or camera fills the alarm meter, the alarm goes up: every guard
   converges on you and a lockdown timer starts ticking. Escape before it
   hits zero — or get caught trying.

## The three jobs

| Level | Building | Guards | Cameras | Loot target |
|-------|----------|--------|---------|-------------|
| 1 | The Coral Gallery | 2 | 1 | $4,000 |
| 2 | Vice City Bank | 3 | 2 | $8,000 |
| 3 | The Penthouse | 4 | 3 | $12,000 |

Clearing a level without raising the alarm earns a $500 quiet bonus. Your
score is the loot you carry out plus your bonuses, across all three jobs.

## Controls

| Key | Action |
|-----|--------|
| WASD / arrow keys | Move |
| Shift (hold) | Sneak — slower, harder to spot |
| E | Grab loot |
| Q or mouse click | Toss a coin to distract guards |
| P | Pause |
| M | Mute / unmute sound |
| Enter | Start / continue |

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser. No build step and
no network requests — every file the game loads lives under `game/`.

## Files

- `game/index.html` — the page shell
- `game/src/main.js` — game loop and state machine
- `game/src/levels.js` — the three floor plans, guards, cameras and loot
- `game/src/guard.js` — patrols, vision cones and suspicion
- `game/src/camera.js` — sweeping security cameras
- `game/src/player.js` — movement, sneaking, loot grabs, coin toss
- `game/src/render.js` — canvas drawing: floor plan, cones, HUD, screens
- `game/src/audio.js` — synthesised WebAudio sounds (no audio files)
- `game/src/input.js` — keyboard and mouse input
- `game/src/utils.js` — math and line-of-sight helpers
- `game/src/shots.js` — fixed screenshot scenes (`?shot=start|play|alarm|win`)
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`
- `screenshots/` — real browser renders of the game

Built for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559).
All art, names, levels and code are original. MIT licensed.
