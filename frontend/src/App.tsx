import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from './i18n';

/**
 * Placeholder landing page — proves i18n works end-to-end.
 * The real taste form (T025) and results view (T026) replace this in Phase 3,
 * styled to design-notes.md (cozy / omakase). All copy MUST stay in i18n keys.
 */
function App() {
  const { t, i18n } = useTranslation();

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
      <h1>{t('appName')}</h1>
      <p>{t('tagline')}</p>
      <button type="button">{t('start')}</button>
      <p style={{ marginTop: '2rem', opacity: 0.7 }}>{t('comingSoon')}</p>

      <div style={{ marginTop: '2rem' }}>
        <label>
          {t('language')}:{' '}
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
      </div>
    </main>
  );
}

export default App;
