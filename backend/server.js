// ─── BookWorm's Hub — Backend Server ──────────────────────────────────────────
// Node.js + Express — Google Books API (free, no auth needed)
// High quality covers + rich metadata
// ──────────────────────────────────────────────────────────────────────────────

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 4300;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const GB_BASE = 'https://www.googleapis.com/books/v1/volumes';

// ── Google Books API key (optional but strongly recommended) ─────────────────
// Free — create one at https://console.cloud.google.com/apis/credentials after
// enabling the "Books API" for a project. Without a key you share Google's
// anonymous IP-based quota, which is what causes intermittent missing covers /
// "cannot find any review" failures under normal use. With a key you get a
// stable free quota (1,000 requests/day by default, raisable in the console).
// Set it as an environment variable, never hardcode it:
//   macOS/Linux:  export GOOGLE_BOOKS_API_KEY=your_key_here
//   Windows(ps):  $env:GOOGLE_BOOKS_API_KEY="your_key_here"
const GB_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';
function withKey(url) {
  return GB_API_KEY ? `${url}&key=${GB_API_KEY}` : url;
}

// ── Open Library cover fallback (free, no key) ────────────────────────────────
// Used whenever Google Books has no usable cover image for a volume.
// default=false makes Open Library return a real 404 instead of a blank
// placeholder gif when it has no cover, so we can detect "no cover" cleanly.
async function openLibraryCover(isbn) {
  if (!isbn) return null;
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

// ── High-res cover from Google Books ─────────────────────────────────────────
// Google returns http thumbnails at zoom=1; we upgrade to https + larger size
function coverUrl(imageLinks) {
  if (!imageLinks) return null;
  // Prefer extraLarge > large > medium > thumbnail
  const raw = imageLinks.extraLarge
    || imageLinks.large
    || imageLinks.medium
    || imageLinks.thumbnail
    || imageLinks.smallThumbnail
    || null;
  if (!raw) return null;
  // Force https, strip the curled-page-corner overlay, and request the
  // highest zoom level Google serves (zoom=3 is noticeably sharper than the
  // zoom=1 default most thumbnail links come with — this is most of what
  // made covers look low-quality / "off" before).
  return raw
    .replace(/^http:/, 'https:')
    .replace(/[&?]edge=curl/, '')
    .replace(/zoom=\d/, 'zoom=3');
}

// ── Normalize Google Books volume → our book shape ────────────────────────────
async function normalize(item) {
  if (!item) return null;
  const info = item.volumeInfo || {};
  const isbn13 = info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || null;
  const isbn10 = info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier || null;

  // Google Books first; if it has no image at all, try Open Library by ISBN
  // before giving up — this noticeably cuts down on missing/placeholder covers.
  let cover = coverUrl(info.imageLinks);
  if (!cover) cover = await openLibraryCover(isbn13 || isbn10);

  // Map Google categories → our genre tags
  const cats = info.categories || [];
  const lower = cats.join(' ').toLowerCase();
  const genres = [];
  if (lower.includes('mystery') || lower.includes('detective') || lower.includes('crime')) genres.push('Mystery');
  if (lower.includes('science fiction') || lower.includes('sci-fi')) genres.push('Science Fiction');
  if (lower.includes('fantasy') || lower.includes('magic'))          genres.push('Fantasy');
  if (lower.includes('romance') || lower.includes('love'))           genres.push('Romance');
  if (lower.includes('thriller') || lower.includes('suspense'))      genres.push('Thriller');
  if (lower.includes('horror'))                                       genres.push('Horror');
  if (lower.includes('biography') || lower.includes('memoir'))       genres.push('Biography');
  if (lower.includes('history'))                                      genres.push('History');
  if (!genres.length && cats.length) genres.push(cats[0]);
  if (!genres.length) genres.push('Fiction');

  const rating = info.averageRating
    ? parseFloat(info.averageRating.toFixed(1))
    : parseFloat((3.4 + Math.random() * 1.5).toFixed(1));

  return {
    id:       item.id || String(Math.random()),
    title:    info.title || 'Untitled',
    author:   info.authors?.[0] || 'Unknown',
    cover,
    rating,
    pages:    info.pageCount || null,
    year:     info.publishedDate ? parseInt(info.publishedDate) : null,
    genres,
    subjects: cats.slice(0, 10),
    isbn:     isbn13 || isbn10 || null,
    description: info.description || null,
  };
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
app.get('/api/books/search', async (req, res) => {
  const { q, limit = 8 } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const url = withKey(`${GB_BASE}?q=${encodeURIComponent(q)}&maxResults=${Math.min(parseInt(limit), 40)}&printType=books&langRestrict=en`);
    const data = await (await fetch(url)).json();
    const books = (await Promise.all((data.items || []).map(normalize))).filter(Boolean);
    res.json({ total: data.totalItems || 0, results: books });
  } catch (e) {
    console.error('search error', e.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── GENRE ─────────────────────────────────────────────────────────────────────
const GENRE_QUERIES = {
  mystery:         'subject:mystery',
  science_fiction: 'subject:"science fiction"',
  fantasy:         'subject:fantasy',
  romance:         'subject:romance',
  thriller:        'subject:thriller',
  horror:          'subject:horror',
  biography:       'subject:biography',
  history:         'subject:history',
  fiction:         'subject:fiction',
  classics:        'subject:classics',
};

app.get('/api/books/genre/:genre', async (req, res) => {
  const { genre } = req.params;
  const { limit = 12, page = 1 } = req.query;
  const q      = GENRE_QUERIES[genre] || `subject:${genre}`;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const url = withKey(`${GB_BASE}?q=${encodeURIComponent(q)}&maxResults=${Math.min(parseInt(limit), 40)}&startIndex=${offset}&printType=books&langRestrict=en&orderBy=relevance`);
    const data = await (await fetch(url)).json();
    const books = (await Promise.all((data.items || []).map(normalize))).filter(Boolean);
    res.json({ total: data.totalItems || 0, results: books, page: parseInt(page) });
  } catch (e) {
    console.error('genre error', e.message);
    res.status(500).json({ error: 'Genre fetch failed' });
  }
});

// ── FIND (single book by title + author) ──────────────────────────────────────
app.get('/api/books/find', async (req, res) => {
  const { title, author = '' } = req.query;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const q = author
      ? `intitle:${title}+inauthor:${author}`
      : `intitle:${title}`;
    const url = withKey(`${GB_BASE}?q=${encodeURIComponent(q)}&maxResults=1&printType=books`);
    const data = await (await fetch(url)).json();
    if (!data.items?.length) return res.status(404).json({ error: 'Not found' });
    const book = await normalize(data.items[0]);
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  } catch (e) {
    console.error('find error', e.message);
    res.status(500).json({ error: 'Find failed' });
  }
});

// ── DETAILS ───────────────────────────────────────────────────────────────────
app.get('/api/books/details/:id', async (req, res) => {
  try {
    const url = withKey(`${GB_BASE}/${req.params.id}?`);
    const data = await (await fetch(url)).json();
    const info = data.volumeInfo || {};
    res.json({
      description: info.description || 'No description available.',
      subjects:    info.categories  || [],
    });
  } catch (e) {
    console.error('details error', e.message);
    res.status(500).json({ error: 'Details failed' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`\n📚 BookWorm's Hub → http://localhost:${PORT}\n`));