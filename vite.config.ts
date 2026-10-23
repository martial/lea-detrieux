import { defineConfig, type Plugin } from 'vite'
import { fillIncludes } from './build/html.ts'

// GH_PAGES=1 builds for https://martial.github.io/lea-detrieux/
// PUBLIC=1 removes the noindex (only once Léa has approved the site).
const base = process.env.GH_PAGES === '1' ? '/lea-detrieux/' : '/'

function includes(): Plugin {
  return {
    name: 'lea-includes',
    transformIndexHtml: { order: 'pre', handler: fillIncludes },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: process.env.PUBLIC === '1' ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n',
      })
    },
  }
}

export default defineConfig({
  base,
  plugins: [includes()],
  server: { port: 5194 },
  preview: { port: 5195 },
  build: {
    rollupOptions: {
      input: { main: 'index.html', legal: 'mentions-legales.html' },
    },
  },
})
