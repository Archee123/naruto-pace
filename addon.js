'use strict';
const { addonBuilder } = require('stremio-addon-sdk');
const episodes = require('./data/episodes.json');
const classification = require('./data/classifications.json');
const PARENT_ID = 'narutoguide:pace-v1';
const CATALOG = 'naruto-pace-v1';
const IMDB = 'tt0409591';
const TOTAL = 220;
// Normal Naruto artwork from Metahub (the same images Stremio's own Naruto page uses).
// Swap COVER for your own file later, e.g. `${origin}/cover.png` after adding public/cover.png.
const ART = {
  cover: () => `https://images.metahub.space/poster/medium/${IMDB}/img`,
  background: () => `https://images.metahub.space/background/medium/${IMDB}/img`,
  logo: () => `https://images.metahub.space/logo/medium/${IMDB}/img`
};
function expand(ranges) {
  return ranges.split(',').flatMap(part => {
    const [start, end = start] = part.split('-').map(Number);
    if (!Number.isInteger(start) || start < 1 || end < start || end > TOTAL) throw new Error('Invalid range');
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });
}
const labels = new Map();
for (const [key, label] of [['canon', 'Canon'], ['mixed', 'Mixed Canon/Filler'], ['filler', 'Filler']]) {
  for (const n of expand(classification[key])) {
    if (labels.has(n)) throw new Error(`Duplicate classification: ${n}`);
    labels.set(n, label);
  }
}
if (episodes.length !== TOTAL || labels.size !== TOTAL) throw new Error('Incomplete Naruto dataset');
const ids = new Set();
episodes.forEach((v, i) => {
  if (v.absolute !== i + 1 || v.id !== `${IMDB}:${v.season}:${v.episode}` || ids.has(v.id) || !Number.isFinite(Date.parse(v.released))) throw new Error('Invalid episode mapping');
  ids.add(v.id);
});
// Watch path: manga canon plus mixed canon/filler. Only pure filler is skipped.
const selected = new Set([...labels].filter(([, label]) => label !== 'Filler').map(([n]) => n));
function createAddon({ baseUrl = process.env.PUBLIC_URL || `http://127.0.0.1:${process.env.PORT || 7000}` } = {}) {
  const origin = baseUrl.replace(/\/$/, '');
  const preview = { id: PARENT_ID, type: 'series', name: 'Naruto Pace', releaseInfo: '2002-2007', poster: ART.cover(), background: ART.background(), logo: ART.logo(), posterShape: 'poster', description: 'Naruto Pace watch path, original series only. Manga canon and mixed canon/filler episodes are kept; pure filler is skipped. Canon/filler labels come from Anime Filler List. Original episode numbering and stream IDs preserved.' };
  const builder = new addonBuilder({
    id: 'community.naruto.filler.guide', version: '1.0.0', name: 'Naruto Pace',
    logo: `${origin}/icon.png`,
    description: 'A dedicated Naruto page with canon/filler episode labels. No streams provided.',
    types: ['series'], resources: ['catalog', { name: 'meta', types: ['series'], idPrefixes: ['narutoguide:'] }],
    catalogs: [{ type: 'series', id: CATALOG, name: 'Naruto Pace', extra: [{ name: 'search', isRequired: false }, { name: 'skip', isRequired: false }] }]
  });
  builder.defineCatalogHandler(async ({ type, id, extra = {} }) => ({
    metas: type === 'series' && id === CATALOG && !(Number(extra.skip) > 0) && (!extra.search || /naruto|pace/i.test(extra.search)) ? [{ ...preview }] : [],
    cacheMaxAge: 300
  }));
  builder.defineMetaHandler(async ({ type, id }) => ({
    meta: type === 'series' && id === PARENT_ID ? {
      ...preview,
      videos: episodes.filter(v => selected.has(v.absolute)).map(v => ({
        id: v.id, season: v.season, episode: v.episode, released: v.released,
        title: `[${labels.get(v.absolute)}] Episode ${v.absolute}`,
        thumbnail: `https://episodes.metahub.space/${IMDB}/${v.season}/${v.episode}/w780.jpg`,
        overview: `Original Naruto episode ${v.absolute}. Classification: ${labels.get(v.absolute)}. ${labels.get(v.absolute) === 'Mixed Canon/Filler' ? 'Contains adapted manga material as well as original material.' : ''}`.trim()
      }))
    } : null,
    cacheMaxAge: 300
  }));
  return builder.getInterface();
}
module.exports = { createAddon, PARENT_ID, CATALOG, ART, labels, selected };
