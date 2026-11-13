/**
 * 把 icon.svg 同步到 client.js 里的 ICON_DATA_URL。
 *
 * Client 模块通过模块加载器加载，不能直接读取包内文件，所以菜单行使用的
 * 插件图标以 base64 data URL 内嵌在 client.js 里。替换 icon.svg 后运行：
 *
 *   node scripts/sync-icon.mjs
 *   # 或
 *   npm run sync-icon
 *
 * 然后刷新页面（或重新加载插件）即可。
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const iconPath = join(root, 'icon.svg')
const clientPath = join(root, 'client.js')

const icon = await readFile(iconPath)
const dataUrl = `data:image/svg+xml;base64,${icon.toString('base64')}`
const source = await readFile(clientPath, 'utf8')
const pattern = /const ICON_DATA_URL = '[^']*'/

if (!pattern.test(source)) {
    console.error('client.js 中找不到 ICON_DATA_URL，未修改任何文件。')
    process.exit(1)
}

const next = source.replace(pattern, `const ICON_DATA_URL = '${dataUrl}'`)
if (next === source) {
    console.log('ICON_DATA_URL 已是最新，无需修改。')
    process.exit(0)
}

await writeFile(clientPath, next)
console.log(`已把 ${icon.length} 字节的 icon.svg 同步到 client.js（data URL ${dataUrl.length} 字符）。`)
