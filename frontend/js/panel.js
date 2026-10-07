/* BookWorm's Hub — card renderer + book viewer */
(function () {
  const { esc, cover } = BW;
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  BW.store = store;
  // Finish a save that was interrupted by sign-up
  const pend = store.get('bw_pending', null);
  if (pend && BW.user()) {
    if (pend.book) {
      const lib = store.get('bw_library', []);
      if (!lib.some(x => x.key === pend.book.key)) lib.push(pend.book);
      store.set('bw_library', lib);
      if (pend.review) { const all = store.get('bw_reviews', {}); (all[pend.book.key] ||= []).unshift(pend.review); store.set('bw_reviews', all); }
    }
    store.set('bw_pending', null);
  }
  let current = null, cache = new Map();

  // A book card; clicking it opens the viewer
  const cv = (b, s) => b.coverUrl || cover(b.coverId, s);
  BW.card = (b) => {
    const el = document.createElement('button');
    el.className = 'card';
    el.innerHTML = `<div class="card-cover">${(b.coverUrl || b.coverId)
      ? `<img loading="lazy" src="${cv(b)}" alt="">` : `<span>${esc(b.title)}</span>`}</div>
      <div class="card-title">${esc(b.title)}</div><div class="card-author">${esc(b.author)}</div>${b.date ? `<div class="card-date">${esc(b.date)}</div>` : ''}`;
    el.addEventListener('click', () => BW.open(b));
    return el;
  };
  BW.fill = (grid, books, empty = 'No books found.') => {
    grid.innerHTML = '';
    if (!books.length) grid.innerHTML = `<div class="loading-msg">${empty}</div>`;
    books.forEach(b => grid.appendChild(BW.card(b)));
  };

  function build() {
    if (document.getElementById('bkBack')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div class="bk-back" id="bkBack" role="dialog" aria-modal="true" aria-label="Book details">
      <button class="bk-x" id="bkX" aria-label="Close">✕</button>
      <div class="bk" id="bk">
        <section class="bk-page bk-left">
          <div class="bk-img" id="bkImg"></div>
          <h2 id="bkTitle"></h2><p class="bk-author" id="bkAuthor"></p>
          <p class="bk-meta" id="bkMeta"></p>
          <button class="btn-primary" id="bkAdd">Add to My Library</button>
        </section>
        <section class="bk-page bk-right">
          <div class="bk-tabs">
            <button class="on" data-t="summary">Summary</button><button data-t="reviews">Reviews</button><button data-t="details">Details</button>
          </div>
          <div class="bk-body">
            <div class="bk-pane on" id="t-summary"></div>
            <div class="bk-pane" id="t-reviews"></div>
            <div class="bk-pane" id="t-details"></div>
          </div>
        </section>
        <div class="bk-cover" id="bkCover"><span id="bkCoverT"></span></div>
      </div>
    </div>`);
    const $ = id => document.getElementById(id);
    $('bkX').onclick = BW.close;
    $('bkBack').addEventListener('click', e => { if (e.target.id === 'bkBack') BW.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') BW.close(); });
    document.querySelectorAll('.bk-tabs button').forEach(t => t.onclick = e => {
      document.querySelectorAll('.bk-tabs button,.bk-pane').forEach(x => x.classList.remove('on'));
      t.classList.add('on'); $('t-' + t.dataset.t).classList.add('on');
      if (e && e.isTrusted && BW.sfx) BW.sfx.page();
    });
    $('bkAdd').onclick = () => {
      if (!BW.requireUser({ book: current })) return;
      const lib = store.get('bw_library', []);
      const had = lib.some(x => x.key === current.key);
      if (!had) lib.push(current);
      store.set('bw_library', lib); $('bkAdd').textContent = '✓ In My Library';
      if (!had && BW.sfx) BW.sfx.add();
    };
  }

  BW.open = async function (b) {
    build(); current = b;
    const $ = id => document.getElementById(id);
    $('bkImg').innerHTML = (b.coverUrl || b.coverId) ? `<img src="${cv(b, 'L')}" alt="Cover of ${esc(b.title)}">` : `<span>${esc(b.title)}</span>`;
    $('bkTitle').textContent = b.title; $('bkAuthor').textContent = b.author; $('bkCoverT').textContent = b.title;
    $('bkMeta').textContent = [b.date ? 'Released ' + b.date : b.year && 'First published ' + b.year, b.pages && b.pages + ' pages'].filter(Boolean).join(' · ');
    $('bkAdd').textContent = store.get('bw_library', []).some(x => x.key === b.key) ? '✓ In My Library' : 'Add to My Library';
    $('t-summary').innerHTML = '<p class="muted">Turning the page…</p>';
    $('t-reviews').innerHTML = $('t-details').innerHTML = '';
    document.querySelector('.bk-tabs button').click();
    if (BW.sfx) { if ($('bkBack').classList.contains('show')) BW.sfx.page(); else BW.sfx.open(); }
    $('bkBack').classList.add('show'); document.body.classList.add('noscroll');
    requestAnimationFrame(() => setTimeout(() => $('bk').classList.add('open'), 60));

    try {
      const d = cache.get(b.key) || await BW.api.details(b); cache.set(b.key, d);
      if (current !== b) return;
      $('t-summary').innerHTML = d.summary ? d.summary.split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('')
        : '<p class="muted">No summary has been written for this book yet.</p>';
      $('t-details').innerHTML = `<h3>Subjects</h3><div class="tags">${d.subjects.map(s => `<span>${esc(s)}</span>`).join('') || '<p class="muted">No subjects listed.</p>'}</div>`;
      renderReviews(d, b);
      const first = d.subjects[0];
      if (first) BW.api.search(`subject:"${first}"`, 5).then(sim => {
        if (current !== b) return;
        $('t-details').insertAdjacentHTML('beforeend', '<h3>Similar reads</h3><ul class="similar"></ul>');
        const ul = $('t-details').querySelector('.similar');
        sim.filter(s => s.key !== b.key).slice(0, 4).forEach(s => {
          const li = document.createElement('li'); li.innerHTML = `<b>${esc(s.title)}</b> <i>${esc(s.author)}</i>`;
          li.onclick = () => BW.open(s); ul.appendChild(li);
        });
      }).catch(() => {});
    } catch {
      $('t-summary').innerHTML = '<p class="muted">Couldn\'t load details. Check your connection and reopen this book.</p>';
    }
  };

  function renderReviews(d, b) {
    const total = Object.values(d.dist).reduce((a, n) => a + n, 0);
    const bars = [5, 4, 3, 2, 1].map(n => {
      const pct = total ? Math.round((d.dist[n] || 0) / total * 100) : 0;
      return `<div class="bar"><span>${n}★</span><i><u style="width:${pct}%"></u></i><span>${pct}%</span></div>`;
    }).join('');
    const mine = store.get('bw_reviews', {})[b.key] || [];
    const pane = document.getElementById('t-reviews');
    pane.innerHTML = `<div class="rev-top"><div class="rev-num">${d.average ? d.average.toFixed(1) : '—'}</div>
      <div class="rev-bars">${total ? bars : '<p class="muted">No star breakdown available.</p>'}<small>${d.count} reader ratings</small></div></div>
      <h3>Your review</h3>
      <textarea id="rvText" rows="3" placeholder="What did you think?"></textarea>
      <button class="btn-ghost" id="rvSave">Save review</button><div id="rvList"></div>`;
    const list = () => document.getElementById('rvList').innerHTML = mine.map(t => `<blockquote>${esc(t)}</blockquote>`).join('');
    list();
    document.getElementById('rvSave').onclick = () => {
      const t = document.getElementById('rvText').value.trim(); if (!t) return;
      if (!BW.requireUser({ book: b, review: t })) return;
      mine.unshift(t); const all = store.get('bw_reviews', {}); all[b.key] = mine; store.set('bw_reviews', all);
      document.getElementById('rvText').value = ''; list();
    };
  }

  BW.close = function () {
    const back = document.getElementById('bkBack'); if (!back) return;
    if (back.classList.contains('show') && BW.sfx) BW.sfx.close();
    document.getElementById('bk').classList.remove('open');
    setTimeout(() => { back.classList.remove('show'); document.body.classList.remove('noscroll'); current = null; }, 500);
  };
})();