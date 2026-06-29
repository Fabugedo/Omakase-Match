import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchAnime, type AnimeSummary } from '../../api/client';

interface Props {
  favorites: AnimeSummary[];
  onAdd: (anime: AnimeSummary) => void;
  onRemove: (id: number) => void;
}

/** Search-as-you-type picker for favorite anime (T025), debounced, keyboard-friendly. */
export function FavoriteSearch({ favorites, onAdd, onRemove }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'done'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setStatus('idle');
      return;
    }
    setStatus('searching');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      searchAnime(q)
        .then((found) => {
          setResults(found.filter((f) => !favorites.some((fav) => fav.id === f.id)));
          setStatus('done');
        })
        .catch(() => {
          setResults([]);
          setStatus('done');
        });
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [query, favorites]);

  const add = (anime: AnimeSummary) => {
    onAdd(anime);
    setQuery('');
    setResults([]);
    setStatus('idle');
  };

  return (
    <div className="favorite-search">
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('form.favoritesPlaceholder')}
        aria-label={t('form.favorites')}
      />

      {query.trim().length > 0 && (
        <ul className="search-dropdown">
          {status === 'searching' && <li className="search-status">{t('form.searching')}</li>}
          {status === 'done' && results.length === 0 && (
            <li className="search-status">{t('form.noMatches')}</li>
          )}
          {results.map((anime) => (
            <li key={anime.id}>
              <button type="button" className="search-item" onClick={() => add(anime)}>
                {anime.imageUrl ? (
                  <img src={anime.imageUrl} alt="" loading="lazy" />
                ) : (
                  <img alt="" />
                )}
                <span>{anime.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {favorites.length > 0 && (
        <div className="favorites-list">
          {favorites.map((fav) => (
            <span key={fav.id} className="favorite-chip">
              {fav.title}
              <button
                type="button"
                aria-label={`${t('form.remove')}: ${fav.title}`}
                onClick={() => onRemove(fav.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
