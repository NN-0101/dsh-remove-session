/**
 * dsh-remove-session —— Host 半边。
 *
 * 对外暴露一个同源 HTTP 接口，用于永久删除一个会话：会话根目录下的 JSONL
 * 日志目录、它在 Workspace 中的归属记录，以及它的置顶/归档成员关系。官方
 * 侧栏本身没有“删除会话”能力，所以本 bundle 自己完成这一步破坏性文件操作，
 * 再让 Workspace registry 忘掉该会话；Client 半边负责把这一行从实时列表中
 * 移除。
 *
 * 安全规则：
 * - 会话的 Agent 正在运行时拒绝删除；
 * - `workspace/session-activity` 报告仍有进行中的工作时拒绝删除；
 * - 删除文件前先 flush 尚未落盘的写入；
 * - 只删除精确匹配的、已转义的会话目录；附件和其他内容寻址存储保持不动。
 *
 * @module dsh-remove-session
 */

import {findSessionDirectories, removeSessionDirectory, resolveSessionsRoot} from './host/session-files.js'

/** 本 bundle 独占的 HTTP 路由前缀。 */
const ROUTE_PREFIX = '/plugin/dsh-remove-session'

/** 本插件激活所必需的 Host 服务。 */
export const inject = ['webServer']

/**
 * 安装删除相关的 HTTP 接口。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host 插件上下文。
 * @returns {void}
 */
