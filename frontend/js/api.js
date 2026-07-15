// ─── api.js ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:4300/api/books';

const api = {
  async search(query, limit = 8) {
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!res.ok) throw new Error('Search failed');
      return await res.json();
    } catch (e) { console.error('api.search:', e); return null; }
  },
  async getDetails(bookId) {
    try {
      const res = await fetch(`${API_BASE}/details/${bookId}`);
      if (!res.ok) throw new Error('Details failed');
      return await res.json();
    } catch (e) { console.error('api.getDetails:', e); return null; }
  },
  async getByGenre(genre, limit = 8, page = 1) {
    try {
      const res = await fetch(`${API_BASE}/genre/${genre}?limit=${limit}&page=${page}`);
      if (!res.ok) throw new Error('Genre failed');
      return await res.json();
    } catch (e) { console.error('api.getByGenre:', e); return null; }
  },
  async findBook(title, author = '') {
    try {
      const params = new URLSearchParams({ title });
      if (author) params.append('author', author);
      const res = await fetch(`${API_BASE}/find?${params}`);
      if (!res.ok) throw new Error('Find failed');
      return await res.json();
    } catch (e) { console.error('api.findBook:', e); return null; }
  }
};