import type { Level } from './elementals';
import data from '../levels.json';

// Made by scripts/make-levels.ts, easiest first. The tests check each one
// again with the game's own rules. An id comes from the board, so saved
// progress keeps pointing at the same level.
//
//   .  grass     #  rock      ~  water    i  ice      *  bramble
//   a  button and A its door, b  button and B its door
//   h  meeting place          F  fire     W  water (starting on grass)
export const LEVELS: Level[] = data;
