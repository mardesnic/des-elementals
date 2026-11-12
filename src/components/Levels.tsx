import { elementsIn, parse } from '../lib/elements';
import { isOpen, type Progress } from '../lib/game';
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
          <div
            key={world}
            className='world'
            role='group'
            aria-label={t.worlds[world]}
          >
            {/* Who is in the world, shown by their pictures only. */}
            <div className='world__name'>
              {elementsIn(parse(levels[0])).map((e) => (
                <span key={e} className='world__friend'>
                  <Friend element={e} home={false} />
                </span>
              ))}
            </div>
            <div className='levels'>
              {levels.map((level) => {
                const n = LEVELS.indexOf(level) + 1;
                const won = progress.includes(level.id);
                // In dev every level is open, to try any of them.
                const open =
                  import.meta.env.DEV || isOpen(level.id, progress, current);
                return (
                  <button
                    key={level.id}
                    className={[
                      'level',
                      won && 'level--won',
                      level.id === current && 'level--current',
                      !open && 'level--locked',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onPick(level.id)}
                    disabled={!open}
                    aria-label={
                      won
                        ? `${t.level(n)}, ${t.won}`
                        : open
                          ? t.level(n)
                          : `${t.level(n)}, ${t.locked}`
                    }
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
