import { useTranslation } from 'react-i18next';

/** Minimal footer: brand + an honest attribution / prototype note. */
export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="container">
        <span className="footer-brand">◆ {t('appName')}</span>
        <span className="footer-note">{t('footer.note')}</span>
      </div>
    </footer>
  );
}
