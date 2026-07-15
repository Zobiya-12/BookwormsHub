// ─── library.js ───────────────────────────────────────────────────────────────

// Nav search
const navSearchToggle = document.getElementById('navSearchToggle');
if(navSearchToggle) {
    navSearchToggle.addEventListener('click',()=>{document.getElementById('navSearchBar').classList.add('open');document.getElementById('searchInput').focus();});
}
const navSearchClose = document.getElementById('navSearchClose');
if(navSearchClose) {
    navSearchClose.addEventListener('click',()=>document.getElementById('navSearchBar').classList.remove('open'));
}

document.getElementById('searchBtn')?.addEventListener('click',()=>{
  const q=document.getElementById('searchInput').value.trim();
  if(q) window.location.href=`../index.html?search=${encodeURIComponent(q)}`;
});

// ── Library Storage ────────────────────────────────────────────────────────────
function getLibrary() {
  try { return JSON.parse(localStorage.getItem('bwh_library') || '[]'); }
  catch { return []; }
}
function saveLibrary(lib) {
  localStorage.setItem('bwh_library', JSON.stringify(lib));
}

// ── State ──────────────────────────────────────────────────────────────────────
let currentShelf = 'all';
let filterText   = '';
let editingBook  = null;

// ── Render ─────────────────────────────────────────────────────────────────────
const SHELF_LABELS = { reading: '📖 Reading', read: '✅ Finished', want: '🔖 Want to Read' };
const SHELF_CLASS  = { reading: 'shelf-reading', read: 'shelf-read', want: 'shelf-want' };

function renderStars(r){
    return r ? '★ ' + Number(r).toFixed(1) : '—';
}

function renderLibCard(book) {
  const cover = book.cover
    ? `<img src="${book.cover}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=\'lib-cover-placeholder\'>${book.title}</div>'">`
    : `<div class="lib-cover-placeholder">${book.title}</div>`;
  const badge = `<span class="lib-shelf-badge ${SHELF_CLASS[book.shelf]||'shelf-want'}">${SHELF_LABELS[book.shelf]||'🔖 Want to Read'}</span>`;

  return `
    <div class="lib-book-card" data-id="${book.id}">
      <div class="lib-book-cover">
        ${cover}
        ${badge}
      </div>
      <div class="lib-book-info">
        <div class="lib-book-genre">✦ ${book.genres?.[0]||'Fiction'}</div>
        <div class="lib-book-title">${book.title}</div>
        <div class="lib-book-author">${book.author}</div>
        <div class="lib-book-actions">
          <button class="lib-action-btn" onclick="openEditModal('${book.id}')">Manage</button>
          <button class="lib-action-btn" onclick="openBookPanel('${book.id}')">Details</button>
          <button class="lib-action-btn danger" onclick="removeBook('${book.id}')">Remove</button>
        </div>
      </div>
    </div>`;
}

function renderLibrary() {
  const lib = getLibrary();
  const grid  = document.getElementById('libGrid');
  const empty = document.getElementById('libEmpty');
  
  if(!grid || !empty) return; // Safety check

  // Stats
  document.getElementById('statTotal').textContent   = lib.length;
  document.getElementById('statRead').textContent    = lib.filter(b=>b.shelf==='read').length;
  document.getElementById('statReading').textContent = lib.filter(b=>b.shelf==='reading').length;
  document.getElementById('statWant').textContent    = lib.filter(b=>b.shelf==='want').length;

  // Filter
  let filtered = lib;
  if(currentShelf !== 'all') filtered = filtered.filter(b => b.shelf === currentShelf);
  if(filterText) {
    const q = filterText.toLowerCase();
    filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }

  if(!filtered.length) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    grid.style.display  = 'grid';
    grid.innerHTML = filtered.map(renderLibCard).join('');
  }
}

// ── Shelf Tabs ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.shelf-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shelf-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentShelf = btn.dataset.shelf;
    renderLibrary();
  });
});

document.getElementById('libSearch')?.addEventListener('input', e => {
  filterText = e.target.value;
  renderLibrary();
});

document.getElementById('libClearBtn')?.addEventListener('click', () => {
  if(confirm('Remove all books from your library? This cannot be undone.')) {
    saveLibrary([]);
    renderLibrary();
  }
});

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const modal        = document.getElementById('libModal');
const modalBackdrop = document.getElementById('modalBackdrop');

window.openEditModal = function(bookId) {
  const lib  = getLibrary();
  const book = lib.find(b => b.id === bookId);
  if(!book) return;
  editingBook = book;

  const img  = document.getElementById('modalCoverImg');
  const text = document.getElementById('modalCoverText');
  
  if(book.cover) { 
      img.src=book.cover; 
      img.style.display='block'; 
      text.style.display='none'; 
  } else { 
      img.style.display='none'; 
      text.style.display='block'; 
      text.textContent=book.title; 
  }

  document.getElementById('modalGenre').textContent  = '✦ ' + (book.genres?.[0]||'Fiction');
  document.getElementById('modalTitle').textContent  = book.title;
  document.getElementById('modalAuthor').textContent = book.author;
  document.getElementById('modalStars').textContent  = renderStars(book.rating);

  document.querySelectorAll('.modal-shelf-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shelf === book.shelf);
  });

  modal.classList.add('open');
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
};

function closeModal() {
  modal.classList.remove('open');
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  editingBook = null;
}

document.getElementById('modalClose')?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', closeModal);

document.querySelectorAll('.modal-shelf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if(!editingBook) return;
    const lib = getLibrary();
    const idx = lib.findIndex(b => b.id === editingBook.id);
    if(idx !== -1) { 
        lib[idx].shelf = btn.dataset.shelf; 
        saveLibrary(lib); 
    }
    document.querySelectorAll('.modal-shelf-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderLibrary();
  });
});

document.getElementById('modalRemoveBtn')?.addEventListener('click', () => {
  if(!editingBook) return;
  removeBook(editingBook.id);
  closeModal();
});

window.removeBook = function(bookId) {
  if(!confirm('Are you sure you want to remove this book?')) return;
  const lib = getLibrary().filter(b => b.id !== bookId);
  saveLibrary(lib);
  renderLibrary();
};

// ── Missing Logic: openPanel ───────────────────────────────────────────────
// This was the main cause of the error. Ensure you have this function defined.
window.openPanel = function(book) {
    console.log("Opening details for:", book.title);
    // Add your logic to show a side panel or detail view here
    // Example: document.getElementById('sidePanel').classList.add('active');
};

window.openBookPanel = function(bookId) {
  const lib  = getLibrary();
  const book = lib.find(b => b.id === bookId);
  if(book) openPanel(book);
};

// ── DOMContentLoaded ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', renderLibrary);