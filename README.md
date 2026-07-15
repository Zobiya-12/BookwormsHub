# BookWorm's Hub

A book discovery and review site I built to practice full-stack work — search books, browse by genre, and keep a personal reading library, all backed by a small Express server.
 
## Live Demo
**https://bookwormshub.onrender.com/**
## What it does

- Search for books and browse by genre (mystery, sci-fi, fantasy, romance, thriller, horror, biography, history)
- Click into any book to see a summary, details, and reviews in a side panel
- Add books to a personal library and sort them into shelves — reading, finished, want to read
- Filter/search your own library
- Cover images and metadata pulled from the Google Books API, with an Open Library fallback for the books Google doesn't have decent covers for

## Why I built it this way

I originally had the frontend calling Google Books directly from the browser, opened as a plain HTML file. That breaks — `fetch()` doesn't work over `file://`, and there's no clean way to hide an API key client-side. So the backend exists mainly to:

1. Serve the frontend and proxy API calls through one origin (no CORS headaches)
2. Keep the Google Books API key server-side instead of shipping it in JS
3. Normalize whatever Google/Open Library return into one consistent book shape the frontend can just render, instead of every page having to know the quirks of two different APIs

The genre pages and library page originally each had their own copy-pasted inline `<script>` blocks. I pulled that out into shared files (`api.js`, `panel.js`) once it got obviously unmaintainable — same book card, same side panel, same rating logic, three different places.

## Stack

- **Backend:** Node.js, Express
- **Frontend:** Vanilla JS, HTML, CSS — no framework, no build step
- **Data:** Google Books API (primary), Open Library Covers API (fallback)
- **Storage:** localStorage for the personal library (no accounts/database — it's a portfolio project, not a product)

## Running it locally

```bash
cd backend
npm install
node server.js
```

Then open `http://localhost:4300`.

Optional: set a Google Books API key so you're not on the shared anonymous quota (free, takes 2 minutes at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials), enable "Books API"):

```bash
# macOS/Linux
export GOOGLE_BOOKS_API_KEY=your_key_here

# Windows PowerShell
$env:GOOGLE_BOOKS_API_KEY="your_key_here"
```

## What I'd do differently / next

- Swap localStorage for a real database + accounts if this ever needed to work across devices
- Add pagination caching so switching genre filters doesn't re-hit the API every time
- The genre detection from Google's category strings is just keyword matching (`server.js`) — works fine for common genres, but it's not going to be right for anything niche

## Project structure

```
backend/
  server.js
frontend/
  index.html
  css/
  js/
  pages/
    genre.html
    library.html
```