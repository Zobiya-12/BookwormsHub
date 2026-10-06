(function () {
  const GENRES = { mystery: 'Mystery', science_fiction: 'Sci-Fi', fantasy: 'Fantasy', romance: 'Romance', thriller: 'Thriller', horror: 'Horror', biography: 'Biography', history: 'History', classic_literature: 'Classics' };
  const SORTS = { rating: 'Top rated', new: 'Newest', editions: 'Popular' };
  const $ = id => document.getElementById(id), PAGE = 30;
  const slug = new URLSearchParams(location.search).get('g');
  const g = GENRES[slug] ? slug : 'mystery';
  let sort = 'rating', offset = 0, all = [], hasMore = true;

  document.title = GENRES[g] + " — BookWorm's Hub";
  $('gTitle').textContent = GENRES[g];
  $('pills').innerHTML = Object.entries(GENRES).map(([s, n]) => `<a class="pill${s === g ? ' on' : ''}" href="genre.html?g=${s}">${n}</a>`).join('');
  BW.api.genreCount(g).then(n => $('gCount').textContent = n.toLocaleString() + ' books to explore').catch(() => $('gCount').textContent = 'Browse the shelf');

  function drawSorts() {
    $('sorts').innerHTML = Object.entries(SORTS).map(([k, v]) => `<button class="chip${k === sort ? ' on' : ''}" data-k="${k}" aria-pressed="${k === sort}">${v}</button>`).join('');
    $('sorts').querySelectorAll('.chip').forEach(c => c.onclick = () => { sort = c.dataset.k; drawSorts(); load(true); });
  }
  function render() {
    const q = $('filter').value.trim().toLowerCase();
    BW.fill($('grid'), all.filter(b => !q || (b.title + ' ' + b.author).toLowerCase().includes(q)), 'Nothing matches your filter. Clear it or load more books.');
    $('more').hidden = !hasMore;
  }
  async function load(reset) {
    if (reset) { all = []; offset = 0; hasMore = true; $('grid').innerHTML = '<div class="loading-msg">Loading books…</div>'; }
    $('more').disabled = true;
    try {
      const raw = await BW.api.search(`subject:"${g.replace(/_/g, ' ')}" AND ratings_count:[3 TO *]`, PAGE, offset, sort);
      offset += PAGE; hasMore = raw.length === PAGE;
      all = all.concat(raw.filter(b => b.coverId)); render();
    } catch { $('grid').innerHTML = '<div class="loading-msg">Couldn\'t load this genre. Reload to try again.</div>'; }
    $('more').disabled = false;
  }
  $('more').onclick = () => load(false); $('filter').oninput = render;
  drawSorts(); load(true);
})();