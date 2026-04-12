import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Gallery.module.css';

const API_KEY  = 'uaO8e3j55HhBtZHFHa9hLWn8QPaA4R3GCExRwWjow5g';
const PER_PAGE = 24;

const CATEGORIES = [
  { label: 'All',       val: '' },
  { label: 'Dark',      val: 'dark' },
  { label: 'Cyberpunk', val: 'cyberpunk' },
  { label: 'Nature',    val: 'nature' },
  { label: 'Space',     val: 'space' },
  { label: 'Abstract',  val: 'abstract' },
  { label: 'Minimal',   val: 'minimal' },
  { label: 'City',      val: 'city' },
];

const ORIENTATIONS = [
  { label: '📱 Mobile',  val: 'portrait' },
  { label: '🖥 Desktop', val: 'landscape' },
  { label: '◻ Square',  val: 'squarish' },
];

const COLORS = [
  { val: '',                label: 'Any',   bg: 'linear-gradient(135deg,#00e5a0,#00b4ff)' },
  { val: 'black_and_white', label: 'B&W',   bg: 'linear-gradient(135deg,#888,#222)' },
  { val: 'black',           label: 'Black', bg: '#111' },
  { val: 'white',           label: 'White', bg: '#eee' },
  { val: 'yellow',          label: 'Yellow',bg: '#f5d020' },
  { val: 'orange',          label: 'Orange',bg: '#f37335' },
  { val: 'red',             label: 'Red',   bg: '#c0392b' },
  { val: 'purple',          label: 'Purple',bg: '#8e44ad' },
  { val: 'magenta',         label: 'Magenta',bg:'#e91e8c' },
  { val: 'blue',            label: 'Blue',  bg: '#2980b9' },
  { val: 'teal',            label: 'Teal',  bg: '#1abc9c' },
  { val: 'green',           label: 'Green', bg: '#27ae60' },
];

