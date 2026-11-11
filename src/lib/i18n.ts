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
  hint: 'Bring fire and water to the heart. Tap one, then where it should go.',
  undo: 'Undo',
  clear: 'Start over',
  solved: 'Well done!',
  together: 'Fire and water met at the heart!',
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
    buttonA: 'Orange button',
    doorA: 'Orange door',
    buttonB: 'Purple button',
    doorB: 'Purple door',
    goal: 'Meeting place',
  } satisfies Record<Tile, string>,
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
  hint: 'Dovedi vatru i vodu do srca. Dodirni jednu, pa kamo treba ići.',
  undo: 'Poništi',
  clear: 'Ispočetka',
  solved: 'Bravo!',
  together: 'Vatra i voda su se našle kod srca!',
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
    buttonA: 'Narančasti gumb',
    doorA: 'Narančasta vrata',
    buttonB: 'Ljubičasti gumb',
    doorB: 'Ljubičasta vrata',
    goal: 'Mjesto susreta',
  },
  open: 'otvorena',
  won: 'riješeno',
  language: 'Jezik',
  automatic: 'Automatski',
  sound: 'Zvuk',
  on: 'Uključen',
  off: 'Isključen',
  source: 'Izvorni kod',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
