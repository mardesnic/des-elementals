import {
  boardOf,
  elementsIn,
  isNextTo,
  isWon,
  move,
  parse,
  type Element,
  type Level,
  type State,
} from './elementals';
import type { Language } from './i18n';
import { LEVELS } from './levels';

export type Settings = {
  language: Language;
  sound: boolean;
};

export const initialSettings: Settings = {
  language: 'auto',
  sound: true,
};

export type Game = {
  level: string;
  state: State;
  // The one that moves when a square is tapped.
  active: Element;
  won: boolean;
};

export const levelById = (id: string | undefined): Level | undefined =>
  LEVELS.find((l) => l.id === id);

export function newGame(level: Level): Game {
  const state = parse(level);
  return { level: level.id, state, active: elementsIn(state)[0], won: false };
}

// Nothing has moved yet.
export const isFresh = (game: Game) =>
  JSON.stringify(game.state) === JSON.stringify(parse(levelById(game.level)!));

// A saved game is kept only if its level is still there in the same shape.
export function savedGame(game: Game | undefined): Game | undefined {
  const level = levelById(game?.level);
  if (!level || !game?.state?.tiles) return undefined;
  const fresh = parse(level);
  const same =
    game.state.tiles.length === fresh.tiles.length &&
    elementsIn(game.state).join() === elementsIn(fresh).join();
  return same ? game : undefined;
}

// The game after a move, and who tried to move but couldn't, so they can
// shake.
export type Turn = { game: Game; stuck?: Element };

// What a tap on square i does: picks the one standing there, or moves the
// active one there. A square next to only the other one moves that one, as
// that is what a small finger meant.
export function tap(game: Game, i: number): Turn {
  if (game.won) return { game };
  const level = levelById(game.level)!;
  const b = boardOf(level);
  const s = game.state;
  const everyone = elementsIn(s);
  const there = everyone.find((e) => s.at[e] === i);
  if (there)
    return { game: there === game.active ? game : { ...game, active: there } };
  const mover = isNextTo(b, s.at[game.active]!, i)
    ? game.active
    : everyone.find((e) => isNextTo(b, s.at[e]!, i));
  if (!mover) return { game };
  return step(game, mover, i);
}

// Moves the active one a square up, right, down or left.
export function nudge(game: Game, dx: number, dy: number): Turn {
  if (game.won) return { game };
  const b = boardOf(levelById(game.level)!);
  const from = game.state.at[game.active]!;
  const x = (from % b.width) + dx;
  const y = Math.floor(from / b.width) + dy;
  if (x < 0 || y < 0 || x >= b.width || y >= b.height)
    return { game, stuck: game.active };
  return step(game, game.active, y * b.width + x);
}

function step(game: Game, e: Element, to: number): Turn {
  const b = boardOf(levelById(game.level)!);
  const state = move(b, game.state, e, to);
  if (state === game.state)
    return {
      game: e === game.active ? game : { ...game, active: e },
      stuck: e,
    };
  return { game: { ...game, state, active: e, won: isWon(b, state) } };
}

// The ids of the levels won so far.
export type Progress = string[];

export const recordWin = (progress: Progress, game: Game): Progress =>
  progress.includes(game.level) ? progress : [...progress, game.level];

// The next level after this one, or the first one not yet won.
export function nextLevel(current: string, progress: Progress): Level {
  const at = LEVELS.findIndex((l) => l.id === current);
  return (
    LEVELS.slice(at + 1).find((l) => !progress.includes(l.id)) ??
    LEVELS.find((l) => !progress.includes(l.id)) ??
    LEVELS[(at + 1) % LEVELS.length]
  );
}
