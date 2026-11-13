/**
 * dsh-remove-session Host 半边的文件系统辅助函数。
 *
 * JSONL 会话后端拥有磁盘布局，却没有提供删除 API，所以本插件复刻了该布局中
 * 唯一稳定的部分：一个会话位于以其路径编码 id 命名的目录中，目录挂在一个
 * 人类可读的项目目录下。下面的 `encodeSegment` 与后端在接触文件系统前使用的
 * 转义完全相同（单射）；项目目录名没有复刻，因为只要扫描根目录下的各个项目
 * 目录，用会话 id 就足以定位它。
 *
 * 同一个文件还负责投影缓存（`session_projcache`）的孤儿清理：那份缓存按会话
 * id 每个会话一个文档，是纯派生数据，会话目录消失后文档就是无用残留。
 *
 * @module dsh-remove-session/host/session-files
 */

import { readdir, rm, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * 把任意字符串转义成单个安全的路径段。
 *
 * 安全的 ASCII 码元保持原样；其他每个 UTF-16 码元都变成 `~XXXX`。`.` 和
 * `..` 会被整体转义，因此精心构造的 id 也无法造成目录穿越。
 *
 * @param {string} raw - 会话 id。
 * @returns {string} 转义后的单个路径段。
 */
export function encodeSegment(raw) {
  if (typeof raw !== 'string' || raw.length === 0) throw new TypeError('cannot encode an empty path segment')
  if (raw === '.') return '~002E'
  if (raw === '..') return '~002E~002E'
  let out = ''
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index)
    const character = String.fromCharCode(code)
    if (character !== '~' && /^[A-Za-z0-9._-]$/.test(character)) out += character
    else out += `~${code.toString(16).toUpperCase().padStart(4, '0')}`
  }
  return out
}

/**
 * 解析 harness 主目录。
 *
 * 优先使用 `DSH_HOME`（组合里 `dshHomePath()` 读取的同一个变量）；没有设置时
 * 回退到普通的 `<home>/.dsh`。把这段逻辑留在本地，可以避免从安装在 profile
 * 里的 bundle 去导入任何 Harness 包。
 *
 * @returns {string} harness 主目录的绝对路径。
 */
export function resolveDshHome() {
  const home = process.env.DSH_HOME
  return typeof home === 'string' && home.trim() !== '' ? home : join(homedir(), '.dsh')
}

/**
 * 解析当前配置的会话根目录。
 *
 * 优先使用 `DSH_REMOVE_SESSION_ROOT`；否则是 `<DSH_HOME>/sessions`。
 *
 * @returns {string} 会话根目录的绝对路径。
 */
export function resolveSessionsRoot() {
  const override = process.env.DSH_REMOVE_SESSION_ROOT
  if (typeof override === 'string' && override.trim() !== '') return override
  return join(resolveDshHome(), 'sessions')
}

/**
 * 找出某个会话在磁盘上拥有的所有目录。
 *
 * 后端按项目目录给会话分组，所以这里在每个项目目录下探测同一个转义 id，
 * 而不是根据会话启动时可能已经变化的工作目录去复刻项目目录名。
 *
 * @param {string} root - 会话根目录。
 * @param {string} sessionId - 要定位的会话。
 * @returns {Promise<string[]>} 会话目录的绝对路径。
 */
export async function findSessionDirectories(root, sessionId) {
  const encoded = encodeSegment(sessionId)
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch (error) {
    if (error && error.code === 'ENOENT') return []
    throw error
  }
  const found = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const candidate = join(root, entry.name, encoded)
    try {
      if ((await stat(candidate)).isDirectory()) found.push(candidate)
    } catch (error) {
      if (!error || error.code !== 'ENOENT') throw error
    }
  }
  return found
}

/**
 * 删除一个会话目录，以及后端存放在其中的所有内容。
 *
 * 重试用于扛过一次性的共享冲突；调用方仍然应该拒绝仍在运行的会话，因为
 * 文件一旦消失，已经打开的写句柄就无处可写了。
 *
 * @param {string} directory - 会话目录的绝对路径。
 * @returns {Promise<void>} 目录消失后 resolve。
 */
export async function removeSessionDirectory(directory) {
  await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 })
}

// #region 投影缓存孤儿

/**
 * 投影缓存域在 harness 主目录下的位置。
 *
 * `storage-json` 后端把 `session_projcache` 域按 `per-record` 布局存放：域名
 * 目录下的 `sessions/` 表目录里，每个会话一个 `<会话ID>.json` 检查点文档。
 * 这份文档是**纯派生数据**（fold shortcut），会话目录没了它就是无用文件。
 *
 * @returns {{unit: string, table: string}} 域目录名与表目录名。
 */
