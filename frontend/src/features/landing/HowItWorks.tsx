import { useTranslation } from 'react-i18next';

const STEPS = [1, 2, 3] as const;

/**
 * "How it works" — describes the app's real, deterministic flow
 * (taste → transparent scoring → grouped matches). No invented features.
 */
export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="section" id="how">
      <div className="container">
        <div className="step-label">{t('how.label')}</div>
        <p className="section-lead">{t('how.lead')}</p>

        <div className="how-grid">
          {STEPS.map((n) => (
            <article className="how-card" key={n}>
              <div className="how-num">{`0${n}`}</div>
              <h3>{t(`how.step${n}.title`)}</h3>
              <p>{t(`how.step${n}.body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
