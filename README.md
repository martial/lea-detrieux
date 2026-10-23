# Léa Detrieux, ostéopathe animalier

One-page site for Léa Detrieux (Instagram @leadetrieux_oa): home-visit animal osteopathy in the Sud-Gironde.
Vite + TypeScript, no framework. The HTML is complete without JavaScript; the scripts add the animal picker,
the "Votre commune ?" check and the pre-filled SMS.

Preview: https://martial.github.io/lea-detrieux/ (noindex until Léa approves).

## Commands

```sh
npm install
npm run dev       # http://127.0.0.1:5194
npm run build     # type-check + build into dist/
npm run deploy    # build for GitHub Pages and push the gh-pages branch
npm run photos    # resize src/assets/photos/** into public/photos (AVIF + JPEG)
npm run zone      # rebuild the map and the commune list (uses scripts/cache/)
```

`PUBLIC=1 npm run deploy` removes the noindex and the `Disallow` in robots.txt. Only do this once Léa has said yes.

## Where things are

- `src/data/site.ts`: phone, RNA number, Instagram, zone centre and radius.
- `src/data/species.ts`: the five animals, their "when to call" lines and prices.
- `index.html`, `mentions-legales.html`: the page text. `<!--include:…-->` markers are filled at build time by `build/html.ts`.
- `data-draft` marks every passage Léa still has to check. The full list is in `LEA-A-VALIDER.md`.
- `scripts/build-zone.ts`: the dot map of the Sud-Gironde and `src/generated/communes.json`.
- `scripts/build-photos.ts`: photo crops and sizes.

## Changing the zone

Edit `zone.radiusKm` (and `centre`/`code` if Léa moves) in `src/data/site.ts`, then run `npm run zone`.

## Replacing a photo

Put the new file in `src/assets/photos/`, adjust its line in `scripts/build-photos.ts` if the name or crop changes, then run `npm run photos`.
