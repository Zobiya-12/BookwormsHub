/* BookWorm's Hub — homepage */
(function () {
  const $ = id => document.getElementById(id);
  const nav = $('mainNav');

  // Nav: search bar, mobile menu, dropdown (tap-friendly)
  $('navSearchToggle').onclick = () => { nav.classList.toggle('searching'); $('searchInput').focus(); };
  $('navSearchClose').onclick = () => nav.classList.remove('searching');
  $('menuBtn').onclick = () => nav.classList.toggle('menu-open');
  document.querySelector('.nav-dropdown-wrap > button').onclick = e => {
    e.stopPropagation(); e.currentTarget.parentElement.classList.toggle('open');
  };
  document.addEventListener('click', () => document.querySelector('.nav-dropdown-wrap').classList.remove('open'));

  $('heroExploreBtn').onclick = () => document.querySelector('.genres-section').scrollIntoView({ behavior: 'smooth' });

  // Search
  async function runSearch() {
    const q = $('searchInput').value.trim(); if (!q) return;
    const sec = $('searchResultsSection'), grid = $('searchResultsGrid');
    sec.style.display = 'block'; $('searchResultsLabel').textContent = `Results for “${q}”`;
    grid.innerHTML = '<div class="loading-msg">Searching…</div>'; sec.scrollIntoView({ behavior: 'smooth' });
    try { BW.fill(grid, await BW.api.search(q, 18), 'No books matched. Try a title, an author or a subject.'); }
    catch { grid.innerHTML = '<div class="loading-msg">Search is unavailable right now. Try again in a moment.</div>'; }
  }
  $('searchBtn').onclick = runSearch;
  $('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
  $('clearSearchBtn').onclick = () => { $('searchResultsSection').style.display = 'none'; $('searchInput').value = ''; };

  // Genre counts
  document.querySelectorAll('.gc-count').forEach(el =>
    BW.api.genreCount(el.dataset.genre).then(n => el.textContent = n.toLocaleString() + ' books').catch(() => el.textContent = 'Browse'));

  // Find your next read
  const MOODS = {
    'Cozy': 'subject:("cozy mystery" OR friendship OR "country life")',
    'Gripping': 'subject:(thriller OR suspense)',
    'Escape': 'subject:(fantasy OR adventure)',
    'Heartbreak': 'subject:("love stories" OR romance)',
    'Mind-bending': 'subject:("science fiction" OR "time travel")',
    'Learn something': 'subject:(history OR biography)'
  };
  const LENGTHS = { 'Any length': '', 'Quick, under 250 pages': '[1 TO 249]', 'Weekend, 250-450': '[250 TO 450]', 'Epic, 450+': '[451 TO *]' };
  let mood = null, len = 'Any length';
  const chips = (id, opts, get, set) => {
    const box = $(id);
    box.innerHTML = Object.keys(opts).map(k => `<button class="chip${get() === k ? ' on' : ''}" aria-pressed="${get() === k}">${k}</button>`).join('');
    box.querySelectorAll('.chip').forEach(b => b.onclick = () => { set(b.textContent); drawChips(); findBooks(); });
  };
  const drawChips = () => { chips('moodChips', MOODS, () => mood, v => mood = v); chips('lenChips', LENGTHS, () => len, v => len = v); };
  async function findBooks(random) {
    if (!mood) { $('finderNote').textContent = 'Pick a mood first, or let us surprise you.'; return; }
    const grid = $('finderGrid'); grid.innerHTML = '<div class="loading-msg">Finding books…</div>';
    const pages = LENGTHS[len] ? ` AND number_of_pages_median:${LENGTHS[len]}` : '';
    const q = `${MOODS[mood]}${pages} AND ratings_count:[5 TO *]`;
    try {
      const books = (await BW.api.search(q, 24, random ? Math.floor(Math.random() * 60) : 0, 'rating')).filter(b => b.coverId).slice(0, 12);
      $('finderNote').textContent = books.length ? `${books.length} ${mood.toLowerCase()} reads, ${len.toLowerCase()}` : '';
      BW.fill(grid, books, 'Nothing matched that combination. Try another length or mood.');
    } catch { grid.innerHTML = '<div class="loading-msg">Couldn\'t load books. Try again in a moment.</div>'; }
  }
  $('surpriseBtn').onclick = () => { const k = Object.keys(MOODS); mood = k[Math.floor(Math.random() * k.length)]; drawChips(); findBooks(true); };
  drawChips();

  // Best reads by year
  const thisYear = new Date().getFullYear(); let year = thisYear - 1;
  function drawYears() {
    const box = $('yearChips'); box.innerHTML = '';
    for (let y = thisYear; y >= thisYear - 14; y--) {
      const b = document.createElement('button'); b.className = 'chip' + (y === year ? ' on' : ''); b.textContent = y;
      b.setAttribute('aria-pressed', y === year); b.onclick = () => { year = y; drawYears(); loadYear(); }; box.appendChild(b);
    }
  }
  async function loadYear() {
    $('yearGrid').innerHTML = '<div class="loading-msg">Loading…</div>';
    try { BW.fill($('yearGrid'), await BW.api.byYear(year), `No rated books found for ${year} yet.`); }
    catch { $('yearGrid').innerHTML = '<div class="loading-msg">Couldn\'t load this year. Try again in a moment.</div>'; }
  }
  drawYears(); loadYear();

  // Hero editor's pick opens its book
  let pick = null;
  BW.api.search('Mother of Strangers Suad Amiry', 1).then(r => {
    pick = r[0];
    if (pick && pick.coverId) $('heroFrontBook').style.backgroundImage = `linear-gradient(180deg,rgba(10,8,20,.05) 35%,rgba(10,8,20,.93)),url(${BW.cover(pick.coverId, 'L')})`;
  }).catch(() => {});
  $('heroFrontBook').onclick = () => pick && BW.open(pick);

  // Best books by country
  const COUNTRIES = ['India', 'Pakistan', 'Palestine', 'Japan', 'Nigeria', 'Russia', 'France', 'England', 'United States', 'Colombia', 'Iran', 'Egypt'];
  let country = 'India';
  function drawCountries() {
    const box = $('countryChips');
    box.innerHTML = COUNTRIES.map(c => `<button class="chip${c === country ? ' on' : ''}" aria-pressed="${c === country}">${c}</button>`).join('');
    box.querySelectorAll('.chip').forEach(b => b.onclick = () => { country = b.textContent; drawCountries(); loadCountry(); });
  }
  async function loadCountry() {
    $('countryGrid').innerHTML = '<div class="loading-msg">Loading…</div>';
    try {
      const b = await BW.api.search(`(subject:"${country}" OR place:"${country}") AND ratings_count:[5 TO *]`, 30, 0, 'rating');
      BW.fill($('countryGrid'), b.filter(x => x.coverId).slice(0, 12), `No rated books found for ${country} yet.`);
    } catch { $('countryGrid').innerHTML = '<div class="loading-msg">Couldn\'t load books. Try again in a moment.</div>'; }
  }
  drawCountries(); loadCountry();

  // Scroll reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
})();