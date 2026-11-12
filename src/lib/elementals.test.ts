import { describe, expect, it } from 'vitest';

import {
  boardOf,
  isAwake,
  isHeld,
  isWon,
  move,
  movesToWin,
  outcome,
  parse,
  shownOpen,
  tapsToWin,
  walks,
  type Level,
} from './elementals';

const setup = (...rows: string[]) => {
  const level: Level = { id: 'test', rows };
  return { b: boardOf(level), s: parse(level) };
};

describe('outcome', () => {
  it('lets only water swim', () => {
    expect(outcome('water', 'water', false)).toBe('step');
    expect(outcome('fire', 'water', false)).toBe('blocked');
  });

  it('lets fire melt ice into water and burn coals to grass', () => {
    expect(outcome('fire', 'ice', false)).toEqual({ becomes: 'water' });
    expect(outcome('fire', 'coal', false)).toEqual({ becomes: 'grass' });
    expect(outcome('water', 'ice', false)).toBe('blocked');
    expect(outcome('water', 'coal', false)).toBe('blocked');
  });

  it('lets through gates only while they are held up', () => {
    expect(outcome('water', 'grate', true)).toBe('step');
    expect(outcome('fire', 'sluice', false)).toBe('blocked');
  });

  it('lets everyone onto the places and things to hold', () => {
    for (const tile of [
      'fireTemple',
      'waterTemple',
      'brazier',
      'wheel',
    ] as const) {
      expect(outcome('fire', tile, false)).toBe('step');
      expect(outcome('water', tile, false)).toBe('step');
    }
  });
});

describe('move', () => {
  it('steps one square onto grass', () => {
    const { b, s } = setup('F..', '...', '..W');
    expect(move(b, s, 'fire', 1).at.fire).toBe(1);
  });

  it('ignores squares that are not next to the element', () => {
    const { b, s } = setup('F..', '...', '..W');
    expect(move(b, s, 'fire', 2)).toBe(s);
    expect(move(b, s, 'fire', 4)).toBe(s);
  });

  it('does not wrap around the edge of the board', () => {
    const { b, s } = setup('..F', 'W..');
    expect(move(b, s, 'fire', 3)).toBe(s);
  });

  it('does not step onto someone else', () => {
    const { b, s } = setup('FW.');
    expect(move(b, s, 'fire', 1)).toBe(s);
  });

  it('melts ice without moving, leaving water', () => {
    const { b, s } = setup('Fi.', '..W');
    const next = move(b, s, 'fire', 1);
    expect(next.at.fire).toBe(0);
    expect(next.tiles[1]).toBe('water');
    expect(s.tiles[1]).toBe('ice');
  });

  it('raises the grate while fire holds the brazier', () => {
    const { b, s } = setup('WA.', '#..', 'Fa.');
    expect(move(b, s, 'water', 1)).toBe(s);
    const held = move(b, s, 'fire', 7);
    expect(isHeld(held, 'fire')).toBe(true);
    expect(shownOpen(held, 1)).toBe(true);
    expect(move(b, held, 'water', 1).at.water).toBe(1);
  });

  it('raises the sluice while water turns the wheel', () => {
    const { b, s } = setup('FB.', '#..', 'Wb.');
    expect(move(b, s, 'fire', 1)).toBe(s);
    const held = move(b, s, 'water', 7);
    expect(move(b, held, 'fire', 1).at.fire).toBe(1);
  });

  it('does nothing when the wrong one holds', () => {
    const { b, s } = setup('WA.', '#..', 'Fb.', 'a..');
    const wrong = move(b, move(b, s, 'fire', 7), 'water', 1);
    expect(isHeld(wrong, 'fire')).toBe(false);
    expect(isAwake(wrong, 7)).toBe(false);
    expect(shownOpen(wrong, 1)).toBe(false);
    expect(wrong.at.water).toBe(0);
  });

  it('does not let fire walk through the grate it holds up', () => {
    const { b, s } = setup('aA.', 'F#W');
    const holding = move(b, s, 'fire', 0);
    expect(move(b, holding, 'fire', 1)).toBe(holding);
  });

  it('lets someone in a gate leave after it is let go', () => {
    const { b, s } = setup('WA..', '##a#', '##F#');
    let next = move(b, s, 'fire', 6);
    next = move(b, next, 'water', 1);
    next = move(b, next, 'fire', 10);
    expect(isHeld(next, 'fire')).toBe(false);
    expect(shownOpen(next, 1)).toBe(true);
    expect(move(b, next, 'water', 2).at.water).toBe(2);
    expect(move(b, next, 'water', 0).at.water).toBe(0);
  });
});

