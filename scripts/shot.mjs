// Dev tool: screenshot a page with real device emulation (Chrome DevTools Protocol, no dependencies).
//
//   node scripts/shot.mjs <url> <out.png> [options]
//     --w 390 --h 844     viewport (CSS px), default 390x844 (iPhone 14)
//     --dpr 3             device pixel ratio, default 3 for phones, 1 when --desktop
//     --desktop           1440x900, no touch, dpr 1
//     --full              capture the whole page height
//     --wait 2500         ms to wait after load (animations), default 2500
//     --scroll "#zone"    scroll this selector into view (top) before the shot
//     --eval "js"         run this in the page before the shot (awaited)
//     --reduced           emulate prefers-reduced-motion: reduce
//
// Prints the page's scrollWidth vs viewport width, so horizontal overflow shows up.

import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const [url, out] = args
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [--w --h --dpr --desktop --full --wait --scroll --eval --reduced]')
  process.exit(1)
}
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i < 0 ? def : args[i + 1]
}
const flag = (name) => args.includes(`--${name}`)
const desktop = flag('desktop')
const width = Number(opt('w', desktop ? 1440 : 390))
const height = Number(opt('h', desktop ? 900 : 844))
const dpr = Number(opt('dpr', desktop ? 1 : 3))
const wait = Number(opt('wait', 2500))

const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const profile = mkdtempSync(join(tmpdir(), 'shot-'))
const chrome = spawn(chromePath, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })

const browserWs = await new Promise((resolve, reject) => {
  let buf = ''
  chrome.stderr.on('data', (d) => {
    buf += d
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/)
    if (m) resolve(m[1])
  })
  setTimeout(() => reject(new Error('Chrome did not start')), 15000)
})
const port = new URL(browserWs).port
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
  }
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value

try {
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: !desktop })
  if (!desktop) {
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    await send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })
  }
  if (flag('reduced')) {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  }
  await send('Page.navigate', { url })
  await new Promise((r) => setTimeout(r, 800))
  await evaluate('document.fonts.ready.then(() => true)')
  const scroll = opt('scroll', null)
  if (scroll) await evaluate(`document.querySelector(${JSON.stringify(scroll)})?.scrollIntoView({ block: 'start', behavior: 'instant' }); true`)
  const code = opt('eval', null)
  if (code) await evaluate(`(async () => { ${code} })()`)
  await new Promise((r) => setTimeout(r, wait))

  const print = opt('print', null)
  if (print) console.log(JSON.stringify(await evaluate(print), null, 1))
  const info = await evaluate('({ sw: document.documentElement.scrollWidth, vw: innerWidth, h: document.documentElement.scrollHeight })')
  const shot = flag('full')
    ? await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: info.h, scale: 1 } })
    : await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log(`${out}  viewport ${info.vw}px, scrollWidth ${info.sw}px${info.sw > info.vw ? '  ← HORIZONTAL OVERFLOW' : ''}, page height ${info.h}px`)
} finally {
  ws.close()
  chrome.kill()
  await new Promise((r) => chrome.once('exit', r))
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    // Chrome may still be flushing its profile; it lives in the OS temp folder anyway
  }
}
