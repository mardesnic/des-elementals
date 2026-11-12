// Every picture on the board, drawn on a 100 × 100 square. Colours come
// from classes in index.css, so light and dark mode both work.
import type { Element, Tile } from '../lib/elementals';

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg className='art' viewBox='0 0 100 100' aria-hidden='true'>
    {children}
  </svg>
);

const FLAME =
  'M50 94C29 94 18 80 18 64c0-14 10-22 15-34 4 8 8 12 13 12 0-13 5-25 17-36 0 19 14 29 17 49 2 21-10 39-30 39z';
const FLAME_CORE =
  'M50 92c-10 0-16-7-16-16 0-8 6-13 10-21 2 6 6 8 8 8 2-4 4-8 6-12 4 8 6 16 6 24 0 10-6 17-14 17z';
const DROP = 'M50 6c13 21 31 39 31 59a31 31 0 0 1-62 0c0-20 18-38 31-59z';
const LEAF = 'M50 6C82 26 86 64 50 94 14 64 18 26 50 6z';
const HEART =
  'M50 90C20 68 8 50 8 34 8 20 18 10 31 10c9 0 15 5 19 12 4-7 10-12 19-12 13 0 23 10 23 24 0 16-12 34-42 56z';
const TORNADO =
  'M8 18q42-16 84 0-6 16-20 26-10 8-13 22-3 14-9 26-6 4-8-2-2-12-6-24-4-12-14-22Q14 34 8 18z';

const Face = ({ y }: { y: number }) => (
  <g className='art-face'>
    <circle cx='42' cy={y} r='4.5' />
    <circle cx='58' cy={y} r='4.5' />
    <path d={`M43 ${y + 9}q7 6 14 0`} fill='none' strokeWidth='4' />
  </g>
);

// A small flame, for a burning brazier.
const SmallFlame = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <g transform={`translate(${x - 50 * size} ${y - 94 * size}) scale(${size})`}>
    <path className='art-flame' d={FLAME} />
    <path className='art-flame-core' d={FLAME_CORE} />
  </g>
);

// `home` is for one standing in its own temple, where fire becomes the sun,
// water a rain cloud, earth a green tree and air a puffing cloud that
// blows a breeze.
export function Friend({ element, home }: { element: Element; home: boolean }) {
  if (home && element === 'air')
    return (
      <Svg>
        <g className='art-gust'>
          <path d='M68 42h26a8 8 0 1 0-8-8' />
          <path d='M72 62h32a8 8 0 1 1-8 8' />
        </g>
        <path
          className='art-breeze'
          d='M22 76a16 16 0 0 1-4-30 22 22 0 0 1 40-14 18 18 0 0 1 22 26 14 14 0 0 1-10 18z'
        />
        <g className='art-cheek'>
          <circle cx='28' cy='58' r='6' />
          <circle cx='54' cy='58' r='6' />
        </g>
        <g className='art-face'>
          <circle cx='35' cy='48' r='4.5' />
          <circle cx='51' cy='48' r='4.5' />
        </g>
        <circle className='art-blow' cx='68' cy='54' r='4.5' />
      </Svg>
    );
  if (element === 'man' || element === 'woman')
    return (
      <Svg>
        {element === 'woman' && (
          <path className='art-hair' d='M28 40c0-24 44-24 44 0v22H28z' />
        )}
        <path
          className={element === 'man' ? 'art-shirt' : 'art-dress'}
          d={
            element === 'man'
              ? 'M30 96V72q0-10 20-10t20 10v24z'
              : 'M26 96l10-30q14-6 28 0l10 30z'
          }
        />
        <circle className='art-skin' cx='50' cy='40' r='20' />
        <path
          className='art-hair'
          d='M30 36q2-18 20-18t20 18q-8-8-20-8t-20 8z'
        />
        <Face y={40} />
      </Svg>
    );
  if (element === 'air')
    return (
      <Svg>
        <path className='art-air' d={TORNADO} />
        <path
          className='art-swirl'
          d='M16 22q34 10 68 0M28 40q22 8 44 0M40 58q10 5 20 0'
        />
        <Face y={30} />
      </Svg>
    );
  if (home && element === 'earth')
    return (
      <Svg>
        <path className='art-trunk' d='M44 92V60h12v32z' />
        <g className='art-leaf-dark'>
          <circle cx='50' cy='46' r='30' />
          <circle cx='26' cy='58' r='16' />
          <circle cx='74' cy='58' r='16' />
        </g>
        <g className='art-crown'>
          <circle cx='50' cy='42' r='28' />
          <circle cx='26' cy='54' r='14' />
          <circle cx='74' cy='54' r='14' />
        </g>
        <Face y={44} />
      </Svg>
    );
  if (element === 'earth')
    return (
      <Svg>
        <path className='art-sprout' d='M50 34V14' />
        <path
          className='art-leaf'
          d='M50 20c-4-10-14-12-20-8 4 8 12 10 20 8z'
        />
        <path className='art-leaf' d='M50 16c4-10 14-12 20-8-4 8-12 10-20 8z' />
        <path
          className='art-earth'
          d='M50 30c22 0 38 14 38 34 0 18-16 28-38 28S12 82 12 64c0-20 16-34 38-34z'
        />
        <g className='art-earth-dark'>
          <circle cx='26' cy='74' r='4' />
          <circle cx='76' cy='70' r='3.5' />
          <circle cx='68' cy='44' r='3' />
        </g>
        <Face y={62} />
      </Svg>
    );
  if (home && element === 'fire')
    return (
      <Svg>
        <g className='art-rays'>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path key={a} d='M50 4v14' transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
        <circle className='art-sun' cx='50' cy='50' r='27' />
        <Face y={48} />
      </Svg>
    );
  if (home)
    return (
      <Svg>
        <g className='art-rain'>
          <path d='M32 74l-3 9M50 78l-3 9M68 74l-3 9' />
        </g>
        <path
          className='art-cloud'
          d='M24 70a16 16 0 0 1 2-32 24 24 0 0 1 46-6 19 19 0 0 1 4 38z'
        />
        <Face y={50} />
      </Svg>
    );
  return (
    <Svg>
      {element === 'fire' ? (
        <>
          <path className='art-flame' d={FLAME} />
          <path className='art-flame-core' d={FLAME_CORE} />
          <Face y={70} />
        </>
      ) : (
        <>
          <path className='art-drop' d={DROP} />
          <path
            className='art-shine'
            d='M30 66a20 20 0 0 0 12 17'
            fill='none'
            strokeWidth='5'
            strokeLinecap='round'
          />
          <Face y={62} />
        </>
      )}
    </Svg>
  );
}

