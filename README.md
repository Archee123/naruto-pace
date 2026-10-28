# Naruto Pace for Stremio

A simple install page and Stremio metadata add-on for the original Naruto series (episodes 1–220). The catalog contains 130 whole episodes: manga canon plus mixed canon/filler. Pure filler is skipped. Each episode has a canon/mixed label and a thumbnail. No video streams are supplied.

## Use

Open the deployed homepage and choose **Install in Stremio**, or copy its manifest link into Stremio → Add-ons. Then open **Naruto Pace** under Discover. A compatible installed stream provider is required.

Only original Naruto episodes 1–220 are in scope; Shippuden, movies and specials are excluded.

## Local development

Node.js 22 or later is required.

```sh
npm ci
npm test
npm start
```

Open http://127.0.0.1:7000/. `PORT` changes the listening port.

## Vercel

Import this repository into Vercel with framework preset **Other**. `vercel.json` configures the Node function; `api/addon.js` exports the HTTP handler. Set `PUBLIC_URL=https://YOUR-DOMAIN` only if you use a custom domain. Install the production URL, not a protected preview.

Core endpoints:

```text
/manifest.json
/catalog/series/naruto-pace-v1.json
/meta/series/narutoguide:pace-v1.json
```

## Data and artwork

- `data/classifications.json`: canon, mixed and filler ranges (74 canon, 56 mixed, 90 filler) from the supplied filler guide, matching [Anime Filler List](https://www.animefillerlist.com/shows/naruto).
- `data/episodes.json`: [Cinemeta](https://v3-cinemeta.strem.io/meta/series/tt0409591.json) snapshot (`tt0409591`), seasons 35/48/48/48/41, absolute 1–220.
- Cover, background, logo and episode thumbnails are the normal Naruto images from Metahub (the same ones Stremio shows). To use your own cover, add `public/cover.png`, serve it from `server.js`, and change `ART.cover` in `addon.js`.
- `public/icon.png`: generated original swirl icon, 256×256.

Independent fan project, not affiliated with Stremio or Naruto's creators.
