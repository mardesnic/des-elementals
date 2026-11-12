import { useRef, type CSSProperties } from 'react';

import {
  boardOf,
  elementsIn,
  isAwake,
  isGate,
  ownerOf,
  shownOpen,
  type Element,
  type Level,
  type State,
} from '../lib/elements';
import type { Strings } from '../lib/i18n';
import type { World } from '../lib/levels';
import { WORLDS } from '../lib/levels';
import { Birds, Flower, Friend, House, Rainbow, TileArt } from './Art';

// Whether a flower grows on grass square i once the level is won: about
// half of them, the same ones every time. On the last level, a little
// house comes up on the rest.
const blooms = (i: number) => (i * 7 + 3) % 11 < 6;

// A drag shorter than this is a tap.
const SWIPE = 24;

export type Bump = { who: Element; n: number };

export function Board({
  level,
  state,
  active,
  won,
  world,
  reach,
  bump,
  onTap,
  onBumpDone,
  onSwipe,
  t,
}: {
  level: Level;
  state: State;
  active: Element;
  won: boolean;
  // Its world: a win there has a rainbow from water on, flowers from
  // earth on, birds from air on, and houses on the last level.
  world: World;
  // Squares the active one can walk to, shown with a dot.
  reach: Set<number>;
  // The last one that couldn't move, counted so each bump shakes again.
  bump?: Bump;
  onTap: (i: number) => void;
  // The shake is over, so the bob can come back.
  onBumpDone: () => void;
  onSwipe: (from: number, dx: number, dy: number) => void;
  t: Strings;
}) {
  const b = boardOf(level);
  const from = (w: World) => WORLDS.indexOf(world) >= WORLDS.indexOf(w);
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
          const open = isGate(tile) && shownOpen(state, i);
          const awake = isAwake(state, i);
          const owner = ownerOf(tile);
          const said = awake
            ? t.awake[tile as keyof Strings['awake']]
            : open && t.open;
          return (
            <span
              // A tile that changes is drawn anew, so it pops in.
              key={`${i}-${tile}`}
              className={[
                'tile',
                `tile--${tile}`,
                owner && `tile--of-${owner}`,
                awake && 'tile--awake',
                reach.has(i) && 'tile--reach',
              ]
                .filter(Boolean)
                .join(' ')}
              role='img'
              aria-label={said ? `${t.tiles[tile]}, ${said}` : t.tiles[tile]}
            >
              <TileArt tile={tile} awake={awake} open={open} i={i} />
              {won &&
                from('earth') &&
                tile === 'grass' &&
                (blooms(i) ? (
                  <Flower i={i} />
                ) : (
                  from('people') && <House i={i} />
                ))}
            </span>
          );
        })}
      </div>

      {elementsIn(state).map((e) => {
        const i = state.at[e]!;
        const stuck = bump?.who === e;
        // The two people side by side, when they share their temple.
        const paired =
          (e === 'man' || e === 'woman') &&
          state.at.man === state.at.woman &&
          `friend--${e === 'man' ? 'left' : 'right'}`;
        return (
          <span
            key={e}
            className={[
              'friend',
              `friend--${e}`,
              paired,
              e === active && !won && 'friend--active',
              // Smaller on its own place, so the glow shows around it.
              isAwake(state, i) && `friend--home friend--on-${state.tiles[i]}`,
            ]
              .filter(Boolean)
              .join(' ')}
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
              onAnimationEnd={stuck ? onBumpDone : undefined}
            >
              <Friend
                element={e}
                home={isAwake(state, i) && state.tiles[i].endsWith('Temple')}
              />
            </span>
          </span>
        );
      })}
      {won && from('water') && <Rainbow />}
      {won && from('air') && <Birds />}
    </div>
  );
}
