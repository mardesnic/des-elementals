import {
  boardOf,
  elementsIn,
  isWon,
  move,
  neighbours,
  outcomeAt,
  parse,
  walks,
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

// What a tap or swipe does: the games one after another as someone walks,
// a step at a time, and who wanted to move but couldn't, so they can shake.
export type Turn = { steps: Game[]; stuck?: Element };

// What a tap on square i does. On someone, it picks them. Elsewhere, the
// one picked walks there, or up to an ice or bramble there and changes it.
// If they can't but the other one can, the other one goes.
export function tap(
  game: Game,
  i: number,
  level = levelById(game.level)!
): Turn {
  if (game.won) return { steps: [] };
  const s = game.state;
  const everyone = elementsIn(s);
  const there = everyone.find((e) => s.at[e] === i);
  if (there)
    return {
      steps: there === game.active ? [] : [{ ...game, active: there }],
    };
  for (const e of [game.active, ...everyone.filter((o) => o !== game.active)]) {
    const steps = walkTo(game, e, i, level);
    if (steps) return { steps };
  }
  return { steps: [], stuck: game.active };
}

// Moves the active one a square up, right, down or left.
export function nudge(
  game: Game,
  dx: number,
  dy: number,
  level = levelById(game.level)!
): Turn {
  if (game.won) return { steps: [] };
  const b = boardOf(level);
  const from = game.state.at[game.active]!;
  const x = (from % b.width) + dx;
  const y = Math.floor(from / b.width) + dy;
  const to = y * b.width + x;
  const state =
    x < 0 || y < 0 || x >= b.width || y >= b.height
      ? game.state
      : move(b, game.state, game.active, to);
  if (state === game.state) return { steps: [], stuck: game.active };
  return { steps: [{ ...game, state, won: isWon(state) }] };
}

// The squares the active one can walk to, for showing.
export function reachable(
  game: Game,
  level = levelById(game.level)!
): Set<number> {
  if (game.won) return new Set();
  const b = boardOf(level);
  return new Set(walks(b, game.state, game.active).keys());
}

// The way for `e` to square i, as one game a step, or undefined if it
// can't get there.
function walkTo(
  game: Game,
  e: Element,
  i: number,
  level: Level
): Game[] | undefined {
  const b = boardOf(level);
  const s = game.state;
  const from = s.at[e]!;
  const ways = walks(b, s, e);
  let path = ways.get(i);
  if (!path) {
    // An ice or bramble: walk up to it, then into it to change it.
    const here = (n: number) => (n === from ? [] : ways.get(n));
    const nearest = neighbours(b, i)
      .map(here)
      .filter((p): p is number[] => !!p)
      .filter((p) => {
        const at = p.at(-1) ?? from;
        const result = outcomeAt({ ...s, at: { ...s.at, [e]: at } }, e, i);
        return typeof result === 'object';
      })
      .sort((p, q) => p.length - q.length)[0];
    if (!nearest) return undefined;
    path = [...nearest, i];
  }
  const steps: Game[] = [];
  let state = s;
  for (const to of path) {
    state = move(b, state, e, to);
    const won = isWon(state);
    steps.push({ ...game, state, active: e, won });
    if (won) break;
  }
  return steps;
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
