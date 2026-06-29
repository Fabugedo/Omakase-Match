import { useTranslation } from 'react-i18next';
import type { Recommendation, RecommendationsResult } from '../../api/client';

interface Props {
  data: RecommendationsResult;
  onStartOver: () => void;
}

const BAND_ORDER = ['CHEFS_PICK', 'RECOMMENDED', 'WORTH_A_TRY'] as const;

const BAND_EMOJI: Record<(typeof BAND_ORDER)[number], string> = {
  CHEFS_PICK: '🍣',
  RECOMMENDED: '🌟',
  WORTH_A_TRY: '🍵',
};

/** Results view (T026): warm cards grouped by band; plain-text only; friendly states. */
export function Results({ data, onStartOver }: Props) {
  const { t } = useTranslation();
  const { results } = data;

  if (results.length === 0) {
    return (
      <div className="panel state">
        <span className="state-emoji" aria-hidden="true">
          🍱
        </span>
        <p>{t('results.empty')}</p>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: '1rem' }}
          onClick={onStartOver}
        >
          {t('results.startOver')}
        </button>
      </div>
    );
  }

  const groups = BAND_ORDER.map((band) => ({
    band,
    items: results.filter((r) => r.band === band),
  })).filter((g) => g.items.length > 0);

  return (
    <section>
      <div className="results-header">
        <div>
          <h2>{t('results.heading')}</h2>
          <p className="curated">{t('results.curated')}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onStartOver}>
          {t('results.startOver')}
        </button>
      </div>

      {results.length < 10 && <div className="notice">{t('results.notEnough')}</div>}

      {groups.map((group) => (
        <div key={group.band} className={`band-section band-${group.band}`}>
          <div className="band-head">
            <span className="band-emoji" aria-hidden="true">
              {BAND_EMOJI[group.band]}
            </span>
            <span className="band-badge">{t(`results.bands.${group.band}`)}</span>
            <span className="band-count">{group.items.length}</span>
            <span className="band-rule" aria-hidden="true" />
          </div>
          <div className="cards">
            {group.items.map((item) => (
              <AnimeCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function AnimeCard({ item }: { item: Recommendation }) {
  return (
    <article className="card">
      {item.imageUrl ? (
        <div className="card-cover-wrap">
          <img className="card-cover" src={item.imageUrl} alt={item.title} loading="lazy" />
        </div>
      ) : (
        <div className="card-cover-wrap placeholder" aria-hidden="true">
          🍥
        </div>
      )}
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        {item.genres.length > 0 && (
          <div className="card-genres">
            {item.genres.slice(0, 3).map((g) => (
              <span key={g} className="card-genre">
                {g}
              </span>
            ))}
          </div>
        )}
        {item.reason && <p className="card-reason">{item.reason}</p>}
      </div>
    </article>
  );
}
