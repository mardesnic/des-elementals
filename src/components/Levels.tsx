import type { Progress } from '../lib/game';
import type { Strings } from '../lib/i18n';
import { LEVELS } from '../lib/levels';

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
      <div className='levels'>
        {LEVELS.map((level, n) => {
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
              aria-label={won ? `${t.level(n + 1)}, ${t.won}` : t.level(n + 1)}
            >
              {n + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}