export function apply(ctx) {
    const root = resolveSessionsRoot()
    ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/delete`,
        handler: (request, response) => handleDelete(ctx, root, request, response),
    }), 'dsh-remove-session: delete route')
    ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: `${ROUTE_PREFIX}/inspect`,
        handler: (request, response) => handleInspect(ctx, root, request, response),
    }), 'dsh-remove-session: inspect route')
}

// #region HTTP 接口

/**
 * 输出一个 JSON 响应。
 *
 * @param {import('node:http').ServerResponse} response - 正在构造的响应。
 * @param {number} status - HTTP 状态码。
 * @param {unknown} value - 可 JSON 序列化的响应体。
 * @returns {void}
 */
function sendJson(response, status, value) {
    if (response.writableEnded) return
    const body = JSON.stringify(value)
    response.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'content-length': Buffer.byteLength(body),
    })
    response.end(body)
}

/**
 * 通过比较 Origin 与 Host 请求头拒绝跨源请求。
 *
 * 没有 Origin 头的请求（curl、原生客户端）会被放行：监听地址绑定在回环上，
 * 而且这个破坏性动作仍然要求 JSON POST 请求体；浏览器发起该请求时一定会
 * 带上 Origin。
 *
 * @param {import('node:http').IncomingMessage} request - 收到的请求。
 * @returns {boolean} 是否允许该请求执行操作。
 */
function sameOrigin(request) {
    const origin = request.headers.origin
    if (typeof origin !== 'string' || origin === '') return true
    const host = request.headers.host
    if (typeof host !== 'string' || host === '') return false
    try {
        return new URL(origin).host === host
    } catch {
        return false
    }
}

/**
 * 读取并解析有大小上限的 JSON 请求体。
 *
 * @param {import('node:http').IncomingMessage} request - 收到的请求。
 * @param {number} limit - 请求体最大字节数。
 * @returns {Promise<Record<string, unknown>>} 解析后的 JSON 对象；空请求体返回空对象。
 */
async function readJsonBody(request, limit = 64 * 1024) {
    const chunks = []
    let size = 0
    for await (const chunk of request) {
        size += chunk.length
        if (size > limit) throw new Error(`request body exceeds ${String(limit)} bytes`)
        chunks.push(chunk)
    }
    const text = Buffer.concat(chunks).toString('utf8').trim()
    if (text === '') return {}
    const parsed = JSON.parse(text)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

/**
 * 处理 `POST /plugin/dsh-remove-session/delete`。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host 插件上下文。
 * @param {string} root - 会话根目录。
 * @param {import('node:http').IncomingMessage} request - 收到的请求。
 * @param {import('node:http').ServerResponse} response - 由本函数负责完成的响应。
 * @returns {Promise<void>} 响应写完后 resolve。
 */
async function handleDelete(ctx, root, request, response) {
    if (request.method !== 'POST') {
        sendJson(response, 405, {ok: false, error: {code: 'method-not-allowed', message: 'POST required'}})
        return
    }
    if (!sameOrigin(request)) {
        sendJson(response, 403, {ok: false, error: {code: 'forbidden', message: 'cross-origin request refused'}})
        return
    }
    let body
    try {
        body = await readJsonBody(request)
    } catch (error) {
        sendJson(response, 400, {ok: false, error: {code: 'bad-request', message: messageOf(error)}})
        return
    }
    const sessionId = body.sessionId
    if (typeof sessionId !== 'string' || sessionId.trim() === '' || sessionId.length > 512) {
        sendJson(response, 400, {
            ok: false,
            error: {code: 'bad-request', message: 'sessionId must be a non-empty string'}
        })
        return
    }
    try {
        const failure = await deleteSession(ctx, root, sessionId)
        if (failure !== undefined) {
            sendJson(response, 200, {ok: false, error: failure})
            return
        }
        sendJson(response, 200, {ok: true})
    } catch (error) {
        ctx.logger?.warn?.(`dsh-remove-session: deleting "${sessionId}" failed: ${messageOf(error)}`)
        sendJson(response, 200, {
            ok: false,
            error: {code: 'delete-failed', detail: messageOf(error)},
        })
    }
}

/**
 * 处理 `GET /plugin/dsh-remove-session/inspect`。
 *
 * 仅供本 bundle 验证步骤使用的只读诊断：报告会话是否处于 live 状态、它的
 * 磁盘目录在哪里，以及 Workspace registry 如何记账。它不会读取日志内容。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host 插件上下文。
 * @param {string} root - 会话根目录。
 * @param {import('node:http').IncomingMessage} request - 收到的请求。
 * @param {import('node:http').ServerResponse} response - 由本函数负责完成的响应。
 * @returns {Promise<void>} 响应写完后 resolve。
 */
async function handleInspect(ctx, root, request, response) {
    if (request.method !== 'GET') {
        sendJson(response, 405, {ok: false, error: {code: 'method-not-allowed', message: 'GET required'}})
        return
    }
    if (!sameOrigin(request)) {
        sendJson(response, 403, {ok: false, error: {code: 'forbidden', message: 'cross-origin request refused'}})
        return
    }
    const url = new URL(request.url ?? '/', 'http://localhost')
    const sessionId = url.searchParams.get('sessionId') ?? undefined
    const sessions = ctx.get('sessions')
    const agents = ctx.get('agents')
    const registry = ctx.get('workspaceRegistry')
    const liveSessionIds = (sessions?.list?.() ?? []).map((session) => String(session.id))
    const agentIds = (agents?.list?.() ?? []).map((agent) => String(agent.id))
    const payload = {
        ok: true,
        version: '0.1.1',
        root,
        liveSessionIds,
        agentIds,
    }
    if (sessionId !== undefined && sessionId !== '') {
        let directories = []
        let directoryError
        try {
            directories = await findSessionDirectories(root, sessionId)
        } catch (error) {
            directoryError = messageOf(error)
        }
        payload.session = {
            id: sessionId,
            live: liveSessionIds.includes(sessionId) || agentIds.includes(sessionId),
            directories,
            archived: Array.isArray(registry?.archivedSessionIds) && registry.archivedSessionIds.includes(sessionId),
            pinned: Array.isArray(registry?.pinnedSessionIds) && registry.pinnedSessionIds.includes(sessionId),
            workspaces: (registry?.list?.() ?? [])
                .filter((workspace) => Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(sessionId))
                .map((workspace) => String(workspace.id)),
            ...directoryError === undefined ? {} : {directoryError},
        }
    }
    sendJson(response, 200, payload)
}

// #endregion

// #region 删除

/**
 * 删除一个会话：成功时 resolve 为 `undefined`，失败时 resolve 为稳定的失败描述。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host 插件上下文。
 * @param {string} root - 会话根目录。
 * @param {string} sessionId - 待删除的会话。
 * @returns {Promise<undefined | { code: string, detail?: string }>} 失败描述。
 */
async function deleteSession(ctx, root, sessionId) {
    const agents = ctx.get('agents')
    const agent = agents?.get?.(sessionId)
    if (agent !== undefined && agent.status === 'running') return {code: 'session-running'}

    const persistence = ctx.get('sessionPersistence')
    if (persistence === undefined) return {code: 'unsupported'}

    const directories = await findSessionDirectories(root, sessionId)
    if (directories.length === 0 && ctx.get('sessions')?.get?.(sessionId) !== undefined) {
        // 没有落盘日志的 live 会话，是尚未实际写入的空白“新会话”，它的 pending
        // 记录只存在于当前进程内存里；此时没有文件可删，删了也会在列表里重新出现，
        // 所以直接拒绝，而不是假装删除成功。
        return {code: 'session-in-use'}
    }

    if (typeof persistence.stat === 'function') {
        try {
            await persistence.stat(sessionId)
        } catch (error) {
            // 头部损坏不应阻止删除它的物理文件。
            ctx.logger?.warn?.(`dsh-remove-session: cannot stat "${sessionId}": ${messageOf(error)}`)
        }
    }

    const activity = await sessionActivity(ctx, sessionId)
    if (activity.length > 0) return {code: 'session-active', detail: activity.map(describeActivity).join(', ')}

    if (typeof persistence.flush === 'function') {
        try {
            await persistence.flush()
        } catch (error) {
            ctx.logger?.warn?.(`dsh-remove-session: flushing before deleting "${sessionId}" failed: ${messageOf(error)}`)
        }
    }

    for (const directory of directories) await removeSessionDirectory(directory)

    await forgetInWorkspaces(ctx, sessionId)
    try {
        ctx.emit('api-session/removed', sessionId)
    } catch (error) {
        ctx.logger?.warn?.(`dsh-remove-session: announcing removal of "${sessionId}" failed: ${messageOf(error)}`)
    }
    return undefined
}

/**
 * 询问已组合的提供方：该会话还有哪些工作正在进行。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host 插件上下文。
 * @param {string} sessionId - 要检查的会话。
 * @returns {Promise<Array<{ kind?: string, items?: Array<{ label?: string, id?: string }> }>>} 进行中的工作条目。
 */
async function sessionActivity(ctx, sessionId) {
    if (typeof ctx.waterfall !== 'function') return []
    const activity = await ctx.waterfall('workspace/session-activity', {sessionId}, () => Promise.resolve([]))
    return Array.isArray(activity) ? activity : []
}

/**
 * 把一个工作条目渲染成简短的诊断文本。
 *
 * @param {{ kind?: string, items?: Array<{ label?: string, id?: string }> }} entry - 工作条目。
 * @returns {string} 类型和条目数量。
 */
function describeActivity(entry) {
    const kind = typeof entry?.kind === 'string' ? entry.kind : 'activity'
    const count = Array.isArray(entry?.items) ? entry.items.length : 0
    return `${kind} (${String(count)})`
}

/**
 * 把会话从 Workspace 归属、置顶集合和归档集合中移除。
 *
 * `detachSession` 在 `@deepseek-ai/dsh-workspace` 里是包内私有方法，只在运行
 * 中的实体确实暴露它时才调用。实现缺失时会留下一个记录中的 id，日志删除后
 * registry 会把它过滤掉；因此清理失败只记日志，不升级为删除失败。
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host 插件上下文。
 * @param {string} sessionId - 已删除的会话。
 * @returns {Promise<void>} 尽力清理完成后 resolve。
 */
async function forgetInWorkspaces(ctx, sessionId) {
    const registry = ctx.get('workspaceRegistry')
    if (registry === undefined) return
    try {
        if (Array.isArray(registry.archivedSessionIds) && registry.archivedSessionIds.includes(sessionId)) {
            await registry.unarchiveSession(sessionId)
        }
    } catch (error) {
        ctx.logger?.warn?.(`dsh-remove-session: unarchiving "${sessionId}" failed: ${messageOf(error)}`)
    }
    try {
        if (Array.isArray(registry.pinnedSessionIds) && registry.pinnedSessionIds.includes(sessionId)) {
            await registry.unpinSession(sessionId)
        }
    } catch (error) {
        ctx.logger?.warn?.(`dsh-remove-session: unpinning "${sessionId}" failed: ${messageOf(error)}`)
    }
    let workspaces
    try {
        workspaces = registry.list()
    } catch (error) {
        ctx.logger?.warn?.(`dsh-remove-session: listing Workspaces failed: ${messageOf(error)}`)
        return
    }
    for (const workspace of workspaces) {
        try {
            if (!Array.isArray(workspace.sessionIds) || !workspace.sessionIds.includes(sessionId)) continue
            if (typeof workspace.detachSession !== 'function') continue
            await workspace.detachSession(sessionId)
        } catch (error) {
            ctx.logger?.warn?.(`dsh-remove-session: detaching "${sessionId}" from a Workspace failed: ${messageOf(error)}`)
        }
    }
}

/**
 * 从任意抛出值中读取人类可读的错误信息。
 *
 * @param {unknown} error - 抛出的值。
 * @returns {string} 错误文本。
 */
function messageOf(error) {
    return error instanceof Error ? error.message : String(error)
}

// #endregion
