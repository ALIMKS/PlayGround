import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'

const started = performance.now()
const elapsed = () => `${((performance.now() - started) / 1000).toFixed(2)}s`

async function timed(label, fn) {
  const stepStart = performance.now()
  try {
    return await fn()
  } finally {
    console.log(`[capture] ${label} (${((performance.now() - stepStart) / 1000).toFixed(2)}s)`)
  }
}

class CaptureError extends Error {
  constructor(message, exitCode) {
    super(message)
    this.name = 'CaptureError'
    this.exitCode = exitCode
  }
}

const transient = message => new CaptureError(message, 75)
const defect = message => new CaptureError(message, 1)

const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
if (!url || !output) {
  console.error('[capture] CAPTURE_URL and CAPTURE_DIR are required.')
  process.exit(1)
}

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const configPath = join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json')
const config = JSON.parse(readFileSync(configPath, 'utf8'))
if (process.platform === 'linux' && !process.env.DISPLAY) {
  try {
    process.env.DISPLAY = ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
  } catch {
    // Headless fallback below does not need a display.
  }
}

mkdirSync(output, { recursive: true })
console.log(`[capture] start ${new Date().toISOString()} -> ${url}`)
console.log(`[capture] output ${output}`)

let browser
try {
  browser = await timed('launch browser', async () => {
    const configured = {
      ...config.browser.launchOptions,
      timeout: 30000
    }
    try {
      return await chromium.launch(configured)
    } catch (firstError) {
      console.error(`[capture] configured launch failed: ${firstError.message}`)
      console.error('[capture] retrying with headless Chromium')
      try {
        return await chromium.launch({
          headless: true,
          timeout: 30000,
          args: ['--disable-dev-shm-usage', '--no-sandbox']
        })
      } catch (secondError) {
        throw transient(`Browser launch failed: ${secondError.message}`)
      }
    }
  })

  const views = [
    { name: 'desktop', width: 1440, height: 900, mobile: false, scale: 1 },
    { name: 'mobile', width: 390, height: 844, mobile: true, scale: 2 }
  ]

  for (const view of views) {
    const page = await timed(`open ${view.name} page`, () => browser.newPage({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: view.scale,
      isMobile: view.mobile,
      hasTouch: view.mobile
    }).catch(error => {
      throw transient(`Could not open ${view.name} page: ${error.message}`)
    }))

    page.setDefaultTimeout(30000)
    await page.emulateMedia({ reducedMotion: 'reduce' }).catch(() => {})

    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))

    const response = await timed(`navigate ${view.name}`, () => page.goto(url, {
      waitUntil: 'load',
      timeout: 45000
    }).catch(error => {
      const message = String(error?.message || error)
      if (/net::ERR|ERR_|timeout|ECONN|ENOTFOUND|EAI_AGAIN|socket hang up|Target closed/i.test(message)) {
        throw transient(`Navigation failed for ${view.name}: ${message}`)
      }
      throw defect(`Navigation failed for ${view.name}: ${message}`)
    }))

    if (!response) throw transient(`No HTTP response while loading ${view.name}`)
    const status = response.status()
    if (!response.ok()) {
      const message = `HTTP ${status} while loading ${view.name} (${response.url()})`
      if (status >= 500 || status === 408 || status === 429) throw transient(message)
      throw defect(message)
    }

    await timed(`wait for render ${view.name}`, async () => {
      try {
        await page.waitForSelector('[data-capture-ready]', { state: 'attached', timeout: 30000 })
      } catch (error) {
        throw defect(`The app never signalled capture readiness on ${view.name}: ${error.message}`)
      }
      const state = await page.evaluate(() => document.documentElement.dataset.captureReady)
      if (state !== 'true') throw defect(`Capture readiness is "${state}" on ${view.name}`)
    })

    await timed(`wait for assets ${view.name}`, async () => {
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map(image => image.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            })))
      }).catch(error => {
        throw defect(`Assets did not settle on ${view.name}: ${error.message}`)
      })
      await page.waitForTimeout(700)
    })

    if (view.name === 'desktop') {
      await timed('exercise episode reader', async () => {
        const trigger = page.locator('.episode-card .episode-open').first()
        await trigger.click({ timeout: 5000 }).catch(error => {
          throw defect(`Could not open the first episode: ${error.message}`)
        })
        await page.locator('#reader:not([hidden])').waitFor({ state: 'visible', timeout: 5000 }).catch(error => {
          throw defect(`Episode reader did not open: ${error.message}`)
        })
        const readerTitle = (await page.locator('#readerTitle').innerText()).trim()
        if (!readerTitle) throw defect('Episode reader opened without a title')
        await page.keyboard.press('Escape')
        await page.locator('#reader[hidden]').waitFor({ state: 'attached', timeout: 5000 }).catch(error => {
          throw defect(`Episode reader did not close: ${error.message}`)
        })
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.waitForTimeout(250)
      })
    }

    const audit = await timed(`audit ${view.name}`, () => page.evaluate(() => {
      const heading = document.querySelector('.hero h1')
      const root = document.querySelector('#app')
      const cards = document.querySelectorAll('.episode-card')
      const places = document.querySelectorAll('.place-card')
      const text = (document.body.innerText || '').trim()
      return {
        ready: document.documentElement.dataset.captureReady === 'true',
        rootChildren: root ? root.children.length : 0,
        heading: heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '',
        headingVisible: Boolean(heading && heading.getBoundingClientRect().height > 0),
        cards: cards.length,
        places: places.length,
        textLength: text.length,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        brokenImages: [...document.images]
          .filter(image => image.getAttribute('src') && (!image.complete || image.naturalWidth === 0))
          .map(image => image.getAttribute('src'))
      }
    }))

    if (!audit.ready) throw defect(`Readiness flag lost on ${view.name}`)
    if (!audit.rootChildren || !audit.headingVisible) throw defect(`Hero did not render on ${view.name}: ${JSON.stringify(audit)}`)
    if (!/Sept Portes|Meknès/i.test(audit.heading)) throw defect(`Unexpected hero title on ${view.name}: ${audit.heading}`)
    if (audit.cards < 6) throw defect(`Expected 6 episode cards on ${view.name}, found ${audit.cards}`)
    if (audit.places < 6) throw defect(`Expected 6 place cards on ${view.name}, found ${audit.places}`)
    if (audit.textLength < 500) throw defect(`Page text is too short on ${view.name}: ${audit.textLength}`)
    if (audit.brokenImages.length) throw defect(`Broken images on ${view.name}: ${audit.brokenImages.join(', ')}`)
    if (pageErrors.length) throw defect(`Page errors on ${view.name}: ${pageErrors.join(' | ')}`)
    if (audit.scrollWidth > audit.innerWidth + 2) {
      console.log(`[capture] note: horizontal overflow on ${view.name} (${audit.scrollWidth} > ${audit.innerWidth})`)
    }

    const file = join(output, `final-${view.name}.png`)
    await timed(`screenshot ${view.name}`, () => page.screenshot({
      path: file,
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      timeout: 30000
    }).catch(error => {
      if (error.name === 'TimeoutError' || !browser.isConnected()) {
        throw transient(`Screenshot failed for ${view.name}: ${error.message}`)
      }
      throw defect(`Screenshot failed for ${view.name}: ${error.message}`)
    }))

    console.log(`[capture] captured ${file}`)
    await page.close().catch(() => {})
  }
} catch (error) {
  const exitCode = error?.exitCode || 1
  console.error(`[capture] ${exitCode === 75 ? 'TRANSIENT' : 'DEFECT'}: ${error?.message || error}`)
  if (error?.stack) console.error(error.stack)
  process.exitCode = exitCode
} finally {
  if (browser) {
    await browser.close().catch(error => {
      console.error(`[capture] browser close failed: ${error.message}`)
      if (!process.exitCode) process.exitCode = 75
    })
  }
  console.log(`[capture] finished in ${elapsed()}`)
}
