import { describe, expect, it } from 'vitest';

import {
  isFresh,
  levelById,
  newGame,
  nextLevel,
  nudge,
  recordWin,
  savedGame,
  tap,
} from './game';
import { LEVELS } from './levels';

// meet:
//   F....
//   .###.
//   .....
//   .###.
//   ....W
const meet = () => newGame(levelById('meet')!);

describe('tap', () => {
  it('moves the active one to a square next to it', () => {
    const { game, stuck } = tap(meet(), 1);
    expect(game.state.at.fire).toBe(1);
    expect(stuck).toBeUndefined();
  });

  it('picks the one that is tapped', () => {
    const { game } = tap(meet(), 24);
    expect(game.active).toBe('water');
    expect(game.state).toEqual(meet().state);
  });

  it('moves the other one when the square is only next to it', () => {
    const { game } = tap(meet(), 23);
    expect(game.active).toBe('water');
    expect(game.state.at.water).toBe(23);
  });

  it('says who is stuck when the way is blocked', () => {
    const { game, stuck } = tap(tap(meet(), 1).game, 6);
    expect(stuck).toBe('fire');
    expect(game.state.at.fire).toBe(1);
  });

  it('ignores squares far from everyone', () => {
    const start = meet();
    expect(tap(start, 12).game).toBe(start);
  });

  it('wins when they meet', () => {
    let game = meet();
    for (const i of [1, 2, 3, 4, 9, 14]) game = tap(game, i).game;
    expect(game.won).toBe(false);
    game = tap(game, 19).game;
    expect(game.won).toBe(true);
    expect(tap(game, 18).game).toBe(game);
  });
});

describe('isFresh', () => {
  it('is fresh until something moves', () => {
    expect(isFresh(meet())).toBe(true);
    expect(isFresh(tap(meet(), 24).game)).toBe(true);
    expect(isFresh(tap(meet(), 1).game)).toBe(false);
  });
});

describe('nudge', () => {
  it('moves the active one by a step', () => {
    expect(nudge(meet(), 1, 0).game.state.at.fire).toBe(1);
    expect(nudge(meet(), 0, 1).game.state.at.fire).toBe(5);
  });

  it('stops at the edge', () => {
    const { game, stuck } = nudge(meet(), -1, 0);
    expect(stuck).toBe('fire');
    expect(game.state.at.fire).toBe(0);
  });
});

describe('savedGame', () => {
  it('keeps a game of a level that is still there', () => {
    const game = meet();
    expect(savedGame(game)).toBe(game);
  });

  it('drops a game of a level that is gone or changed', () => {
    expect(savedGame(undefined)).toBeUndefined();
    expect(savedGame({ ...meet(), level: 'gone' })).toBeUndefined();
    const game = meet();
    const smaller = { ...game.state, tiles: game.state.tiles.slice(1) };
    expect(savedGame({ ...game, state: smaller })).toBeUndefined();
  });
});

describe('progress', () => {
  it('records each win once', () => {
    expect(recordWin(['meet'], meet())).toEqual(['meet']);
    expect(recordWin([], meet())).toEqual(['meet']);
  });

  it('goes on to the next level not yet won', () => {
    expect(nextLevel('meet', []).id).toBe(LEVELS[1].id);
    expect(nextLevel('meet', [LEVELS[1].id]).id).toBe(LEVELS[2].id);
    const last = LEVELS.at(-1)!.id;
    expect(nextLevel(last, [LEVELS[0].id]).id).toBe(LEVELS[1].id);
    const all = LEVELS.map((l) => l.id);
    expect(nextLevel(last, all).id).toBe(LEVELS[0].id);
  });
});
