import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.cwd(), 'dist')
const port = Number(process.env.PORT || 3000)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
}

if (!existsSync(join(root, 'index.html'))) {
  console.error(`Missing static build at ${root}. Run npm run build first.`)
  process.exit(1)
}

const server = createServer((request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost')
    if (url.pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ ok: true, project: 'sept-portes-meknes' }))
      return
    }

    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
    let file = resolve(root, '.' + (relative === '/' ? '/index.html' : relative))
    if (file !== root && !file.startsWith(root + '/')) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file)) {
      if (extname(file)) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        response.end('Not found')
        return
      }
      file = join(root, 'index.html')
    }

    const stats = statSync(file)
    const etag = `W/"${stats.size}-${stats.mtimeMs}"`
    if (request.headers['if-none-match'] === etag) {
      response.writeHead(304)
      response.end()
      return
    }

    response.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=300',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff'
    })
    createReadStream(file).pipe(response)
  } catch (error) {
    console.error(error)
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Internal server error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Les Sept Portes de Meknès is serving ${root} on http://0.0.0.0:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