describe('isWon', () => {
  it('is won when fire and water are each in their own temple', () => {
    const { b, s } = setup('Fts', '..W');
    const one = move(b, s, 'fire', 1);
    expect(isWon(one)).toBe(false);
    expect(isAwake(one, 1)).toBe(true);
    const both = move(b, one, 'water', 2);
    expect(isAwake(both, 2)).toBe(true);
    expect(isWon(both)).toBe(true);
  });

  it('is not won the other way round', () => {
    const { b, s } = setup('Fst', '..W');
    const swapped = move(b, move(b, s, 'fire', 1), 'water', 2);
    expect(swapped.at).toEqual({ fire: 1, water: 2 });
    expect(isAwake(swapped, 1)).toBe(false);
    expect(isWon(swapped)).toBe(false);
  });
});

describe('walks', () => {
  it('finds the shortest way to every square in reach', () => {
    const { b, s } = setup('F.#', '..~', '#.W');
    const ways = walks(b, s, 'fire');
    expect(ways.get(7)).toEqual([1, 4, 7]);
    expect(ways.has(5)).toBe(false);
    expect(ways.has(0)).toBe(false);
    expect(walks(b, s, 'water').has(5)).toBe(true);
  });
});

describe('solvers', () => {
  it('count single steps', () => {
    const { b, s } = setup('F.tsW');
    expect(movesToWin(b, s)).toBe(3);
    expect(movesToWin(b, s, ['fire'])).toBe(-1);
  });

  it('count taps, a whole walk being one', () => {
    const { b, s } = setup('F....', '.....', '..ts.', '.....', '....W');
    expect(tapsToWin(b, s)?.taps).toBe(2);
  });

  it('count melting as a tap', () => {
    const { b, s } = setup('Fs.iW', '#t###');
    // Fire walks up to the ice and melts it, then down to its temple; water
    // swims through to its own.
    expect(tapsToWin(b, s)?.taps).toBe(3);
  });

  it('say when it cannot be won', () => {
    const { b, s } = setup('F#tsW');
    expect(movesToWin(b, s)).toBe(-1);
    expect(tapsToWin(b, s)).toBeUndefined();
  });
});

describe('earth', () => {
  it('fills a pit, which nobody else can cross', () => {
    expect(outcome('earth', 'pit', false)).toEqual({ becomes: 'grass' });
    expect(outcome('fire', 'pit', false)).toBe('blocked');
    expect(outcome('water', 'pit', false)).toBe('blocked');
    expect(outcome('earth', 'water', false)).toBe('blocked');
    expect(outcome('earth', 'ice', false)).toBe('blocked');
    expect(outcome('earth', 'coal', false)).toBe('blocked');
  });

  it('pushes a round stone onto grass and walks after it', () => {
    const { b, s } = setup('E@.');
    const next = move(b, s, 'earth', 1);
    expect(next.tiles).toEqual(['grass', 'grass', 'boulder']);
    expect(next.at.earth).toBe(1);
  });

  it('pushes a round stone into water, where it is a bridge for all', () => {
    const { b, s } = setup('E@~F');
    const next = move(b, s, 'earth', 1);
    expect(next.tiles[2]).toBe('bridge');
    expect(move(b, next, 'fire', 2).at.fire).toBe(2);
    // A bridge stays where it is.
    expect(move(b, next, 'earth', 2).at.earth).toBe(2);
    expect(move(b, next, 'earth', 2).tiles[2]).toBe('bridge');
  });

  it("can't push a stone into a rock, a friend, a temple or off the board", () => {
    for (const rows of [['E@#'], ['E@F'], ['E@t'], ['E@'], ['E@i']]) {
      const { b, s } = setup(...rows);
      expect(move(b, s, 'earth', 1)).toBe(s);
    }
  });

  it("doesn't push a stone at the end of a row onto the next row", () => {
    const { b, s } = setup('.E@', '...');
    expect(move(b, s, 'earth', 2)).toBe(s);
  });

  it('is the only one who pushes', () => {
    const { b, s } = setup('F@.', 'W@.');
    expect(move(b, s, 'fire', 1)).toBe(s);
    expect(move(b, s, 'water', 4)).toBe(s);
  });

  it('goes through a grate fire holds up', () => {
    const { b, s } = setup('FaE', '.A.');
    const held = move(b, s, 'fire', 1);
    const near = move(b, held, 'earth', 5);
    expect(move(b, near, 'earth', 4).at.earth).toBe(4);
    expect(move(b, move(b, s, 'earth', 5), 'earth', 4).at.earth).toBe(5);
  });

  it('wins only when all three are home', () => {
    const { b, s } = setup('Ft', 'Ws', 'Ee');
    expect(isWon(s)).toBe(false);
    const fire = move(b, s, 'fire', 1);
    const water = move(b, fire, 'water', 3);
    expect(isWon(water)).toBe(false);
    expect(isWon(move(b, water, 'earth', 5))).toBe(true);
    expect(movesToWin(b, s)).toBe(3);
    expect(tapsToWin(b, s)).toEqual({ taps: 3, switches: 2 });
  });
});