export const PROJECTION_CACHE_LAYOUT = Object.freeze({
  unit: 'session_projcache',
  table: 'sessions',
})

/**
 * 解析投影缓存表目录的绝对路径。
 *
 * @param {string} home - harness 主目录。
 * @returns {string} `<home>/storages/session_projcache/sessions`。
 */
export function resolveProjectionCacheDir(home) {
  return join(home, 'storages', PROJECTION_CACHE_LAYOUT.unit, PROJECTION_CACHE_LAYOUT.table)
}

/**
 * 扫一遍会话根目录，收集磁盘上还存在会话目录的所有会话 id。
 *
 * 只往下看两层（项目目录 → 会话目录），与 JSONL 后端的布局一致；项目目录名
 * 不参与判断，因此不依赖会话当初创建时的工作目录。
 *
 * **会话根目录本身不存在时抛错，而不是返回空集合**：空集合意味着“所有缓存
 * 都是孤儿”，而根目录读不到更可能是 `DSH_HOME` / 根目录配置指错了地方。
 * 调用方据此整体跳过清理——保留一份用不上的缓存，永远比误删一份有效缓存好。
 *
 * @param {string} root - 会话根目录。
 * @returns {Promise<Set<string>>} 磁盘上仍有目录的会话 id。
 * @throws {Error} 会话根目录不存在或不可读。
 */
export async function listStoredSessionIds(root) {
  const ids = new Set()
  const projects = await readdir(root, { withFileTypes: true })
  for (const project of projects) {
    if (!project.isDirectory()) continue
    let sessions
    try {
      sessions = await readdir(join(root, project.name), { withFileTypes: true })
    } catch (error) {
      if (error && error.code === 'ENOENT') continue
      throw error
    }
    for (const session of sessions) {
      if (session.isDirectory()) ids.add(session.name)
    }
  }
  return ids
}

/**
 * 找出投影缓存里那些“没有对应会话目录”的孤儿文档。
 *
 * 判定完全基于磁盘事实，并且故意保守：
 *
 * - 会话 id 从文件名反推（去掉 `.json`），与后端 `per-record` 的键一致；
<<<<<<< HEAD
 * - 这个目录就是 `session_projcache` 域的 `sessions` 表，所以凡是通过后端
 *   `per-record` 键校验（路径安全）的 `<key>.json` 都算候选；`global.json`、
 *   `.bak.*` 备份、`.deleting` 暂存名不动；
 * - 任何扫描错误都让本次清理整体跳过，而不是“看不见就当孤儿删掉”；
 * - 会话根读得到但**一个会话目录都没有**时同样跳过：布局搬家、根目录改名、
 *   `DSH_HOME` 指错都长这样，而它的后果是把整份缓存当孤儿清空。
=======
 * - 只把**形状像会话 id** 的文件当作候选（`session-…`，或至少包含一个连字符
 *   的普通键），其余文件（`global.json`、备份、未知版本残留）一律不动；
 * - 任何扫描错误都让本次清理整体跳过，而不是“看不见就当孤儿删掉”。
>>>>>>> origin/main
 *
 * @param {object} options - 扫描参数。
 * @param {string} options.root - 会话根目录。
 * @param {string} options.cacheDir - 投影缓存表目录。
 * @param {Set<string>} [options.keep] - 额外要保留的会话 id（例如内存里 live 的会话）。
<<<<<<< HEAD
 * @returns {Promise<{cacheDir: string, scanned: number, orphans: string[], skipped?: string}>} 扫描结果；`skipped` 说明本次为何一只未删。
=======
 * @returns {Promise<{cacheDir: string, scanned: number, orphans: string[]}>} 扫描结果。
>>>>>>> origin/main
 * @throws {Error} 会话根目录读不到时抛出，调用方据此跳过整次清理。
 */
