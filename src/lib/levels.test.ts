import { describe, expect, it } from 'vitest';

import { solvable } from '../../scripts/solver';
import {
  ELEMENTS,
  boardOf,
  elementsIn,
  isWon,
  keyOf,
  move,
  movesToWin,
  neighbours,
  parse,
  tapsToWin,
  type Level,
  type State,
} from './elementals';
import { LEVELS, WORLDS, hintFor, worldOf } from './levels';

// How many reachable positions can no longer be won. Walks every move from
// the start, then works back from the wins.
function deadEnds(level: Level): number {
  const b = boardOf(level);
  const start = parse(level);
  const states = new Map([[keyOf(start), start]]);
  const from = new Map<string, string[]>();
  const queue: State[] = [start];
  while (queue.length) {
    const s = queue.pop()!;
    if (isWon(s)) continue;
    for (const e of elementsIn(s))
      for (const to of neighbours(b, s.at[e]!)) {
        const n = move(b, s, e, to);
        if (n === s) continue;
        const k = keyOf(n);
        from.set(k, [...(from.get(k) ?? []), keyOf(s)]);
        if (!states.has(k)) {
          states.set(k, n);
          queue.push(n);
        }
      }
  }
  const good = new Set([...states].filter(([, s]) => isWon(s)).map(([k]) => k));
  const back = [...good];
  while (back.length)
    for (const k of from.get(back.pop()!) ?? [])
      if (!good.has(k)) {
        good.add(k);
        back.push(k);
      }
  return states.size - good.size;
}

// With all four friends, checking a level with the game's own rules takes
// a while.
const SLOW = 300_000;

describe('levels', () => {
  it('are there', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(20);
  });

  it('have unique ids', () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(LEVELS)('$id is a rectangle at most 7 wide', (level) => {
    const width = level.rows[0].length;
    expect(width).toBeLessThanOrEqual(7);
    expect(level.rows.length).toBeLessThanOrEqual(7);
    for (const row of level.rows) expect(row).toHaveLength(width);
  });

  it.each(LEVELS)('$id has its friends and their temples', (level) => {
    const s = parse(level);
    const world = worldOf(level);
    const friends =
      world === 'people'
        ? ELEMENTS
        : ELEMENTS.slice(0, WORLDS.indexOf(world) + 1);
    expect(elementsIn(s)).toEqual(friends);
    const temples = (tile: string) => s.tiles.filter((t) => t === tile);
    for (const e of ['fire', 'water', 'earth', 'air'])
      expect(temples(`${e}Temple`)).toHaveLength(
        friends.includes(e as 'fire') ? 1 : 0
      );
    expect(temples('heartTemple')).toHaveLength(world === 'people' ? 1 : 0);
    expect(isWon(s)).toBe(false);
  });

  it('come in worlds, one after another', () => {
    const order = LEVELS.map(worldOf).filter((w, k, a) => w !== a[k - 1]);
    expect(order).toEqual([...WORLDS]);
    expect(LEVELS.filter((l) => worldOf(l) === 'fire').length).toBeGreaterThan(
      2
    );
  });

  it('tell how to play at the start of each world', () => {
    const fire = LEVELS.findIndex((l) => worldOf(l) === 'fire');
    const both = LEVELS.findIndex((l) => worldOf(l) === 'water');
    expect(hintFor(LEVELS[fire])).toBe('fire');
    expect(hintFor(LEVELS[both])).toBe('water');
    const coal = LEVELS.findIndex((l) => l.rows.join('').includes('*'));
    expect(hintFor(LEVELS[coal])).toBe('coal');
    const earth = LEVELS.findIndex((l) => worldOf(l) === 'earth');
    expect(hintFor(LEVELS[earth])).toBe('earth');
    const stone = LEVELS.findIndex((l) => l.rows.join('').includes('@'));
    expect(worldOf(LEVELS[stone])).toBe('earth');
    expect(hintFor(LEVELS[stone])).toBe('boulder');
    const air = LEVELS.findIndex((l) => worldOf(l) === 'air');
    expect(hintFor(LEVELS[air])).toBe('air');
    const vane = LEVELS.findIndex((l) => l.rows.join('').includes('v'));
    expect(worldOf(LEVELS[vane])).toBe('air');
    expect(hintFor(LEVELS[vane])).toBe('vane');
    // One last level with the man and the woman.
    expect(LEVELS.filter((l) => worldOf(l) === 'people')).toEqual([
      LEVELS.at(-1),
    ]);
    expect(hintFor(LEVELS.at(-1)!)).toBe('people');
  });

  it('keep fire alone away from ice, which would only block it', () => {
    for (const level of LEVELS.filter((l) => worldOf(l) === 'fire'))
      expect(level.rows.join('')).not.toMatch(/[i~aAbB]/);
  });

  it('bring in the brazier and the wheel each on its own first', () => {
    const first = (ch: string) =>
      LEVELS.findIndex((l) => l.rows.join('').includes(ch));
    const kinds = (n: number) =>
      new Set(LEVELS[n].rows.join('').replace(/[.#FWEtse]/g, ''));
    for (const ch of 'ab') expect(kinds(first(ch)).size).toBe(2);
  });

  it.each(LEVELS)(
    '$id can be won',
    (level) => {
      expect(solvable(level.rows)).toBe(true);
      const b = boardOf(level);
      expect(movesToWin(b, parse(level))).toBeGreaterThan(0);
      expect(tapsToWin(b, parse(level))).toBeDefined();
    },
    SLOW
  );

  // Turning any obstacle into rock makes the level impossible, so each one
  // has to be used.
  it.each(LEVELS)('$id needs every obstacle', (level) => {
    const flat = level.rows.join('');
    const w = level.rows[0].length;
    for (let i = 0; i < flat.length; i++) {
      if (!'*iaAbBo@vV'.includes(flat[i])) continue;
      const rows = level.rows.map((r, y) =>
        y === Math.floor(i / w)
          ? r.slice(0, i % w) + '#' + r.slice((i % w) + 1)
          : r
      );
      expect(solvable(rows), `square ${i}`).toBe(false);
    }
  });

  // Where there are water and a round stone, the stone has to become a
  // bridge.
  it.each(
    LEVELS.filter((l) => /~/.test(l.rows.join('')) && /@/.test(l.rows.join('')))
  )('$id needs a bridge', (level) =>
    expect(solvable(level.rows, false)).toBe(false)
  );

  it('have several levels with a bridge', () => {
    const bridges = LEVELS.filter((l) => /~[^]*@|@[^]*~/.test(l.rows.join('')));
    expect(bridges.length).toBeGreaterThanOrEqual(3);
  });

  // No way to lose: whatever a kid does, the level can still be won.
  it.each(LEVELS)(
    '$id has no dead ends',
    (level) => expect(deadEnds(level)).toBe(0),
    SLOW
  );
});
