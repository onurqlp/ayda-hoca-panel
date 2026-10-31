import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

await mkdir('apps-script', { recursive: true })
let html = await readFile('dist/index.html', 'utf8')
const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
const styleMatch = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/)
if (!scriptMatch || !styleMatch) throw new Error('Vite asset bağlantıları bulunamadı.')
const script = await readFile(resolve('dist', scriptMatch[1].replace(/^\.?\//, '')), 'utf8')
const style = await readFile(resolve('dist', styleMatch[1].replace(/^\.?\//, '')), 'utf8')
html = html
  .replace(scriptMatch[0], () => `<script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace(styleMatch[0], () => `<style>${style.replace(/<\/style/gi, '<\\/style')}</style>`)
await writeFile('apps-script/Index.html', html)
console.log('apps-script/Index.html hazırlandı.')
