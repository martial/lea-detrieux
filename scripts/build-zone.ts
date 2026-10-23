// Builds the "Où j'interviens" map and the commune list used by the zone check.
// Run once (or when the zone changes): `npm run zone`.
// Sources: geo.api.gouv.fr (Etalab open licence) for communes,
// OpenStreetMap via Overpass (ODbL, © OpenStreetMap contributors) for the Garonne.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { geoMercator, geoPath, geoCircle } from 'd3-geo'
import { zone } from '../src/data/site.ts'

type Commune = { nom: string; code: string; codesPostaux: string[]; centre: { coordinates: [number, number] } }

const DEPARTEMENTS = ['33', '40', '47']
const MAP_RADIUS_KM = 56 // what the map shows around the centre
const LIST_RADIUS_KM = 90 // communes the zone check knows about
const SIZE = 800

// Town name → label on the map. Labels sit right of the dot unless `left`;
// `minor` labels are hidden on phones, where the map is small.
const LABELS = new Map<string, { text: string; left?: boolean; minor?: boolean }>([
  ['Langon', { text: 'Langon' }], ['Bazas', { text: 'Bazas' }], ['La Réole', { text: 'La Réole' }],
  ['Cadillac-sur-Garonne', { text: 'Cadillac', left: true }], ['Saint-Macaire', { text: 'Saint-Macaire', minor: true }],
  ['Villandraut', { text: 'Villandraut', left: true, minor: true }],
  ['Captieux', { text: 'Captieux' }], ['Saint-Symphorien', { text: 'Saint-Symphorien', left: true, minor: true }],
  ['Sauveterre-de-Guyenne', { text: 'Sauveterre-de-Guyenne', minor: true }], ['Monségur', { text: 'Monségur', minor: true }],
  ['Bordeaux', { text: 'Bordeaux', left: true }], ['Marmande', { text: 'Marmande' }],
])

const toRad = (d: number) => (d * Math.PI) / 180
function km([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

// API answers are kept in scripts/cache/ so a rebuild works offline (and when Overpass is busy).
// Delete a cache file to fetch it again.
async function json<T>(name: string, url: string, init?: RequestInit): Promise<T> {
  const file = new URL(`./cache/${name}.json`, import.meta.url)
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T
  } catch {
    const res = await fetch(url, init)
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    const data = await res.json()
    await mkdir(new URL('./cache/', import.meta.url), { recursive: true })
    await writeFile(file, JSON.stringify(data))
    return data as T
  }
}

const communes = (await Promise.all(DEPARTEMENTS.map((d) =>
  json<Commune[]>(`communes-${d}`, `https://geo.api.gouv.fr/departements/${d}/communes?fields=nom,code,codesPostaux,centre`),
))).flat().filter((c) => c.centre)

const centre = zone.centre
const withKm = communes.map((c) => ({ ...c, km: km(centre, c.centre.coordinates) }))

// The Garonne: every OSM way tagged as the river inside a box around the zone.
const [lon, lat] = centre
const box = [lat - 0.75, lon - 1.0, lat + 0.75, lon + 1.0].join(',')
const overpass = await json<{ elements: { geometry: { lat: number; lon: number }[] }[] }>(
  'garonne',
  'https://overpass-api.de/api/interpreter',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'lea-detrieux-map-build/1.0',
    },
    body: 'data=' + encodeURIComponent(
      `[out:json][timeout:60];way["waterway"="river"]["name"="La Garonne"](${box});out geom;`,
    ),
  },
)
// OSM ways point downstream. Chain them into continuous lines, main course first
// (the head farthest east, towards Agen), so the page can draw the river flowing
// from upstream to Bordeaux; side arms follow.
type Pt = [number, number]
const ways: Pt[][] = overpass.elements.map((w) => w.geometry.map((p): Pt => [p.lon, p.lat]))
const key = (p: Pt) => `${p[0]},${p[1]}`
const byStart = new Map<string, number[]>()
ways.forEach((w, i) => byStart.set(key(w[0]), [...(byStart.get(key(w[0])) ?? []), i]))
const endKeys = new Set(ways.map((w) => key(w[w.length - 1])))
const used = new Set<number>()
function follow(first: number): Pt[] {
  const line: Pt[] = []
  let cur: number | undefined = first
  while (cur !== undefined && !used.has(cur)) {
    used.add(cur)
    const w: Pt[] = ways[cur]
    line.push(...(line.length ? w.slice(1) : w))
    cur = (byStart.get(key(w[w.length - 1])) ?? []).find((j) => !used.has(j))
  }
  return line
}
const heads = ways.map((_, i) => i).filter((i) => !endKeys.has(key(ways[i][0])))
heads.sort((a, b) => ways[b][0][0] - ways[a][0][0])
const lines = heads.map(follow)
ways.forEach((_, i) => { if (!used.has(i)) lines.push(follow(i)) })
const garonne: GeoJSON.MultiLineString = { type: 'MultiLineString', coordinates: lines.filter((l) => l.length > 1) }

