// ─── panel.js ────────────────────────────────────────────────────────────────
const localReviews = {
  'fourth wing': { reviews: [
    { name: 'Aria K.', badge: 'Verified', stars: '★★★★★', text: 'I finished this in one sitting. The dragons, the tension — impossible to put down.', date: 'Feb 2026' },
    { name: 'James R.', badge: 'Top Reader', stars: '★★★★★', text: "The world-building is extraordinary. Best fantasy I've read in years.", date: 'Jan 2026' },
    { name: 'Sophie M.', badge: 'Verified', stars: '★★★★☆', text: 'The slow burn romance is executed perfectly.', date: 'Dec 2025' },
  ], bars: [92,75,40,10,5] },
  '1984': { reviews: [
    { name: 'Omar T.', badge: 'Top Reader', stars: '★★★★★', text: 'Reading this in 2026 is terrifying — how prescient it is.', date: 'Mar 2026' },
    { name: 'Layla S.', badge: 'Verified', stars: '★★★★★', text: "The language Orwell invented has become part of how we understand the world.", date: 'Jan 2026' },
  ], bars: [88,70,30,8,4] },
  default: { reviews: [
    { name: 'BookWorm Reader', badge: 'Verified', stars: '★★★★☆', text: 'A wonderful read. Highly recommended to anyone who loves this genre.', date: 'Apr 2026' },
  ], bars: [70,65,40,15,8] }
};

const panel    = document.getElementById('sidePanel');
const backdrop = document.getElementById('backdrop');
const panelClose = document.getElementById('panelClose');

async function openPanel(book) {
  populateHeader(book);
  panel.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  switchTab('summary');
  updateAddBtn(book);

  // Use description already on book object (Google Books includes it inline)
  if (book.description) {
    document.getElementById('panelSummary').textContent = book.description;
    populateDetailsTab({ description: book.description, subjects: book.subjects || [] });
  } else {
    document.getElementById('panelSummary').textContent = 'Loading description…';
    if (book.id) {
      const details = await api.getDetails(book.id);
      if (details) {
        document.getElementById('panelSummary').textContent = details.description || 'No description available.';
        populateDetailsTab(details);
      } else {
        document.getElementById('panelSummary').textContent = 'Description not available.';
      }
    }
  }

  populateReviews(book);
  setTimeout(() => {
    document.querySelectorAll('.rating-bar-fill').forEach(el => { el.style.width = el.dataset.width; });
  }, 600);
}

function updateAddBtn(book) {
  const btn = document.getElementById('panelAddBtn');
  if (!btn) return;
  const lib = getLibrary();
  const exists = lib.find(b => b.id === book.id);
  if (exists) {
    btn.textContent = '✓ In My Library';
    btn.classList.add('added');
    btn.onclick = null;
  } else {
    btn.textContent = '✦ Add to My Library';
    btn.classList.remove('added');
    btn.onclick = () => { addToLibrary(book); updateAddBtn(book); };
  }
}

function getLibrary() {
  try { return JSON.parse(localStorage.getItem('bwh_library') || '[]'); }
  catch { return []; }
}

function addToLibrary(book) {
  const lib = getLibrary();
  if (lib.find(b => b.id === book.id)) return;
  lib.push({ ...book, shelf: 'want', addedAt: Date.now() });
  localStorage.setItem('bwh_library', JSON.stringify(lib));
  showToast(`"${book.title}" added to your library!`);
}

function showToast(msg) {
  let t = document.getElementById('bwh-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bwh-toast';
    t.style.cssText = `
      position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);
      background:var(--gold);color:var(--bg);padding:12px 24px;border-radius:50px;
      font-family:var(--mono);font-size:12px;letter-spacing:.08em;font-weight:500;
      z-index:9999;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  setTimeout(() => { t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; }, 10);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 2800);
}

function populateHeader(book) {
  const coverImg  = document.getElementById('panelCoverImg');
  const coverText = document.getElementById('panelCoverText');
  if (book.cover) {
    coverImg.src = book.cover; coverImg.style.display = 'block';
    if (coverText) coverText.style.display = 'none';
  } else {
    coverImg.style.display = 'none';
    if (coverText) { coverText.style.display = 'block'; coverText.textContent = book.title; }
  }
  document.getElementById('panelGenre').textContent  = '✦ ' + (book.genres?.[0] || 'Fiction');
  document.getElementById('panelTitle').textContent  = book.title;
  document.getElementById('panelAuthor').textContent = book.author;
  document.getElementById('panelPages').textContent  = book.pages ? book.pages + ' pages' : '—';
  const rating = book.rating || 0;
  document.getElementById('panelStars').textContent  = rating ? '★ ' + rating.toFixed(1) : '—';
  document.getElementById('panelRating').textContent = rating ? '/ 5' : '';
  document.getElementById('detailGenre').textContent = book.genres?.[0] || '—';
  document.getElementById('detailPages').textContent = book.pages || '—';
  document.getElementById('detailYear').textContent  = book.year || '—';
  document.getElementById('detailRating').textContent = rating ? rating + ' ★' : '—';
}

function populateReviews(book) {
  const data = localReviews[book.title.toLowerCase()] || localReviews.default;
  document.getElementById('reviewsBigNum').textContent = book.rating || '—';
  document.getElementById('reviewsBars').innerHTML = [5,4,3,2,1].map((n,i) => `
    <div class="rating-bar-row">
      <div class="rating-bar-label">${n}</div>
      <div class="rating-bar-track"><div class="rating-bar-fill" style="width:0%" data-width="${data.bars[i]}%"></div></div>
      <div class="rating-bar-count">${data.bars[i]}%</div>
    </div>`).join('');
  document.getElementById('reviewsList').innerHTML = data.reviews.map(r => `
    <div class="review-card">
      <div class="review-card-header"><div class="reviewer-name">${r.name}</div><div class="reviewer-badge">${r.badge}</div></div>
      <div class="review-card-stars">${r.stars}</div>
      <div class="review-card-text">"${r.text}"</div>
      <div class="review-card-date">${r.date}</div>
    </div>`).join('');
}

function populateDetailsTab(details) {
  document.getElementById('panelTags').innerHTML = (details.subjects?.length)
    ? details.subjects.map(s => `<span class="tag-item">${s}</span>`).join('')
    : '<span class="tag-item">No subjects listed</span>';
  document.getElementById('panelSimilar').innerHTML = `<div class="similar-ph">Sign in to see personalised recommendations</div>`;
}

function closePanel() {
  panel.classList.remove('open'); backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function switchTab(name) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel-tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
}

panelClose.addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);
document.querySelectorAll('.panel-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });