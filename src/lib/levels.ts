import { elementsIn, parse, type Level } from './elementals';
import data from '../levels.json';

// Made by scripts/make-levels.ts, easiest first. The tests check each one
// again with the game's own rules. An id comes from the board, so saved
// progress keeps pointing at the same level.
//
//   .  grass     #  rock      ~  water    i  ice      *  bramble
//   a  brazier, held by fire to keep the grate A up
//   b  wheel, turned by water to keep the sluice B up
//   t  fire temple            s  water temple
//   F  fire     W  water (starting on grass)
export const LEVELS: Level[] = data;

// Levels come in worlds, one friend more in each: first fire alone, then
// fire and water.
export const WORLDS = ['fire', 'fireWater'] as const;
export type World = (typeof WORLDS)[number];

// A level's world is who is in it.
export const worldOf = (level: Level): World =>
  elementsIn(parse(level)).length === 1 ? 'fire' : 'fireWater';

// The levels of each world, in order.
export const levelsOf = (world: World) =>
  LEVELS.filter((l) => worldOf(l) === world);

// The world that starts after this level, if this is its world's last.
export function worldAfter(level: Level): World | undefined {
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  return next && worldOf(next) !== worldOf(level) ? worldOf(next) : undefined;
}

// What to tell a kid on a level: how to play on the first level of each
// world, and what fire does to a bramble on the first one with a bramble.
export type Hint = World | 'bramble';
export function hintFor(level: Level): Hint | undefined {
  const at = LEVELS.indexOf(level);
  const before = LEVELS[at - 1];
  if (!before || worldOf(before) !== worldOf(level)) return worldOf(level);
  const bramble = (l: Level) => l.rows.join('').includes('*');
  if (bramble(level) && !LEVELS.slice(0, at).some(bramble)) return 'bramble';
  return undefined;
}
