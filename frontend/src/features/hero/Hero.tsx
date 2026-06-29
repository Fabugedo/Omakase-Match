import { useTranslation } from 'react-i18next';
import type { AnimeSummary } from '../../api/client';

interface Props {
  covers: AnimeSummary[];
  onStart: () => void;
}

/** Landing hero: a tilted collage of real catalog covers behind a bold headline. */
export function Hero({ covers, onStart }: Props) {
  const { t } = useTranslation();

  return (
    <section className="hero">
      <div className="hero-collage" aria-hidden="true">
        {covers.map((c) =>
          c.imageUrl ? <img key={c.id} src={c.imageUrl} alt="" loading="lazy" /> : null,
        )}
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-kicker">{t('hero.kicker')}</div>
        <h1 className="hero-title">{t('hero.title')}</h1>
        <p className="hero-tagline">{t('tagline')}</p>
        <button type="button" className="btn btn-primary" onClick={onStart}>
          {t('hero.cta')}
        </button>
      </div>
    </section>
  );
}