export default function Gallery() {
  const [query,       setQuery]       = useState('');
  const [orient,      setOrient]      = useState('portrait');
  const [category,    setCategory]    = useState('');
  const [color,       setColor]       = useState('');
  const [sort,        setSort]        = useState('relevant');
  const [photos,      setPhotos]      = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [lbIndex,     setLbIndex]     = useState(null);
  const searchTimer = useRef(null);

  const fetchPhotos = useCallback(async (reset = false) => {
    setLoading(true);
    setError('');
    const q = [query || 'wallpaper', category].filter(Boolean).join(' ');
    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${reset ? 1 : page}&per_page=${PER_PAGE}&order_by=${sort}&orientation=${orient}`;
    if (color) url += `&color=${color}`;
    try {
      const res  = await fetch(url, { headers: { Authorization: `Client-ID ${API_KEY}` } });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPhotos(prev => reset ? data.results : [...prev, ...data.results]);
      if (reset) setPage(1);
    } catch (e) {
      setError(`Could not load images. (${e.message})`);
    } finally {
      setLoading(false);
    }
  }, [query, orient, category, color, sort, page]);

  // Fetch on filter change (reset)
  useEffect(() => {
    setPage(1);
    setPhotos([]);
    fetchPhotos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orient, category, color, sort]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setPhotos([]);
      fetchPhotos(true);
    }, 500);
    return () => clearTimeout(searchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
  };

  useEffect(() => {
    if (page === 1) return;
    fetchPhotos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Lightbox keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (lbIndex === null) return;
      if (e.key === 'Escape')     setLbIndex(null);
      if (e.key === 'ArrowLeft')  setLbIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setLbIndex(i => Math.min(photos.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbIndex, photos.length]);

  useEffect(() => {
    document.body.style.overflow = lbIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lbIndex]);

  const triggerDownload = (id) => {
    fetch(`https://api.unsplash.com/photos/${id}/download`, {
      headers: { Authorization: `Client-ID ${API_KEY}` }
    }).catch(() => {});
  };

  const lbPhoto = lbIndex !== null ? photos[lbIndex] : null;

  return (
    <div className={styles.gallery}>
      <div className={styles.header}>
        <div className={styles.tag}>// MODULE_05</div>
        <h2 className={styles.title}>IMAGE<span className={styles.accent}>_GALLERY</span></h2>
        <p className={styles.sub}>Powered by Unsplash. Search, filter, and download high-quality images.</p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search images..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            {ORIENTATIONS.map(o => (
              <button key={o.val}
                className={`${styles.filterBtn} ${orient === o.val ? styles.filterActive : ''}`}
                onClick={() => setOrient(o.val)}>{o.label}</button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            {CATEGORIES.map(c => (
              <button key={c.val}
                className={`${styles.filterBtn} ${category === c.val ? styles.filterActive : ''}`}
                onClick={() => setCategory(c.val)}>{c.label}</button>
            ))}
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.colorGroup}>
            <span className={styles.colorLabel}>Color:</span>
            {COLORS.map(c => (
              <button key={c.val} title={c.label}
                className={`${styles.colorBtn} ${color === c.val ? styles.colorActive : ''}`}
                style={{ background: c.bg }}
                onClick={() => setColor(c.val)} />
            ))}
          </div>
          <div className={styles.sortWrap}>
            <span className={styles.sortLabel}>Sort:</span>
            <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="relevant">Relevant</option>
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results bar */}
      {total > 0 && !loading && (
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>{total.toLocaleString()} results</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.stateBox}>
          <div className={styles.stateIcon}>⚠</div>
          <div className={styles.stateTitle}>Could not load images</div>
          <div className={styles.stateSub}>{error}</div>
        </div>
      )}

      {/* Loading initial */}
      {loading && photos.length === 0 && (
        <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
      )}

      {/* Empty */}
      {!loading && !error && photos.length === 0 && (
        <div className={styles.stateBox}>
          <div className={styles.stateIcon}>🔍</div>
          <div className={styles.stateTitle}>No results found</div>
          <div className={styles.stateSub}>Try a different search term or filters.</div>
        </div>
      )}

      {/* Masonry */}
      {photos.length > 0 && (
        <div className={styles.masonry}>
          {photos.map((photo, idx) => (
            <div key={photo.id} className={styles.photoItem} onClick={() => setLbIndex(idx)}>
              <img src={photo.urls.small} alt={photo.alt_description || 'image'} loading="lazy" />
              <div className={styles.photoOverlay}>
                <div className={styles.photoAuthor}>
                  Photo by <a href={`${photo.user.links.html}?utm_source=mysite&utm_medium=referral`}
                    target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{photo.user.name}</a>
                  {' '}on{' '}
                  <a href="https://unsplash.com?utm_source=mysite&utm_medium=referral"
                    target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Unsplash</a>
                </div>
                <div className={styles.overlayBtns}>
                  <a className={styles.dlBtn}
                    href={`${photo.links.download}&force=true`}
                    download={`${photo.id}.jpg`}
                    target="_blank" rel="noreferrer"
                    onClick={e => { e.stopPropagation(); triggerDownload(photo.id); }}>↓ Download</a>
                  <button className={styles.previewBtn} onClick={e => { e.stopPropagation(); setLbIndex(idx); }}>⤢ Preview</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {photos.length > 0 && page < totalPages && (
        <div className={styles.loadMoreWrap}>
          <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More →'}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lbPhoto && (
        <div className={styles.lightbox} onClick={() => setLbIndex(null)}>
          <div className={styles.lightboxInner} onClick={e => e.stopPropagation()}>
            <button className={styles.lbClose} onClick={() => setLbIndex(null)}>✕</button>
            {lbIndex > 0 && (
              <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={() => setLbIndex(i => i - 1)}>‹</button>
            )}
            {lbIndex < photos.length - 1 && (
              <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={() => setLbIndex(i => i + 1)}>›</button>
            )}
            <img src={lbPhoto.urls.regular} alt={lbPhoto.alt_description || 'image'} />
            <div className={styles.lbMeta}>
              <span className={styles.lbAuthor}>
                Photo by{' '}
                <a href={`${lbPhoto.user.links.html}?utm_source=mysite&utm_medium=referral`}
                  target="_blank" rel="noreferrer">{lbPhoto.user.name}</a>
                {' '}on{' '}
                <a href="https://unsplash.com?utm_source=mysite&utm_medium=referral"
                  target="_blank" rel="noreferrer">Unsplash</a>
              </span>
              <a className={styles.lbDl}
                href={`${lbPhoto.links.download}&force=true`}
                download={`${lbPhoto.id}.jpg`}
                target="_blank" rel="noreferrer"
                onClick={() => triggerDownload(lbPhoto.id)}>↓ Download Full</a>
            </div>
          </div>
        </div>
      )}

      <div className={styles.credit}>
        Images powered by <a href="https://unsplash.com?utm_source=mysite&utm_medium=referral" target="_blank" rel="noreferrer">Unsplash</a>
      </div>
    </div>
  );
}
