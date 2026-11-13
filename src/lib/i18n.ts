import type { Element, Tile } from './elements';
import type { World } from './levels';

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
  title: 'Elements',
  settings: 'Settings',
  levels: 'Levels',
  close: 'Close',
  level: (n: number) => `Level ${n}`,
  undo: 'Undo',
  clear: 'Start over',
  solved: 'Well done!',
  worlds: {
    fire: 'Fire',
    water: 'Fire and water',
    earth: 'Fire, water and earth',
    air: 'Fire, water, earth and air',
    people: 'Everyone together',
  } satisfies Record<World, string>,
  next: 'Next',
  finale: 'You did it all!',
  elements: {
    fire: 'Fire',
    water: 'Water',
    earth: 'Earth',
    air: 'Air',
    man: 'Man',
    woman: 'Woman',
  } satisfies Record<Element, string>,
  tiles: {
    grass: 'Grass',
    rock: 'Rock',
    water: 'Water',
    ice: 'Ice',
    coal: 'Coal',
    brazier: 'Brazier',
    grate: 'Grate',
    wheel: 'Water wheel',
    sluice: 'Sluice gate',
    fireTemple: 'Fire temple',
    waterTemple: 'Water temple',
    earthTemple: 'Earth temple',
    pit: 'Hole',
    boulder: 'Round stone',
    bridge: 'Stone bridge',
    vane: 'Weather vane',
    windGate: 'Wind gate',
    airTemple: 'Air temple',
    heartTemple: 'Heart temple',
  } satisfies Record<Tile, string>,
  // A temple, brazier or wheel with its own element on it.
  awake: {
    fireTemple: 'the sun shines',
    waterTemple: 'rain falls',
    earthTemple: 'the tree grows green',
    airTemple: 'the wind blows',
    heartTemple: 'a heart shines',
    brazier: 'burning',
    wheel: 'turning',
    vane: 'spinning',
  } satisfies Partial<Record<Tile, string>>,
  open: 'open',
  won: 'done',
  locked: 'locked',
  language: 'Language',
  automatic: 'Automatic',
  sound: 'Sound and vibration',
  on: 'On',
  off: 'Off',
  allGames: 'All games',
  source: 'Source',
  version: 'Version',
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
  title: 'Elementi',
  settings: 'Postavke',
  levels: 'Razine',
  close: 'Zatvori',
  level: (n: number) => `Razina ${n}`,
  undo: 'Poništi',
  clear: 'Ispočetka',
  solved: 'Bravo!',
  worlds: {
    fire: 'Vatra',
    water: 'Vatra i voda',
    earth: 'Vatra, voda i zemlja',
    air: 'Vatra, voda, zemlja i zrak',
    people: 'Svi zajedno',
  },
  next: 'Dalje',
  finale: 'Sve je riješeno!',
  elements: {
    fire: 'Vatra',
    water: 'Voda',
    earth: 'Zemlja',
    air: 'Zrak',
    man: 'Muškarac',
    woman: 'Žena',
  },
  tiles: {
    grass: 'Trava',
    rock: 'Stijena',
    water: 'Voda',
    ice: 'Led',
    coal: 'Ugljen',
    brazier: 'Žeravnik',
    grate: 'Rešetka',
    wheel: 'Mlinsko kolo',
    sluice: 'Ustava',
    fireTemple: 'Vatreni hram',
    waterTemple: 'Vodeni hram',
    earthTemple: 'Zemljani hram',
    pit: 'Rupa',
    boulder: 'Okrugli kamen',
    bridge: 'Kameni most',
    vane: 'Vjetrokaz',
    windGate: 'Vjetrena vrata',
    airTemple: 'Zračni hram',
    heartTemple: 'Hram srca',
  },
  awake: {
    fireTemple: 'sunce sja',
    waterTemple: 'pada kiša',
    earthTemple: 'drvo zeleni',
    airTemple: 'vjetar puše',
    heartTemple: 'srce sja',
    brazier: 'gori',
    wheel: 'okreće se',
    vane: 'vrti se',
  },
  open: 'podignuta',
  won: 'riješeno',
  locked: 'zaključano',
  language: 'Jezik',
  automatic: 'Automatski',
  sound: 'Zvuk i vibracija',
  on: 'Uključeno',
  off: 'Isključeno',
  allGames: 'Sve igre',
  source: 'Izvorni kod',
  version: 'Verzija',
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
