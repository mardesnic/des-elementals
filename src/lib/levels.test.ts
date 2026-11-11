import { describe, expect, it } from 'vitest';

import {
  ELEMENTS,
  boardOf,
  elementsIn,
  isWon,
  move,
  movesToWin,
  neighbours,
  parse,
  type State,
} from './elementals';
import { LEVELS } from './levels';

const keyOf = (s: State) =>
  s.tiles.join() + '|' + ELEMENTS.map((e) => s.at[e] ?? '').join();

// How many reachable positions can no longer be won. Walks every move from
// the start, then works back from the wins.
function deadEnds(level: (typeof LEVELS)[number]): number {
  const b = boardOf(level);
  const start = parse(level);
  const states = new Map([[keyOf(start), start]]);
  const from = new Map<string, string[]>();
  const queue = [start];
  while (queue.length) {
    const s = queue.pop()!;
    if (isWon(b, s)) continue;
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
  const good = new Set(
    [...states].filter(([, s]) => isWon(b, s)).map(([k]) => k)
  );
  const back = [...good];
  while (back.length)
    for (const k of from.get(back.pop()!) ?? [])
      if (!good.has(k)) {
        good.add(k);
        back.push(k);
      }
  return states.size - good.size;
}

describe('levels', () => {
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

  it.each(LEVELS)('$id has fire and water, not yet together', (level) => {
    const s = parse(level);
    expect(elementsIn(s)).toEqual(['fire', 'water']);
    expect(isWon(boardOf(level), s)).toBe(false);
  });

  it.each(LEVELS)('$id can be won', (level) => {
    expect(movesToWin(boardOf(level), parse(level))).toBeGreaterThan(0);
  });

  it.each(LEVELS.slice(3))('$id takes both', (level) => {
    const b = boardOf(level);
    const s = parse(level);
    expect(movesToWin(b, s, ['fire'])).toBe(-1);
    expect(movesToWin(b, s, ['water'])).toBe(-1);
  });

  // No way to lose: whatever a kid does, the level can still be won.
  it.each(LEVELS)('$id has no dead ends', (level) => {
    expect(deadEnds(level)).toBe(0);
  });
});
