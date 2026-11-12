// The rules: a few element friends on a small board of tiles, who win when
// each of them reaches its own temple: there fire becomes the sun, water
// a rain cloud, earth a green tree and air a cloud that blows. On the last
// level a man and a woman join them, and meet in the heart temple.

export const ELEMENTS = [
  'fire',
  'water',
  'earth',
  'air',
  'man',
  'woman',
] as const;
export type Element = (typeof ELEMENTS)[number];

// One letter a tile in a level's map.
export const TILES = {
  '.': 'grass',
  '#': 'rock',
  '~': 'water',
  i: 'ice',
  '*': 'coal',
  a: 'brazier',
  A: 'grate',
  b: 'wheel',
  B: 'sluice',
  t: 'fireTemple',
  s: 'waterTemple',
  o: 'pit',
  '@': 'boulder',
  '=': 'bridge',
  e: 'earthTemple',
  v: 'vane',
  V: 'windGate',
  m: 'airTemple',
  h: 'heartTemple',
} as const;
export type Tile = (typeof TILES)[keyof typeof TILES];

// Each element has its own place to wake, and its own thing to hold that
// opens a way for the other: fire keeps the brazier burning and the grate
// stays up; water turns the wheel and the sluice stays up; air spins the
// weather vane and the wind gate stays up.
const HOME: Partial<Record<Tile, Element>> = {
  fireTemple: 'fire',
  waterTemple: 'water',
  earthTemple: 'earth',
  airTemple: 'air',
};
const HOLDER: Partial<Record<Tile, Element>> = {
  brazier: 'fire',
  wheel: 'water',
  vane: 'air',
};
const GATE: Partial<Record<Tile, Element>> = {
  grate: 'fire',
  sluice: 'water',
  windGate: 'air',
};
// The two people share one temple, where they meet.
const PEOPLE: readonly Element[] = ['man', 'woman'];
const HOME_OF: Record<Element, Tile> = {
  fire: 'fireTemple',
  water: 'waterTemple',
  earth: 'earthTemple',
  air: 'airTemple',
  man: 'heartTemple',
  woman: 'heartTemple',
};
// Whether `e` may stand on square i with `o` already there: only the two
// people, together in their temple.
const together = (s: State, e: Element, o: Element, i: number) =>
  s.tiles[i] === 'heartTemple' &&
  e !== o &&
  [e, o].every((p) => PEOPLE.includes(p));
// Whose place or thing a tile is, if anyone's.
export const ownerOf = (t: Tile) => HOME[t] ?? HOLDER[t] ?? GATE[t];
export const isGate = (t: Tile) => GATE[t] !== undefined;

// Where each element starts, written on grass.
const STARTS: Record<string, Element> = {
  F: 'fire',
  W: 'water',
  E: 'earth',
  Z: 'air',
  M: 'man',
  L: 'woman',
};

export type Level = { id: string; rows: string[] };

export type State = {
  // Row by row.
  tiles: Tile[];
  // Only the elements in this level.
  at: Partial<Record<Element, number>>;
};

export type Board = { width: number; height: number };

export const boardOf = (level: Level): Board => ({
  width: level.rows[0].length,
  height: level.rows.length,
});

export function parse(level: Level): State {
  const tiles: Tile[] = [];
  const at: State['at'] = {};
  level.rows
    .join('')
    .split('')
    .forEach((ch, i) => {
      const element = STARTS[ch];
      if (element) {
        at[element] = i;
        tiles.push('grass');
      } else {
        const tile = TILES[ch as keyof typeof TILES];
        if (!tile) throw new Error(`Unknown tile '${ch}' in ${level.id}`);
        tiles.push(tile);
      }
    });
  return { tiles, at };
}

export const elementsIn = (s: State) =>
  ELEMENTS.filter((e) => s.at[e] !== undefined);

// The squares next to i, up, right, down, left.
export function neighbours({ width, height }: Board, i: number): number[] {
  const x = i % width;
  const y = Math.floor(i / width);
  return [
    y > 0 ? i - width : -1,
    x < width - 1 ? i + 1 : -1,
    y < height - 1 ? i + width : -1,
    x > 0 ? i - 1 : -1,
  ].filter((n) => n >= 0);
}

export const isNextTo = (b: Board, a: number, c: number) =>
  neighbours(b, a).includes(c);

// Whether `e` stands on its own thing to hold, so its gates are up.
// `besides` is left out, as the one moving can't hold and walk at once.
export function isHeld(s: State, e: Element, besides?: Element): boolean {
  const at = s.at[e];
  return e !== besides && at !== undefined && HOLDER[s.tiles[at]] === e;
}