const SIGNS: Record<Element, string> = {
  fire: FLAME,
  water: DROP,
  earth: LEAF,
  air: TORNADO,
  man: HEART,
  woman: HEART,
};

// A small temple, its roof in its element's colour with its sign on top.
const Temple = ({ element }: { element: Element }) => (
  <Svg>
    <rect
      className='art-stone-dark'
      x='8'
      y='82'
      width='84'
      height='12'
      rx='3'
    />
    <rect className='art-stone' x='14' y='74' width='72' height='10' rx='3' />
    <path className='art-column' d='M27 46v28M50 46v28M73 46v28' />
    <path className={`art-roof-${element}`} d='M6 48L50 12l44 36z' />
    <g transform='translate(41 24) scale(0.18)'>
      <path className='art-sign' d={SIGNS[element]} />
    </g>
  </Svg>
);

// `awake` is for a temple, brazier, wheel or vane with its own element
// on it; `open` for a grate, sluice or wind gate held up.
export function TileArt({
  tile,
  awake,
  open,
  i,
}: {
  tile: Tile;
  awake: boolean;
  open: boolean;
  // Where it is, so grass tufts don't all line up.
  i: number;
}) {
  switch (tile) {
    case 'grass': {
      const x = [22, 58, 34, 68, 46][i % 5];
      const y = [70, 36, 40, 74, 58][(i * 3) % 5];
      return (
        <Svg>
          <path
            className='art-tuft'
            d={`M${x - 6} ${y}l-3-9M${x} ${y}v-12M${x + 6} ${y}l3-9`}
          />
        </Svg>
      );
    }
    case 'rock':
      return (
        <Svg>
          <path
            className='art-stone'
            d='M14 80C6 70 10 46 26 34 38 18 64 16 78 30c14 12 16 36 8 50-8 10-62 10-72 0z'
          />
          <path
            className='art-stone-dark'
            d='M14 80c10 10 62 10 72 0 4-6 5-12 4-20-10 14-46 20-76 12z'
          />
          <ellipse
            className='art-shine'
            cx='38'
            cy='38'
            rx='11'
            ry='6'
            transform='rotate(-25 38 38)'
          />
        </Svg>
      );
    case 'water':
      return (
        <Svg>
          <path
            className='art-wave'
            d='M14 40q9-8 18 0t18 0M50 70q9-8 18 0t18 0'
          />
        </Svg>
      );
    case 'ice':
      return (
        <Svg>
          <rect
            className='art-ice'
            x='12'
            y='12'
            width='76'
            height='76'
            rx='12'
          />
          <path className='art-ice-line' d='M12 64L64 12M40 88L88 40' />
          <path className='art-shine-line' d='M26 34l12-10M24 48l6-5' />
        </Svg>
      );
    case 'coal':
      return (
        <Svg>
          <ellipse className='art-shadow' cx='50' cy='88' rx='42' ry='7' />
          <g className='art-lump'>
            <path d='M8 86l6-24 20-8 14 12-4 20z' />
            <path d='M44 88l2-22 22-12 22 10 2 24z' />
            <path d='M24 58l10-24 22-8 16 14-6 22-24 6z' />
          </g>
          <path
            className='art-lump-edge'
            d='M14 62l20-8M46 66l22-12M34 34l22-8'
          />
          <path className='art-glint' d='M40 40l6-3M62 66l6-3M20 70l4-2' />
        </Svg>
      );
    case 'fireTemple':
      return <Temple element='fire' />;
    case 'waterTemple':
      return <Temple element='water' />;
    case 'earthTemple':
      return <Temple element='earth' />;
    case 'airTemple':
      return <Temple element='air' />;
    case 'heartTemple':
      // With both people in it, a big heart shines over it.
      return awake ? (
        <Svg>
          <path className='art-heart art-heart--big' d={HEART} />
        </Svg>
      ) : (
        <Temple element='man' />
      );
    case 'vane':
      return (
        <Svg>
          <path className='art-post' d='M50 92V30' />
          <path className='art-vane-cross' d='M34 56h32' />
          <g className={awake ? 'art-vane art-vane--spinning' : 'art-vane'}>
            <path className='art-arrow' d='M18 30h58' />
            <path className='art-arrow-head' d='M90 30L72 20v20z' />
            <path
              className='art-arrow-tail'
              d='M12 18l14 12-14 12h12l12-12-12-12z'
            />
          </g>
          <circle className='art-hub' cx='50' cy='30' r='5' />
        </Svg>
      );
    case 'windGate':
      return (
        <Svg>
          {open ? (
            <path className='art-cloth-rolled' d='M14 22h72' />
          ) : (
            <g className='art-cloth'>
              <path d='M14 18h20v70q-10 6-20 0z' />
              <path d='M40 18h20v70q-10 6-20 0z' />
              <path d='M66 18h20v70q-10 6-20 0z' />
            </g>
          )}
          <rect
            className='art-beam-air'
            x='4'
            y='4'
            width='92'
            height='14'
            rx='5'
          />
        </Svg>
      );
    case 'pit':
      return (
        <Svg>
          <ellipse className='art-earth' cx='50' cy='54' rx='40' ry='30' />
          <ellipse className='art-pit' cx='50' cy='58' rx='31' ry='22' />
        </Svg>
      );
    case 'boulder':
      return (
        <Svg>
          <ellipse className='art-shadow' cx='50' cy='88' rx='30' ry='6' />
          <circle className='art-boulder' cx='50' cy='52' r='36' />
          <path
            className='art-boulder-line'
            d='M24 34q26 22 52 0M18 58q32 20 64 0'
          />
          <ellipse
            className='art-shine'
            cx='36'
            cy='32'
            rx='9'
            ry='5'
            transform='rotate(-30 36 32)'
          />
        </Svg>
      );
    case 'bridge':
      return (
        <Svg>
          <rect
            className='art-boulder-dark'
            x='8'
            y='12'
            width='84'
            height='82'
            rx='8'
          />
          <rect
            className='art-boulder'
            x='8'
            y='6'
            width='84'
            height='82'
            rx='8'
          />
          <path
            className='art-boulder-line'
            d='M8 33h84M8 61h84M40 6v27M66 33v28M34 61v27M72 61v27'
          />
        </Svg>
      );
    case 'brazier':
      return (
        <Svg>
          <path className='art-leg' d='M38 70l-8 22M62 70l8 22' />
          <path className='art-iron' d='M16 44h68q-4 32-34 32T16 44z' />
          <g className={awake ? 'art-coal art-coal--hot' : 'art-coal'}>
            <circle cx='34' cy='44' r='9' />
            <circle cx='50' cy='42' r='10' />
            <circle cx='66' cy='44' r='9' />
          </g>
          {awake && (
            <>
              <SmallFlame x={38} y={40} size={0.24} />
              <SmallFlame x={60} y={38} size={0.3} />
            </>
          )}
        </Svg>
      );
    case 'wheel':
      return (
        <Svg>
          <g className={awake ? 'art-wheel art-wheel--turning' : 'art-wheel'}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <rect
                key={a}
                className='art-paddle'
                x='42'
                y='4'
                width='16'
                height='16'
                rx='3'
                transform={`rotate(${a} 50 50)`}
              />
            ))}
            <circle className='art-rim' cx='50' cy='50' r='32' />
            <path
              className='art-spoke'
              d='M50 18v64M18 50h64M27 27l46 46M73 27L27 73'
            />
            <circle className='art-wood' cx='50' cy='50' r='9' />
          </g>
        </Svg>
      );
    case 'grate':
      return (
        <Svg>
          {open ? (
            <path className='art-bar' d='M26 8v14M42 8v14M58 8v14M74 8v14' />
          ) : (
            <path
              className='art-bar'
              d='M26 8v84M42 8v84M58 8v84M74 8v84M14 56h72'
            />
          )}
          <rect
            className='art-beam-fire'
            x='6'
            y='4'
            width='88'
            height='14'
            rx='5'
          />
        </Svg>
      );
    case 'sluice':
      return (
        <Svg>
          {!open &&
            [22, 46, 70].map((y) => (
              <rect
                key={y}
                className='art-plank'
                x='12'
                y={y}
                width='76'
                height='20'
                rx='4'
              />
            ))}
          <path className='art-post' d='M10 10v84M90 10v84' />
          <rect
            className='art-beam-water'
            x='4'
            y='4'
            width='92'
            height='14'
            rx='5'
          />
        </Svg>
      );
  }
}

