import { elementsIn, parse, type Level } from './elementals';
import data from '../levels.json';

// Made by scripts/make-levels.ts, easiest first. The tests check each one
// again with the game's own rules. An id comes from the board, so saved
// progress keeps pointing at the same level.
//
//   .  grass     #  rock      ~  water    i  ice      *  coal
//   a  brazier, held by fire to keep the grate A up
//   b  wheel, turned by water to keep the sluice B up
//   o  pit, filled by earth   @  round stone, pushed by earth
//   v  weather vane, spun by air to keep the wind gate V up
//   t  fire temple   s  water temple   e  earth temple   m  air temple
//   h  heart temple, where the man M and the woman L meet
//   F  fire   W  water   E  earth   Z  air (starting on grass)
export const LEVELS: Level[] = data;

// Levels come in worlds, named after the friend who joins: first fire
// alone, then water with it, then earth with both, then air, and last a
// man and a woman with all four.
export const WORLDS = ['fire', 'water', 'earth', 'air', 'people'] as const;
export type World = (typeof WORLDS)[number];

// A level's world is who is in it.
export function worldOf(level: Level): World {
  const everyone = elementsIn(parse(level));
  return everyone.includes('man') ? 'people' : WORLDS[everyone.length - 1];
}

// The levels of each world, in order.
export const levelsOf = (world: World) =>
  LEVELS.filter((l) => worldOf(l) === world);
