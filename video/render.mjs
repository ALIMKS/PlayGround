import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, copyFileSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildSoundtrack } from './audio.mjs'
import ffmpegPath from 'ffmpeg-static'

const ROOT = resolve(import.meta.dirname)
const OUT = join(ROOT, 'out')
const FRAMES = join(OUT, 'frames')
const W = Number(process.env.W || 1920)
const H = Number(process.env.H || 1080)
const FPS = Number(process.env.FPS || 30)
const DURATION = Number(process.env.DURATION || 38)
const PORT = Number(process.env.PORT || 3011)
const TOTAL = Math.round(FPS * DURATION)
const POSTER_T = Number(process.env.POSTER_T || 26)

function log(...args){ console.log('[video]', ...args) }

let chromium
try {
  ({ chromium } = await import('/home/runner/.local/share/omgithub-playwright/node_modules/playwright/index.mjs'))
} catch {
  ({ chromium } = await import('playwright'))
}

mkdirSync(OUT, { recursive: true })
rmSync(FRAMES, { recursive: true, force: true })
mkdirSync(FRAMES, { recursive: true })

log('soundtrack…')
const audio = buildSoundtrack(join(OUT, 'soundtrack.wav'), DURATION)
log(`soundtrack ready (${audio.seconds.toFixed(1)}s)`)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
}
const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
    let file = resolve(ROOT, '.' + (rel === '/' ? '/teaser.html' : rel))
    if (file !== ROOT && !file.startsWith(ROOT + '/')){ res.writeHead(403); res.end(); return }
    if (!existsSync(file) || statSync(file).isDirectory()){ res.writeHead(404); res.end('not found'); return }
    const data = statSync(file)
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': data.size })
    createReadStream(file).pipe(res)
  } catch (error){
    res.writeHead(500); res.end(String(error))
  }
})
await new Promise(r => server.listen(PORT, '127.0.0.1', r))
log(`serving ${ROOT} on http://127.0.0.1:${PORT}`)

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-dev-shm-usage',
    '--no-sandbox'
  ]
})

const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  colorScheme: 'dark'
})
const page = await context.newPage()
page.on('pageerror', e => console.error('[pageerror]', e.message))
page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()) })

await page.goto(`http://127.0.0.1:${PORT}/teaser.html?capture=1`, { waitUntil: 'load', timeout: 60000 })
await page.waitForFunction('window.__ready === true', null, { timeout: 60000 })
await page.evaluate(() => document.fonts.ready)
log(`rendering ${TOTAL} frames at ${W}x${H} @ ${FPS}fps`)

const started = Date.now()
for (let i = 0; i < TOTAL; i++){
  const t = i / FPS
  await page.evaluate(time => window.renderAt(time), t)
  const name = `frame_${String(i).padStart(5, '0')}.jpg`
  await page.screenshot({ path: join(FRAMES, name), type: 'jpeg', quality: 95, animations: 'disabled' })
  if (i % 150 === 0 || i === TOTAL - 1){
    const pct = Math.round(((i + 1) / TOTAL) * 100)
    log(`${pct}% — frame ${i + 1}/${TOTAL} (${((Date.now() - started)/1000).toFixed(0)}s)`)
  }
}

const posterIndex = Math.min(TOTAL - 1, Math.round(POSTER_T * FPS))
copyFileSync(join(FRAMES, `frame_${String(posterIndex).padStart(5, '0')}.jpg`), join(OUT, 'poster.jpg'))
for (const [snap, time] of [['still-01', 4], ['still-02', 12], ['still-03', 29], ['still-04', 35]]){
  const idx = Math.min(TOTAL - 1, Math.round(time * FPS))
  copyFileSync(join(FRAMES, `frame_${String(idx).padStart(5, '0')}.jpg`), join(OUT, `${snap}.jpg`))
}

await context.close()
await browser.close()
await new Promise(r => server.close(r))

const mp4 = join(OUT, 'les-sept-portes-teaser.mp4')
log('encoding mp4…')
const ff = spawnSync(ffmpegPath, [
  '-y',
  '-framerate', String(FPS),
  '-start_number', '0',
  '-i', join(FRAMES, 'frame_%05d.jpg'),
  '-i', join(OUT, 'soundtrack.wav'),
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '17',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'high',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-shortest',
  '-movflags', '+faststart',
  '-metadata', 'title=Les Sept Portes de Meknès — teaser',
  mp4
], { encoding: 'utf8' })

if (ff.status !== 0){
  console.error(ff.stderr?.slice(-3000))
  process.exit(1)
}

const size = statSync(mp4).size
log(`done → ${mp4} (${(size/1024/1024).toFixed(1)} MB)`)
log(`poster → ${join(OUT, 'poster.jpg')}`)
if (process.env.KEEP_FRAMES === '1'){
  log(`frames kept in ${FRAMES} (${readdirSync(FRAMES).length})`)
} else {
  rmSync(FRAMES, { recursive: true, force: true })
  log('frames cleaned up')
}
