// A fast solver for making levels: the same rules as src/lib/elementals.ts
// on plain numbers, so millions of random boards can be tried. The level
// tests check the levels again with the game's own rules.
//
// A state is a row of numbers: which ice, brambles and pits are changed
// (one bit each), where each friend stands, then where each round stone is.

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
const PIT = 11;
const TREE = 12;
const BRIDGE = 13;
// Only ever worked out: a round stone on grass. In water it is a bridge.
const BOULDER = 14;

const CODES: Record<string, number> = {
  '.': GRASS,
  F: GRASS,
  W: GRASS,
  E: GRASS,
  '@': GRASS,
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
  o: PIT,
  e: TREE,
  '=': BRIDGE,
};

const FIRE = 0;
const WET = 1;
const EARTH = 2;
const STARTS = 'FWE';
const HOMES = [TORCH, SPRING, TREE];

type Board = {
  w: number;
  n: number;
  tiles: Uint8Array;
  // The bit of each ice, bramble or pit square, or -1.
  bit: Int8Array;
  bits: number;
  next: number[][];
  // Who is on the board, in order: fire, water, earth.
  kinds: number[];
  // Their places in a state, or -1 for one not on the board.
  slot: number[];
  stones: number;
  // A state's length, and the state at the start.
  len: number;
  start: number[];
  // How many states there could be.
  size: number;
  // Whether a stone pushed into water makes a bridge, or can't go there.
  bridges: boolean;
};

function load(rows: string[], bridges = true): Board {
  const w = rows[0].length;
  const flat = rows.join('');
  const n = flat.length;
  const tiles = new Uint8Array(n);
  const bit = new Int8Array(n).fill(-1);
  let bits = 0;
  const at = [-1, -1, -1];
  const stones: number[] = [];
  for (let i = 0; i < n; i++) {
    const ch = flat[i];
    tiles[i] = CODES[ch];
    const e = STARTS.indexOf(ch);
    if (e >= 0) at[e] = i;
    if (ch === '@') stones.push(i);
    if (tiles[i] === ICE || tiles[i] === BRAMBLE || tiles[i] === PIT)
      bit[i] = bits++;
  }
  const kinds = [FIRE, WET, EARTH].filter((e) => at[e] >= 0);
  const slot = [-1, -1, -1];
  kinds.forEach((e, k) => (slot[e] = 1 + k));
  const next = Array.from({ length: n }, (_, i) => {
    const x = i % w;
    const out: number[] = [];
    if (i >= w) out.push(i - w);
    if (x < w - 1) out.push(i + 1);
    if (i + w < n) out.push(i + w);
    if (x > 0) out.push(i - 1);
    return out;
  });
  const start = [0, ...kinds.map((e) => at[e]), ...stones];
  const size = 2 ** bits * n ** (kinds.length + stones.length);
  return {
    w,
    n,
    tiles,
    bit,
    bits,
    next,
    kinds,
    slot,
    stones: stones.length,
    len: start.length,
    start,
    size,
    bridges,
  };
}

// A state, or the space for one.
type State = ArrayLike<number> & { [j: number]: number };

// The states found so far, each with its number in the order found: a
// table while there are few enough states to have a place for each,
// otherwise a hash table.
class Index {
  private table?: Int32Array;
  private keys?: Float64Array;
  private vals?: Int32Array;
  private used = 0;
  constructor(size: number) {
    if (size <= 1 << 20) this.table = new Int32Array(size).fill(-1);
    else this.grow(1 << 12);
  }
  private slotOf(k: number, keys: Float64Array) {
    const mask = keys.length - 1;
    let h = Math.imul((k % 4294967296) ^ ((k / 4294967296) | 0), 0x9e3779b1);
    for (h &= mask; keys[h] !== -1 && keys[h] !== k; h = (h + 1) & mask);
    return h;
  }
  private grow(size: number) {
    const [keys, vals] = [this.keys, this.vals];
    this.keys = new Float64Array(size).fill(-1);
    this.vals = new Int32Array(size);
    if (keys && vals)
      for (let h = 0; h < keys.length; h++)
        if (keys[h] !== -1) {
          const at = this.slotOf(keys[h], this.keys);
          this.keys[at] = keys[h];
          this.vals[at] = vals[h];
        }
  }
  get(k: number): number {
    if (this.table) return this.table[k];
    const h = this.slotOf(k, this.keys!);
    return this.keys![h] === k ? this.vals![h] : -1;
  }
  set(k: number, v: number) {
    if (this.table) {
      this.table[k] = v;
      return;
    }
    if (++this.used * 2 > this.keys!.length) this.grow(this.keys!.length * 2);
    const h = this.slotOf(k, this.keys!);
    this.keys![h] = k;
    this.vals![h] = v;
  }
}

