'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const PORT = Number(process.env.PORT) || 3000;
const PROD = process.env.NODE_ENV === 'production';
const PUBLIC = path.join(__dirname, 'public');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // hosts like Render/Railway/Fly sit behind one proxy

// Strict CSP: only our own scripts; Open Library for data and covers; Google Fonts for type.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      styleSrcAttr: ["'unsafe-inline'"], // progress bars and spine colours set style attributes
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://covers.openlibrary.org', 'https://*.archive.org'], // covers redirect to archive.org
      connectSrc: ["'self'", 'https://openlibrary.org'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      ...(PROD ? { upgradeInsecureRequests: [] } : {})
    }
  },
  crossOriginEmbedderPolicy: false // covers load cross-origin without CORP headers
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

// Static site only: reject anything that isn't a read
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  res.set('Allow', 'GET, HEAD').status(405).type('text/plain').send('Method not allowed');
});

app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

app.use(express.static(PUBLIC, {
  dotfiles: 'ignore',
  index: 'index.html',
  extensions: ['html'],
  maxAge: '1h',
  setHeaders(res, file) { if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
}));

app.use((req, res) => res.status(404).type('text/plain').send('Not found'));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.message); // log the message, never leak the stack
  res.status(500).type('text/plain').send('Something went wrong');
});

const server = app.listen(PORT, () => console.log(`BookWorm's Hub on :${PORT}`));
server.requestTimeout = 15000;
server.headersTimeout = 10000;
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}