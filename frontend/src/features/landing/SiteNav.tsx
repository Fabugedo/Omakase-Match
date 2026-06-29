import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';

/**
 * Sticky top nav: brand · in-page anchor links · language switcher.
 * Links target real on-page sections (#home, #how, #catalog, #match) — no
 * routing and no fabricated pages.
 */
export function SiteNav() {
  const { t, i18n } = useTranslation();

  return (
    <header className="site-nav">
      <div className="container">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          {t('appName')}
        </span>

        <nav className="nav-links" aria-label={t('nav.aria')}>
          <a className="nav-link" href="#home">
            {t('nav.home')}
          </a>
          <a className="nav-link" href="#how">
            {t('nav.how')}
          </a>
          <a className="nav-link" href="#catalog">
            {t('nav.catalog')}
          </a>
          <a className="nav-link" href="#match">
            {t('nav.match')}
          </a>
        </nav>

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
      </div>
    </header>
  );
}
