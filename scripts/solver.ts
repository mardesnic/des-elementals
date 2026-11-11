// A fast solver for making levels: the same rules as src/lib/elementals.ts
// for fire and water, on plain numbers, so millions of random boards can be
// tried. The level tests check the levels again with the game's own rules.

const GRASS = 0;
const ROCK = 1;
const WATER = 2;
const ICE = 3;
const BRAMBLE = 4;
// Fire holds the brazier to keep the grate up; water the wheel for the
// sluice. Each wins in its own temple.
const BRAZIER = 5;
const GRATE = 6;
const WHEEL = 7;
const SLUICE = 8;
const TORCH = 9;
const SPRING = 10;

const CODES: Record<string, number> = {
  '.': GRASS,
  F: GRASS,
  W: GRASS,
  '#': ROCK,
  '~': WATER,
  i: ICE,
  '*': BRAMBLE,
  a: BRAZIER,
  A: GRATE,
  b: WHEEL,
  B: SLUICE,
  t: TORCH,
  s: SPRING,
};

type Board = {
  w: number;
  n: number;
  tiles: Uint8Array;
  // The bit of each ice or bramble square, or -1.
  bit: Int8Array;
  bits: number;
  next: number[][];
  start: [number, number];
};

function load(rows: string[]): Board {
  const w = rows[0].length;
  const flat = rows.join('');
  const n = flat.length;
  const tiles = new Uint8Array(n);
  const bit = new Int8Array(n).fill(-1);
  let bits = 0;
  const start: [number, number] = [-1, -1];
  for (let i = 0; i < n; i++) {
    const ch = flat[i];
    tiles[i] = CODES[ch];
    if (ch === 'F') start[0] = i;
    if (ch === 'W') start[1] = i;
    if (tiles[i] === ICE || tiles[i] === BRAMBLE) bit[i] = bits++;
  }
  const next = Array.from({ length: n }, (_, i) => {
    const x = i % w;
    const out: number[] = [];
    if (i >= w) out.push(i - w);
    if (x < w - 1) out.push(i + 1);
    if (i + w < n) out.push(i + w);
    if (x > 0) out.push(i - 1);
    return out;
  });
  return { w, n, tiles, bit, bits, next, start };
}

// The tile on square i once the changes in `mask` are made.
function tileAt(b: Board, i: number, mask: number) {
  const t = b.tiles[i];
  const k = b.bit[i];
  if (k >= 0 && mask & (1 << k)) return t === ICE ? WATER : GRASS;
  return t;
}

// Whether element e (0 fire, 1 water) can step onto square i while the
// other one stands on `other`. Only fire can hold the brazier, so only
// water ever goes through the grate, and the other way round.
function canStep(b: Board, e: number, i: number, mask: number, other: number) {
  if (i === other) return false;
  switch (tileAt(b, i, mask)) {
    case GRASS:
    case TORCH:
    case SPRING:
    case BRAZIER:
    case WHEEL:
      return true;
    case GRATE:
      return e === 1 && b.tiles[other] === BRAZIER;
    case SLUICE:
      return e === 0 && b.tiles[other] === WHEEL;
    case WATER:
      return e === 1;
    default:
      return false;
  }
}

// The change fire makes by moving onto square i, or 0.
function change(b: Board, e: number, i: number, mask: number) {
  if (e !== 0 || b.bit[i] < 0) return 0;
  const flag = 1 << b.bit[i];
  return mask & flag ? 0 : flag;
}

const index = (b: Board, mask: number, p0: number, p1: number) =>
  (mask * b.n + p0) * b.n + p1;

const won = (b: Board, p0: number, p1: number) =>
  b.tiles[p0] === TORCH && b.tiles[p1] === SPRING;

// Calls `visit` with every state one step away.
function successors(
  b: Board,
  mask: number,
  p: [number, number],
  visit: (m: number, p0: number, p1: number) => void
) {
  for (let e = 0; e < 2; e++) {
    const other = p[1 - e];
    for (const i of b.next[p[e]]) {
      if (canStep(b, e, i, mask, other))
        visit(mask, e === 0 ? i : p[0], e === 1 ? i : p[1]);
      else {
        const flag = change(b, e, i, mask);
        if (flag) visit(mask | flag, p[0], p[1]);
      }
    }
  }
}

