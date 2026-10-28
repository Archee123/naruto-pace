'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { getRouter } = require('stremio-addon-sdk');
const { createAddon } = require('./addon');
function createHandler(options) {
  const router = getRouter(createAddon(options));
  const artwork = new Map(['icon.png'].map(name => [`/${name}`, fs.readFileSync(path.join(__dirname, 'public', name))]));
  artwork.set('/favicon.ico', artwork.get('/icon.png'));
  const landing = fs.readFileSync(path.join(__dirname, 'landing.html'));
  return (req, res) => {
    if (artwork.has(req.url)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' });
      return res.end(artwork.get(req.url));
    }
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(landing);
    }
    router(req, res, () => { res.writeHead(404); res.end('Not found'); });
  };
}
function createServer(options) { return http.createServer(createHandler(options)); }
if (require.main === module) {
  const port = Number(process.env.PORT || 7000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
  createServer().listen(port, () => console.log(`Naruto Pace: http://127.0.0.1:${port}/`));
}
module.exports = { createServer, createHandler };
