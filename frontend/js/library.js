/* BookWorm's Hub — My Library: shelf, status, reading progress, yearly goal */
(function () {
  const root = document.getElementById('lib');
  const esc = BW.esc;
  const user = BW.user();
  const signupUrl = BW.root + 'pages/signup.html';

  // Not signed up yet: explain, and send them to sign up
  if (!user) {
    root.innerHTML = `<div class="gate">
      <h1>Your library is waiting</h1>
      <p class="sec-sub">Create a free reader pass to save books, track what you're reading and count towards your yearly goal.</p>
      <a class="btn-primary" href="${signupUrl}?next=${encodeURIComponent(location.href)}">Create my pass</a>
      <a class="btn-ghost" href="${BW.root}index.html">Browse books first</a></div>`;
    return;
  }

  const STATUS = [['want', 'Want to read'], ['reading', 'Reading'], ['done', 'Finished']];
  const SPINES = ['#7a2a22', '#1f5c4a', '#5b3d22', '#3d4a7a', '#7a5a1f', '#5a2d5e', '#2d5a5e'];
  const thisYear = new Date().getFullYear();
  const first = (user.name || '').split(/\s+/)[0] || 'Your';
  const goal = user.goal || 25;

  let lib = BW.store.get('bw_library', []);
  lib.forEach(b => { if (!b.status) b.status = 'want'; });
  let filter = 'all', query = '';

  const save = () => BW.store.set('bw_library', lib);
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const find = key => lib.find(b => b.key === key);
  const count = st => lib.filter(b => b.status === st).length;

  root.innerHTML = `
    <div class="lib-hero">
      <div><h1>${esc(first)}${first === 'Your' ? '' : "'s"} library</h1><p class="sec-sub" id="lTier"></p></div>
      <div class="lstats" id="lStats"></div>
    </div>
    <div class="goal" id="lGoal"></div>
    <div class="ltools">
      <div class="finder-row" id="lChips" role="group" aria-label="Filter by status"></div>
      <input class="sub-input" id="lFilter" type="text" placeholder="Filter by title or author" aria-label="Filter books">
    </div>
    <div class="lshelf" id="lShelf"></div>
    <div class="lgrid" id="lGrid" style="margin-top:1.6rem"></div>
    <div class="panel" style="margin-top:2.4rem;max-width:420px">
      <h2>Your reader pass</h2>
      ${BW.passHTML(user)}
      <a class="btn-ghost" href="${signupUrl}?next=${encodeURIComponent(location.href)}" style="text-align:center">Edit my pass</a>
    </div>`;

  const $ = id => document.getElementById(id);
  $('lTier').textContent = BW.tier(goal) + ' · goal ' + goal + ' books a year';
  if (user.motto) $('lTier').insertAdjacentHTML('afterend', `<p class="sec-sub"><em>“${esc(user.motto)}”</em></p>`);

  function visible() {
    const q = query.toLowerCase();
    return lib.filter(b => (filter === 'all' || b.status === filter) &&
      (!q || (b.title + ' ' + b.author).toLowerCase().includes(q)));
  }

  function drawStats() {
    $('lStats').innerHTML = `<div><b>${lib.length}</b><span>Saved</span></div><div><b>${count('reading')}</b><span>Reading</span></div><div><b>${count('done')}</b><span>Finished</span></div>`;
    const done = lib.filter(b => b.status === 'done' && b.finishedAt && new Date(b.finishedAt).getFullYear() === thisYear).length;
    const pct = Math.min(100, Math.round(done / goal * 100));
    $('lGoal').innerHTML = `<b>${done} of ${goal}</b> books finished in ${thisYear} <span class="sec-sub">(${pct}%)</span><i><u style="width:${pct}%"></u></i>`;
  }

  function drawChips() {
    const opts = [['all', 'All', lib.length], ...STATUS.map(([k, v]) => [k, v, count(k)])];
    $('lChips').innerHTML = opts.map(([k, v, n]) =>
      `<button class="chip${k === filter ? ' on' : ''}" data-k="${k}" aria-pressed="${k === filter}">${v} (${n})</button>`).join('');
    $('lChips').querySelectorAll('.chip').forEach(c => c.onclick = () => { filter = c.dataset.k; drawChips(); drawBooks(); });
  }

  function drawBooks() {
    const list = visible();
    $('lShelf').hidden = !list.length;
    $('lShelf').innerHTML = list.slice(0, 40).map(b => {
      const h = hash(b.key);
      return `<button class="spine" data-open="${esc(b.key)}" title="${esc(b.title)}" style="height:${120 + h % 70}px;background:${SPINES[h % SPINES.length]}"><span>${esc(b.title)}</span></button>`;
    }).join('');

    if (!lib.length) {
      $('lGrid').innerHTML = `<div class="loading-msg">Nothing saved yet. Open any book and choose “Add to My Library”. <a href="${BW.root}index.html" style="color:var(--brass);text-decoration:underline">Browse books</a></div>`;
      return;
    }
    if (!list.length) { $('lGrid').innerHTML = '<div class="loading-msg">No books match. Try another status or clear the filter.</div>'; return; }

    $('lGrid').innerHTML = list.map(b => {
      const img = (b.coverUrl || b.coverId) ? `<img loading="lazy" src="${esc(b.coverUrl || BW.cover(b.coverId, 'M'))}" alt="">` : `<span>${esc(b.title)}</span>`;
      const opts = STATUS.map(([k, v]) => `<option value="${k}"${b.status === k ? ' selected' : ''}>${v}</option>`).join('');
      const prog = b.status === 'reading' && b.pages
        ? `<div class="prog"><span>Page</span> <input class="sub-input" type="number" min="0" max="${b.pages}" value="${b.page || 0}" data-page="${esc(b.key)}" style="width:80px;padding:.3rem .5rem" aria-label="Current page"> <span>of ${b.pages}</span></div>` : '';
      return `<article class="lcard">
        <button class="lcover" data-open="${esc(b.key)}" aria-label="Open ${esc(b.title)}">${img}</button>
        <div class="lbody"><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p>
          <select data-status="${esc(b.key)}" aria-label="Reading status">${opts}</select>${prog}
          <button class="lrm" data-rm="${esc(b.key)}">Remove</button></div></article>`;
    }).join('');
  }

  const drawAll = () => { drawStats(); drawChips(); drawBooks(); };

  // One set of listeners for everything on the shelf and grid
  root.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { const b = find(open.dataset.open); if (b) BW.open(b); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      const b = find(rm.dataset.rm);
      if (b && confirm(`Remove “${b.title}” from your library?`)) { lib = lib.filter(x => x !== b); save(); drawAll(); }
    }
  });
  root.addEventListener('change', e => {
    const sel = e.target.closest('[data-status]');
    if (sel) {
      const b = find(sel.dataset.status); if (!b) return;
      b.status = sel.value;
      if (b.status === 'done') b.finishedAt = b.finishedAt || Date.now(); else delete b.finishedAt;
      save(); drawAll(); return;
    }
    const pg = e.target.closest('[data-page]');
    if (pg) {
      const b = find(pg.dataset.page); if (!b) return;
      b.page = Math.max(0, Math.min(b.pages || Infinity, parseInt(pg.value, 10) || 0));
      pg.value = b.page; save();
    }
  });
  $('lFilter').addEventListener('input', e => { query = e.target.value.trim(); drawBooks(); });

  drawAll();
})();