// A flower that grows on grass when a level is won.
export function Flower({ i }: { i: number }) {
  const colour = ['a', 'b', 'c', 'd'][i % 4];
  return (
    <svg
      className='art art-flower'
      viewBox='0 0 100 100'
      aria-hidden='true'
      style={{ animationDelay: `${(i % 7) * 70}ms` }}
    >
      <path className='art-stem' d='M50 92V56' />
      <g className={`art-petals art-petals--${colour}`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx='50'
            cy='30'
            rx='11'
            ry='15'
            transform={`rotate(${a} 50 46)`}
          />
        ))}
      </g>
      <circle className='art-flower-heart' cx='50' cy='46' r='9' />
    </svg>
  );
}

// The rainbow over the whole board when the last level is won.
export function Rainbow() {
  return (
    <svg className='rainbow' viewBox='0 0 200 110' aria-hidden='true'>
      {['a', 'b', 'c', 'd', 'e', 'f'].map((band, k) => (
        <path
          key={band}
          className={`rainbow__band rainbow__band--${band}`}
          d={`M${10 + k * 9} 106a${90 - k * 9} ${90 - k * 9} 0 0 1 ${180 - k * 18} 0`}
        />
      ))}
    </svg>
  );
}

// Birds that fly over the board when a level with air is won.
export function Birds() {
  return (
    <div className='birds' aria-hidden='true'>
      {[0, 1, 2].map((k) => (
        <svg key={k} className={`bird bird--${k}`} viewBox='0 0 60 40'>
          <path
            className='bird__wing'
            d='M30 22C22 8 10 6 2 12c10 0 18 4 24 12z'
          />
          <ellipse className='bird__body' cx='34' cy='24' rx='14' ry='9' />
          <path className='bird__beak' d='M47 21l8 3-8 3z' />
          <circle className='bird__eye' cx='42' cy='21' r='2' />
          <path
            className='bird__wing'
            d='M34 22c4-12 14-16 22-12-8 2-14 6-18 14z'
          />
        </svg>
      ))}
    </div>
  );
}

// A little house that comes up on grass when the last level is won.
export function House({ i }: { i: number }) {
  return (
    <svg
      className='art house'
      viewBox='0 0 100 100'
      aria-hidden='true'
      style={{ animationDelay: `${(i % 7) * 90}ms` }}
    >
      <rect className='house__wall' x='20' y='46' width='60' height='46' />
      <path className='house__roof' d='M10 50L50 14l40 36z' />
      <rect
        className='house__door'
        x='43'
        y='64'
        width='14'
        height='28'
        rx='3'
      />
      <rect className='house__window' x='26' y='56' width='11' height='11' />
      <rect className='house__window' x='63' y='56' width='11' height='11' />
    </svg>
  );
}
