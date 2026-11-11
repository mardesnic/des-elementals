import type { Element, Tile } from './elementals';

export const LANGS = ['en', 'hr'] as const;
export type Lang = (typeof LANGS)[number];
export type Language = 'auto' | Lang;

// Each language's name in that language, for the picker.
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  hr: 'Hrvatski',
};

export function detectLang(): Lang {
  const preferred = navigator.languages ?? [navigator.language];
  return preferred.some((l) => l.toLowerCase().startsWith('hr')) ? 'hr' : 'en';
}

const en = {
  title: 'Elementals',
  settings: 'Settings',
  levels: 'Levels',
  done: 'Done',
  level: (n: number) => `Level ${n}`,
  hint: 'Bring fire to the fire temple and water to the water temple. Tap one, then where it should go.',
  undo: 'Undo',
  clear: 'Start over',
  solved: 'Well done!',
  together: 'The sun shines, the rain falls, and the flowers grow!',
  next: 'Next level',
  finale: 'You did it all!',
  finaleText: 'Sun and rain woke the whole garden, and a rainbow came out!',
  elements: {
    fire: 'Fire',
    water: 'Water',
  } satisfies Record<Element, string>,
  tiles: {
    grass: 'Grass',
    rock: 'Rock',
    water: 'Water',
    ice: 'Ice',
    bramble: 'Thorny bush',
    brazier: 'Brazier',
    grate: 'Grate',
    wheel: 'Water wheel',
    sluice: 'Sluice gate',
    fireTemple: 'Fire temple',
    waterTemple: 'Water temple',
  } satisfies Record<Tile, string>,
  // A temple, brazier or wheel with its own element on it.
  awake: {
    fireTemple: 'the sun shines',
    waterTemple: 'rain falls',
    brazier: 'burning',
    wheel: 'turning',
  } satisfies Partial<Record<Tile, string>>,
  open: 'open',
  won: 'done',
  language: 'Language',
  automatic: 'Automatic',
  sound: 'Sound',
  on: 'On',
  off: 'Off',
  source: 'Source',
  progress: 'Progress',
  progressCount: (done: number, total: number) =>
    `Levels done: ${done} / ${total}`,
  resetProgress: 'Reset progress',
  resetAsk: 'Every level will be unsolved again, and you start from level 1.',
  resetYes: 'Yes, reset',
  cancel: 'Cancel',
  resetDone: 'Progress reset.',
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Elementals',
  settings: 'Postavke',
  levels: 'Razine',
  done: 'Gotovo',
  level: (n: number) => `Razina ${n}`,
  hint: 'Dovedi vatru do vatrenog hrama, a vodu do vodenog. Dodirni jednu, pa kamo treba ići.',
  undo: 'Poništi',
  clear: 'Ispočetka',
  solved: 'Bravo!',
  together: 'Sunce sja, kiša pada, a cvijeće raste!',
  next: 'Sljedeća razina',
  finale: 'Sve je riješeno!',
  finaleText: 'Sunce i kiša probudili su cijeli vrt, a izašla je i duga!',
  elements: {
    fire: 'Vatra',
    water: 'Voda',
  },
  tiles: {
    grass: 'Trava',
    rock: 'Stijena',
    water: 'Voda',
    ice: 'Led',
    bramble: 'Trnovit grm',
    brazier: 'Žeravnik',
    grate: 'Rešetka',
    wheel: 'Mlinsko kolo',
    sluice: 'Ustava',
    fireTemple: 'Vatreni hram',
    waterTemple: 'Vodeni hram',
  },
  awake: {
    fireTemple: 'sunce sja',
    waterTemple: 'pada kiša',
    brazier: 'gori',
    wheel: 'okreće se',
  },
  open: 'podignuta',
  won: 'riješeno',
  language: 'Jezik',
  automatic: 'Automatski',
  sound: 'Zvuk',
  on: 'Uključen',
  off: 'Isključen',
  source: 'Izvorni kod',
  progress: 'Napredak',
  progressCount: (done: number, total: number) =>
    `Riješene razine: ${done} / ${total}`,
  resetProgress: 'Resetiraj napredak',
  resetAsk: 'Sve razine opet će biti neriješene i krećeš od 1. razine.',
  resetYes: 'Da, resetiraj',
  cancel: 'Odustani',
  resetDone: 'Napredak je resetiran.',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
