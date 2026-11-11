// The rules: a few element friends on a small board of tiles, who win when
// every one of them stands on the meeting place.

export const ELEMENTS = ['fire', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];

// One letter a tile in a level's map.
export const TILES = {
  '.': 'grass',
  '#': 'rock',
  '~': 'water',
  i: 'ice',
  '*': 'bramble',
  a: 'buttonA',
  A: 'doorA',
  b: 'buttonB',
  B: 'doorB',
  h: 'goal',
} as const;
export type Tile = (typeof TILES)[keyof typeof TILES];

// Buttons open the doors of their own colour.
export type Colour = 'A' | 'B';
const BUTTON: Partial<Record<Tile, Colour>> = { buttonA: 'A', buttonB: 'B' };
const DOOR: Partial<Record<Tile, Colour>> = { doorA: 'A', doorB: 'B' };
export const doorColour = (t: Tile) => DOOR[t];
export const buttonColour = (t: Tile) => BUTTON[t];

// Where each element starts, written on grass.
const STARTS: Record<string, Element> = { F: 'fire', W: 'water' };

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

// Doors of a colour are open while anyone stands on a button of that
// colour. `besides` is left out, as the one moving can't hold a button and
// walk through at once.
export function isOpen(s: State, colour: Colour, besides?: Element): boolean {
  return elementsIn(s).some(
    (e) => e !== besides && BUTTON[s.tiles[s.at[e]!]] === colour
  );
}

// Whether the door on square i shows open: its button is held, or someone
// stands in the doorway.
export function shownOpen(s: State, i: number): boolean {
  const colour = DOOR[s.tiles[i]];
  if (!colour) return false;
  return isOpen(s, colour) || elementsIn(s).some((e) => s.at[e] === i);
}

// What happens when an element moves onto a tile: it steps on, can't go,
// or changes the tile and stays where it is.
export type Outcome = 'step' | 'blocked' | { becomes: Tile };

// `open` says whether the tile, if it is a door, is open.
export function outcome(e: Element, tile: Tile, open: boolean): Outcome {
  switch (tile) {
    case 'grass':
    case 'goal':
    case 'buttonA':
    case 'buttonB':
      return 'step';
    case 'doorA':
    case 'doorB':
      return open ? 'step' : 'blocked';
    case 'rock':
      return 'blocked';
    case 'water':
      return e === 'water' ? 'step' : 'blocked';
    case 'ice':
      return e === 'fire' ? { becomes: 'water' } : 'blocked';
    case 'bramble':
      return e === 'fire' ? { becomes: 'grass' } : 'blocked';
  }
}

// What `e` moving onto square `to` would do, ignoring whether it is next
// to it.
export function outcomeAt(s: State, e: Element, to: number): Outcome {
  if (elementsIn(s).some((o) => s.at[o] === to)) return 'blocked';
  const tile = s.tiles[to];
  const colour = DOOR[tile];
  return outcome(e, tile, colour ? isOpen(s, colour, e) : false);
}

// The state after `e` tries to move to square `to`, or the same state if
// it can't.
export function move(b: Board, s: State, e: Element, to: number): State {
  const from = s.at[e];
  if (from === undefined || !isNextTo(b, from, to)) return s;
  const result = outcomeAt(s, e, to);
  if (result === 'blocked') return s;
  if (result === 'step') return { ...s, at: { ...s.at, [e]: to } };
  const tiles = s.tiles.slice();
  tiles[to] = result.becomes;
  return { ...s, tiles };
}

// Everyone is on the meeting place.
export function isWon(s: State): boolean {
  const everyone = elementsIn(s);
  return (
    everyone.length > 0 && everyone.every((e) => s.tiles[s.at[e]!] === 'goal')
  );
}

// The squares `e` can walk to without changing anything, each with the
// way there (not counting where it stands).
export function walks(b: Board, s: State, e: Element): Map<number, number[]> {
  const start = s.at[e]!;
  const ways = new Map<number, number[]>([[start, []]]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    const here = { ...s, at: { ...s.at, [e]: i } };
    for (const n of neighbours(b, i))
      if (!ways.has(n) && outcomeAt(here, e, n) === 'step') {
        ways.set(n, [...ways.get(i)!, n]);
        queue.push(n);
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
