import type { Level } from './elementals';
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
