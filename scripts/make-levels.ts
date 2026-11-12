// Builds src/levels.json: random boards, kept only when every obstacle on
// them is needed, then the best of them in order of how many taps they take.
// First a world of fire alone, then fire and water, then fire, water and
// earth together, and last all four with air.
//
//   npm run levels
//
// A board is kept when it can be won and when turning any ice, coal,
// brazier, wheel, grate, sluice, pit, round stone, vane or wind gate into rock (or all the
// water, if it has some) makes it impossible. So nothing is there just for show, and no shortcut skips it.
// It must also have no dead ends: no move, such as one friend shutting the
// other in, can leave it unwinnable.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

import type { Level } from '../src/lib/elementals.ts';
import { noDeadEnds, solvable, taps as tapsToWin } from './solver.ts';

type Kind =
  | 'water'
  | 'coal'
  | 'ice'
  | 'grate'
  | 'sluice'
  | 'pit'
  | 'boulder'
  | 'windGate';

type Slot = {
  size: [number, number];
  kinds: Kind[];
  // Fewest taps to win, and fewest changes of who moves on the way.
  taps: [number, number];
  switches: number;
  // Fire on its own, without water.
  alone?: boolean;
  // The most coals, if not 2.
  coals?: number;
  // Earth too, with fire and water.
  earth?: boolean;
  // Air too, with all the others.
  air?: boolean;
  // The man and the woman too, with everyone, and more rock, which keeps
  // the ways to move few enough to check.
  people?: boolean;
  // The most pits and round stones, if not 2 and 1.
  pits?: number;
  stones?: number;
};

// Fire alone, just three levels: walking to its temple, then burning coal
// on the way.
// Ice is left out: melted, it only blocks fire.
const FIRE: Slot[] = [
  { size: [4, 4], kinds: [], taps: [1, 1], switches: 0, alone: true },
  { size: [4, 4], kinds: ['coal'], taps: [2, 2], switches: 0, alone: true },
  { size: [5, 5], kinds: ['coal'], taps: [3, 3], switches: 0, alone: true },
];

// Fire, water and earth, all three from the start: earth fills pits and
// pushes round stones, which make a bridge in water. Wherever there are
// water and a stone, a bridge is needed.
const EARTH: Slot[] = [
  { size: [5, 5], kinds: ['pit'], taps: [3, 6], switches: 2, earth: true },
  { size: [5, 5], kinds: ['boulder'], taps: [3, 6], switches: 2, earth: true },
  {
    size: [6, 6],
    kinds: ['water', 'boulder'],
    taps: [4, 7],
    switches: 2,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['pit', 'coal'],
    taps: [4, 8],
    switches: 2,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['pit', 'grate'],
    taps: [4, 8],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['boulder', 'sluice'],
    taps: [4, 8],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['water', 'pit'],
    taps: [4, 8],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['boulder', 'coal'],
    taps: [4, 8],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['water', 'boulder', 'coal'],
    taps: [4, 8],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['pit', 'boulder'],
    taps: [5, 9],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['water', 'boulder', 'pit'],
    taps: [5, 9],
    switches: 3,
    earth: true,
  },
  {
    size: [6, 6],
    kinds: ['water', 'boulder', 'grate'],
    taps: [5, 9],
    switches: 3,
    earth: true,
  },
];

// All four, with air: it flies over water and holes, but once it starts
// it keeps going until something stops it. Its vane holds the wind gate.
const AIR: Slot[] = [
  {
    size: [5, 5],
    kinds: [],
    taps: [4, 6],
    switches: 3,
    earth: true,
    air: true,
  },
  {
    size: [5, 5],
    kinds: ['water'],
    taps: [4, 7],
    switches: 3,
    earth: true,
    air: true,
  },
  {
    size: [6, 6],
    kinds: ['windGate'],
    taps: [5, 9],
    switches: 3,
    earth: true,
    air: true,
  },
  {
    size: [6, 6],
    kinds: ['pit', 'water'],
    taps: [5, 9],
    switches: 3,
    earth: true,
    air: true,
  },
  {
    size: [6, 6],
    kinds: ['boulder', 'coal'],
    taps: [5, 10],
    switches: 4,
    earth: true,
    air: true,
  },
  {
    size: [6, 6],
    kinds: ['windGate', 'water'],
    taps: [5, 10],
    switches: 4,
    earth: true,
    air: true,
  },
  {
    size: [6, 6],
    kinds: ['windGate', 'pit'],
    taps: [5, 10],
    switches: 4,
    earth: true,
    air: true,
  },
  {
    size: [6, 6],
    kinds: ['windGate', 'grate'],
    taps: [6, 11],
    switches: 4,
    earth: true,
    air: true,
  },
];

