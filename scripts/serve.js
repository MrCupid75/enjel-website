#!/usr/bin/env node
// Tiny local preview server for _site/ (no dependencies). Usage: node scripts/serve.js [port]
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '_site');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return res.end(fs.existsSync(path.join(ROOT, '404.html')) ? fs.readFileSync(path.join(ROOT, '404.html')) : 'Not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}  (Ctrl+C to stop)`));
