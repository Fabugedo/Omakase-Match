import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from './i18n';
import {
  getGenres,
  getRecommendations,
  type Genre,
  type RecommendationsResult,
  type TasteProfile,
} from './api/client';
import { TasteForm } from './features/taste-form/TasteForm';
import { Results } from './features/recommendations/Results';

type View = 'form' | 'loading' | 'results' | 'error';

/**
 * App shell + flow (T027): fetch genres → taste form → POST /recommendations →
 * results, with loading and error states. The deterministic MVP — no AI yet.
 */
function App() {
  const { t, i18n } = useTranslation();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [view, setView] = useState<View>('form');
  const [result, setResult] = useState<RecommendationsResult | null>(null);
  const [lastProfile, setLastProfile] = useState<TasteProfile | null>(null);

  useEffect(() => {
    getGenres()
      .then(setGenres)
      .catch(() => setGenres([]));
  }, []);

  const submit = async (profile: TasteProfile) => {
    setLastProfile(profile);
    setView('loading');
    try {
      setResult(await getRecommendations(profile));
      setView('results');
    } catch {
      setView('error');
    }
  };

  return (
    <div className="app">
      <header className="site-header">
        <span className="brand">{t('appName')}</span>
        <label className="lang-switcher">
          {t('language')}
          <select
            value={i18n.resolvedLanguage}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lng) => (
              <option key={lng} value={lng}>
                {lng.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </header>

      {view === 'form' && (
        <>
          <div className="hero">
            <h1>{t('appName')}</h1>
            <p className="tagline">{t('tagline')}</p>
          </div>
          <TasteForm genres={genres} onSubmit={submit} />
        </>
      )}

      {view === 'loading' && (
        <div className="state">
          <div className="spinner" aria-hidden="true" />
          <p>{t('state.loading')}</p>
        </div>
      )}

      {view === 'results' && result && (
        <Results data={result} onStartOver={() => setView('form')} />
      )}

      {view === 'error' && (
        <div className="panel state">
          <p>{t('state.error')}</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => lastProfile && void submit(lastProfile)}
          >
            {t('state.retry')}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
