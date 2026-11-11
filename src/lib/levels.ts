import type { Level } from './elementals';

// Drawn by hand, easiest first. The tests check that each can be won and
// that from the fourth on, it takes both friends. An id never changes, so
// saved progress keeps pointing at the same level.
//
//   .  grass     #  rock      ~  water    i  ice
//   *  bramble   o  button    D  door
//   F  fire      W  water (starting on grass)
export const LEVELS: Level[] = [
  {
    id: 'meet',
    rows: ['F....', '.###.', '.....', '.###.', '....W'],
  },
  {
    id: 'river',
    rows: ['F.~..', '..~..', '..~.W', '..~..', '..~..'],
  },
  {
    id: 'brambles',
    rows: ['..#..', 'F.*.W', '..#..', '..#..', '..#..'],
  },
  {
    id: 'ice',
    rows: ['F.#..', '..i..', '..#.W', '..#..', '..#..'],
  },
  {
    id: 'door',
    rows: ['F.#o.', '..D..', '..#..', '..#.W', '..#..'],
  },
  {
    id: 'pond-door',
    rows: ['F.#o~W', '..D~~~', '..####', '**....'],
  },
  {
    id: 'island-button',
    rows: ['F.#...', '..D...', '###~~~', '...~o~', 'W..~~~', '......'],
  },
  {
    id: 'ice-gap',
    rows: [
      'o~~#...',
      '~~.D.F.',
      '~.###..',
      '~.#W#..',
      '~.#i#..',
      '~...**.',
      '~~~#...',
    ],
  },
  {
    id: 'ice-channel',
    rows: ['F...#.', '.##.#W', '.#i.#~', '.#~##~', '.#~~~~', '.#....'],
  },
  {
    id: 'long-way',
    rows: [
      'F..#.W.',
      '.*.#.~.',
      '.*.D.~.',
      '.*##i~.',
      '...i.#.',
      '.o.#...',
      '...#...',
    ],
  },
  {
    id: 'canal',
    rows: [
      'W~~#...',
      '.#~#.F.',
      '.#~D...',
      '.#~####',
      '.#~~~o.',
      '.######',
      '.......',
    ],
  },
  {
    id: 'big-loop',
    rows: [
      '.o#....',
      '.~#.F..',
      '.~####D',
      '.~...#.',
      '.~.*.~W',
      '.~.#.~~',
      '.~~#~~.',
    ],
  },
];
