// Resizes the source photos (src/assets/photos) into public/photos as AVIF + JPEG.
// Run when a photo changes: `npm run photos`.

import { mkdir, access } from 'node:fs/promises'
import sharp from 'sharp'

type Crop = { left: number; top: number; width: number } // fractions of the source; height follows the ratio
type Job = { src: string; out: string; widths: number[]; ratio: number; crop?: Crop }

const src = (p: string) => new URL(`../src/assets/photos/${p}`, import.meta.url).pathname
const out = new URL('../public/photos/', import.meta.url).pathname

const jobs: Job[] = [
  // Léa's own photos (Instagram, to be replaced by her originals)
  { src: 'ig/ig-spaniel.jpg', out: 'lea-epagneul', widths: [560, 840, 1240], ratio: 4 / 5, crop: { left: 0, top: 0.2, width: 1 } },
  // Until Léa's spaniel photo is here, the dog panel uses a free photo of the same breed:
  // swap this line for the commented one (and the credit in src/data/species.ts)
  // { src: 'ig/ig-spaniel.jpg', out: 'chien', widths: [480, 800, 1100], ratio: 4 / 5, crop: { left: 0.06, top: 0.36, width: 0.88 } },
  { src: 'stock/chien.jpg', out: 'chien', widths: [480, 800, 1100], ratio: 4 / 5, crop: { left: 0.3, top: 0, width: 0.533 } },
  { src: 'ig/ig-white-dog.jpg', out: 'lea-patou', widths: [560, 900], ratio: 4 / 5, crop: { left: 0.19, top: 0, width: 0.8 } },
  // Free photos (Unsplash licence), see CREDITS.md
  { src: 'stock/cheval.jpg', out: 'cheval', widths: [480, 800, 1100], ratio: 4 / 5, crop: { left: 0, top: 0.08, width: 1 } },
  { src: 'stock/vache.jpg', out: 'vache', widths: [480, 800, 1100], ratio: 4 / 5, crop: { left: 0.035, top: 0.01, width: 0.93 } },
  { src: 'stock/chat.jpg', out: 'chat', widths: [480, 800, 1100], ratio: 4 / 5, crop: { left: 0, top: 0.1, width: 1 } },
  { src: 'stock/poule.jpg', out: 'poule', widths: [480, 800, 1100], ratio: 4 / 5, crop: { left: 0, top: 0.14, width: 1 } },
]

await mkdir(out, { recursive: true })

for (const job of jobs) {
  const file = src(job.src)
  try {
    await access(file)
  } catch {
    console.warn(`skip ${job.out}: ${job.src} is missing`)
    continue
  }
  const meta = await sharp(file).metadata()
  const W = meta.width!, H = meta.height!
  const c = job.crop ?? { left: 0, top: 0, width: 1 }
  const width = Math.round(W * c.width)
  const height = Math.min(Math.round(width / job.ratio), H - Math.round(H * c.top))
  const region = { left: Math.round(W * c.left), top: Math.round(H * c.top), width, height }
  for (const w of job.widths) {
    const base = sharp(file).rotate().extract(region).resize({ width: w })
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(`${out}${job.out}-${w}.avif`)
    await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${out}${job.out}-${w}.jpg`)
  }
  console.log(`${job.out}: ${region.width}x${region.height} from ${W}x${H}`)
}
