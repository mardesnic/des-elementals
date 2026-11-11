import { useEffect, useState } from 'react';

import { SettingsView } from './components/Menu';
import { initialSettings, type Settings } from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { popMenu, pushMenu, useBackButton } from './lib/use-back-button';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'settings';

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [settings, setSettings] = useStoredState<Settings>(
    'elementals-settings',
    initialSettings
  );
  const [view, setViewState] = useState<View>('play');
  // Settings open over the game, so the phone's Back button closes them.
  const setView = (next: View) => {
    if (next === 'play') popMenu();
    else pushMenu();
    setViewState(next);
  };
  useBackButton(() => setViewState('play'));
  useWakeLock();

  const lang = settings.language === 'auto' ? detectLang() : settings.language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  return (
    <main className='app'>
      <header className='header'>
        <h1>{t.title}</h1>
        <div className='header__actions'>
          <button
            className='button button--small'
            onClick={() => setView(view === 'play' ? 'settings' : 'play')}
          >
            {view === 'play' ? t.settings : t.done}
          </button>
        </div>
      </header>

      {view === 'settings' ? (
        <SettingsView settings={settings} setSettings={setSettings} t={t} />
      ) : (
        <section className='card soon'>
          <p className='soon__faces' aria-hidden='true'>
            🔥 💧
          </p>
          <p>{t.soon}</p>
        </section>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='https://github.com/mardesnic/des-elementals'>{t.source}</a>
        </footer>
      )}
    </main>
  );
}