// One number for a state, read from `st` at `o`.
function keyOf(b: Board, st: ArrayLike<number>, o = 0) {
  let k = st[o];
  for (let j = 1; j < b.len; j++) k = k * b.n + st[o + j];
  return k;
}

// The tile on square i in state st.
function tileAt(b: Board, st: State, i: number) {
  let t = b.tiles[i];
  const k = b.bit[i];
  if (k >= 0 && st[0] & (1 << k)) t = t === ICE ? WATER : GRASS;
  for (let j = b.len - b.stones; j < b.len; j++)
    if (st[j] === i) return t === WATER ? BRIDGE : BOULDER;
  return t;
}

const isOn = (b: Board, st: State, i: number) => {
  for (let j = 1; j < b.len - b.stones; j++) if (st[j] === i) return true;
  return false;
};

// Whether a holder is held: its friend stands on it.
const holds = (b: Board, st: State, e: number, tile: number) =>
  b.slot[e] >= 0 && b.tiles[st[b.slot[e]]] === tile;

// Whether friend e can step onto square i.
function canStep(b: Board, st: State, e: number, i: number) {
  if (isOn(b, st, i)) return false;
  switch (tileAt(b, st, i)) {
    case GRASS:
    case TORCH:
    case SPRING:
    case TREE:
    case BRAZIER:
    case WHEEL:
    case BRIDGE:
      return true;
    case GRATE:
      return e !== FIRE && holds(b, st, FIRE, BRAZIER);
    case SLUICE:
      return e !== WET && holds(b, st, WET, WHEEL);
    case WATER:
      return e === WET;
    default:
      return false;
  }
}

// Changes `out`, a copy of `st`, to the state after friend e, standing on
// `from`, changes square i: fire melts ice or burns a bramble, earth fills
// a pit or pushes a stone. False if nothing changes.
function change(
  b: Board,
  st: State,
  e: number,
  from: number,
  i: number,
  out: State
): boolean {
  if (isOn(b, st, i)) return false;
  const t = tileAt(b, st, i);
  if (
    ((t === ICE || t === BRAMBLE) && e === FIRE) ||
    (t === PIT && e === EARTH)
  ) {
    out[0] |= 1 << b.bit[i];
    return true;
  }
  if (t !== BOULDER || e !== EARTH) return false;
  const dx = (i % b.w) - (from % b.w);
  const dy = Math.floor(i / b.w) - Math.floor(from / b.w);
  const x = (i % b.w) + dx;
  const y = Math.floor(i / b.w) + dy;
  if (x < 0 || y < 0 || x >= b.w || y * b.w >= b.n) return false;
  const beyond = y * b.w + x;
  if (isOn(b, st, beyond)) return false;
  const there = tileAt(b, st, beyond);
  if (there !== GRASS && !(there === WATER && b.bridges)) return false;
  out[b.slot[EARTH]] = i;
  for (let j = b.len - b.stones; j < b.len; j++)
    if (out[j] === i) out[j] = beyond;
  return true;
}

function won(b: Board, st: State) {
  for (const e of b.kinds)
    if (b.tiles[st[b.slot[e]]] !== HOMES[e]) return false;
  return true;
}

// Calls `visit` with every state one step away, each in the same space,
// so `visit` must copy it to keep it.
function successors(
  b: Board,
  st: State,
  out: State,
  visit: (out: State) => void
) {
  for (const e of b.kinds) {
    const s = b.slot[e];
    const from = st[s];
    for (const i of b.next[from]) {
      for (let j = 0; j < b.len; j++) out[j] = st[j];
      if (canStep(b, st, e, i)) {
        out[s] = i;
        visit(out);
      } else if (change(b, st, e, from, i, out)) visit(out);
    }
  }
}

