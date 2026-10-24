import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import { fillIncludes } from './build/html.ts'

// Served from the root of https://lea-detrieux.com/ (GitHub Pages, public/CNAME).
// PUBLIC=1 removes the noindex (only once Léa has approved the site).

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

// GitHub Pages cannot send security headers, so the built pages carry their
// Content-Security-Policy as a meta tag: only the site's own files run, plus the
// one-line inline script (allowed by its hash). Not in dev, where Vite injects styles.
function csp(): Plugin {
  return {
    name: 'lea-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
          .map(([, js]) => ` 'sha256-${createHash('sha256').update(js).digest('base64')}'`)
        const policy = [
          "default-src 'self'",
          `script-src 'self'${inline.join('')}`,
          "style-src 'self'",
          "img-src 'self' data:",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'self'",
          'upgrade-insecure-requests',
        ].join('; ')
        return html.replace('<meta charset="UTF-8">', `$&\n    <meta http-equiv="Content-Security-Policy" content="${policy}">`)
      },
    },
  }
}

export default defineConfig({
  plugins: [includes(), csp()],
  server: { port: 5194 },
  preview: { port: 5195 },
  build: {
    rollupOptions: {
      input: { main: 'index.html', legal: 'mentions-legales.html' },
    },
  },
})
