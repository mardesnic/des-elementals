import { useRef, type CSSProperties } from 'react';

import {
  boardOf,
  doorsOpen,
  elementsIn,
  type Element,
  type Level,
  type State,
  type Tile,
} from '../lib/elementals';
import type { Strings } from '../lib/i18n';

const FACES: Record<Element, string> = { fire: '🔥', water: '💧' };

// Things drawn on a tile. Water, grass, the button and the door are
// drawn with colour only, so nothing looks like fire or water.
const ON_TILE: Partial<Record<Tile, string>> = {
  rock: '🪨',
  ice: '🧊',
  bramble: '🌵',
};

// A drag shorter than this is a tap.
const SWIPE = 24;

export type Bump = { who: Element; n: number };

export function Board({
  level,
  state,
  active,
  won,
  bump,
  onTap,
  onSwipe,
  t,
}: {
  level: Level;
  state: State;
  active: Element;
  won: boolean;
  // The last one that couldn't move, counted so each bump shakes again.
  bump?: Bump;
  onTap: (i: number) => void;
  onSwipe: (from: number, dx: number, dy: number) => void;
  t: Strings;
}) {
  const b = boardOf(level);
  const open = doorsOpen(state);
  const tiles = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number; i: number } | null>(null);

  const squareAt = (x: number, y: number) => {
    const box = tiles.current!.getBoundingClientRect();
    const c = Math.floor(((x - box.left) / box.width) * b.width);
    const r = Math.floor(((y - box.top) / box.height) * b.height);
    if (c < 0 || r < 0 || c >= b.width || r >= b.height) return -1;
    return r * b.width + c;
  };

  const onDown = (e: React.PointerEvent) => {
    if (won || !e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current = {
      x: e.clientX,
      y: e.clientY,
      i: squareAt(e.clientX, e.clientY),
    };
  };

  const onUp = (e: React.PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (!start || !e.isPrimary || start.i < 0) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) < SWIPE) onTap(start.i);
    else if (Math.abs(dx) > Math.abs(dy)) onSwipe(start.i, Math.sign(dx), 0);
    else onSwipe(start.i, 0, Math.sign(dy));
  };

  const occupied = new Set(elementsIn(state).map((e) => state.at[e]));

  return (
    <div
      className={won ? 'board board--won' : 'board'}
      style={{ '--w': b.width, '--h': b.height } as CSSProperties}
    >
      <div
        ref={tiles}
        className='tiles'
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (down.current = null)}
      >
        {state.tiles.map((tile, i) => {
          const isOpen = tile === 'door' && (open || occupied.has(i));
          return (
            <span
              // A tile that changes is drawn anew, so it pops in.
              key={`${i}-${tile}`}
              className={`tile tile--${tile}${isOpen ? ' tile--open' : ''}`}
              role='img'
              aria-label={
                isOpen ? `${t.tiles[tile]}, ${t.open}` : t.tiles[tile]
              }
            >
              {ON_TILE[tile]}
            </span>
          );
        })}
      </div>

      {elementsIn(state).map((e) => {
        const i = state.at[e]!;
        const stuck = bump?.who === e;
        return (
          <span
            key={e}
            className={`friend${e === active && !won ? ' friend--active' : ''}`}
            style={
              {
                '--x': i % b.width,
                '--y': Math.floor(i / b.width),
              } as CSSProperties
            }
            role='img'
            aria-label={t.elements[e]}
          >
            <span
              // Remounting restarts the shake on every bump.
              key={stuck ? bump.n : 0}
              className={
                stuck ? 'friend__face friend__face--stuck' : 'friend__face'
              }
            >
              {FACES[e]}
            </span>
          </span>
        );
      })}
    </div>
  );
}
