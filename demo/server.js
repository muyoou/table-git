#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(root, urlPath === '/' ? '/index.html' : urlPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (e, buf) => {
      if (e) { res.writeHead(500); res.end('Error'); return; }
      const ext = path.extname(filePath);
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      res.writeHead(200);
      res.end(buf);
    });
  });
});

server.listen(port, () => {
  console.log(`Demo server running: http://localhost:${port}`);
});
