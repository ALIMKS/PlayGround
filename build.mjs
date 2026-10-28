import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.cwd())
const source = join(root, 'src')
const output = join(root, 'dist')

if (!existsSync(join(source, 'index.html'))) {
  throw new Error('src/index.html is missing; cannot build the static site.')
}

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(source, output, { recursive: true })

const stamp = new Date().toISOString()
const htmlPath = join(output, 'index.html')
const html = await readFile(htmlPath, 'utf8')
await writeFile(htmlPath, html.replaceAll('__BUILD_STAMP__', stamp))
await writeFile(join(output, 'build.json'), JSON.stringify({ project: 'sept-portes-meknes', builtAt: stamp }, null, 2))

const files = await import('node:fs/promises').then(fs => fs.readdir(output, { recursive: true }))
console.log(`Built ${files.length} entries into ${output}`)