// Whether square i is woken: a temple, brazier or wheel with its own
// element on it, or the heart temple with both people in it. Anyone else
// can stand there, but nothing happens.
export function isAwake(s: State, i: number): boolean {
  if (s.tiles[i] === 'heartTemple') return PEOPLE.every((p) => s.at[p] === i);
  const owner = HOME[s.tiles[i]] ?? HOLDER[s.tiles[i]];
  return owner !== undefined && s.at[owner] === i;
}

// Whether the gate on square i shows open: it is held up, or someone
// stands in it.
export function shownOpen(s: State, i: number): boolean {
  const by = GATE[s.tiles[i]];
  if (!by) return false;
  return isHeld(s, by) || elementsIn(s).some((e) => s.at[e] === i);
}

// What happens when an element moves onto a tile: it steps on, can't go,
// or changes the tile and stays where it is. A round stone that earth
// pushes is worked out in `move`, which knows the way it goes.
export type Outcome = 'step' | 'blocked' | { becomes: Tile };

// `open` says whether the tile, if it is a gate, is held up.
export function outcome(e: Element, tile: Tile, open: boolean): Outcome {
  switch (tile) {
    case 'grass':
    case 'fireTemple':
    case 'waterTemple':
    case 'earthTemple':
    case 'airTemple':
    case 'heartTemple':
    case 'brazier':
    case 'wheel':
    case 'vane':
    case 'bridge':
      return 'step';
    case 'grate':
    case 'sluice':
    case 'windGate':
      return open ? 'step' : 'blocked';
    case 'rock':
    case 'boulder':
      return 'blocked';
    case 'water':
      return e === 'water' || e === 'air' ? 'step' : 'blocked';
    case 'ice':
      return e === 'fire' ? { becomes: 'water' } : 'blocked';
    case 'coal':
      return e === 'fire' ? { becomes: 'grass' } : 'blocked';
    case 'pit':
      // Air flies over a hole; earth fills it.
      if (e === 'air') return 'step';
      return e === 'earth' ? { becomes: 'grass' } : 'blocked';
  }
}

// Where a round stone on square `to` goes when `e` on `from` pushes it,
// or undefined if it can't: only earth pushes, one square on, onto empty
// grass, or into water where it makes a bridge.
export function pushTo(
  b: Board,
  s: State,
  e: Element,
  from: number,
  to: number
): number | undefined {
  if (e !== 'earth' || s.tiles[to] !== 'boulder') return undefined;
  const dx = (to % b.width) - (from % b.width);
  const dy = Math.floor(to / b.width) - Math.floor(from / b.width);
  if (Math.abs(dx) + Math.abs(dy) !== 1) return undefined;
  const x = (to % b.width) + dx;
  const y = Math.floor(to / b.width) + dy;
  if (x < 0 || y < 0 || x >= b.width || y >= b.height) return undefined;
  const beyond = y * b.width + x;
  if (elementsIn(s).some((o) => s.at[o] === beyond)) return undefined;
  const tile = s.tiles[beyond];
  return tile === 'grass' || tile === 'water' ? beyond : undefined;
}

// What `e` moving onto square `to` would do, ignoring whether it is next
// to it.
export function outcomeAt(s: State, e: Element, to: number): Outcome {
  if (elementsIn(s).some((o) => s.at[o] === to && !together(s, e, o, to)))
    return 'blocked';
  const tile = s.tiles[to];
  const by = GATE[tile];
  return outcome(e, tile, by ? isHeld(s, by, e) : false);
}

// Where air, heading from square `from` to the square next to it `to`,
// stops: it keeps going the same way until the next square is the edge or
// something it can't fly over. `from` itself if it can't go at all.
export function slideEnd(b: Board, s: State, from: number, to: number) {
  const step = to - from;
  let at = from;
  let next = to;
  while (outcomeAt(s, 'air', next) === 'step') {
    at = next;
    next = at + step;
    // Off the board, or round onto the next row.
    if (!isNextTo(b, at, next)) break;
  }
  return at;
}

