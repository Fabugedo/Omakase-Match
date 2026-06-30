import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FavoriteSearch } from './FavoriteSearch';
import type { AnimeSummary, Genre, TasteProfile } from '../../api/client';

interface Props {
  genres: Genre[];
  onSubmit: (profile: TasteProfile) => void;
  /** Pre-selected genre/theme ids — e.g. from the conversational interpreter (US4). */
  initialSelected?: number[];
}

const THEMES_COLLAPSED = 14; // show a manageable first row of themes, reveal the rest on demand

/**
 * The structured taste form (T025): genre/theme chips, favorite search, 18+
 * toggle, submit. Now also serves as the refinement step after the
 * conversational input (US4) — `initialSelected` pre-fills the interpreted tags.
 */
export function TasteForm({ genres, onSubmit, initialSelected }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number[]>(initialSelected ?? []);
  const [favorites, setFavorites] = useState<AnimeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllThemes, setShowAllThemes] = useState(false);

  const genreList = genres.filter((g) => g.kind === 'GENRE');
  const themeList = genres.filter((g) => g.kind === 'THEME');
  // Keep any selected-but-hidden themes visible so selections never disappear.
  const visibleThemes =
    showAllThemes || themeList.length <= THEMES_COLLAPSED
      ? themeList
      : themeList.filter((g, i) => i < THEMES_COLLAPSED || selected.includes(g.id));

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
    // Anonymous use is SFW-only; the mature gate moves to registered, age-confirmed
    // accounts in feature 002 (supersedes the old anonymous self-attestation toggle).
    onSubmit({
      genreIds: selected,
      favoriteAnimeIds: favorites.map((f) => f.id),
      includeExplicit: false,
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
        {chips(visibleThemes)}
        {themeList.length > THEMES_COLLAPSED && (
          <button type="button" className="link-btn" onClick={() => setShowAllThemes((v) => !v)}>
            {showAllThemes ? t('form.showLess') : t('form.showMore')}
          </button>
        )}
      </div>

      <div className="form-section">
        <div className="section-head">
          <span className="section-label">{t('form.favorites')}</span>
          <span className="optional-tag">{t('form.favoritesOptional')}</span>
        </div>
        <div className="section-hint">{t('form.favoritesHint')}</div>
        <FavoriteSearch
          favorites={favorites}
          onAdd={(a) => setFavorites((prev) => [...prev, a])}
          onRemove={(id) => setFavorites((prev) => prev.filter((f) => f.id !== id))}
        />
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
