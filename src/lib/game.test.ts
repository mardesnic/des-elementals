import { describe, expect, it } from 'vitest';

import { boardOf, walks } from './elementals';
import {
  isFresh,
  levelById,
  newGame,
  nextLevel,
  nudge,
  reachable,
  recordWin,
  savedGame,
  tap,
  type Game,
} from './game';
import { LEVELS } from './levels';

const first = () => newGame(LEVELS[0]);
const board = (g: Game) => boardOf(levelById(g.level)!);

// A square far from everyone, that the active one can't walk to.
const nowhere = (g: Game) =>
  g.state.tiles.findIndex(
    (t, i) =>
      t === 'rock' &&
      !Object.values(g.state.at).includes(i) &&
      ![...Object.values(g.state.at)].some(
        (p) => Math.abs((p as number) - i) === 1
      )
  );

describe('tap', () => {
  it('walks the active one to a square, a step at a time', () => {
    const game = first();
    const ways = walks(board(game), game.state, 'fire');
    const [to, path] = [...ways].sort((a, b) => b[1].length - a[1].length)[0];
    const { steps, stuck } = tap(game, to);
    expect(stuck).toBeUndefined();
    expect(steps.map((s) => s.state.at.fire)).toEqual(path);
  });

  it('picks the one that is tapped, without moving anyone', () => {
    const game = first();
    const { steps } = tap(game, game.state.at.water!);
    expect(steps).toHaveLength(1);
    expect(steps[0].active).toBe('water');
    expect(steps[0].state).toBe(game.state);
    expect(tap(game, game.state.at.fire!).steps).toEqual([]);
  });

  it('shakes the active one when nobody can get there', () => {
    const game = first();
    const rock = nowhere(game);
    if (rock < 0) return;
    expect(tap(game, rock)).toEqual({ steps: [], stuck: 'fire' });
  });

  it('wins when fire is on the torch and water on the spring', () => {
    let game = first();
    for (const [e, tile] of [
      ['fire', 'torch'],
      ['water', 'spring'],
    ] as const) {
      game = { ...game, active: e };
      const { steps } = tap(game, game.state.tiles.indexOf(tile));
      if (steps.length) game = steps.at(-1)!;
    }
    const s = game.state;
    expect(game.won).toBe(
      s.tiles[s.at.fire!] === 'torch' && s.tiles[s.at.water!] === 'spring'
    );
  });
});

describe('tap on small boards', () => {
  const play = (rows: string[]) => {
    const level = { id: 'test', rows };
    let game = newGame(level);
    const go = (i: number) => {
      const turn = tap(game, i, level);
      if (turn.steps.length) game = turn.steps.at(-1)!;
      return { ...turn, game };
    };
    return { go, game: () => game };
  };
  const fireAt = (steps: Game[]) => steps.map((g) => g.state.at.fire);

  it('walks water through the grate while fire holds the brazier', () => {
    const { go } = play(['Fa#...', 'W.A..s']);
    expect(go(11)).toMatchObject({ steps: [], stuck: 'fire' });
    go(1); // fire onto the brazier
    go(6); // pick water
    const { steps } = go(11);
    expect(steps.map((g) => g.state.at.water)).toEqual([7, 8, 9, 10, 11]);
  });

  it('walks up to ice far away and melts it', () => {
    const { go } = play(['F..i.W', 'ts####']);
    const { steps, game } = go(3);
    expect(fireAt(steps)).toEqual([1, 2, 2]);
    expect(game.state.tiles[3]).toBe('water');
  });

  it('moves the other one when only it can get there', () => {
    const { go } = play(['F#.W', 'ts#.']);
    const { steps, game } = go(2);
    expect(steps.map((g) => g.state.at.water)).toEqual([2]);
    expect(game.active).toBe('water');
  });

  it('stops a walk on the win', () => {
    const { go } = play(['Ft..', '.sW.']);
    go(6);
    go(5);
    go(0);
    const { steps, game } = go(2);
    expect(fireAt(steps)).toEqual([1]);
    expect(game.won).toBe(true);
    expect(go(3).steps).toEqual([]);
  });
});

describe('melting by tap', () => {
  it('walks fire up to the ice, then melts it', () => {
    const level = LEVELS.find((l) => l.rows.join('').includes('i'))!;
    const game = newGame(level);
    const b = boardOf(level);
    const ices = game.state.tiles.flatMap((t, i) => (t === 'ice' ? [i] : []));
    const ways = walks(b, game.state, 'fire');
    const ice = ices.find((i) =>
      [game.state.at.fire!, ...ways.keys()].some(
        (p) => Math.abs(p - i) === 1 || Math.abs(p - i) === b.width
      )
    );
    if (ice === undefined) return;
    const { steps } = tap(game, ice);
    const last = steps.at(-1)!;
    expect(last.state.tiles[ice]).toBe('water');
    expect(last.state.at.fire).not.toBe(ice);
  });
});

describe('nudge', () => {
  it('moves the active one a single step, or shakes it', () => {
    const game = first();
    const b = board(game);
    const at = game.state.at.fire!;
    const can = reachable(game);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = (at % b.width) + dx;
      const y = Math.floor(at / b.width) + dy;
      const to = y * b.width + x;
      const inside = x >= 0 && y >= 0 && x < b.width && y < b.height;
      const turn = nudge(game, dx, dy);
      if (inside && can.has(to)) expect(turn.steps[0].state.at.fire).toBe(to);
      else expect(turn.stuck).toBe('fire');
    }
  });
});

describe('isFresh', () => {
  it('is fresh until something moves', () => {
    const game = first();
    expect(isFresh(game)).toBe(true);
    expect(isFresh(tap(game, game.state.at.water!).steps[0])).toBe(true);
    const somewhere = [...reachable(game)][0];
    expect(isFresh(tap(game, somewhere).steps[0])).toBe(false);
  });
});

describe('savedGame', () => {
  it('keeps a game of a level that is still there', () => {
    const game = first();
    expect(savedGame(game)).toBe(game);
  });

  it('drops a game of a level that is gone or changed', () => {
    expect(savedGame(undefined)).toBeUndefined();
    expect(savedGame({ ...first(), level: 'gone' })).toBeUndefined();
    const game = first();
    const smaller = { ...game.state, tiles: game.state.tiles.slice(1) };
    expect(savedGame({ ...game, state: smaller })).toBeUndefined();
  });
});

describe('progress', () => {
  it('records each win once', () => {
    const id = LEVELS[0].id;
    expect(recordWin([id], first())).toEqual([id]);
    expect(recordWin([], first())).toEqual([id]);
  });

  it('goes on to the next level not yet won', () => {
    const [a, b, c] = LEVELS.map((l) => l.id);
    expect(nextLevel(a, []).id).toBe(b);
    expect(nextLevel(a, [b]).id).toBe(c);
    const last = LEVELS.at(-1)!.id;
    expect(nextLevel(last, [a]).id).toBe(b);
    const all = LEVELS.map((l) => l.id);
    expect(nextLevel(last, all).id).toBe(a);
  });
});
