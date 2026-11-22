// Level definitions for The Leonida Job: three original floor plans of rising
// difficulty. Each level is a tile map on a 24 x 15 grid (tile = 40 px).
// '#' = wall, '.' = floor, 'E' = exit door, 'P' = player start.
// Guards patrol waypoint lists in tile coordinates; cameras sweep an arc;
// loot items carry a dollar value and a kind. All names, art and layouts
// are original to this game.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;

export const LOOT_KINDS = {
  painting: { label: 'Painting', color: '#e8b64c' },
  gold: { label: 'Gold bars', color: '#ffd94a' },
  jewel: { label: 'Jewels', color: '#7fe7ff' },
  cash: { label: 'Cash stack', color: '#8be26b' },
  vase: { label: 'Antique vase', color: '#d98cff' },
};

const GALLERY_MAP = [
  '########################',
  '#......#......#........#',
  '#.P....#......#..L.....#',
  '#......#..L...#........#',
  '#......#......#...##...#',
  '#..####....####....#...#',
  '#......#......#........#',
  '#..L...#..##..#....L...#',
  '#......#......#........#',
  '#..####....####....##..#',
  '#......#......#........#',
  '#......#..L...#...L....#',
  '#......#......#........#',
  '#......E......#........#',
  '########################',
];

const BANK_MAP = [
  '########################',
  '#....#........#........#',
  '#.P..#...L....#...L....#',
  '#....#........#........#',
  '#....####..#####..###..#',
  '#....#........#........#',
  '#.L..#...##...#...L....#',
  '#....#........#........#',
  '#....####..#####..###..#',
  '#....#........#........#',
  '#....#...L....#...L....#',
  '#....#........#........#',
  '#..######..######..###.#',
  '#....E....#........#...#',
  '########################',
];

const PENTHOUSE_MAP = [
  '########################',
  '#......#......#........#',
  '#.P....#..L...#...L....#',
  '#......#......#........#',
  '#..######..####...###..#',
  '#......#......#........#',
  '#..L...#..##..#....L...#',
  '#......#......#........#',
  '#..######..####...###..#',
  '#......#......#........#',
  '#..L...#...L..#...L....#',
  '#......#......#........#',
  '#..######..####...###..#',
  '#......E......#........#',
  '########################',
];

// Loot placements: [tileX, tileY, kind, value]. Values differ per kind so the
// player has to choose what to risk grabbing.
export const LEVELS = [
  {
    id: 'gallery',
    name: 'Level 1 — The Coral Gallery',
    subtitle: 'A quiet museum after closing. Two guards, one camera.',
    target: 4000,
    coins: 3,
    alarmSeconds: 35,
    map: GALLERY_MAP,
    guards: [
      // Vertical ping-pong patrols down the open columns of each room.
      { waypoints: [[2, 1], [2, 13]], speed: 52, range: 165, halfAngle: 0.61 },
      { waypoints: [[17, 1], [17, 13]], speed: 56, range: 165, halfAngle: 0.61 },
    ],
    cameras: [
      { x: 12, y: 1, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 185 },
    ],
    loot: [
      [3, 6, 'painting', 1500], [9, 2, 'painting', 1500], [19, 6, 'vase', 900],
      [9, 11, 'jewel', 1200], [18, 11, 'cash', 800], [2, 11, 'cash', 600],
    ],
  },
  {
    id: 'bank',
    name: 'Level 2 — Vice City Bank',
    subtitle: 'The vault floor. Three guards, two cameras, tighter patrols.',
    target: 8000,
    coins: 3,
    alarmSeconds: 30,
    map: BANK_MAP,
    guards: [
      // Rectangular loops inside the open corridor bands (rows 1-3, 5-7, 9-11).
      { waypoints: [[7, 1], [7, 3], [12, 3], [12, 1]], speed: 62, range: 180, halfAngle: 0.58 },
      { waypoints: [[16, 5], [16, 7], [21, 7], [21, 5]], speed: 66, range: 180, halfAngle: 0.58 },
      { waypoints: [[7, 9], [7, 11], [12, 11], [12, 9]], speed: 60, range: 175, halfAngle: 0.58 },
    ],
    cameras: [
      { x: 9, y: 4, baseAngle: Math.PI / 2, sweep: 1.1, speed: 0.7, range: 195 },
      { x: 17, y: 9, baseAngle: -Math.PI / 2, sweep: 1.1, speed: 0.65, range: 195 },
    ],
    loot: [
      [7, 2, 'gold', 2500], [17, 2, 'gold', 2500], [2, 6, 'cash', 1200],
      [17, 6, 'jewel', 1800], [7, 10, 'cash', 1200], [17, 10, 'gold', 2500],
      [2, 12, 'vase', 900],
    ],
  },
  {
    id: 'penthouse',
    name: 'Level 3 — The Penthouse',
    subtitle: 'The big score. Four guards, three cameras, no easy route.',
    target: 12000,
    coins: 4,
    alarmSeconds: 25,
    map: PENTHOUSE_MAP,
    guards: [
      // Rectangular loops inside the open corridor bands (rows 1-3, 5-7, 9-11).
      { waypoints: [[2, 1], [2, 3], [6, 3], [6, 1]], speed: 72, range: 190, halfAngle: 0.55 },
      { waypoints: [[9, 1], [9, 3], [12, 3], [12, 1]], speed: 76, range: 190, halfAngle: 0.55 },
      { waypoints: [[16, 5], [16, 7], [21, 7], [21, 5]], speed: 70, range: 185, halfAngle: 0.55 },
      { waypoints: [[2, 9], [2, 11], [6, 11], [6, 9]], speed: 74, range: 185, halfAngle: 0.55 },
    ],
    cameras: [
      { x: 9, y: 5, baseAngle: Math.PI / 2, sweep: 1.2, speed: 0.85, range: 200 },
      { x: 15, y: 7, baseAngle: 0, sweep: 1.2, speed: 0.8, range: 200 },
      { x: 20, y: 11, baseAngle: -Math.PI / 2, sweep: 1.0, speed: 0.9, range: 200 },
    ],
    loot: [
      [9, 1, 'painting', 2200], [18, 1, 'jewel', 2400], [3, 6, 'gold', 3000],
      [18, 6, 'painting', 2200], [3, 10, 'jewel', 2400], [10, 10, 'gold', 3000],
      [18, 10, 'cash', 1500], [6, 10, 'vase', 1200],
    ],
  },
];

// Parse a map's text rows into wall tiles, the player start and the exit.
export function parseMap(rows) {
  const walls = new Set();
  let start = { x: 1.5, y: 2.5 };
  let exit = { x: 1.5, y: 13.5 };
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '#') walls.add(`${x},${y}`);
      else if (ch === 'P') start = { x: x + 0.5, y: y + 0.5 };
      else if (ch === 'E') exit = { x: x + 0.5, y: y + 0.5 };
    }
  }
  return { walls, start, exit };
}
