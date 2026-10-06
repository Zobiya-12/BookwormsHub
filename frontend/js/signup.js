(function () {
  const $ = id => document.getElementById(id);
  const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Thriller', 'Romance', 'Horror', 'Biography', 'History', 'Classics'];
  const AV = [['owl', 'Owl'], ['cat', 'Cat'], ['fox', 'Fox'], ['quill', 'Quill']];
  let next = new URLSearchParams(location.search).get('next') || '../index.html';
  try { if (new URL(next, location.href).origin !== location.origin) next = '../index.html'; } catch { next = '../index.html'; }
  $('later').href = next;
  const old = BW.user() || {};
  const s = { name: old.name || '', email: old.email || '', avatar: old.avatar || 'owl', genres: old.genres || [], goal: old.goal || 25,
    cardId: old.cardId || 'BW-' + new Date().getFullYear() + '-' + (1000 + Math.floor(Math.random() * 9000)) };
  $('name').value = s.name; $('email').value = s.email; $('goal').value = s.goal;

  function drawPicks() {
    $('avatars').innerHTML = AV.map(([k, l]) => `<button type="button" class="av${k === s.avatar ? ' on' : ''}" data-k="${k}" aria-pressed="${k === s.avatar}">${BW.mascots[k]}<span>${l}</span></button>`).join('');
    $('avatars').querySelectorAll('.av').forEach(b => b.onclick = () => { s.avatar = b.dataset.k; drawPicks(); draw(); });
    $('pills').innerHTML = GENRES.map(g => `<button type="button" class="chip${s.genres.includes(g) ? ' on' : ''}" aria-pressed="${s.genres.includes(g)}">${g}</button>`).join('');
    $('pills').querySelectorAll('.chip').forEach(b => b.onclick = () => {
      const g = b.textContent;
      s.genres = s.genres.includes(g) ? s.genres.filter(x => x !== g) : [...s.genres, g].slice(-4);
      drawPicks(); draw();
    });
    $('gc').textContent = `(${s.genres.length} of 4)`;
  }
  function draw() {
    s.name = $('name').value.trim(); s.email = $('email').value.trim(); s.goal = +$('goal').value;
    $('goalV').textContent = s.goal; $('tierT').textContent = 'Reader tier: ' + BW.tier(s.goal);
    $('preview').innerHTML = BW.passHTML(s);
  }
  ['name', 'email', 'goal'].forEach(id => $(id).addEventListener('input', draw));
  $('form').addEventListener('submit', e => {
    e.preventDefault(); draw();
    try { localStorage.setItem('bw_user', JSON.stringify(s)); } catch {}
    location.href = next;
  });
  drawPicks(); draw();
})();