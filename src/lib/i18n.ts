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
  hint: 'Fire lights the torch, water fills the spring. Tap one, then where it should go.',
  undo: 'Undo',
  clear: 'Start over',
  solved: 'Well done!',
  together: 'The torch is lit and the spring is full!',
  next: 'Next level',
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
    torch: 'Torch',
    spring: 'Spring',
  } satisfies Record<Tile, string>,
  // A torch, spring, brazier or wheel with its own element on it.
  awake: {
    torch: 'lit',
    spring: 'full',
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
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Elementals',
  settings: 'Postavke',
  levels: 'Razine',
  done: 'Gotovo',
  level: (n: number) => `Razina ${n}`,
  hint: 'Vatra pali baklju, voda puni izvor. Dodirni jednu, pa kamo treba ići.',
  undo: 'Poništi',
  clear: 'Ispočetka',
  solved: 'Bravo!',
  together: 'Baklja gori, a izvor je pun!',
  next: 'Sljedeća razina',
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
    torch: 'Baklja',
    spring: 'Izvor',
  },
  awake: {
    torch: 'gori',
    spring: 'pun',
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
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
