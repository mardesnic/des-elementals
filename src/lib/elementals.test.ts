import { describe, expect, it } from 'vitest';

import {
  boardOf,
  doorsOpen,
  isWon,
  move,
  movesToWin,
  outcome,
  parse,
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

  it('opens doors only while a button is held', () => {
    expect(outcome('fire', 'door', true)).toBe('step');
    expect(outcome('fire', 'door', false)).toBe('blocked');
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

  it('opens the door while someone stands on the button', () => {
    const { b, s } = setup('FD.', '#..', 'Wo.');
    expect(move(b, s, 'fire', 1)).toBe(s);
    const held = move(b, s, 'water', 7);
    expect(doorsOpen(held)).toBe(true);
    expect(move(b, held, 'fire', 1).at.fire).toBe(1);
  });

  it('does not let the one on the button walk into a door', () => {
    const { b, s } = setup('oD.', 'F#W');
    const onButton = move(b, s, 'fire', 0);
    expect(move(b, onButton, 'fire', 1)).toBe(onButton);
  });

  it('lets someone in the doorway leave after the button is let go', () => {
    const { b, s } = setup('FD..', '##o#', '##W#');
    let next = move(b, s, 'water', 6);
    next = move(b, next, 'fire', 1);
    next = move(b, next, 'water', 10);
    expect(doorsOpen(next)).toBe(false);
    expect(move(b, next, 'fire', 2).at.fire).toBe(2);
    expect(move(b, next, 'fire', 0).at.fire).toBe(0);
  });
});

describe('isWon', () => {
  it('is won when they stand side by side', () => {
    const together = setup('FW');
    expect(isWon(together.b, together.s)).toBe(true);
    const { b, s } = setup('F.', '.W');
    expect(isWon(b, s)).toBe(false);
  });
});

describe('movesToWin', () => {
  it('finds the shortest way', () => {
    const { b, s } = setup('F...W');
    expect(movesToWin(b, s)).toBe(3);
    expect(movesToWin(b, s, ['fire'])).toBe(3);
  });

  it('says when it cannot be won', () => {
    const { b, s } = setup('F#W');
    expect(movesToWin(b, s)).toBe(-1);
  });
});
