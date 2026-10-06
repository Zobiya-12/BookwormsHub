/* BookWorm's Hub — data layer (Open Library, no API key needed) */
const OL = 'https://openlibrary.org';
const BW = window.BW = window.BW || {};

BW.root = document.currentScript.src.replace(/js\/api\.js.*$/, '');
BW.user = () => { try { return JSON.parse(localStorage.getItem('bw_user')); } catch { return null; } };
// Sign-up is only requested when someone tries to save something
BW.requireUser = pending => {
  if (BW.user()) return true;
  try { localStorage.setItem('bw_pending', JSON.stringify(pending || null)); } catch {}
  location.href = BW.root + 'pages/signup.html?next=' + encodeURIComponent(location.href);
  return false;
};
BW.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
BW.cover = (id, size = 'M') => id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : '';

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Request failed: ' + r.status);
  return r.json();
}

// Normalise search results and subject results into one shape
const fromSearch = d => ({
  key: d.key, title: d.title, author: (d.author_name || ['Unknown author'])[0],
  coverId: d.cover_i, year: d.first_publish_year, pages: d.number_of_pages_median,
  rating: d.ratings_average ? +d.ratings_average.toFixed(1) : null
});
const fromSubject = (w, genre) => ({
  key: w.key, title: w.title, author: (w.authors?.[0]?.name) || 'Unknown author',
  coverId: w.cover_id, year: w.first_publish_year, genre
});

BW.api = {
  async search(q, limit = 20, offset = 0, sort = '') {
    const f = 'key,title,author_name,cover_i,first_publish_year,ratings_average,number_of_pages_median';
    const d = await getJSON(`${OL}/search.json?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}${sort ? '&sort=' + sort : ''}&fields=${f}`);
    return d.docs.map(fromSearch);
  },
  async genre(slug, limit = 24, offset = 0) {
    const d = await getJSON(`${OL}/subjects/${slug}.json?limit=${limit}&offset=${offset}`);
    return { total: d.work_count, books: d.works.map(w => fromSubject(w, slug)) };
  },
  async byYear(year) {
    const b = await this.search(`first_publish_year:${year} AND ratings_count:[5 TO *]`, 30, 0, 'rating');
    return b.filter(x => x.coverId).slice(0, 12);
  },
  async genreCount(slug) {
    const d = await getJSON(`${OL}/subjects/${slug}.json?limit=1`);
    return d.work_count;
  },
  // Full details for the book viewer: description, subjects, ratings
  async details(book) {
    if (book.source === 'gb') return { summary: book.summary || '', subjects: book.subjects || [], average: book.average || null, count: book.count || 0, dist: {} };
    const [work, rate] = await Promise.all([
      getJSON(`${OL}${book.key}.json`).catch(() => ({})),
      getJSON(`${OL}${book.key}/ratings.json`).catch(() => ({}))
    ]);
    const desc = typeof work.description === 'string' ? work.description : work.description?.value;
    return {
      summary: desc ? desc.split(/\r?\n---|\r?\n\r?\n\[/)[0].trim() : '',
      subjects: (work.subjects || []).slice(0, 12),
      average: rate.summary?.average || null,
      count: rate.summary?.count || 0,
      dist: rate.counts || {}
    };
  }
};