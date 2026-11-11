import { elementsIn, parse } from '../lib/elementals';
import type { Progress } from '../lib/game';
import type { Strings } from '../lib/i18n';
import { LEVELS, WORLDS, levelsOf } from '../lib/levels';
import { Friend } from './Art';

export function Levels({
  current,
  progress,
  onPick,
  t,
}: {
  current: string;
  progress: Progress;
  onPick: (id: string) => void;
  t: Strings;
}) {
  return (
    <section className='card'>
      <h2>{t.levels}</h2>
      {WORLDS.map((world) => {
        const levels = levelsOf(world);
        if (!levels.length) return null;
        return (
          <div key={world} className='world'>
            <h3 className='world__name'>
              {elementsIn(parse(levels[0])).map((e) => (
                <span key={e} className='world__friend'>
                  <Friend element={e} home={false} />
                </span>
              ))}
              {t.worlds[world]}
            </h3>
            <div className='levels'>
              {levels.map((level) => {
                const n = LEVELS.indexOf(level) + 1;
                const won = progress.includes(level.id);
                return (
                  <button
                    key={level.id}
                    className={[
                      'level',
                      won && 'level--won',
                      level.id === current && 'level--current',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onPick(level.id)}
                    aria-label={won ? `${t.level(n)}, ${t.won}` : t.level(n)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
