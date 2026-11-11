// Builds src/levels.json: random boards, kept only when every obstacle on
// them is needed, then the best of them in order of how many taps they take.
//
//   npm run levels
//
// A board is kept when it can be won and when turning any ice, bramble,
// brazier, wheel, grate or sluice into rock (or all the water, if it has some) makes it
// impossible. So nothing is there just for show, and no shortcut skips it.
// It must also have no dead ends: no move, such as one friend shutting the
// other in, can leave it unwinnable.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import type { Level } from '../src/lib/elementals.ts';
import { noDeadEnds, solvable, taps as tapsToWin } from './solver.ts';

type Kind = 'water' | 'bramble' | 'ice' | 'grate' | 'sluice';

type Slot = {
  size: [number, number];
  kinds: Kind[];
  // Fewest taps to win, and fewest changes of who moves on the way.
  taps: [number, number];
  switches: number;
};

// Easiest first: one new thing at a time, then mixed. Water with ice
// never made a good board, so those mixes are left out.
const SLOTS: Slot[] = [
  { size: [5, 5], kinds: [], taps: [2, 2], switches: 1 },
  { size: [5, 5], kinds: ['water'], taps: [2, 3], switches: 1 },
  { size: [5, 5], kinds: ['bramble'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['ice'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['grate'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['sluice'], taps: [3, 4], switches: 1 },
  { size: [5, 5], kinds: ['water', 'bramble'], taps: [3, 5], switches: 1 },
  { size: [6, 6], kinds: ['ice', 'grate'], taps: [4, 6], switches: 2 },
  { size: [6, 6], kinds: ['bramble', 'sluice'], taps: [4, 6], switches: 2 },
  { size: [6, 6], kinds: ['grate', 'sluice'], taps: [4, 7], switches: 2 },
  { size: [6, 6], kinds: ['ice', 'bramble'], taps: [4, 7], switches: 2 },
  { size: [6, 6], kinds: ['water', 'grate'], taps: [5, 7], switches: 2 },
  {
    size: [6, 6],
    kinds: ['ice', 'bramble', 'sluice'],
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
    kinds: ['bramble', 'grate', 'sluice'],
    taps: [6, 9],
    switches: 3,
  },
  {
    size: [7, 7],
    kinds: ['ice', 'bramble', 'grate', 'sluice'],
    taps: [6, 10],
    switches: 4,
  },
  {
    size: [7, 7],
    kinds: ['water', 'bramble', 'grate', 'sluice'],
    taps: [6, 10],
    switches: 4,
  },
  { size: [6, 6], kinds: ['water', 'sluice'], taps: [5, 8], switches: 3 },
  {
    size: [6, 6],
    kinds: ['water', 'bramble', 'sluice'],
    taps: [5, 8],
    switches: 3,
  },
  {
    size: [7, 7],
    kinds: ['ice', 'bramble', 'sluice'],
    taps: [6, 10],
    switches: 4,
  },
];

const TRIES = Number(process.env.TRIES ?? 100000);

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

  const rock = 0.15 + rnd() * 0.2;
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
    if (kind === 'bramble')
      for (let k = several(2); k > 0; k--) cells[free()] = '*';
    if (kind === 'ice')
      for (let k = several(2); k > 0; k--) cells[free()] = 'i';
    if (kind === 'grate' || kind === 'sluice') {
      const [holder, gate] = kind === 'grate' ? ['a', 'A'] : ['b', 'B'];
      cells[free()] = gate;
      cells[free()] = holder;
    }
  }

  // The temples, for fire and for water.
  cells[free()] = 't';
  cells[free()] = 's';
  cells[free()] = 'F';
  cells[free()] = 'W';

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
    if (!'*iaAbB'.includes(flat[i])) continue;
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
  return true;
}

// Each kind the slot asks for is on the board.
const hasAll = (rows: string[], slot: Slot) => {
  const flat = rows.join('');
  const letter: Record<Kind, string> = {
    water: '~',
    bramble: '*',
    ice: 'i',
    grate: 'A',
    sluice: 'B',
  };
  return slot.kinds.every((k) => flat.includes(letter[k]));
};

// The first few levels each bring in one new thing; after them, levels
// go from fewest taps to most.
const INTRO = 7;
const levels: (Level & { taps: number })[] = [];
const used = new Set<string>();
const rnd = mulberry32(20261111);

for (const [n, slot] of SLOTS.entries()) {
  let best:
    | { rows: string[]; score: number; taps: number; switches: number }
    | undefined;
  for (let t = 0; t < TRIES; t++) {
    let rows: string[];
    try {
      rows = randomBoard(slot, rnd);
    } catch (e) {
      if (e instanceof Full) continue;
      throw e;
    }
    const key = rows.join('/');
    if (used.has(key) || !hasAll(rows, slot) || !solvable(rows)) continue;
    if (!allNeeded(rows, slot)) continue;
    const result = tapsToWin(rows);
    if (!result) continue;
    const { taps, switches } = result;
    if (taps < slot.taps[0] || taps > slot.taps[1] || switches < slot.switches)
      continue;
    // Prefer more changes of who moves, then more taps, then fewer rocks
    // (open boards look friendlier).
    const rocks = key.split('#').length;
    const score = switches * 100 + taps * 10 - rocks;
    // The dead-end check is the slow one, so it runs last.
    if ((!best || score > best.score) && noDeadEnds(rows))
      best = { rows, score, taps, switches };
  }
  if (!best) {
    console.error(`slot ${n + 1}: nothing found`, slot);
    continue;
  }
  used.add(best.rows.join('/'));
  const id = createHash('sha1')
    .update(best.rows.join('/'))
    .digest('hex')
    .slice(0, 8);
  levels.push({ id, rows: best.rows, taps: best.taps * 10 + best.switches });
  console.log(
    `${n + 1}. ${slot.kinds.join('+') || 'walk'}: ${best.taps} taps, ${best.switches} switches\n   ${best.rows.join('\n   ')}`
  );
}

const ordered = [
  ...levels.slice(0, INTRO),
  ...levels.slice(INTRO).sort((p, q) => p.taps - q.taps),
].map(({ id, rows }) => ({ id, rows }));
writeFileSync('src/levels.json', JSON.stringify(ordered, null, 2) + '\n');
console.log(`${levels.length} levels`);
