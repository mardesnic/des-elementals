import { describe, expect, it } from 'vitest';

import {
  boardOf,
  movesToWin,
  parse,
  tapsToWin,
  type Level,
} from '../src/lib/elementals';
import { noDeadEnds, solvable, taps } from './solver';

// The game's own rules, slow but plain, to check the fast solver by.
const rules = (rows: string[]) => {
  const level: Level = { id: 'test', rows };
  const b = boardOf(level);
  return {
    solvable: movesToWin(b, parse(level)) >= 0,
    taps: tapsToWin(b, parse(level)),
  };
};

// Small random boards with every kind of tile, the same every run.
function boards(count: number, friends: string, homes: string): string[][] {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tiles = '.....##~o@@*iaAbB';
  const out: string[][] = [];
  for (let n = 0; n < count; n++) {
    const cells = Array.from(
      { length: 16 },
      () => tiles[Math.floor(rnd() * tiles.length)]
    );
    const free = [...cells.keys()].sort(() => rnd() - 0.5);
    [...friends, ...homes].forEach((ch, k) => (cells[free[k]] = ch));
    out.push([0, 4, 8, 12].map((i) => cells.slice(i, i + 4).join('')));
  }
  return out;
}

describe('solver', () => {
  it.each([
    ['fire', 'F', 't'],
    ['fire and water', 'FW', 'ts'],
    ['fire, water and earth', 'FWE', 'tse'],
  ])('agrees with the game on boards with %s', (_, friends, homes) => {
    let won = 0;
    for (const rows of boards(150, friends, homes)) {
      const game = rules(rows);
      expect(solvable(rows), rows.join('/')).toBe(game.solvable);
      expect(taps(rows), rows.join('/')).toEqual(game.taps);
      if (game.solvable) won++;
    }
    // Enough of them can be won to mean something.
    expect(won).toBeGreaterThan(10);
  });

  it('finds a dead end: a stone pushed the wrong way for good', () => {
    // Earth must push the stone right, into the water as a bridge; pushed
    // down instead, it can never reach the water again.
    expect(solvable(['E@~e', '#..#'])).toBe(true);
    expect(noDeadEnds(['.E.#', '.@~e', '#..#'])).toBe(false);
  });
});
