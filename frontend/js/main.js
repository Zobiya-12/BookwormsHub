// ─── main.js ──────────────────────────────────────────────────────────────────

// Scroll reveal
const obs = new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.08});
document.querySelectorAll('.fade-up').forEach(el=>obs.observe(el));

// Live ticker
const items = document.querySelectorAll('.htp-item'); let idx=0;
if(items.length){items[0].classList.add('active');setInterval(()=>{items[idx].classList.remove('active');idx=(idx+1)%items.length;items[idx].classList.add('active');},3000);}

// Nav
document.getElementById('navSearchToggle').addEventListener('click',()=>{document.getElementById('navSearchBar').classList.add('open');document.getElementById('searchInput').focus();});
document.getElementById('navSearchClose').addEventListener('click',()=>document.getElementById('navSearchBar').classList.remove('open'));
window.addEventListener('scroll',()=>{document.getElementById('mainNav').style.background=window.scrollY>60?'rgba(13,12,10,.98)':'rgba(13,12,10,.96)';});

// ── Render helpers ────────────────────────────────────────────────────────────
function renderRating(r){ return r ? r.toFixed(1) : '—'; }

// Safe encode for data-book — avoids any HTML attribute breakage
function encodeBook(b) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(b))));
}
function decodeBook(s) {
  return JSON.parse(decodeURIComponent(escape(atob(s))));
}

function renderBookCard(book) {
  const genre = book.genres?.[0] || 'Fiction';
  const coverHtml = book.cover
    ? `<img class="book-cover-img" src="${book.cover}" alt="" loading="lazy">`
    : `<div class="book-cover-placeholder">${book.title}</div>`;

  return `
    <div class="book-card" data-book="${encodeBook(book)}">
      <div class="book-cover-wrap">${coverHtml}</div>
      <div class="book-info">
        <div class="book-genre-tag">✦ ${genre}</div>
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-rating">
          <span class="rating-badge">★ ${renderRating(book.rating)}</span>
        </div>
      </div>
    </div>`;
}

function renderReleaseCard(book, i) {
  const coverHtml = book.cover
    ? `<img src="${book.cover}" alt="" loading="lazy">`
    : `<div class="release-cover-placeholder">${book.title}</div>`;
  return `
    <div class="release-card" data-book="${encodeBook(book)}">
      <div class="release-num">${String(i+1).padStart(2,'0')}</div>
      <div class="release-cover">${coverHtml}</div>
      <div class="release-info">
        <div class="release-title">${book.title}</div>
        <div class="release-author">${book.author}</div>
      </div>
    </div>`;
}

function attachClicks(el) {
  el.querySelectorAll('[data-book]').forEach(c => {
    c.addEventListener('click', () => {
      try { openPanel(decodeBook(c.dataset.book)); }
      catch(e){ console.error(e); }
    });
  });
}

// ── Load top picks ────────────────────────────────────────────────────────────
async function loadTopPicks() {
  const grid = document.getElementById('topPicksGrid');
  const picks = [
    {title:'Lost Lambs',      author:'Madeline Cash'},
    {title:'1984',             author:'George Orwell'},
    {title:'To Kill a Mockingbird', author:'Harper Lee'},
    {title:'Mornings in Jenin',       author:'Susan Abulhawa'},
    {title:'Harry Potter and the Philosopher\'s Stone', author:'J.K. Rowling'},
    {title:'The Great Gatsby', author:'F. Scott Fitzgerald'},
    {title:'The Lord of the Rings', author:'J.R.R. Tolkien'},
    {title:'Project Hail Mary', author:'Andy Weir'},
  ];
  const results = await Promise.all(picks.map(b => api.findBook(b.title, b.author)));
  const books = results.filter(Boolean);
  if (!books.length) {
    grid.innerHTML = '<div class="loading-msg">Could not load books — is the server running?</div>';
    return;
  }
  grid.innerHTML = books.map(b => renderBookCard(b)).join('');
  attachClicks(grid);
}

// ── Load new releases ─────────────────────────────────────────────────────────
async function loadNewReleases() {
  const sc = document.getElementById('newReleasesScroll');
  const data = await api.getByGenre('fiction', 12);
  if (!data?.results?.length) {
    sc.innerHTML = '<div class="loading-msg">Could not load releases.</div>';
    return;
  }
  sc.innerHTML = data.results.map((b,i) => renderReleaseCard(b, i)).join('');
  attachClicks(sc);
}

// ── Genre counts ──────────────────────────────────────────────────────────────
async function loadGenreCounts() {
  ['mystery','science_fiction','fantasy','romance','thriller','horror','biography','history'].forEach(async genre => {
    const data = await api.getByGenre(genre, 1);
    if (data?.total) {
      document.querySelectorAll(`.gc-count[data-genre="${genre}"]`).forEach(el => {
        el.textContent = data.total.toLocaleString() + ' Books';
      });
    }
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
async function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  const sec   = document.getElementById('searchResultsSection');
  const grid  = document.getElementById('searchResultsGrid');
  const label = document.getElementById('searchResultsLabel');
  sec.style.display = 'block';
  label.textContent = `Results for "${query}"`;
  grid.innerHTML = '<div class="loading-msg">Searching…</div>';
  sec.scrollIntoView({ behavior: 'smooth' });
  const data = await api.search(query, 8);
  if (!data?.results?.length) {
    grid.innerHTML = '<div class="loading-msg">No results found.</div>';
    return;
  }
  grid.innerHTML = data.results.map(b => renderBookCard(b)).join('');
  attachClicks(grid);
}

document.getElementById('searchBtn').addEventListener('click', handleSearch);
document.getElementById('searchInput').addEventListener('keydown', e => { if(e.key==='Enter') handleSearch(); });
document.getElementById('clearSearchBtn').addEventListener('click', () => {
  document.getElementById('searchResultsSection').style.display = 'none';
  document.getElementById('searchInput').value = '';
});
document.getElementById('heroExploreBtn').addEventListener('click', () => {
  document.querySelector('.books-section')?.scrollIntoView({ behavior: 'smooth' });
});

document.addEventListener('DOMContentLoaded', () => {
  loadTopPicks();
  loadNewReleases();
  loadGenreCounts();
  loadHeroCover();
});

// Load hero book cover
async function loadHeroCover() {
  const book = await api.findBook('Mother of Strangers', 'Suad Amiry');
  if (!book?.cover) return;
  const imgEl = document.getElementById('heroCoverImg');
  const frontEl = document.getElementById('heroFrontBook');
  if (!imgEl || !frontEl) return;
  imgEl.style.backgroundImage = `url('${book.cover}')`;
  imgEl.style.display = 'block';
  frontEl.classList.add('has-cover');
}