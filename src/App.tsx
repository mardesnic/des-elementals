import { useEffect, useState } from 'react';

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

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [store, setStore] = useStoredState<{ game?: Game }>('elementals', {});
  // A saved game of a level since taken out or changed starts afresh.
  const game = savedGame(store.game) ?? newGame(LEVELS[0]);
  const level = levelById(game.level)!;
  const [progress, setProgress] = useStoredState<Progress>(
    'elementals-progress',
    []
  );
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

  const start = (id: string) => {
    setStore({ game: newGame(levelById(id)!) });
    setHistory([]);
    setBump(undefined);
    setView('play');
  };

  // Only moves that change the board can be undone; picking who moves can't.
  const play = ({ game: next, stuck }: Turn) => {
    if (stuck) {
      setBump((b) => ({ who: stuck, n: (b?.n ?? 0) + 1 }));
      navigator.vibrate?.(30);
    }
    if (next === game) return;
    if (next.state !== game.state) setHistory((h) => [...h, game]);
    setStore({ game: next });
    if (next.won) {
      setProgress(recordWin(progress, next));
      setCelebrating(true);
      cheer();
    }
  };

  const onSwipe = (from: number, dx: number, dy: number) => {
    // A swipe that starts on someone moves them.
    const there = elementsIn(game.state).find((e) => game.state.at[e] === from);
    play(nudge(there ? { ...game, active: there } : game, dx, dy));
  };

  const undo = () => {
    if (game.won || !history.length) return;
    setStore({ game: history.at(-1)! });
    setHistory((h) => h.slice(0, -1));
  };

  const clear = () => {
    if (game.won) return;
    play({ game: newGame(level) });
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
              bump={bump}
              onTap={(i) => play(tap(game, i))}
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
