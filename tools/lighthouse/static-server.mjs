#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1] ?? 4280);
const root = path.resolve(args[args.indexOf('--root') + 1] ?? '.');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg']);

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME[ext] ?? 'application/octet-stream';
    const acceptEncoding = req.headers['accept-encoding'] ?? '';
    const useGzip = acceptEncoding.includes('gzip') && COMPRESSIBLE.has(ext);
    const fileName = path.basename(filePath);
    const isHashedAsset = /\.[a-f0-9]{8,}\.(js|css)$/i.test(fileName);

    res.setHeader('Content-Type', contentType);
    if (isHashedAsset) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    }
    if (useGzip) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
    }

    res.writeHead(200);
    const source = fs.createReadStream(filePath);
    await pipeline(source, useGzip ? zlib.createGzip() : res, ...(useGzip ? [res] : []));
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`LISTENING ${port}\n`);
});