export async function findOrphanProjectionCacheFiles({root, cacheDir, keep}) {
  let entries
  try {
    entries = await readdir(cacheDir, { withFileTypes: true })
  } catch (error) {
    if (error && error.code === 'ENOENT') return {cacheDir, scanned: 0, orphans: []}
    throw error
  }
  // 先拿到磁盘上的会话集合；这一步读不到会话根就抛错，调用方据此跳过清理。
  const stored = await listStoredSessionIds(root)
  const retained = keep instanceof Set ? keep : new Set(Array.isArray(keep) ? keep : [])
<<<<<<< HEAD
  const candidates = []
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const key = projectionCacheKey(entry.name)
    if (key !== undefined) candidates.push({key, name: entry.name})
  }
  // 有缓存文档却一个会话目录都扫不到 —— 这是配置指错地方的形状，不是“会话全没了”。
  if (stored.size === 0 && candidates.length > 0) {
    return {
      cacheDir,
      scanned: candidates.length,
      orphans: [],
      skipped: 'the sessions root holds no session directory; refusing to treat every cache file as an orphan',
    }
  }
  const orphans = []
  for (const candidate of candidates) {
    // 能通过 `projectionCacheKey` 的键只含 `[A-Za-z0-9_-]`，这些字符
    // `encodeSegment` 原样保留，所以缓存键与磁盘目录名总是同一个字符串。
    if (stored.has(candidate.key) || retained.has(candidate.key)) continue
    orphans.push(join(cacheDir, candidate.name))
  }
  orphans.sort()
  return {cacheDir, scanned: candidates.length, orphans}
=======
  const orphans = []
  let scanned = 0
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const key = projectionCacheKey(entry.name)
    if (key === undefined) continue
    scanned += 1
    if (stored.has(key) || retained.has(key)) continue
    orphans.push(join(cacheDir, entry.name))
  }
  orphans.sort()
  return {cacheDir, scanned, orphans}
>>>>>>> origin/main
}

/**
 * 从投影缓存的文档文件名反推会话 id。
 *
<<<<<<< HEAD
 * 这个目录**就是** `session_projcache` 域的 `sessions` 表，所以凡是通过后端
 * `per-record` 键校验（路径安全）的 `<key>.json`，其键必然是一个 Session.id。
 * 保留的例外只有：`global.json`（域全局槽），以及不以 `.json` 结尾的文件
 * （`.deleting` 暂存名、`<key>.json.bak.<时间戳>` 备份）——它们根本走不到这里。
 *
=======
>>>>>>> origin/main
 * @param {string} name - 文件名（含 `.json`）。
 * @returns {string | undefined} 会话 id；不是候选文档时返回 `undefined`。
 */
export function projectionCacheKey(name) {
  if (!name.endsWith('.json')) return undefined
  const key = name.slice(0, -'.json'.length)
  if (key === '' || key === 'global') return undefined
  // 后端要求 per-record 键是路径安全的 `[a-zA-Z0-9_-]+`；不符合的原样跳过。
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) return undefined
<<<<<<< HEAD
=======
  if (!key.includes('-')) return undefined
>>>>>>> origin/main
  return key
}

/**
 * 删除孤儿投影缓存文档，返回真正删掉的路径。
 *
 * 删除是逐个文件的：不删目录、不递归，也不碰任何没被判为孤儿的文档。
 *
 * @param {string[]} files - 要删除的文档绝对路径。
 * @returns {Promise<{removed: string[], failed: Array<{path: string, error: string}>}>} 删除结果。
 */
export async function removeProjectionCacheFiles(files) {
  const removed = []
  const failed = []
  for (const file of files) {
    try {
      await rm(file, {force: true, maxRetries: 5, retryDelay: 120})
      removed.push(file)
    } catch (error) {
      failed.push({path: file, error: error instanceof Error ? error.message : String(error)})
    }
  }
  return {removed, failed}
}

/**
 * 清理一批孤儿投影缓存文档：先扫描，再删除。
 *
 * @param {object} options - 参数。
 * @param {string} options.root - 会话根目录。
 * @param {string} options.cacheDir - 投影缓存表目录。
 * @param {Set<string>} [options.keep] - 额外要保留的会话 id。
<<<<<<< HEAD
 * @returns {Promise<{cacheDir: string, scanned: number, orphans: string[], removed: string[], failed: Array<{path: string, error: string}>, skipped?: string}>} 清理结果；`skipped` 表示扫描阶段已决定不动手。
 */
export async function sweepProjectionCache({root, cacheDir, keep}) {
  const {scanned, orphans, skipped} = await findOrphanProjectionCacheFiles({root, cacheDir, keep})
  const {removed, failed} = await removeProjectionCacheFiles(orphans)
  return skipped === undefined
    ? {cacheDir, scanned, orphans, removed, failed}
    : {cacheDir, scanned, orphans, removed, failed, skipped}
=======
 * @returns {Promise<{cacheDir: string, scanned: number, orphans: string[], removed: string[], failed: Array<{path: string, error: string}>}>} 清理结果。
 */
export async function sweepProjectionCache({root, cacheDir, keep}) {
  const {scanned, orphans} = await findOrphanProjectionCacheFiles({root, cacheDir, keep})
  const {removed, failed} = await removeProjectionCacheFiles(orphans)
  return {cacheDir, scanned, orphans, removed, failed}
>>>>>>> origin/main
}

// #endregion
