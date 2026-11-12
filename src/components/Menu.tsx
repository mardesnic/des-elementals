import { useState } from 'react';

import { LANG_NAMES, LANGS, type Language, type Strings } from '../lib/i18n';

function Segmented<T>({
  options,
  value,
  label,
  onChange,
}: {
  options: readonly T[];
  value: T;
  label: (o: T) => string;
  onChange: (o: T) => void;
}) {
  return (
    <div className='segmented'>
      {options.map((o) => (
        <button
          key={String(o)}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function SettingsView({
  language,
  setLanguage,
  sound,
  setSound,
  done,
  total,
  onReset,
  t,
}: {
  language: Language;
  setLanguage: (l: Language) => void;
  sound: boolean;
  setSound: (on: boolean) => void;
  // Levels won so far, out of all of them.
  done: number;
  total: number;
  onReset: () => void;
  t: Strings;
}) {
  const languages: Language[] = ['auto', ...LANGS];
  // Resetting asks first, so one stray tap can't wipe out the progress.
  const [asking, setAsking] = useState(false);
  const [wasReset, setWasReset] = useState(false);

  return (
    <section className='card'>
      <h2>{t.settings}</h2>

      <div className='field'>
        <span>{t.language}</span>
        <Segmented
          options={languages}
          value={language}
          label={(l) => (l === 'auto' ? t.automatic : LANG_NAMES[l])}
          onChange={setLanguage}
        />
      </div>

      <div className='field'>
        <span>{t.sound}</span>
        <Segmented
          options={[true, false]}
          value={sound}
          label={(on) => (on ? t.on : t.off)}
          onChange={setSound}
        />
      </div>

      <div className='field'>
        <span>
          {t.progress}
          <span className='muted'>
            {wasReset ? t.resetDone : t.progressCount(done, total)}
          </span>
        </span>
        {asking ? (
          <>
            <span className='muted'>{t.resetAsk}</span>
            <div className='reset'>
              <button
                className='button button--danger'
                onClick={() => {
                  onReset();
                  setAsking(false);
                  setWasReset(true);
                }}
              >
                {t.resetYes}
              </button>
              <button
                className='button button--secondary'
                onClick={() => setAsking(false)}
              >
                {t.cancel}
              </button>
            </div>
          </>
        ) : (
          <button
            className='button button--secondary'
            disabled={!done}
            onClick={() => setAsking(true)}
          >
            {t.resetProgress}
          </button>
        )}
      </div>
    </section>
  );
}
