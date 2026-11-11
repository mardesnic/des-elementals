import { describe, expect, it } from 'vitest';

import { solvable } from '../../scripts/solver';
import {
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
import { LEVELS } from './levels';

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

  it.each(LEVELS)('$id has fire, water and a heart of two', (level) => {
    const s = parse(level);
    expect(elementsIn(s)).toEqual(['fire', 'water']);
    expect(s.tiles.filter((t) => t === 'goal')).toHaveLength(2);
    expect(isWon(s)).toBe(false);
  });

  it.each(LEVELS)('$id can be won', (level) => {
    const b = boardOf(level);
    expect(movesToWin(b, parse(level))).toBeGreaterThan(0);
    expect(tapsToWin(b, parse(level))).toBeDefined();
  });

  // Turning any obstacle into rock makes the level impossible, so each one
  // has to be used.
  it.each(LEVELS)('$id needs every obstacle', (level) => {
    const flat = level.rows.join('');
    const w = level.rows[0].length;
    for (let i = 0; i < flat.length; i++) {
      if (!'*iaAbB'.includes(flat[i])) continue;
      const rows = level.rows.map((r, y) =>
        y === Math.floor(i / w)
          ? r.slice(0, i % w) + '#' + r.slice((i % w) + 1)
          : r
      );
      expect(solvable(rows), `square ${i}`).toBe(false);
    }
  });

  // No way to lose: whatever a kid does, the level can still be won.
  it.each(LEVELS)('$id has no dead ends', (level) => {
    expect(deadEnds(level)).toBe(0);
  });
});