// Every state reachable from the start, one after another in `data`, and
// their numbers by key; wins are not gone past. With `toWin`, it stops at
// the first win.
function reachable(b: Board, toWin = false) {
  const index = new Index(b.size);
  let data = new Int32Array(b.len * 1024);
  let count = 0;
  let found = false;
  const add = (st: State) => {
    const k = keyOf(b, st);
    if (index.get(k) >= 0) return;
    if ((count + 1) * b.len > data.length) {
      const more = new Int32Array(data.length * 2);
      more.set(data);
      data = more;
    }
    for (let j = 0; j < b.len; j++) data[count * b.len + j] = st[j];
    index.set(k, count++);
    if (won(b, st)) found = true;
  };
  add(b.start);
  const st = new Int32Array(b.len);
  const out = new Int32Array(b.len);
  for (let q = 0; q < count && !(toWin && found); q++) {
    for (let j = 0; j < b.len; j++) st[j] = data[q * b.len + j];
    if (!won(b, st)) successors(b, st, out, add);
  }
  return { data, count, index, found };
}

// Whether the level can be won, one step at a time; with `bridges` false,
// without ever pushing a stone into water.
export function solvable(rows: string[], bridges = true): boolean {
  const b = load(rows, bridges);
  return b.kinds.length > 0 && reachable(b, true).found;
}

// Whether every state a player can reach can still be won, so no move
// ever spoils the level (for example by one blocking another in).
export function noDeadEnds(rows: string[]): boolean {
  const b = load(rows);
  const { data, count, index } = reachable(b);
  // Each state's states one step back, as lists in one array.
  const from: number[] = [];
  const to: number[] = [];
  const st = new Int32Array(b.len);
  const out = new Int32Array(b.len);
  const good = new Uint8Array(count);
  const queue: number[] = [];
  for (let q = 0; q < count; q++) {
    for (let j = 0; j < b.len; j++) st[j] = data[q * b.len + j];
    if (won(b, st)) {
      good[q] = 1;
      queue.push(q);
      continue;
    }
    successors(b, st, out, (n) => {
      from.push(q);
      to.push(index.get(keyOf(b, n)));
    });
  }
  const start = new Int32Array(count + 1);
  for (const v of to) start[v + 1]++;
  for (let q = 0; q < count; q++) start[q + 1] += start[q];
  const back = new Int32Array(to.length);
  const fill = start.slice();
  for (let k = 0; k < to.length; k++) back[fill[to[k]]++] = from[k];
  // Work back from the wins: a state with a good next state is good.
  let left = count - queue.length;
  while (queue.length) {
    const v = queue.pop()!;
    for (let k = start[v]; k < start[v + 1]; k++)
      if (!good[back[k]]) {
        good[back[k]] = 1;
        left--;
        queue.push(back[k]);
      }
  }
  return left === 0;
}

// The fewest taps to win, where a tap walks someone anywhere they can get
// to, or walks them up to an ice, bramble, pit or stone and changes it; and
// how often the one moving changes on that way.
export function taps(
  rows: string[]
): { taps: number; switches: number } | undefined {
  const b = load(rows);
  if (!b.kinds.length) return undefined;
  if (won(b, b.start)) return { taps: 0, switches: 0 };
  const seen = new Index(b.size);
  seen.set(keyOf(b, b.start), 0);
  type Node = { st: number[]; who: number; sw: number };
  let layer: Node[] = [{ st: b.start, who: -1, sw: 0 }];
  // Marks squares reached by the current walk; each walk gets a new stamp.
  const reach = new Int32Array(b.n);
  let stamp = 0;
  for (let depth = 1; layer.length; depth++) {
    const next: Node[] = [];
    let best = Infinity;
    for (const { st, who, sw } of layer) {
      for (const e of b.kinds) {
        const s = b.slot[e];
        const switches = sw + (who >= 0 && who !== e ? 1 : 0);
        // Everywhere e can walk to.
        stamp++;
        const walk = [st[s]];
        reach[st[s]] = stamp;
        for (let w = 0; w < walk.length; w++)
          for (const i of b.next[walk[w]])
            if (reach[i] !== stamp && canStep(b, st, e, i)) {
              reach[i] = stamp;
              walk.push(i);
            }
        const add = (out: number[]) => {
          if (won(b, out)) best = Math.min(best, switches);
          const k = keyOf(b, out);
          if (seen.get(k) < 0) {
            seen.set(k, 0);
            next.push({ st: out, who: e, sw: switches });
          }
        };
        for (const at of walk) {
          const there = st.slice();
          there[s] = at;
          if (at !== st[s]) add(there);
          for (const i of b.next[at]) {
            const out = there.slice();
            if (change(b, there, e, at, i, out)) add(out);
          }
        }
      }
    }
    if (best < Infinity) return { taps: depth, switches: best };
    layer = next;
  }
  return undefined;
}
