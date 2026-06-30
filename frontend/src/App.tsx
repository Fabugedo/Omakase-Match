import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getGenres,
  getRecommendations,
  getShowcase,
  interpretTaste,
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
import { ConversationalInput } from './features/taste-form/ConversationalInput';
import { TasteForm } from './features/taste-form/TasteForm';
import { Results } from './features/recommendations/Results';

type View = 'input' | 'loading' | 'results' | 'error';
type InputMode = 'chat' | 'manual';

/**
 * Landing flow as one scrollable page: top nav → hero → how it works → catalog
 * strip → taste input → results. The taste step is conversational-first (US4):
 * a free-text box is the primary entry; the genre/theme form is the fallback
 * and the post-results refinement. Deterministic core still works AI-off.
 */
function App() {
  const { t, i18n } = useTranslation();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [showcase, setShowcase] = useState<AnimeSummary[]>([]);
  const [view, setView] = useState<View>('input');
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [interpretedIds, setInterpretedIds] = useState<number[]>([]);
  const [noMatch, setNoMatch] = useState(false);
  const [result, setResult] = useState<RecommendationsResult | null>(null);
  const [lastProfile, setLastProfile] = useState<TasteProfile | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
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

  // Structured path (manual form or post-results refine).
  const submit = async (profile: TasteProfile) => {
    setLastProfile(profile);
    setInterpretedIds(profile.genreIds);
    setView('loading');
    try {
      setResult(await getRecommendations(profile));
      setView('results');
      setRefineOpen(false);
    } catch {
      setView('error');
    }
    scrollToTaste();
  };

  // Conversational path: interpret free text → genres → recommendations.
  const submitText = async (text: string) => {
    setNoMatch(false);
    setView('loading');
    try {
      const interpreted = await interpretTaste(text, i18n.resolvedLanguage);
      const ids = interpreted.genres.map((g) => g.id);
      if (ids.length === 0) {
        // Couldn't map the text — drop to the structured form with a gentle hint.
        setInterpretedIds([]);
        setNoMatch(true);
        setInputMode('manual');
        setView('input');
        scrollToTaste();
        return;
      }
      await submit({ genreIds: ids, favoriteAnimeIds: [], includeExplicit: false });
    } catch {
      setView('error');
    }
  };

  const startOver = () => {
    setView('input');
    setInputMode('chat');
    setInterpretedIds([]);
    setNoMatch(false);
    setRefineOpen(false);
    setResult(null);
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
          {view === 'input' && (
            <>
              <div className="step-label">{t('steps.taste')}</div>
              {inputMode === 'chat' ? (
                <ConversationalInput
                  onSubmit={(text) => void submitText(text)}
                  onPickManually={() => setInputMode('manual')}
                />
              ) : (
                <>
                  {noMatch && (
                    <p className="notice" role="status">
                      {t('chat.noMatch')}
                    </p>
                  )}
                  <button type="button" className="link-btn back-to-chat" onClick={startOver}>
                    {t('chat.useChat')}
                  </button>
                  <TasteForm genres={genres} initialSelected={interpretedIds} onSubmit={submit} />
                </>
              )}
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
              <Results data={result} onStartOver={startOver} />

              <div className="refine">
                <button
                  type="button"
                  className="link-btn"
                  aria-expanded={refineOpen}
                  onClick={() => setRefineOpen((v) => !v)}
                >
                  {refineOpen ? t('chat.refineHide') : t('chat.refine')}
                </button>
                {refineOpen && (
                  <TasteForm
                    key={interpretedIds.join(',')}
                    genres={genres}
                    initialSelected={interpretedIds}
                    onSubmit={submit}
                  />
                )}
              </div>
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
