// The rules: a few element friends on a small board of tiles, moved one
// square at a time, who win by standing next to each other.

export const ELEMENTS = ['fire', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];

// One letter a tile in a level's map.
export const TILES = {
  '.': 'grass',
  '#': 'rock',
  '~': 'water',
  i: 'ice',
  '*': 'bramble',
  o: 'button',
  D: 'door',
} as const;
export type Tile = (typeof TILES)[keyof typeof TILES];

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

// Doors are open while anyone stands on a button. `besides` is left out,
// as the one moving can't hold a button and walk through at once.
export function doorsOpen(s: State, besides?: Element): boolean {
  return elementsIn(s).some(
    (e) => e !== besides && s.tiles[s.at[e]!] === 'button'
  );
}

// What happens when an element moves onto a tile: it steps on, can't go,
// or changes the tile and stays where it is.
export type Outcome = 'step' | 'blocked' | { becomes: Tile };

export function outcome(e: Element, tile: Tile, open: boolean): Outcome {
  switch (tile) {
    case 'grass':
    case 'button':
      return 'step';
    case 'door':
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

// The state after `e` tries to move to square `to`, or the same state if
// it can't.
export function move(b: Board, s: State, e: Element, to: number): State {
  const from = s.at[e];
  if (from === undefined || !isNextTo(b, from, to)) return s;
  if (elementsIn(s).some((o) => s.at[o] === to)) return s;
  // Anyone in a doorway keeps the door open.
  const open = doorsOpen(s, e);
  const result = outcome(e, s.tiles[to], open);
  if (result === 'blocked') return s;
  if (result === 'step') return { ...s, at: { ...s.at, [e]: to } };
  const tiles = s.tiles.slice();
  tiles[to] = result.becomes;
  return { ...s, tiles };
}

// Everyone is next to someone, so they are all together. For two that is
// just standing side by side.
export function isWon(b: Board, s: State): boolean {
  const spots = elementsIn(s).map((e) => s.at[e]!);
  if (spots.length < 2) return false;
  // Joined up: everyone can be reached from the first through neighbours.
  const seen = new Set([spots[0]]);
  const queue = [spots[0]];
  while (queue.length) {
    const i = queue.pop()!;
    for (const n of neighbours(b, i))
      if (spots.includes(n) && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
  }
  return seen.size === spots.length;
}

const keyOf = (s: State) =>
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

// The fewest moves to win, or -1 if it can't be won from here. Only
// `movers` may move (everyone by default). Wins stop the search.
export function movesToWin(
  b: Board,
  start: State,
  movers: readonly Element[] = elementsIn(start)
): number {
  if (isWon(b, start)) return 0;
  const seen = new Set([keyOf(start)]);
  let layer = [start];
  for (let depth = 1; layer.length; depth++) {
    const next: State[] = [];
    for (const s of layer)
      for (const n of nextStates(b, s, movers)) {
        if (isWon(b, n)) return depth;
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

// Every state reachable from the start without winning on the way.
export function reachable(b: Board, start: State): State[] {
  const seen = new Map([[keyOf(start), start]]);
  const queue = [start];
  while (queue.length) {
    const s = queue.pop()!;
    if (isWon(b, s)) continue;
    for (const n of nextStates(b, s, elementsIn(s))) {
      const k = keyOf(n);
      if (!seen.has(k)) {
        seen.set(k, n);
        queue.push(n);
      }
    }
  }
  return [...seen.values()];
}
