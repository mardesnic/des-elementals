import { elementsIn, parse, type Level } from './elementals';
import data from '../levels.json';

// Made by scripts/make-levels.ts, easiest first. The tests check each one
// again with the game's own rules. An id comes from the board, so saved
// progress keeps pointing at the same level.
//
//   .  grass     #  rock      ~  water    i  ice      *  bramble
//   a  brazier, held by fire to keep the grate A up
//   b  wheel, turned by water to keep the sluice B up
//   o  pit, filled by earth   @  round stone, pushed by earth
//   t  fire temple            s  water temple    e  earth temple
//   F  fire     W  water      E  earth (starting on grass)
export const LEVELS: Level[] = data;

// Levels come in worlds, named after the friend who joins: first fire
// alone, then water with it, then earth with both.
export const WORLDS = ['fire', 'water', 'earth'] as const;
export type World = (typeof WORLDS)[number];

// A level's world is who is in it.
export const worldOf = (level: Level): World =>
  WORLDS[elementsIn(parse(level)).length - 1];

// The levels of each world, in order.
export const levelsOf = (world: World) =>
  LEVELS.filter((l) => worldOf(l) === world);

// The world that starts after this level, if this is its world's last.
export function worldAfter(level: Level): World | undefined {
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  return next && worldOf(next) !== worldOf(level) ? worldOf(next) : undefined;
}

// Things shown for the first time on a level, with their letters.
const NEW = { bramble: '*', boulder: '@' } as const;

// What to tell a kid on a level: how to play on the first level of each
// world, and what a bramble or round stone is the first time there is one.
export type Hint = World | keyof typeof NEW;
export function hintFor(level: Level): Hint | undefined {
  const at = LEVELS.indexOf(level);
  const before = LEVELS[at - 1];
  if (!before || worldOf(before) !== worldOf(level)) return worldOf(level);
  const has = (ch: string) => (l: Level) => l.rows.join('').includes(ch);
  for (const [hint, ch] of Object.entries(NEW) as [Hint, string][])
    if (has(ch)(level) && !LEVELS.slice(0, at).some(has(ch))) return hint;
  return undefined;
}