// The last level: everyone, and a man and a woman who meet in the heart
// temple. They can't do anything special; they are just in the way.
const PEOPLE: Slot[] = [
  {
    size: [6, 6],
    kinds: [],
    taps: [11, 18],
    switches: 6,
    earth: true,
    air: true,
    people: true,
  },
];

// The most states a level may have, so the tests can check it with the
// game's own rules in time.
const LIMIT = 2_000_000;

// Fire and water. Easiest first: one new thing at a time, then mixed. Water with ice
// never made a good board, so those mixes are left out.
const SLOTS: Slot[] = [
  { size: [5, 5], kinds: [], taps: [2, 2], switches: 1 },
  { size: [5, 5], kinds: ['water'], taps: [2, 3], switches: 1 },
  { size: [5, 5], kinds: ['coal'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['ice'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['grate'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['sluice'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['water', 'coal'], taps: [3, 5], switches: 1 },
  { size: [6, 6], kinds: ['ice', 'grate'], taps: [4, 6], switches: 2 },
  { size: [6, 6], kinds: ['coal', 'sluice'], taps: [4, 6], switches: 2 },
  { size: [6, 6], kinds: ['grate', 'sluice'], taps: [4, 7], switches: 2 },
  { size: [6, 6], kinds: ['ice', 'coal'], taps: [4, 7], switches: 2 },
  { size: [6, 6], kinds: ['water', 'grate'], taps: [5, 7], switches: 2 },
  {
    size: [6, 6],
    kinds: ['ice', 'coal', 'sluice'],
    taps: [5, 8],
    switches: 3,
  },
  {
    size: [6, 6],
    kinds: ['water', 'grate', 'sluice'],
    taps: [5, 8],
    switches: 3,
  },
  {
    size: [6, 6],
    kinds: ['ice', 'grate', 'sluice'],
    taps: [5, 8],
    switches: 3,
  },
  {
    size: [7, 7],
    kinds: ['coal', 'grate', 'sluice'],
    taps: [6, 9],
    switches: 3,
  },
  {
    size: [7, 7],
    kinds: ['ice', 'coal', 'grate', 'sluice'],
    taps: [6, 10],
    switches: 4,
  },
  {
    size: [7, 7],
    kinds: ['water', 'coal', 'grate', 'sluice'],
    taps: [6, 10],
    switches: 4,
  },
  { size: [6, 6], kinds: ['water', 'sluice'], taps: [5, 8], switches: 3 },
  {
    size: [6, 6],
    kinds: ['water', 'coal', 'sluice'],
    taps: [5, 8],
    switches: 3,
  },
  {
    size: [7, 7],
    kinds: ['ice', 'coal', 'sluice'],
    taps: [6, 10],
    switches: 4,
  },
];

// Boards tried for each slot. With three friends a board takes longer, so
// fewer are tried. TRIES=… sets it for every world.
const TRIES = process.env.TRIES ? Number(process.env.TRIES) : undefined;

// A small seeded random generator, so the same levels come out every time.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A board too full for everything it needs; that try is skipped.
class Full extends Error {}

function randomBoard(slot: Slot, rnd: () => number): string[] {
  const [w, h] = slot.size;
  const cells = Array.from({ length: w * h }, () => '.');
  const pick = (n: number) => Math.floor(rnd() * n);
  const free = () => {
    for (let t = 0; t < 200; t++) {
      const i = pick(w * h);
      if (cells[i] === '.') return i;
    }
    throw new Full();
  };

  const rock = (slot.people ? 0.3 : 0.15) + rnd() * 0.2;
  for (let i = 0; i < cells.length; i++) if (rnd() < rock) cells[i] = '#';

  if (slot.kinds.includes('water')) {
    // A river across the board, and maybe a pond. With ice about, the
    // river is often left out, so the water from melted ice can matter.
    if (!slot.kinds.includes('ice') || rnd() < 0.4) {
      const across = rnd() < 0.5;
      const at = 1 + pick((across ? h : w) - 2);
      for (let k = 0; k < (across ? w : h); k++)
        cells[across ? at * w + k : k * w + at] = '~';
    }
    for (let k = pick(4); k > 0; k--) cells[free()] = '~';
  }
  const several = (n: number) => 1 + pick(n);
  for (const kind of slot.kinds) {
    if (kind === 'coal')
      for (let k = several(slot.coals ?? 2); k > 0; k--) cells[free()] = '*';
    if (kind === 'ice')
      for (let k = several(2); k > 0; k--) cells[free()] = 'i';
    if (kind === 'grate' || kind === 'sluice' || kind === 'windGate') {
      const [holder, gate] = { grate: 'aA', sluice: 'bB', windGate: 'vV' }[
        kind
      ];
      cells[free()] = gate;
      cells[free()] = holder;
    }
    if (kind === 'pit')
      for (let k = several(slot.pits ?? 2); k > 0; k--) cells[free()] = 'o';
    if (kind === 'boulder')
      for (let k = several(slot.stones ?? 1); k > 0; k--) cells[free()] = '@';
  }

  // The temples, for fire and for water.
  cells[free()] = 't';
  if (!slot.alone) cells[free()] = 's';
  if (slot.earth) cells[free()] = 'e';
  if (slot.air) cells[free()] = 'm';
  if (slot.people) cells[free()] = 'h';
  cells[free()] = 'F';
  if (!slot.alone) cells[free()] = 'W';
  if (slot.earth) cells[free()] = 'E';
  if (slot.air) cells[free()] = 'Z';
  if (slot.people) {
    cells[free()] = 'M';
    cells[free()] = 'L';
  }

  return Array.from({ length: h }, (_, r) =>
    cells.slice(r * w, (r + 1) * w).join('')
  );
}

const replace = (rows: string[], test: (ch: string) => boolean, by: string) =>
  rows.map((r) =>
    r
      .split('')
      .map((ch) => (test(ch) ? by : ch))
      .join('')
  );

// Every obstacle is needed: without it, as rock, the level can't be won.
function allNeeded(rows: string[], slot: Slot): boolean {
  const flat = rows.join('');
  const w = rows[0].length;
  for (let i = 0; i < flat.length; i++) {
    if (!'*iaAbBo@vV'.includes(flat[i])) continue;
    const without = rows.map((r, y) =>
      y === Math.floor(i / w)
        ? r.slice(0, i % w) + '#' + r.slice((i % w) + 1)
        : r
    );
    if (solvable(without)) return false;
  }
  if (
    slot.kinds.includes('water') &&
    solvable(replace(rows, (c) => c === '~', '#'))
  )
    return false;
  // With water and a round stone, the stone has to become a bridge.
  if (
    slot.kinds.includes('water') &&
    slot.kinds.includes('boulder') &&
    solvable(rows, false)
  )
    return false;
  return true;
}

// Each kind the slot asks for is on the board.
const hasAll = (rows: string[], slot: Slot) => {
  const flat = rows.join('');
  const letter: Record<Kind, string> = {
    water: '~',
    coal: '*',
    ice: 'i',
    grate: 'A',
    sluice: 'B',
    pit: 'o',
    boulder: '@',
    windGate: 'V',
  };
  return slot.kinds.every((k) => flat.includes(letter[k]));
};

// Rows written as one string, for telling boards apart.
const used = new Set<string>();

// Only this slot (counting from 1), when a world's slots are made side by
// side, each by its own process.
const SLOT = process.env.SLOT ? Number(process.env.SLOT) : undefined;

type Made = Level & { taps: number };

// The best board for each slot, with its own seeded random numbers, so
// adding a world doesn't change the boards of another. With `perSlot`,
// each slot has its own random numbers too, so slots can be made apart.
function make(slots: Slot[], seed: number, tries: number, perSlot = false) {
  const levels: Made[] = [];
  let rnd = mulberry32(seed);
  for (const [n, slot] of slots.entries()) {
    if (SLOT !== undefined && n + 1 !== SLOT) continue;
    if (perSlot) rnd = mulberry32(seed + n);
    let best:
      | { rows: string[]; score: number; taps: number; switches: number }
      | undefined;
    // How many boards fit the slot, before the dead-end check.
    let fits = 0;
    for (let t = 0; t < tries; t++) {
      let rows: string[];
      try {
        rows = randomBoard(slot, rnd);
      } catch (e) {
        if (e instanceof Full) continue;
        throw e;
      }
      const key = rows.join('/');
      const cap = slot.people ? LIMIT : Infinity;
      if (used.has(key) || !hasAll(rows, slot) || !solvable(rows, true, cap))
        continue;
      if (!allNeeded(rows, slot)) continue;
      const result = tapsToWin(rows, cap);
      if (!result) continue;
      const { taps, switches } = result;
      if (
        taps < slot.taps[0] ||
        taps > slot.taps[1] ||
        switches < slot.switches
      )
        continue;
      fits++;
      // Prefer more changes of who moves, then more taps, then fewer rocks
      // (open boards look friendlier). Fire alone also likes a long walk.
      const rocks = key.split('#').length;
      const score =
        switches * 100 +
        taps * 10 -
        rocks +
        (slot.alone ? 2 * distance(rows, 'F', 't') : 0);
      // The dead-end check is the slow one, so it runs last.
      if ((!best || score > best.score) && noDeadEnds(rows, cap))
        best = { rows, score, taps, switches };
    }
    if (!best) {
      console.error(`slot ${n + 1}: nothing found`, slot);
      continue;
    }
    used.add(best.rows.join('/'));
    const id = idOf(best.rows);
    levels.push({ id, rows: best.rows, taps: best.taps * 10 + best.switches });
    console.log(
      `${n + 1}. ${slot.kinds.join('+') || 'walk'}: ${best.taps} taps, ${best.switches} switches (${fits} fit)\n   ${best.rows.join('\n   ')}`
    );
  }
  return levels;
}

// How many squares apart two letters are, across and down.
function distance(rows: string[], a: string, b: string) {
  const flat = rows.join('');
  const w = rows[0].length;
  const i = flat.indexOf(a);
  const j = flat.indexOf(b);
  return (
    Math.abs((i % w) - (j % w)) +
    Math.abs(Math.floor(i / w) - Math.floor(j / w))
  );
}

// A level's id, from its board.
const idOf = (rows: string[]) =>
  createHash('sha1').update(rows.join('/')).digest('hex').slice(0, 8);

// The last level, everyone with every obstacle. The man and the woman
// start apart and find their way to each other: he through the wind gate
// that air holds up on the vane, she over the bridge that earth makes by
// pushing the stone into the water, before it fills the pit on its way
// home. Fire burns the coal and holds the brazier, so water, once fire
// has melted the ice, gets through the grate to turn the wheel; that
// holds the sluice up for fire on its way home.
const LAST = [
  'm.Zv#t~',
  '####~BF',
  'M..V#.*',
  '~~~h#a.',
  'L~@E#iW',
  '~~~o#A#',
  '~~~e#bs',
];

const WORLDS = {
  fire: { slots: FIRE, seed: 20261112, intro: FIRE.length, tries: 100000 },
  water: { slots: SLOTS, seed: 20261111, intro: 7, tries: 100000 },
  earth: { slots: EARTH, seed: 20261113, intro: 3, tries: 20000 },
  // With four friends a board is slow to check, so each slot is made by a
  // process of its own, all at once.
  air: { slots: AIR, seed: 20261114, intro: 3, tries: 10000, perSlot: true },
  people: { slots: PEOPLE, seed: 20261123, intro: 1, tries: 1500 },
};
type World = keyof typeof WORLDS;

// Makes each slot of a world in its own process (this script again, with
// SLOT set), and gathers their levels in slot order.
async function apart(name: World): Promise<Made[]> {
  const runs = WORLDS[name].slots.map(
    (_, n) =>
      new Promise<Made[]>((resolve, reject) => {
        const out = `temp/levels-${name}-${n + 1}.json`;
        const env = { ...process.env, WORLD: name, SLOT: `${n + 1}`, OUT: out };
        spawn(process.execPath, [...process.execArgv, process.argv[1]], {
          env,
          stdio: 'inherit',
        }).on('exit', (code) =>
          code === 0
            ? resolve(JSON.parse(readFileSync(out, 'utf8')))
            : reject(new Error(`slot ${n + 1} failed`))
        );
      })
  );
  return (await Promise.all(runs)).flat();
}

// A world's levels: the first few each bring in one new thing, in the
// order of their slots; after them, levels go from fewest taps to most.
async function world(name: World) {
  // The last level is made by hand: with six friends a board open enough
  // for every obstacle is far too big to find at random. A run of only
  // WORLD=people still makes random ones (spares are in spare-levels.json).
  if (name === 'people' && !only) return [{ id: idOf(LAST), rows: LAST }];
  const { slots, seed, intro, tries } = WORLDS[name];
  const perSlot = 'perSlot' in WORLDS[name];
  const levels = perSlot
    ? await apart(name)
    : make(slots, seed, TRIES ?? tries);
  return [
    ...levels.slice(0, intro),
    ...levels.slice(intro).sort((p, q) => p.taps - q.taps),
  ].map(({ id, rows }) => ({ id, rows }));
}

// WORLD=earth makes only that world, into OUT (temp/ by default), to try
// slots out without waiting for the others.
const only = process.env.WORLD as World | undefined;
if (only && SLOT !== undefined) {
  // One slot of a world being made apart: its level, with its taps.
  const { slots, seed, tries } = WORLDS[only];
  const levels = make(slots, seed, TRIES ?? tries, true);
  writeFileSync(process.env.OUT!, JSON.stringify(levels));
} else {
  const names = only ? [only] : (Object.keys(WORLDS) as World[]);
  const ordered = [];
  for (const name of names) ordered.push(...(await world(name)));
  const out = only
    ? (process.env.OUT ?? `temp/levels-${only}.json`)
    : 'src/levels.json';
  writeFileSync(out, JSON.stringify(ordered, null, 2) + '\n');
  console.log(`${ordered.length} levels in ${out}`);
}
