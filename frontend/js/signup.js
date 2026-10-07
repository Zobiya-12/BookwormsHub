/* BookWorm's Hub — sign-up page: form, live pass preview, flip card, confetti */
(function () {
  const $ = id => document.getElementById(id);
  const esc = BW.esc;
  // Core genres always show (they match the site's genre pages); more are loaded from Open Library
  const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Thriller', 'Romance', 'Horror', 'Biography', 'History', 'Classics'];
  const SEEDS = ['mystery', 'science_fiction', 'fantasy', 'romance', 'thriller', 'horror', 'biography', 'history', 'classic_literature'];
  const CACHE_KEY = 'bw_genres_v1', CACHE_DAYS = 7, MAX_EXTRA = 14;
  let extra = [];   // [{ name, count }] from the API
  const AV = [['owl', 'Owl'], ['cat', 'Cat'], ['fox', 'Fox'], ['quill', 'Quill']];
  const QUOTES = [
    ['There is no friend as loyal as a book.', 'Ernest Hemingway'],
    ['Books are a uniquely portable magic.', 'Stephen King'],
    ['So many books, so little time.', 'Frank Zappa'],
    ['I have always imagined that Paradise will be a kind of library.', 'Jorge Luis Borges']
  ];
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // Only allow redirects back to this site
  let next = new URLSearchParams(location.search).get('next') || '../index.html';
  try { if (new URL(next, location.href).origin !== location.origin) next = '../index.html'; } catch { next = '../index.html'; }
  $('later').href = next;

  // Start from the saved profile if there is one (editing), else defaults
  const old = BW.user() || {};
  const s = {
    name: old.name || '', email: old.email || '', motto: old.motto || '', avatar: old.avatar || 'owl',
    genres: old.genres || [], goal: old.goal || 25,
    cardId: old.cardId || 'BW-' + new Date().getFullYear() + '-' + (1000 + Math.floor(Math.random() * 9000))
  };
  $('name').value = s.name; $('email').value = s.email; $('motto').value = s.motto; $('goal').value = s.goal;

  function drawPicks() {
    $('avatars').innerHTML = AV.map(([k, l]) =>
      `<button type="button" class="av${k === s.avatar ? ' on' : ''}" data-k="${k}" aria-pressed="${k === s.avatar}">${BW.mascots[k]}<span>${l}</span></button>`).join('');
    $('avatars').querySelectorAll('.av').forEach(b => b.onclick = () => { s.avatar = b.dataset.k; drawPicks(); draw(); });

    const chip = (name, count) => `<button type="button" class="chip${s.genres.includes(name) ? ' on' : ''}" data-g="${esc(name)}" aria-pressed="${s.genres.includes(name)}"${count ? ` title="${count.toLocaleString()} books"` : ''}>${esc(name)}</button>`;
    $('pills').innerHTML = GENRES.map(g => chip(g)).join('');
    // Picks that are not in either list (e.g. from an older profile) still show, so they can be removed
    const known = new Set([...GENRES, ...extra.map(x => x.name)]);
    $('pills2').innerHTML = extra.map(x => chip(x.name, x.count)).join('') + s.genres.filter(g => !known.has(g)).map(g => chip(g)).join('');
    document.querySelectorAll('#pills .chip, #pills2 .chip').forEach(b => b.onclick = () => {
      const g = b.dataset.g;
      // Keep the 4 most recent picks
      s.genres = s.genres.includes(g) ? s.genres.filter(x => x !== g) : [...s.genres, g].slice(-4);
      drawPicks(); draw();
    });
    $('gc').textContent = `(${s.genres.length} of 4)`;
  }

  // ---- Genres from Open Library: related subjects of the core genres, ranked by book count ----
  const OLB = 'https://openlibrary.org';
  const norm = n => n.toLowerCase().replace(/[^a-z]/g, '');
  const CORE_NORMS = new Set([...GENRES.map(norm), 'sciencefiction', 'classicliterature', 'classics', 'mysteryanddetectivestories']);
  const SKIP = /accessible|protected|daisy|in library|large type|open library|staff pick|reading level|juvenile|textbook|study|translation|^fiction$|^nonfiction$|^history$|^biography$/i;
  const tidy = n => n.replace(/(^|[\s\-(])([a-z])/g, (m, a, b) => a + b.toUpperCase());

  async function fetchGenres() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && c.list && c.list.length && Date.now() - c.t < CACHE_DAYS * 864e5) return c.list;
    } catch {}
    const results = await Promise.allSettled(SEEDS.map(slug =>
      fetch(`${OLB}/subjects/${slug}.json?details=true&limit=1`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })));
    const best = new Map();
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const x of (r.value.subjects || [])) {
        const name = (x.name || '').trim(), key = norm(name);
        if (!name || name.length > 28 || /^\d/.test(name) || SKIP.test(name) || CORE_NORMS.has(key)) continue;
        if (!best.has(key) || best.get(key).count < x.count) best.set(key, { name: tidy(name), count: x.count || 0 });
      }
    }
    const list = [...best.values()].sort((a, b) => b.count - a.count).slice(0, MAX_EXTRA);
    if (list.length) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), list })); } catch {} }
    return list;
  }

  function backHTML() {
    const d = new Date();
    return `<div class="pass">
      <div class="pass-top"><span class="pass-brand">BookWorm's Hub</span><span class="pass-tag">Member pass</span></div>
      <p class="pass-quote">“${esc(s.motto || quote[0])}”<cite>${esc(s.motto ? (s.name || 'The cardholder') : quote[1])}</cite></p>
      <div class="pass-back-grid"><div><small>Reader tier</small><b>${esc(BW.tier(s.goal))}</b></div><div><small>Yearly goal</small><b>${s.goal}</b> books</div></div>
      <div class="pass-foot"><span>${esc(s.cardId)}</span><span>${d.toLocaleString('en', { month: 'short' }).toUpperCase()} ${d.getFullYear()}</span></div></div>`;
  }

  function draw() {
    s.name = $('name').value.trim(); s.email = $('email').value.trim(); s.motto = $('motto').value.trim(); s.goal = +$('goal').value;
    $('goalV').textContent = s.goal;
    $('tierT').textContent = 'Reader tier: ' + BW.tier(s.goal);
    $('passFront').innerHTML = BW.passHTML(s);
    $('passBack').innerHTML = backHTML();
  }
  ['name', 'email', 'motto', 'goal'].forEach(id => $(id).addEventListener('input', draw));

  // Flip the pass
  const flip = $('flip'), flipBtn = $('flipBtn');
  function toggleFlip() {
    const on = flip.classList.toggle('flipped');
    BW.sfx.page();
    flipBtn.setAttribute('aria-pressed', on);
    flipBtn.textContent = on ? 'Show the front' : 'Flip the pass';
  }
  flipBtn.onclick = toggleFlip;
  flip.addEventListener('click', toggleFlip);

  // Confetti (skipped for people who prefer reduced motion)
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('confetti'), ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const colors = ['#e0a84f', '#1f7a5c', '#d9684f', '#f4eedd', '#a8741f'];
    const bits = Array.from({ length: 110 }, () => ({
      x: innerWidth / 2, y: innerHeight / 2.2,
      vx: (Math.random() - .5) * 15, vy: (Math.random() - .8) * 13,
      size: Math.random() * 7 + 4, color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, vr: (Math.random() - .5) * 10, life: 1
    }));
    (function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      let alive = false;
      for (const p of bits) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += .25; p.life -= .012; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .6); ctx.restore();
      }
      if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  // Floating particles (still for people who prefer reduced motion)
  (function particles() {
    const cv = $('particles'), ctx = cv.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let bits = [];
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
    size(); addEventListener('resize', size);
    for (let i = 0; i < 32; i++) bits.push({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 2.4 + 1, vx: Math.random() * .4 - .2, vy: -(Math.random() * .4 + .1),
      a: Math.random() * .35 + .1
    });
    (function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      // Match the current theme's accent colour (re-read so dark/light switches apply)
      const col = getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() || '#e0a84f';
      ctx.fillStyle = col;
      for (const p of bits) {
        if (!still) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -5) p.y = cv.height + 5;
          if (p.x < -5) p.x = cv.width + 5;
          if (p.x > cv.width + 5) p.x = -5;
        }
        ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!still) requestAnimationFrame(frame);
    })();
  })();

  $('form').addEventListener('submit', e => {
    e.preventDefault(); draw();
    try { localStorage.setItem('bw_user', JSON.stringify(s)); } catch {}
    const first = (s.name.split(/\s+/)[0]) || 'reader';
    $('welcomeTitle').textContent = `Welcome, ${first}`;
    $('welcomeText').textContent = `Your pass ${s.cardId} is ready. You're a ${BW.tier(s.goal)} aiming for ${s.goal} books this year.`;
    $('welcome').hidden = false;
    $('welcomeGo').focus();
    confetti();
    BW.sfx.success();
  });
  $('welcomeGo').onclick = () => { location.href = next; };

  drawPicks(); draw();
  fetchGenres().then(list => {
    extra = list;
    $('gMore').textContent = list.length ? 'More genres from Open Library' : "Couldn't load more genres right now. Pick from the list above.";
    drawPicks();
  }).catch(() => { $('gMore').textContent = "Couldn't load more genres right now. Pick from the list above."; });
})();