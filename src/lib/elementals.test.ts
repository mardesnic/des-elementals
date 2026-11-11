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

  it('lets fire melt ice into water and burn brambles to grass', () => {
    expect(outcome('fire', 'ice', false)).toEqual({ becomes: 'water' });
    expect(outcome('fire', 'bramble', false)).toEqual({ becomes: 'grass' });
    expect(outcome('water', 'ice', false)).toBe('blocked');
    expect(outcome('water', 'bramble', false)).toBe('blocked');
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
