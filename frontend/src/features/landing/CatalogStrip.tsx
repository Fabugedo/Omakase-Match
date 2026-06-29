import { useTranslation } from 'react-i18next';
import type { AnimeSummary } from '../../api/client';

interface Props {
  covers: AnimeSummary[];
}

/**
 * Full-width marquee of real catalog cover art. Decorative (aria-hidden);
 * the list is duplicated so the CSS marquee can loop seamlessly at -50%.
 */
export function CatalogStrip({ covers }: Props) {
  const { t } = useTranslation();
  const withImg = covers.filter((c) => c.imageUrl);
  if (withImg.length === 0) return null;

  const loop = [...withImg, ...withImg];

  return (
    <section className="catalog-band" id="catalog">
      <div className="container">
        <div className="step-label">{t('featured.label')}</div>
        <p className="section-lead">{t('featured.lead')}</p>
      </div>

      <div className="catalog-marquee" aria-hidden="true">
        <div className="catalog-track">
          {loop.map((c, i) => (
            <img key={`${c.id}-${i}`} src={c.imageUrl ?? ''} alt="" loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
