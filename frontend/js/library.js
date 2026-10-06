(function () {
  const $ = id => document.getElementById(id), { esc } = BW, root = $('lib'), user = BW.user();
  const next = encodeURIComponent(location.href);
  if (!user) {
    root.innerHTML = `<div class="gate"><h1>Your library is waiting</h1><p class="sec-sub">Create a free reader profile to save books and track your reading.</p><a class="btn-primary" href="signup.html?next=${next}">Create my profile</a></div>`;
    return;
  }
  const goal = user.goal || 25, first = (user.name || 'Reader').split(' ')[0];
  let lib = BW.store.get('bw_library', []), tab = 'all', q = '', view = 'grid';
  const save = () => BW.store.set('bw_library', lib);
  const ST = { want: 'Want to read', reading: 'Reading', done: 'Finished' };
  const TABS = { all: 'All books', reading: 'Reading', done: 'Finished', want: 'Want to read' };
  const COLORS = ['#1f5c4d', '#7a2a22', '#6b4a14', '#2a6b78', '#4f5d1f', '#5a3a52'];
  const st = b => b.status || 'want';
  const opts = cur => Object.entries(ST).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${v}</option>`).join('');

  root.innerHTML = `<div class="lib-hero"><div><p class="sec-sub">Reader's library</p><h1>Your personal<br><em>reading world.</em></h1></div><div class="lstats" id="stats"></div></div>
    <div class="goal" id="goal"></div>
    <div class="ltools"><div class="finder-row" id="tabs"></div>
      <input class="sub-input" id="lq" placeholder="Filter my books" aria-label="Filter my books" maxlength="80">
      <button class="btn-ghost" id="viewBtn">Shelf view</button><button class="btn-ghost" id="addBtn">Add a book</button><button class="btn-ghost" id="passBtn">My pass</button></div>
    <div id="shelf" class="lgrid"></div>`;

  function card(b) {
    const el = document.createElement('article'); el.className = 'lcard';
    const pg = b.pages || 300, s = st(b), img = b.coverUrl || BW.cover(b.coverId);
    el.innerHTML = `<button class="lcover" aria-label="Open ${esc(b.title)}">${img ? `<img loading="lazy" src="${esc(img)}" alt="">` : `<span>${esc(b.title)}</span>`}</button>
      <div class="lbody"><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p>
      <select aria-label="Status">${opts(s)}</select>
      ${s === 'reading' ? `<label class="prog"><input type="range" min="0" max="${pg}" value="${b.page || 0}"><span>${b.page || 0} / ${pg} pages</span></label>` : ''}
      <button class="lrm">Remove</button></div>`;
    el.querySelector('.lcover').onclick = () => BW.open(b);
    el.querySelector('select').onchange = e => { b.status = e.target.value; if (b.status === 'done') b.page = pg; save(); draw(); };
    const r = el.querySelector('input[type=range]');
    if (r) r.oninput = () => { b.page = +r.value; r.nextElementSibling.textContent = `${b.page} / ${pg} pages`; save(); };
    el.querySelector('.lrm').onclick = () => { lib = lib.filter(x => x !== b); save(); draw(); };
    return el;
  }
  function spine(b, i) {
    const el = document.createElement('button'); el.className = 'spine';
    el.style.background = COLORS[i % COLORS.length]; el.style.height = 150 + (i * 23) % 60 + 'px';
    el.innerHTML = `<span>${esc(b.title)}</span>`; el.title = b.title; el.onclick = () => BW.open(b);
    return el;
  }
  function draw() {
    const n = s => lib.filter(b => st(b) === s).length, done = n('done');
    $('stats').innerHTML = [[lib.length, 'Total'], [done, 'Finished'], [n('reading'), 'Reading'], [n('want'), 'Want to read']].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const pct = Math.min(100, Math.round(done / goal * 100));
    $('goal').innerHTML = `<b>${esc(first)}, your ${new Date().getFullYear()} goal:</b> ${done} of ${goal} books<i><u style="width:${pct}%"></u></i>`;
    $('tabs').innerHTML = Object.entries(TABS).map(([k, v]) => `<button class="chip${k === tab ? ' on' : ''}" data-k="${k}" aria-pressed="${k === tab}">${v}</button>`).join('');
    $('tabs').querySelectorAll('.chip').forEach(c => c.onclick = () => { tab = c.dataset.k; draw(); });
    const list = lib.filter(b => (tab === 'all' || st(b) === tab) && (!q || (b.title + ' ' + b.author).toLowerCase().includes(q)));
    const box = $('shelf'); box.innerHTML = ''; box.className = view === 'grid' ? 'lgrid' : 'lshelf';
    if (!list.length) {
      box.className = 'lgrid';
      box.innerHTML = `<div class="loading-msg">${lib.length ? 'Nothing on this shelf yet.' : 'Your library is empty. Open any book and press "Add to My Library", or use "Add a book".'}</div>`;
      return;
    }
    list.forEach((b, i) => box.appendChild(view === 'grid' ? card(b) : spine(b, i)));
  }
  $('lq').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
  $('viewBtn').onclick = e => { view = view === 'grid' ? 'shelf' : 'grid'; e.target.textContent = view === 'grid' ? 'Shelf view' : 'Grid view'; draw(); };
  $('passBtn').onclick = () => BW.pop('Your reader pass', BW.passHTML(user) + `<p><a href="signup.html?next=${next}">Edit profile</a></p>`);
  $('addBtn').onclick = () => {
    const d = BW.pop('Add a book', `<form class="lform" id="mf"><input class="sub-input" id="mt" placeholder="Title" required maxlength="150" aria-label="Title"><input class="sub-input" id="ma" placeholder="Author" required maxlength="100" aria-label="Author"><input class="sub-input" id="mp" type="number" min="1" max="5000" placeholder="Pages (optional)" aria-label="Pages"><select class="sub-input" id="ms" aria-label="Status">${opts('want')}</select><button class="btn-primary">Save to library</button></form>`);
    d.querySelector('#mf').onsubmit = e => {
      e.preventDefault();
      lib.unshift({ key: 'manual:' + Date.now(), title: d.querySelector('#mt').value.trim(), author: d.querySelector('#ma').value.trim(), pages: +d.querySelector('#mp').value || null, status: d.querySelector('#ms').value });
      save(); d.close(); draw();
    };
  };
  draw();
})();