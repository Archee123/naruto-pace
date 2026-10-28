'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');
const { createAddon, PARENT_ID, CATALOG, labels, selected } = require('../addon');

test('complete classifications, boundaries, and preserved playback IDs', async () => {
  const addon = createAddon();
  const { meta } = await addon.get('meta', 'series', PARENT_ID);
  assert.equal(meta.videos.length, 130);
  assert.equal(selected.size, 130);
  const counts = {};
  for (const value of labels.values()) counts[value] = (counts[value] || 0) + 1;
  assert.deepEqual(counts, { Canon: 74, 'Mixed Canon/Filler': 56, Filler: 90 });
  for (const n of [7, 9, 14, 220]) assert.equal(labels.get(n), 'Mixed Canon/Filler');
  for (const n of [26, 97, 101, 106, 136, 143, 219]) assert.equal(labels.get(n), 'Filler');
  for (const n of [1, 135]) assert.equal(labels.get(n), 'Canon');
  assert.equal(meta.videos[0].id, 'tt0409591:1:1');
  assert.equal(meta.videos.at(-1).id, 'tt0409591:5:41');
  const shown = new Set(meta.videos.map(v => v.title));
  assert.equal(shown.has('[Filler] Episode 26'), false);
  assert.equal(shown.has('[Mixed Canon/Filler] Episode 7'), true);
  assert.equal(shown.has('[Mixed Canon/Filler] Episode 220'), true);
  for (const v of meta.videos) {
    assert.match(v.title, /^\[(Canon|Mixed Canon\/Filler)\] Episode \d+$/);
    assert.equal('streams' in v, false);
    assert.equal('available' in v, false);
    assert.match(v.thumbnail, /^https:\/\/episodes\.metahub\.space\/tt0409591\/\d+\/\d+\/w780\.jpg$/);
  }
  assert.equal(addon.manifest.resources.some(r => (r.name || r) === 'stream'), false);
  assert.deepEqual(await addon.get('meta', 'series', 'tt0409591'), { meta: null, cacheMaxAge: 300 });
  assert.equal((await addon.get('meta', 'series', 'narutoguide:original')).meta, null);
  assert.equal((await addon.get('catalog', 'series', CATALOG, { search: 'Naruto' })).metas.length, 1);
  for (const extra of [{ search: 'Bleach' }, { skip: '1' }]) assert.deepEqual((await addon.get('catalog', 'series', CATALOG, extra)).metas, []);
  assert.equal((await addon.get('meta', 'movie', PARENT_ID)).meta, null);
});

test('real SDK HTTP transport: manifest, CORS, catalog, metadata, landing page', async () => {
  const server = createServer({ baseUrl: 'http://example.test' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const manifest = await fetch(`${base}/manifest.json`);
    assert.equal(manifest.status, 200);
    assert.equal(manifest.headers.get('access-control-allow-origin'), '*');
    const manifestData = await manifest.json();
    assert.equal(manifestData.version, '1.0.0');
    assert.equal(manifestData.logo, 'http://example.test/icon.png');
    assert.equal(manifestData.name, 'Naruto Pace');
    const catalog = await (await fetch(`${base}/catalog/series/${CATALOG}.json`)).json();
    assert.equal(catalog.metas.length, 1);
    assert.equal(catalog.metas[0].id, PARENT_ID);
    assert.equal(catalog.metas[0].poster, 'https://images.metahub.space/poster/medium/tt0409591/img');
    assert.match(catalog.metas[0].background, /^https:\/\/images\.metahub\.space\/background\//);
    assert.match(catalog.metas[0].logo, /^https:\/\/images\.metahub\.space\/logo\//);
    const icon = await fetch(`${base}/icon.png`);
    assert.equal(icon.headers.get('content-type'), 'image/png');
    const iconBytes = Buffer.from(await icon.arrayBuffer());
    assert.equal(iconBytes.readUInt32BE(16), 256);
    assert.equal(iconBytes.readUInt32BE(20), 256);
    const response = await fetch(`${base}/meta/series/${encodeURIComponent(PARENT_ID)}.json`);
    assert.match(response.headers.get('cache-control'), /300/);
    const { meta } = await response.json();
    assert.equal(meta.videos.length, 130);
    assert.equal(meta.videos[6].title, '[Mixed Canon/Filler] Episode 7');
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);
    const html = await home.text();
    assert.match(html, /Naruto Pace/);
    assert.match(html, /130 episodes/);
    assert.doesNotMatch(html, /Bleach/i);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('Vercel entry builds public HTTPS URLs', async () => {
  const saved = { P: process.env.PUBLIC_URL, V: process.env.VERCEL_PROJECT_PRODUCTION_URL };
  process.env.PUBLIC_URL = 'https://naruto-pace.example';
  delete require.cache[require.resolve('../api/addon')];
  const handler = require('../api/addon');
  assert.equal(typeof handler, 'function');
  const chunks = [];
  await new Promise(resolve => {
    const res = { writeHead() {}, setHeader() {}, getHeader() {}, end(b) { chunks.push(b); resolve(); }, write(b) { chunks.push(b); } };
    handler({ url: '/', method: 'GET', headers: {} }, res);
  });
  assert.match(String(chunks.join('')), /Naruto Pace/);
  if (saved.P === undefined) delete process.env.PUBLIC_URL; else process.env.PUBLIC_URL = saved.P;
});
