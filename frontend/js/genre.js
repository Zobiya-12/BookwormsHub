// ─── genre.js ─────────────────────────────────────────────────────────────────

// Nav search
document.getElementById('navSearchToggle').addEventListener('click',()=>{document.getElementById('navSearchBar').classList.add('open');document.getElementById('searchInput').focus();});
document.getElementById('navSearchClose').addEventListener('click',()=>document.getElementById('navSearchBar').classList.remove('open'));
document.getElementById('searchBtn').addEventListener('click', async () => {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  window.location.href = `../index.html?search=${encodeURIComponent(q)}`;
});

const GENRE_META = {
  mystery:        { name:'Mystery',    icon:'🖤', bg:'gc-mystery',  accent:'#7eb8f7', accentRgb:'126,184,247' },
  science_fiction:{ name:'Sci-Fi',     icon:'🚀', bg:'gc-scifi',   accent:'#4ecdc4', accentRgb:'78,205,196'  },
  fantasy:        { name:'Fantasy',    icon:'🐉', bg:'gc-fantasy', accent:'#b87fff', accentRgb:'184,127,255' },
  romance:        { name:'Romance',    icon:'💌', bg:'gc-romance', accent:'#ff8cb0', accentRgb:'255,140,176' },
  thriller:       { name:'Thriller',   icon:'⚡', bg:'gc-thriller',accent:'#f0c040', accentRgb:'240,192,64'  },
  horror:         { name:'Horror',     icon:'👻', bg:'gc-horror',  accent:'#ff6b6b', accentRgb:'255,107,107' },
  biography:      { name:'Biography',  icon:'✍️', bg:'gc-bio',     accent:'#4fc3b0', accentRgb:'79,195,176'  },
  history:        { name:'History',    icon:'🏛️', bg:'gc-history', accent:'#d4a840', accentRgb:'212,168,64'  },
};

const PER_PAGE = 20;
let currentPage = 1;
let currentGenre = '';
let totalBooks = 0;

const params = new URLSearchParams(location.search);
currentGenre = params.get('g') || 'fantasy';
const meta = GENRE_META[currentGenre] || { name: currentGenre, icon: '📚', bg: 'gc-fantasy', accent: '#c9a84c', accentRgb: '201,168,76' };

document.title = `${meta.name} — BookWorm's Hub`;
document.getElementById('ghIcon').textContent = meta.icon;
document.getElementById('ghTitle').textContent = meta.name;
document.getElementById('ghBg').className = `gh-bg ${meta.bg}`;

if (meta.accent) {
  document.documentElement.style.setProperty('--genre-accent', meta.accent);
  document.documentElement.style.setProperty('--genre-accent-rgb', meta.accentRgb);
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderRating(r){ return r ? r.toFixed(1) : '—'; }

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

function attachClicks(el) {
  el.querySelectorAll('[data-book]').forEach(c => {
    c.addEventListener('click', () => {
      try { openPanel(decodeBook(c.dataset.book)); }
      catch(e){ console.error(e); }
    });
  });
}

function renderPagination() {
  const totalPages = Math.ceil(totalBooks / PER_PAGE);
  if (totalPages <= 1) { document.getElementById('pagination').innerHTML = ''; return; }
  const prev = currentPage > 1 ? `<button class="page-btn prev-btn" onclick="goPage(${currentPage-1})">← Prev</button>` : '';
  const next = currentPage < totalPages ? `<button class="page-btn next-btn" onclick="goPage(${currentPage+1})">Next →</button>` : '';
  let pages = '';
  for(let i=Math.max(1,currentPage-2); i<=Math.min(totalPages,currentPage+2); i++) {
    pages += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  document.getElementById('pagination').innerHTML = prev + pages + next;
}

async function loadBooks(page = 1) {
  currentPage = page;
  const grid = document.getElementById('genreBooksGrid');
  grid.innerHTML = '<div class="loading-msg">Loading books…</div>';
  window.scrollTo({ top: document.querySelector('.genre-books-section').offsetTop - 80, behavior: 'smooth' });

  const data = await api.getByGenre(currentGenre, PER_PAGE, page);
  if (!data?.results?.length) {
    grid.innerHTML = '<div class="loading-msg">No books found.</div>';
    return;
  }
  totalBooks = data.total;
  document.getElementById('ghCount').textContent = totalBooks.toLocaleString() + ' books in this genre';
  grid.innerHTML = data.results.map(b => renderBookCard(b)).join('');
  attachClicks(grid);
  renderPagination();
}

window.goPage = loadBooks;

document.querySelectorAll('.gh-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gh-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadBooks(1);
  });
});

document.addEventListener('DOMContentLoaded', () => loadBooks(1));