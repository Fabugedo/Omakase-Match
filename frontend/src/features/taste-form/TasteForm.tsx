import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FavoriteSearch } from './FavoriteSearch';
import type { AnimeSummary, Genre, TasteProfile } from '../../api/client';

interface Props {
  genres: Genre[];
  onSubmit: (profile: TasteProfile) => void;
}

/** The taste form (T025): genre/theme chips, favorite search, 18+ toggle, submit. */
export function TasteForm({ genres, onSubmit }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<AnimeSummary[]>([]);
  const [includeExplicit, setIncludeExplicit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genreList = genres.filter((g) => g.kind === 'GENRE');
  const themeList = genres.filter((g) => g.kind === 'THEME');

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError(t('form.needGenre'));
      return;
    }
    onSubmit({
      genreIds: selected,
      favoriteAnimeIds: favorites.map((f) => f.id),
      includeExplicit,
    });
  };

  const chips = (list: Genre[]) => (
    <div className="chips">
      {list.map((g) => (
        <button
          key={g.id}
          type="button"
          className="chip"
          aria-pressed={selected.includes(g.id)}
          onClick={() => toggle(g.id)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );

  return (
    <form className="panel" onSubmit={handleSubmit} noValidate>
      <div className="form-section">
        <div className="section-hint">{t('form.genresHint')}</div>
        <div className="subgroup-label">{t('form.genres')}</div>
        {chips(genreList)}
        <div className="subgroup-label">{t('form.themes')}</div>
        {chips(themeList)}
      </div>

      <div className="form-section">
        <div className="section-label">
          {t('form.favorites')}{' '}
          <span className="optional-tag">({t('form.favoritesOptional')})</span>
        </div>
        <div className="section-hint">{t('form.favoritesHint')}</div>
        <FavoriteSearch
          favorites={favorites}
          onAdd={(a) => setFavorites((prev) => [...prev, a])}
          onRemove={(id) => setFavorites((prev) => prev.filter((f) => f.id !== id))}
        />
      </div>

      <div className="form-section">
        <label className="explicit-row">
          <input
            type="checkbox"
            checked={includeExplicit}
            onChange={(e) => setIncludeExplicit(e.target.checked)}
          />
          <span className="explicit-text">
            <strong>{t('form.explicit')}</strong>
            <span>{t('form.explicitConfirm')}</span>
          </span>
        </label>
      </div>

      <div className="submit-row">
        <button type="submit" className="btn btn-primary">
          {t('form.submit')}
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