// The state after `e` tries to move to square `to`, or the same state if
// it can't. Air goes on past `to` until something stops it.
export function move(b: Board, s: State, e: Element, to: number): State {
  const from = s.at[e];
  if (from === undefined || !isNextTo(b, from, to)) return s;
  if (e === 'air') {
    const end = slideEnd(b, s, from, to);
    return end === from ? s : { ...s, at: { ...s.at, air: end } };
  }
  const beyond = pushTo(b, s, e, from, to);
  if (beyond !== undefined) {
    const tiles = s.tiles.slice();
    tiles[beyond] = tiles[beyond] === 'water' ? 'bridge' : 'boulder';
    tiles[to] = 'grass';
    return { tiles, at: { ...s.at, [e]: to } };
  }
  const result = outcomeAt(s, e, to);
  if (result === 'blocked') return s;
  if (result === 'step') return { ...s, at: { ...s.at, [e]: to } };
  const tiles = s.tiles.slice();
  tiles[to] = result.becomes;
  return { ...s, tiles };
}

// Everyone is on their own place at once.
export function isWon(s: State): boolean {
  const everyone = elementsIn(s);
  return (
    everyone.length > 0 &&
    everyone.every((e) => s.tiles[s.at[e]!] === HOME_OF[e])
  );
}

// The squares `e` can walk to without changing anything, each with the
// way there (not counting where it stands): the squares it steps on, one
// by one. For air, the squares it can stop on, and the way there is the
// square it heads for at the start of each slide.
export function walks(b: Board, s: State, e: Element): Map<number, number[]> {
  const start = s.at[e]!;
  const ways = new Map<number, number[]>([[start, []]]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    const here = { ...s, at: { ...s.at, [e]: i } };
    for (const n of neighbours(b, i)) {
      if (outcomeAt(here, e, n) !== 'step') continue;
      const end = e === 'air' ? slideEnd(b, here, i, n) : n;
      if (!ways.has(end)) {
        ways.set(end, [...ways.get(i)!, n]);
        queue.push(end);
      }
    }
  }
  ways.delete(start);
  return ways;
}

export const keyOf = (s: State) =>
  s.tiles.join() + '|' + ELEMENTS.map((e) => s.at[e] ?? '').join();

function nextStates(b: Board, s: State, movers: readonly Element[]): State[] {
  const out: State[] = [];
  for (const e of movers)
    for (const to of neighbours(b, s.at[e]!)) {
      const next = move(b, s, e, to);
      if (next !== s) out.push(next);
    }
  return out;
}

// The fewest single steps to win, or -1 if it can't be won from here. Only
// `movers` may move (everyone by default).
export function movesToWin(
  b: Board,
  start: State,
  movers: readonly Element[] = elementsIn(start)
): number {
  if (isWon(start)) return 0;
  const seen = new Set([keyOf(start)]);
  let layer = [start];
  for (let depth = 1; layer.length; depth++) {
    const next: State[] = [];
    for (const s of layer)
      for (const n of nextStates(b, s, movers)) {
        if (isWon(n)) return depth;
        const k = keyOf(n);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(n);
        }
      }
    layer = next;
  }
  return -1;
}

// The states one tap away: someone walks somewhere, or walks up to a tile
// and changes it.
function tapsFrom(b: Board, s: State): { s: State; who: Element }[] {
  const out: { s: State; who: Element }[] = [];
  for (const e of elementsIn(s)) {
    const ways = walks(b, s, e);
    for (const to of [s.at[e]!, ...ways.keys()]) {
      const there = to === s.at[e] ? s : { ...s, at: { ...s.at, [e]: to } };
      if (to !== s.at[e]) out.push({ s: there, who: e });
      for (const n of neighbours(b, to)) {
        const changed = move(b, there, e, n);
        if (changed.tiles !== there.tiles) out.push({ s: changed, who: e });
      }
    }
  }
  return out;
}

// The fewest taps to win, and how often the one moving changes on that
// way, or undefined if it can't be won.
export function tapsToWin(
  b: Board,
  start: State
): { taps: number; switches: number } | undefined {
  if (isWon(start)) return { taps: 0, switches: 0 };
  type Node = { s: State; who?: Element; switches: number };
  const seen = new Set([keyOf(start)]);
  let layer: Node[] = [{ s: start, switches: 0 }];
  for (let taps = 1; layer.length; taps++) {
    const next: Node[] = [];
    let best: number | undefined;
    for (const node of layer)
      for (const { s, who } of tapsFrom(b, node.s)) {
        const switches = node.switches + (node.who && node.who !== who ? 1 : 0);
        if (isWon(s)) best = Math.min(best ?? Infinity, switches);
        const k = keyOf(s);
        if (!seen.has(k)) {
          seen.add(k);
          next.push({ s, who, switches });
        }
      }
    if (best !== undefined) return { taps, switches: best };
    layer = next;
  }
  return undefined;
}
