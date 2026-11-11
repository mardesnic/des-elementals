import { useEffect, useRef, useState } from 'react';

import { Board, type Bump } from './components/Board';
import { Confetti } from './components/Confetti';
import { Icon } from './components/Icon';
import { Levels } from './components/Levels';
import { SettingsView } from './components/Menu';
import { elementsIn } from './lib/elementals';
import {
  initialSettings,
  isFresh,
  levelById,
  newGame,
  nextLevel,
  nudge,
  reachable,
  recordWin,
  savedGame,
  tap,
  type Game,
  type Progress,
  type Settings,
  type Turn,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { LEVELS } from './lib/levels';
import { popMenu, pushMenu, useBackButton } from './lib/use-back-button';
import { useCheer } from './lib/use-cheer';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'levels' | 'settings';

// How long one step of a walk takes, in ms. The CSS slide matches it.
const STEP_MS = 130;

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [store, setStore] = useStoredState<{ game?: Game }>('elementals', {});
  // A saved game of a level since taken out or changed starts afresh.
  const game = savedGame(store.game) ?? newGame(LEVELS[0]);
  const level = levelById(game.level)!;
  // Wrapped in an object: stored state is merged as an object.
  const [stored, setStored] = useStoredState<{ won: Progress }>(
    'elementals-progress',
    { won: [] }
  );
  const progress = Array.isArray(stored.won) ? stored.won : [];
  const setProgress = (won: Progress) => setStored({ won });
  const [settings, setSettings] = useStoredState<Settings>(
    'elementals-settings',
    initialSettings
  );
  const [view, setViewState] = useState<View>('play');
  // Menus open over the game, so the phone's Back button closes them.
  const setView = (next: View) => {
    if (next === 'play') popMenu();
    else pushMenu();
    setViewState(next);
  };
  useBackButton(() => setViewState('play'));
  const [history, setHistory] = useState<Game[]>([]);
  const [bump, setBump] = useState<Bump>();
  const [celebrating, setCelebrating] = useState(false);
  useWakeLock();
  const cheer = useCheer(settings.sound);

  const lang = settings.language === 'auto' ? detectLang() : settings.language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  // A walk plays out a step at a time.
  const walking = useRef<number | undefined>(undefined);
  const stopWalking = () => {
    window.clearTimeout(walking.current);
    walking.current = undefined;
  };
  useEffect(() => stopWalking, []);

  const start = (id: string) => {
    stopWalking();
    setStore({ game: newGame(levelById(id)!) });
    setHistory([]);
    setBump(undefined);
    setView('play');
  };

  // A whole walk is undone at once; picking who moves can't be undone.
  const play = ({ steps, stuck }: Turn) => {
    stopWalking();
    if (stuck) {
      setBump((b) => ({ who: stuck, n: (b?.n ?? 0) + 1 }));
      navigator.vibrate?.(30);
    }
    if (!steps.length) return;
    if (steps.some((s) => s.state !== game.state))
      setHistory((h) => [...h, game]);
    const go = (k: number) => {
      const next = steps[k];
      setStore({ game: next });
      if (next.won) {
        setProgress(recordWin(progress, next));
        setCelebrating(true);
        cheer();
      }
      walking.current =
        k + 1 < steps.length
          ? window.setTimeout(() => go(k + 1), STEP_MS)
          : undefined;
    };
    go(0);
  };

  const onSwipe = (from: number, dx: number, dy: number) => {
    // A swipe that starts on someone moves them.
    const there = elementsIn(game.state).find((e) => game.state.at[e] === from);
    play(nudge(there ? { ...game, active: there } : game, dx, dy));
  };

  const undo = () => {
    stopWalking();
    if (game.won || !history.length) return;
    setStore({ game: history.at(-1)! });
    setHistory((h) => h.slice(0, -1));
  };

  const clear = () => {
    if (game.won) return;
    play({ steps: [newGame(level)] });
  };

  const n = LEVELS.indexOf(level) + 1;

  return (
    <main className={view === 'play' ? 'app app--play' : 'app'}>
      <header className='header'>
        <h1>{t.title}</h1>
        <div className='header__actions'>
          {view === 'play' ? (
            <>
              <button
                className='button button--small'
                onClick={() => setView('levels')}
              >
                {t.levels}
              </button>
              <button
                className='button button--small'
                onClick={() => setView('settings')}
              >
                {t.settings}
              </button>
            </>
          ) : (
            <button
              className='button button--small'
              onClick={() => setView('play')}
            >
              {t.done}
            </button>
          )}
        </div>
      </header>

      {view === 'levels' && (
        <Levels current={game.level} progress={progress} onPick={start} t={t} />
      )}
      {view === 'settings' && (
        <SettingsView settings={settings} setSettings={setSettings} t={t} />
      )}

      {view === 'play' && (
        <>
          <div className='stage'>
            <Board
              // A new level starts with nothing shaking.
              key={level.id}
              level={level}
              state={game.state}
              active={game.active}
              won={game.won}
              reach={reachable(game)}
              bump={bump}
              onTap={(i) => play(tap(game, i))}
              onBumpDone={() => setBump(undefined)}
              onSwipe={onSwipe}
              t={t}
            />
          </div>

          {game.won ? (
            <section className='card solved'>
              <h2>{t.solved}</h2>
              <p className='solved__text'>{t.together}</p>
              <div className='solved__actions'>
                <button
                  className='button'
                  onClick={() => start(nextLevel(level.id, progress).id)}
                >
                  {t.next}
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('levels')}
                >
                  {t.levels}
                </button>
              </div>
            </section>
          ) : (
            <div className='bar'>
              <span className='bar__level'>{t.level(n)}</span>
              {n === 1 && <p className='hint'>{t.hint}</p>}
              <div className='tools'>
                <button
                  className='tool'
                  onClick={undo}
                  disabled={!history.length}
                  aria-label={t.undo}
                >
                  <Icon name='undo' />
                </button>
                <button
                  className='tool'
                  onClick={clear}
                  disabled={isFresh(game)}
                  aria-label={t.clear}
                >
                  <Icon name='clear' />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='https://github.com/mardesnic/des-elementals'>{t.source}</a>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}
