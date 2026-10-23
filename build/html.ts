// Build-time HTML: index.html and mentions-legales.html hold `<!--include:name-->`
// markers, filled here from src/data so the content lives in one place and the
// page is complete without JavaScript.

import { readFileSync, existsSync } from 'node:fs'
import { species, type Species } from '../src/data/species.ts'
import { site, zone } from '../src/data/site.ts'

const root = new URL('../', import.meta.url).pathname
const read = (p: string) => readFileSync(root + p, 'utf8')

const euro = (n: number) => `${n}&nbsp;€`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const WIDTHS: Record<string, number[]> = {
  'lea-epagneul': [560, 840, 1240],
  'lea-patou': [560, 900],
}

export function picture(name: string, alt: string, sizes: string, opts: { eager?: boolean; cls?: string } = {}) {
  const widths = WIDTHS[name] ?? [480, 800, 1100]
  const cls = opts.cls ? ` class="${opts.cls}"` : ''
  if (!existsSync(`${root}public/photos/${name}-${widths[0]}.jpg`)) {
    return `<div${cls} data-missing-photo="${name}"><span>Photo à venir</span></div>`
  }
  const set = (ext: string) => widths.map((w) => `/photos/${name}-${w}.${ext} ${w}w`).join(', ')
  const mid = widths[Math.min(1, widths.length - 1)]
  const loading = opts.eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'
  return `<picture${cls}><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` +
    `<img src="/photos/${name}-${mid}.jpg" srcset="${set('jpg')}" sizes="${sizes}" alt="${esc(alt)}" width="800" height="1000" ${loading}></picture>`
}

function markSymbol() {
  const svg = read('src/assets/logo/mark.svg')
  const inner = svg.replace(/^[\s\S]*?<g /, '<g ').replace(/<\/svg>\s*$/, '')
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="mark" viewBox="724 513 1133 1528" fill="currentColor">${inner}</symbol></svg>`
}

function speciesPicker() {
  const tabs = species.map((s, i) =>
    `<button type="button" role="tab" id="tab-${s.slug}" aria-controls="${s.slug}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${s.word}</button>`,
  ).join('')
  const panels = species.map((s, i) => panel(s, i)).join('\n')
  return `<div class="picker-tabs" role="tablist" aria-label="Choisir un animal" hidden>${tabs}</div>\n<div class="picker-panels">\n${panels}\n</div>`
}

function panel(s: Species, i: number) {
  const prices = s.prices.map((p) =>
    `<li><span class="price-label">${p.label}${p.note ? ` <small>${p.note}</small>` : ''}</span><span class="price">${euro(p.price)}</span></li>`,
  ).join('')
  const reasons = s.reasons.map((r) => `<li>${r}</li>`).join('')
  const credit = s.photo.credit ? `<figcaption>Photo&nbsp;: ${s.photo.credit} (Unsplash)</figcaption>` : ''
  return `<article class="panel${i === 0 ? ' is-active' : ''}" id="${s.slug}" role="tabpanel" aria-labelledby="tab-${s.slug}" data-sms="${esc(s.forSms)}" tabindex="0">
  <figure class="panel-photo">${picture(s.photo.name, s.photo.alt, '(min-width: 960px) 420px, 88vw')}${credit}</figure>
  <div class="panel-text">
    <h3>${s.title}</h3>
    <p class="panel-when">Quand faire appel à moi&nbsp;?</p>
    <ul class="reasons" data-draft>${reasons}</ul>
    <ul class="prices" aria-label="Tarifs">${prices}</ul>
  </div>
</article>`
}

function pricesTable() {
  const rows = species.flatMap((s) => s.prices.map((p) =>
    `<tr><th scope="row">${p.label}${p.note ? ` <small>${p.note}</small>` : ''}</th><td>${euro(p.price)}</td></tr>`))
  return `<table class="all-prices"><caption class="visually-hidden">Tous les tarifs, par séance</caption><tbody>${rows.join('')}</tbody></table>`
}

function zoneMap() {
  return read('src/generated/zone-map.svg')
}

function robots() {
  return process.env.PUBLIC === '1' ? '' : '<meta name="robots" content="noindex, nofollow">'
}

function jsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${site.name}, ${site.job.toLowerCase()}`,
    description: 'Ostéopathie animale à domicile pour chevaux, chiens, bovins, chats et poules, dans le Sud-Gironde.',
    telephone: site.phoneHref,
    areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: zone.centre[1], longitude: zone.centre[0] }, geoRadius: zone.radiusKm * 1000 },
    address: { '@type': 'PostalAddress', addressLocality: zone.base, postalCode: '33210', addressRegion: 'Gironde', addressCountry: 'FR' },
    sameAs: [site.instagram],
    priceRange: '30 € – 90 €',
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

const includes: Record<string, () => string> = {
  'mark-symbol': markSymbol,
  'species-picker': speciesPicker,
  'prices-table': pricesTable,
  'zone-map': zoneMap,
  robots,
  'json-ld': jsonLd,
  'og-image': () => `<meta property="og:image" content="${site.url}og.jpg"><meta property="og:url" content="${site.url}">`,
  'hero-photo': () => picture('lea-epagneul', 'Léa, assise, tient contre elle un épagneul breton blanc et orange.', '(min-width: 960px) 520px, 92vw', { eager: true, cls: 'hero-picture' }),
  'about-photo': () => picture('lea-patou', 'Léa, assise en terrasse, caresse un grand chien blanc.', '(min-width: 960px) 440px, 88vw', { cls: 'about-picture' }),
}

export function fillIncludes(html: string) {
  return html.replace(/<!--include:([\w-]+)-->/g, (m, name: string) => includes[name]?.() ?? m)
}
