/**
 * dsh-remove-session Host 半边的文件系统辅助函数。
 *
 * JSONL 会话后端拥有磁盘布局，却没有提供删除 API，所以本插件复刻了该布局中
 * 唯一稳定的部分：一个会话位于以其路径编码 id 命名的目录中，目录挂在一个
 * 人类可读的项目目录下。下面的 `encodeSegment` 与后端在接触文件系统前使用的
 * 转义完全相同（单射）；项目目录名没有复刻，因为只要扫描根目录下的各个项目
 * 目录，用会话 id 就足以定位它。
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
 * 解析当前配置的会话根目录。
 *
 * 优先使用 `DSH_REMOVE_SESSION_ROOT`；其次用 `DSH_HOME`（JSONL 后端组合时
 * 使用的 harness 主目录）；最后回退到普通的 `<home>/.dsh`。把这段逻辑留在
 * 本地，可以避免从安装在 profile 里的 bundle 去导入任何 Harness 包。
 *
 * @returns {string} 会话根目录的绝对路径。
 */
export function resolveSessionsRoot() {
  const override = process.env.DSH_REMOVE_SESSION_ROOT
  if (typeof override === 'string' && override.trim() !== '') return override
  const home = process.env.DSH_HOME
  const base = typeof home === 'string' && home.trim() !== '' ? home : join(homedir(), '.dsh')
  return join(base, 'sessions')
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
