import { describe, expect, it } from 'vitest';

import { boardOf, walks } from './elements';
import {
  isFresh,
  isOpen,
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
import { LEVELS, worldOf } from './levels';

// The first level with both fire and water.
const first = () => newGame(LEVELS.find((l) => worldOf(l) === 'water')!);
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

  it('wins when both are in their own temples', () => {
    let game = first();
    for (const [e, tile] of [
      ['fire', 'fireTemple'],
      ['water', 'waterTemple'],
    ] as const) {
      game = { ...game, active: e };
      const { steps } = tap(game, game.state.tiles.indexOf(tile));
      if (steps.length) game = steps.at(-1)!;
    }
    const s = game.state;
    expect(game.won).toBe(
      s.tiles[s.at.fire!] === 'fireTemple' &&
        s.tiles[s.at.water!] === 'waterTemple'
    );
  });

  it('pushes a round stone straight on when earth is next to it', () => {
    const level = { id: 'stone', rows: ['....', '.E@.', '....'] };
    const game = { ...newGame(level), active: 'earth' as const };
    const pushed = tap(game, 6, level).steps.at(-1)!;
    expect(pushed.state.tiles[7]).toBe('boulder');
    expect(pushed.state.at.earth).toBe(6);
    // From afar, earth walks up to the stone first.
    const far = { ...game, state: { ...game.state, at: { earth: 0 } } };
    const steps = tap(far, 6, level).steps;
    expect(steps.at(-1)!.state.tiles[6]).toBe('grass');
    expect(steps.length).toBeGreaterThan(1);
  });

  it('wins when fire alone is in its temple', () => {
    const level = { id: 'alone', rows: ['F.#', '.*t'] };
    const game = newGame(level);
    expect(game.active).toBe('fire');
    // The coal is in the way: tapping the temple only shakes fire.
    expect(tap(game, 5, level).stuck).toBe('fire');
    const burnt = tap(game, 4, level).steps.at(-1)!;
    expect(burnt.state.tiles[4]).toBe('grass');
    const done = tap(burnt, 5, level).steps.at(-1)!;
    expect(done.won).toBe(true);
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

  it('flies air from stop to stop, one slide a step', () => {
    const { go } = play(['Z...', '#..m', 'tEeF']);
    go(0); // pick air
    const { steps } = go(5);
    expect(steps.map((g) => g.state.at.air)).toEqual([3, 7, 5]);
    // It can't stop on a square in the middle of a slide.
    expect(go(2)).toMatchObject({ steps: [], stuck: 'air' });
  });

  it('takes the picked person into the heart temple to the other one', () => {
    const { go } = play(['Mh.L', 'F..t']);
    go(0); // pick the man
    go(1); // he walks into the temple
    go(3); // pick the woman
    const { steps } = go(1);
    expect(steps.map((g) => g.state.at.woman)).toEqual([2, 1]);
    // With both in, a tap there picks the one not picked yet.
    expect(go(1).steps[0].active).toBe('man');
    expect(go(1).steps[0].active).toBe('woman');
  });

  it('walks up to ice far away and melts it', () => {
    const { go } = play(['F..i.W', 'ts####']);
    const { steps, game } = go(3);
    expect(fireAt(steps)).toEqual([1, 2, 2]);
    expect(game.state.tiles[3]).toBe('water');
  });

  it('only moves the one picked, even when the other could get there', () => {
    const { go } = play(['F#.W', 'ts#.']);
    const turn = go(2);
    expect(turn).toMatchObject({ steps: [], stuck: 'fire' });
    expect(turn.game.active).toBe('fire');
    expect(turn.game.state.at.water).toBe(3);
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
    const id = first().level;
    expect(recordWin([id], first())).toEqual([id]);
    expect(recordWin([], first())).toEqual([id]);
  });

  it('goes on to the next level, even one already won', () => {
    const [a, b] = LEVELS.map((l) => l.id);
    expect(nextLevel(a).id).toBe(b);
    expect(nextLevel(LEVELS.at(-1)!.id).id).toBe(a);
  });
});

describe('isOpen', () => {
  const [a, b, c, d] = LEVELS.map((l) => l.id);

  it('opens only the first level at the start', () => {
    expect(isOpen(a, [], a)).toBe(true);
    expect(isOpen(b, [], a)).toBe(false);
  });

  it('opens the level after one that is won', () => {
    expect(isOpen(b, [a], b)).toBe(true);
    expect(isOpen(c, [a], b)).toBe(false);
    expect(isOpen(c, [a, b], c)).toBe(true);
  });

  it('keeps won levels and the one being played open', () => {
    expect(isOpen(d, [d], a)).toBe(true);
    expect(isOpen(c, [], c)).toBe(true);
  });
});
