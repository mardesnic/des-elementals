import type { Element, Tile } from './elementals';
import type { Hint, World } from './levels';

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
  hints: {
    fire: 'Take fire to its temple, where it becomes the sun. Tap where it should go.',
    coal: 'Fire can set a pile of coal alight, and it burns away. Tap the coal!',
    water:
      'Bring fire to the fire temple and water to the water temple. Tap one, then where it should go.',
    earth:
      'Here comes earth! It fills holes and has its own temple, where it grows into a tree.',
    boulder:
      'Earth can push a round stone. In water, the stone becomes a little bridge.',
    air: 'Here comes air! It flies over water and holes, but once it starts, it keeps going until something stops it. In its temple it becomes a cloud that blows a breeze.',
    vane: 'While air stands on the weather vane, the wind gate stays up for the others.',
    people:
      'Last of all, a man and a woman want to meet in the heart temple. Bring everyone home!',
  } satisfies Record<Hint, string>,
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
  next: 'Next level',
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
  hints: {
    fire: 'Odvedi vatru do njezina hrama, gdje postaje sunce. Dodirni kamo treba ići.',
    coal: 'Vatra može zapaliti hrpu ugljena, pa izgori. Dodirni ugljen!',
    water:
      'Dovedi vatru do vatrenog hrama, a vodu do vodenog. Dodirni jednu, pa kamo treba ići.',
    earth:
      'Stiže zemlja! Ona zatrpava rupe i ima svoj hram, gdje izraste u drvo.',
    boulder:
      'Zemlja može gurnuti okrugli kamen. U vodi kamen postane mali most.',
    air: 'Stiže zrak! Leti preko vode i rupa, ali kad krene, juri ravno dok ga nešto ne zaustavi. U svom hramu postaje oblačić koji puše.',
    vane: 'Dok zrak stoji na vjetrokazu, vjetrena vrata ostaju podignuta za ostale.',
    people:
      'Na kraju se muškarac i žena žele naći u hramu srca. Odvedi sve kući!',
  },
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
  next: 'Sljedeća razina',
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
