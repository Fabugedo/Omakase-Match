import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getGenres,
  getRecommendations,
  getShowcase,
  type AnimeSummary,
  type Genre,
  type RecommendationsResult,
  type TasteProfile,
} from './api/client';
import { SiteNav } from './features/landing/SiteNav';
import { Hero } from './features/hero/Hero';
import { HowItWorks } from './features/landing/HowItWorks';
import { CatalogStrip } from './features/landing/CatalogStrip';
import { SiteFooter } from './features/landing/SiteFooter';
import { TasteForm } from './features/taste-form/TasteForm';
import { Results } from './features/recommendations/Results';

type View = 'form' | 'loading' | 'results' | 'error';

/**
 * Landing flow as one scrollable page (arxia-style): top nav → hero →
 * how it works → catalog strip → taste form → results, with loading and
 * error states. Deterministic MVP — no AI yet.
 */
function App() {
  const { t } = useTranslation();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [showcase, setShowcase] = useState<AnimeSummary[]>([]);
  const [view, setView] = useState<View>('form');
  const [result, setResult] = useState<RecommendationsResult | null>(null);
  const [lastProfile, setLastProfile] = useState<TasteProfile | null>(null);
  const tasteRef = useRef<HTMLElement>(null);

  useEffect(() => {
    getGenres()
      .then(setGenres)
      .catch(() => setGenres([]));
    getShowcase()
      .then(setShowcase)
      .catch(() => setShowcase([]));
  }, []);

  const scrollToTaste = () => tasteRef.current?.scrollIntoView({ behavior: 'smooth' });

  const submit = async (profile: TasteProfile) => {
    setLastProfile(profile);
    setView('loading');
    try {
      setResult(await getRecommendations(profile));
      setView('results');
    } catch {
      setView('error');
    }
    scrollToTaste();
  };

  return (
    <div className="app">
      <SiteNav />

      <Hero covers={showcase} onStart={scrollToTaste} />
      <div className="hazard" />

      <HowItWorks />
      <CatalogStrip covers={showcase} />

      <main className="section" id="match" ref={tasteRef}>
        <div className="container">
          {view === 'form' && (
            <>
              <div className="step-label">{t('steps.taste')}</div>
              <TasteForm genres={genres} onSubmit={submit} />
            </>
          )}

          {view === 'loading' && (
            <div className="state">
              <div className="spinner" aria-hidden="true" />
              <p className="loading-label">{t('state.loading')}</p>
            </div>
          )}

          {view === 'results' && result && (
            <>
              <div className="step-label">{t('steps.results')}</div>
              <Results data={result} onStartOver={() => setView('form')} />
            </>
          )}

          {view === 'error' && (
            <div className="panel state">
              <span className="state-emoji" aria-hidden="true">
                ⚠️
              </span>
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
      </main>

      <SiteFooter />
    </div>
  );
}

export default App;
