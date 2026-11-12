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
  const tiles = '.....##~o@@*iaAbBvV';
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
    ['fire and air', 'FZ', 'tm'],
    ['earth and air', 'EZ', 'em'],
    ['the man and the woman, with fire', 'FML', 'thh'],
    // The game's rules are slow with four, so fewer boards.
    ['all four', 'FWEZ', 'tsem', 25],
  ])(
    'agrees with the game on boards with %s',
    (_, friends, homes, count = 150) => {
      let won = 0;
      for (const rows of boards(count, friends, homes)) {
        const game = rules(rows);
        expect(solvable(rows), rows.join('/')).toBe(game.solvable);
        expect(taps(rows), rows.join('/')).toEqual(game.taps);
        if (game.solvable) won++;
      }
      // Enough of them can be won to mean something.
      expect(won).toBeGreaterThan(count / 15);
    },
    30000
  );

  it('finds a dead end: a stone pushed the wrong way for good', () => {
    // Earth must push the stone right, into the water as a bridge; pushed
    // down instead, it can never reach the water again.
    expect(solvable(['E@~e', '#..#'])).toBe(true);
    expect(noDeadEnds(['.E.#', '.@~e', '#..#'])).toBe(false);
  });

  it('lets air fly straight on until something stops it', () => {
    // Over water and a hole, to the rock.
    expect(solvable(['Z~om#'])).toBe(true);
    expect(solvable(['Z~om.#'])).toBe(false);
    // Stopped by a friend standing in the way.
    expect(solvable(['Z.mt.F'])).toBe(true);
    // One tap can take it on several slides, back over where it started.
    expect(taps(['#.Z..', '.m#..'])?.taps).toBe(1);
  });

  it('can leave out bridges, to tell if a level needs one', () => {
    expect(solvable(['E@~e'])).toBe(true);
    expect(solvable(['E@~e'], false)).toBe(false);
    expect(solvable(['E@.e'], false)).toBe(false);
    expect(solvable(['E.e@'], false)).toBe(true);
  });
});