describe('air', () => {
  it('flies straight on over grass, water and holes until stopped', () => {
    const { b, s } = setup('Z.~o.#');
    expect(move(b, s, 'air', 1).at.air).toBe(4);
  });

  it('stops at the edge of the board, without going round a row', () => {
    const { b, s } = setup('Z..', '...');
    expect(move(b, s, 'air', 1).at.air).toBe(2);
    expect(move(b, s, 'air', 3).at.air).toBe(3);
  });

  it('is stopped by coals, ice, stones and friends', () => {
    for (const ch of '*i@F') {
      const { b, s } = setup(`Z..${ch}`);
      expect(move(b, s, 'air', 1).at.air).toBe(2);
    }
  });

  it('does not move at all when the square next to it is blocked', () => {
    const { b, s } = setup('Z#.');
    expect(move(b, s, 'air', 1)).toBe(s);
  });

  it('flies over its own temple without stopping there', () => {
    const { b, s } = setup('Zm..');
    const after = move(b, s, 'air', 1);
    expect(after.at.air).toBe(3);
    expect(isWon(after)).toBe(false);
    expect(isWon(move(b, setup('Z.m#').s, 'air', 1))).toBe(true);
  });

  it('holds the wind gate up for the others, but not for itself', () => {
    const { b, s } = setup('Zv', 'FV', 't.');
    const held = move(b, s, 'air', 1);
    expect(isHeld(held, 'air')).toBe(true);
    expect(shownOpen(held, 3)).toBe(true);
    expect(move(b, held, 'fire', 3).at.fire).toBe(3);
    expect(move(b, s, 'fire', 3).at.fire).toBe(2);
  });

  it('can be walked to only where it can stop', () => {
    const { b, s } = setup('Z...', '#...');
    const stops = walks(b, s, 'air');
    expect([...stops.keys()].sort()).toEqual([1, 3, 5, 7]);
    // The way there: the square it heads for at the start of each slide.
    expect(stops.get(5)).toEqual([1, 7, 6]);
  });
});

describe('the man and the woman', () => {
  it('walk like the others, and can do nothing special', () => {
    for (const tile of ['water', 'ice', 'coal', 'pit', 'boulder'] as const)
      expect(outcome('man', tile, false)).toBe('blocked');
    expect(outcome('woman', 'grass', false)).toBe('step');
  });

  it('share only their own temple, and only with each other', () => {
    const { b, s } = setup('MhL', 'F..');
    const one = move(b, s, 'man', 1);
    expect(one.at.man).toBe(1);
    expect(isAwake(one, 1)).toBe(false);
    const both = move(b, one, 'woman', 1);
    expect(both.at.woman).toBe(1);
    expect(isAwake(both, 1)).toBe(true);
    // Nobody else gets in, and the two can't share grass.
    const fireIn = move(b, setup('MhF', 'L..').s, 'fire', 1);
    expect(move(b, fireIn, 'man', 1).at.man).toBe(0);
    const { s: g } = setup('ML.', 'h..');
    expect(move(b, g, 'man', 1).at.man).toBe(0);
  });

  it('win only with everyone home', () => {
    const { b, s } = setup('Mh', 'L.');
    const there = move(b, move(b, s, 'man', 1), 'woman', 3);
    expect(isWon(there)).toBe(false);
    expect(isWon(move(b, there, 'woman', 1))).toBe(true);
  });
});
