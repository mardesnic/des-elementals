import { describe, expect, it } from 'vitest';

import {
  boardOf,
  isOpen,
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

  it('opens doors only while their button is held', () => {
    expect(outcome('fire', 'doorA', true)).toBe('step');
    expect(outcome('fire', 'doorB', false)).toBe('blocked');
  });

  it('lets everyone onto the meeting place', () => {
    expect(outcome('fire', 'goal', false)).toBe('step');
    expect(outcome('water', 'goal', false)).toBe('step');
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

  it('opens only the doors of the colour held', () => {
    const { b, s } = setup('FAB', '#..', 'Wab');
    expect(move(b, s, 'fire', 1)).toBe(s);
    const held = move(b, s, 'water', 7);
    expect(isOpen(held, 'A')).toBe(true);
    expect(isOpen(held, 'B')).toBe(false);
    expect(move(b, held, 'fire', 1).at.fire).toBe(1);
  });

  it('does not let the one on the button walk into its door', () => {
    const { b, s } = setup('aA.', 'F#W');
    const onButton = move(b, s, 'fire', 0);
    expect(move(b, onButton, 'fire', 1)).toBe(onButton);
  });

  it('lets someone in the doorway leave after the button is let go', () => {
    const { b, s } = setup('FA..', '##a#', '##W#');
    let next = move(b, s, 'water', 6);
    next = move(b, next, 'fire', 1);
    next = move(b, next, 'water', 10);
    expect(isOpen(next, 'A')).toBe(false);
    expect(shownOpen(next, 1)).toBe(true);
    expect(move(b, next, 'fire', 2).at.fire).toBe(2);
    expect(move(b, next, 'fire', 0).at.fire).toBe(0);
  });
});

describe('isWon', () => {
  it('is won when everyone is on the meeting place', () => {
    expect(isWon(setup('Fhh', '..W').s)).toBe(false);
    const { b, s } = setup('Fhh', '..W');
    const one = move(b, s, 'fire', 1);
    expect(isWon(one)).toBe(false);
    expect(isWon(move(b, one, 'water', 2))).toBe(true);
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
    const { b, s } = setup('F.hhW');
    expect(movesToWin(b, s)).toBe(3);
    expect(movesToWin(b, s, ['fire'])).toBe(-1);
  });

  it('count taps, a whole walk being one', () => {
    const { b, s } = setup('F....', '.....', '..hh.', '.....', '....W');
    expect(tapsToWin(b, s)?.taps).toBe(2);
  });

  it('count melting as a tap', () => {
    const { b, s } = setup('Fh.iW', '#h###');
    // Fire walks up to the ice and melts it, then walks down to the heart;
    // water swims through to the other half.
    expect(tapsToWin(b, s)?.taps).toBe(3);
  });

  it('say when it cannot be won', () => {
    const { b, s } = setup('F#hhW');
    expect(movesToWin(b, s)).toBe(-1);
    expect(tapsToWin(b, s)).toBeUndefined();
  });
});
