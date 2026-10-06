/* BookWorm's Hub — shared: pop-ups, nav/footer for inner pages, mascots, reader pass */
(function () {
  const R = BW.root, esc = BW.esc;
  const S = b => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
  BW.mascots = {
    owl: S('<path d="M32 12C20 12 14 20 14 34C14 48 22 54 32 54C42 54 50 48 50 34C50 20 44 12 32 12Z"/><circle cx="25" cy="28" r="6"/><circle cx="39" cy="28" r="6"/><circle cx="25" cy="28" r="2" fill="currentColor"/><circle cx="39" cy="28" r="2" fill="currentColor"/><path d="M32 32L30 37H34L32 32Z" fill="currentColor"/><path d="M18 16L24 22M46 16L40 22"/>'),
    cat: S('<path d="M16 22L22 30H14L16 22Z" fill="currentColor"/><path d="M48 22L50 30H42L48 22Z" fill="currentColor"/><circle cx="32" cy="34" r="16"/><path d="M26 32A2 2 0 0 1 26 36A2 2 0 0 1 26 32" fill="currentColor"/><path d="M38 32A2 2 0 0 1 38 36A2 2 0 0 1 38 32" fill="currentColor"/><path d="M30 39C32 41 34 41 36 39"/><path d="M18 36H10M54 36H46"/>'),
    fox: S('<path d="M14 16L24 28L12 36L14 16Z"/><path d="M50 16L40 28L52 36L50 16Z"/><path d="M32 50L18 32H46L32 50Z"/><circle cx="32" cy="46" r="3" fill="currentColor"/><path d="M24 34H26M38 34H40" stroke-width="3"/>'),
    quill: S('<path d="M48 10C30 14 20 30 16 52L22 50C26 36 34 22 52 14L48 10Z" fill="currentColor" fill-opacity=".2"/><path d="M16 52L48 10"/><path d="M28 28L36 32M22 36L30 40"/><path d="M38 48H52L48 54H42L38 48Z"/>')
  };
  BW.TIERS = [[10, 'Casual Reader'], [25, 'Page Turner'], [50, 'Voracious Reader'], [75, 'Master Bibliophile'], [100, 'Book Dragon']];
  BW.tier = g => (BW.TIERS.find(t => g <= t[0]) || BW.TIERS[4])[1];
  BW.passHTML = u => {
    const d = new Date(), goal = u.goal || 25;
    return `<div class="pass"><div class="pass-top"><span class="pass-brand">BookWorm's Hub</span><span class="pass-tag">Member pass</span></div>
      <div class="pass-row"><div class="pass-av">${BW.mascots[u.avatar] || BW.mascots.owl}</div><div><small>Cardholder</small><h3>${esc(u.name || 'Your name')}</h3><p>${esc(u.email || 'reader@example.com')}</p></div></div>
      <div class="pass-grid"><div><small>Yearly goal</small><b>${goal}</b> books<br>${BW.tier(goal)}</div><div><small>Genres</small>${(u.genres || []).map(g => `<i>${esc(g)}</i>`).join('') || '<i>None yet</i>'}</div></div>
      <div class="pass-foot"><span>${esc(u.cardId || '')}</span><span>${d.toLocaleString('en', { month: 'short' }).toUpperCase()} ${d.getFullYear()}</span></div></div>`;
  };

  // Pop-ups (native <dialog>: Esc to close, focus is trapped)
  let dlg;
  BW.pop = (title, html) => {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'pop';
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `<div class="pop-in"><button class="pop-x" aria-label="Close">✕</button><h2>${esc(title)}</h2>${html}</div>`;
    dlg.querySelector('.pop-x').onclick = () => dlg.close();
    if (!dlg.open) dlg.showModal();
    return dlg;
  };
  const POP = {
    about: ['About BookWorm\'s Hub', '<p>BookWorm\'s Hub helps readers discover books by mood, genre, year and country, then keep a personal library of what they want to read, are reading and have finished.</p><p>Book data comes from the open Open Library catalogue.</p>'],
    contact: ['Contact us', '<p>Questions, feedback, or a book we should feature? Write to us:</p><p><a href="mailto:newsletter.padding547@simplelogin.com">mail here</a></p><p><small>This is a placeholder address. Replace it with your real one before launch.</small></p>'],
    privacy: ['Privacy', '<ul><li>Your profile, library and reviews are saved only in this browser\'s local storage. They are not sent to or stored on our servers.</li><li>Searching and browsing sends your queries to Open Library to fetch book data.</li><li>Fonts load from Google Fonts, which can see your IP address.</li><li>We use no cookies or analytics. Clearing your browser data deletes everything saved here.</li><li>The newsletter box is not connected to anything yet, so your email goes nowhere.</li></ul>']
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-pop]'); if (!t || !POP[t.dataset.pop]) return;
    e.preventDefault(); BW.pop(...POP[t.dataset.pop]);
  });

  // Nav + footer for inner pages (index.html has its own)
  const GEN = [['mystery', 'Mystery'], ['science_fiction', 'Sci-Fi'], ['fantasy', 'Fantasy'], ['romance', 'Romance'], ['thriller', 'Thriller'], ['horror', 'Horror'], ['biography', 'Biography'], ['history', 'History'], ['classic_literature', 'Classics']];
  const logo = `<span class="logo-box">BW</span><span class="logo-text">BookWorm's<br><em>Hub</em></span>`;
  const navEl = document.getElementById('siteNav');
  if (navEl) {
    navEl.outerHTML = `<nav class="nav" id="innerNav"><div class="nav-inner"><a class="nav-logo" href="${R}index.html">${logo}</a>
      <div class="nav-center"><a class="nav-link" href="${R}index.html">Home</a><a class="nav-link" href="${R}pages/library.html">My Library</a>
      <div class="nav-dropdown-wrap"><button class="nav-link" aria-haspopup="true">Genres <span class="arrow">▾</span></button>
      <div class="nav-dropdown">${GEN.map(([s, n]) => `<a class="dd-item" href="${R}pages/genre.html?g=${s}">${n}</a>`).join('')}</div></div></div>
      <div class="nav-right"><a class="nav-cta" href="${R}pages/library.html">My Library</a><button class="nav-icon-btn menu-btn" aria-label="Menu">☰</button></div></div></nav>`;
    const n = document.getElementById('innerNav'), w = n.querySelector('.nav-dropdown-wrap');
    n.querySelector('.menu-btn').onclick = () => n.classList.toggle('menu-open');
    w.querySelector('button').onclick = e => { e.stopPropagation(); w.classList.toggle('open'); };
    document.addEventListener('click', () => w.classList.remove('open'));
  }
  const ft = document.getElementById('siteFooter');
  if (ft) ft.outerHTML = `<footer class="footer"><div class="footer-inner"><div class="nav-logo">${logo}</div>
    <div class="footer-copy">© ${new Date().getFullYear()} BookWorm's Hub. All rights reserved.</div>
    <div class="footer-links"><a href="#" data-pop="about">About</a><a href="#" data-pop="contact">Contact</a><a href="#" data-pop="privacy">Privacy</a></div></div></footer>`;
})();