// Every state reachable from the start, as [mask, p0, p1] triples; wins
// are not gone past.
function reachable(b: Board): number[] {
  const seen = new Uint8Array((1 << b.bits) * b.n * b.n);
  const queue: number[] = [0, b.start[0], b.start[1]];
  seen[index(b, 0, b.start[0], b.start[1])] = 1;
  for (let q = 0; q < queue.length; q += 3) {
    if (won(b, queue[q + 1], queue[q + 2])) continue;
    successors(b, queue[q], [queue[q + 1], queue[q + 2]], (m, p0, p1) => {
      const k = index(b, m, p0, p1);
      if (!seen[k]) {
        seen[k] = 1;
        queue.push(m, p0, p1);
      }
    });
  }
  return queue;
}

// Whether the level can be won, one step at a time.
export function solvable(rows: string[]): boolean {
  const b = load(rows);
  if (b.start[0] < 0 || b.start[1] < 0) return false;
  const states = reachable(b);
  for (let q = 0; q < states.length; q += 3)
    if (won(b, states[q + 1], states[q + 2])) return true;
  return false;
}

// Whether every state a player can reach can still be won, so no move
// ever spoils the level (for example by one blocking the other in).
export function noDeadEnds(rows: string[]): boolean {
  const b = load(rows);
  const states = reachable(b);
  const good = new Uint8Array((1 << b.bits) * b.n * b.n);
  let left = 0;
  for (let q = 0; q < states.length; q += 3)
    if (won(b, states[q + 1], states[q + 2]))
      good[index(b, states[q], states[q + 1], states[q + 2])] = 1;
    else left++;
  // Mark states with a good next state as good, until nothing changes.
  for (let changed = true; changed && left;) {
    changed = false;
    for (let q = 0; q < states.length; q += 3) {
      const k = index(b, states[q], states[q + 1], states[q + 2]);
      if (good[k]) continue;
      let ok = false;
      successors(b, states[q], [states[q + 1], states[q + 2]], (m, p0, p1) => {
        if (good[index(b, m, p0, p1)]) ok = true;
      });
      if (ok) {
        good[k] = 1;
        left--;
        changed = true;
      }
    }
  }
  return left === 0;
}

// The fewest taps to win, where a tap walks someone anywhere they can get
// to, or walks them up to an ice or bramble and changes it; and how often
// the one moving changes on that way.
export function taps(
  rows: string[]
): { taps: number; switches: number } | undefined {
  const b = load(rows);
  const seen = new Uint8Array((1 << b.bits) * b.n * b.n);
  type Node = [mask: number, p0: number, p1: number, who: number, sw: number];
  let layer: Node[] = [[0, b.start[0], b.start[1], -1, 0]];
  seen[index(b, 0, b.start[0], b.start[1])] = 1;
  if (won(b, b.start[0], b.start[1])) return { taps: 0, switches: 0 };
  // Marks squares reached by the current walk; each walk gets a new stamp.
  const reach = new Int32Array(b.n);
  let stamp = 0;
  for (let depth = 1; layer.length; depth++) {
    const next: Node[] = [];
    let best = Infinity;
    for (const [mask, p0, p1, who, sw] of layer) {
      const p = [p0, p1];
      for (let e = 0; e < 2; e++) {
        const other = p[1 - e];
        const switches = sw + (who >= 0 && who !== e ? 1 : 0);
        // Everywhere e can walk to.
        stamp++;
        const walk = [p[e]];
        reach[p[e]] = stamp;
        for (let w = 0; w < walk.length; w++)
          for (const i of b.next[walk[w]])
            if (reach[i] !== stamp && canStep(b, e, i, mask, other)) {
              reach[i] = stamp;
              walk.push(i);
            }
        const add = (m: number, at: number) => {
          const np = [p[0], p[1]];
          np[e] = at;
          if (won(b, np[0], np[1])) best = Math.min(best, switches);
          const k = index(b, m, np[0], np[1]);
          if (!seen[k]) {
            seen[k] = 1;
            next.push([m, np[0], np[1], e, switches]);
          }
        };
        for (const at of walk) {
          if (at !== p[e]) add(mask, at);
          for (const i of b.next[at]) {
            const flag = change(b, e, i, mask);
            if (flag && i !== other) add(mask | flag, at);
          }
        }
      }
    }
    if (best < Infinity) return { taps: depth, switches: best };
    layer = next;
  }
  return undefined;
}