// Fit the projection on a circle of MAP_RADIUS_KM around the centre.
const frame = geoCircle().center(centre).radius(MAP_RADIUS_KM / 111.2)()
const r1 = (n: number) => Math.round(n * 10) / 10
const projection = geoMercator().fitExtent([[0, 0], [SIZE, SIZE]], frame)
const path = geoPath(projection)

// The zone is "about" radiusKm, so it is drawn as a soft blob (her brand shape), not a compass circle.
function blob(steps = 120) {
  const [x0, y0] = projection(centre)!
  const [, yr] = projection([centre[0], centre[1] + zone.radiusKm / 111.2])!
  const r = y0 - yr
  const pts = Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    const k = 1 + 0.025 * Math.sin(3 * a + 0.6) + 0.012 * Math.sin(5 * a + 2.1)
    return [x0 + Math.cos(a) * r * k, y0 + Math.sin(a) * r * k]
  })
  return 'M' + pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join('L') + 'Z'
}

const shown = withKm.filter((c) => c.km <= MAP_RADIUS_KM * 1.05)
const dots = shown.map((c) => {
  const [x, y] = projection(c.centre.coordinates)!
  const inside = c.km <= zone.radiusKm
  return `<circle${inside ? ' class="in"' : ''} data-c="${c.code}" cx="${Math.round(x)}" cy="${Math.round(y)}" r="${inside ? 3 : 2}"/>`
}).join('')

const labels = shown.filter((c) => LABELS.has(c.nom)).map((c) => {
  const [x, y] = projection(c.centre.coordinates)!
  const { text, left, minor } = LABELS.get(c.nom)!
  const base = c.code === zone.code
  const dx = (base ? 13 : 8) * (left ? -1 : 1)
  const cls = base ? 'base' : minor ? 'minor' : ''
  const attrs = ` data-c="${c.code}"${cls ? ` class="${cls}"` : ''}${left ? ' text-anchor="end"' : ''}`
  return `<text${attrs} x="${Math.round(x + dx)}" y="${Math.round(y + (base ? 7 : 5))}">${text}</text>`
}).join('')

const roundPath = (d: string | null) => (d ?? '').replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n))))
  .replace(/L(-?\d+),(-?\d+)(?=L\1,\2(?!\d))/g, '') // drop repeated points after rounding

const [cx, cy] = projection(centre)!
const svg = `<svg class="zone-map" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-labelledby="zone-map-title">
<title id="zone-map-title">Carte du Sud-Gironde : la zone d'intervention couvre environ ${zone.radiusKm} km autour de ${zone.base}, le long de la Garonne.</title>
<path class="area" d="${blob()}"/>
<path class="river" pathLength="1" d="${roundPath(path(garonne))}"/>
<g class="dots">${dots}</g>
<circle class="home" cx="${r1(cx)}" cy="${r1(cy)}" r="7"/>
<g class="labels">${labels}</g>
</svg>
`

const list = withKm
  .filter((c) => c.km <= LIST_RADIUS_KM)
  .map((c) => ({ n: c.nom, c: c.code, cp: c.codesPostaux, km: Math.round(c.km) }))
  .sort((a, b) => a.n.localeCompare(b.n, 'fr'))

await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true })
await writeFile(new URL('../src/generated/zone-map.svg', import.meta.url), svg)
await writeFile(new URL('../src/generated/communes.json', import.meta.url), JSON.stringify(list))
console.log(`map: ${shown.length} communes, ${garonne.coordinates.length} river lines, ${(svg.length / 1024).toFixed(1)} KB`)
console.log(`list: ${list.length} communes, ${list.filter((c) => c.km <= zone.radiusKm).length} inside ${zone.radiusKm} km`)
