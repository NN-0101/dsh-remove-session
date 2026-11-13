// 用最小化的假 Context 验证删除流程的顺序与结果。
// 运行：node --test test/
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { encodeSegment } from '../host/session-files.js'
import * as mod from '../index.js'

/** 建一个临时会话根，可选地含一个项目的会话目录。 */
async function makeRoot(sessionId, cwd = 'C:\\proj') {
  const root = await mkdtemp(join(tmpdir(), 'drs-'))
  if (sessionId !== undefined) {
    const dir = join(root, '--proj--', encodeSegment(sessionId))
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'session.v4.jsonl.zstd'), 'x')
  }
  return root
}

/** 记录调用顺序的假 Host 上下文。 */
function makeContext(options = {}) {
  const calls = []
  const store = new Map()
  const id = options.sessionId
  const session = id === undefined ? undefined : { id, header: { id, cwd: 'C:\\proj' } }
  if (session !== undefined && options.live !== false) {
    store.set(id, {
      id,
      session,
      // 与真实 detachEntered() 一致：删表项 + 发出配对的 session/disposed。
      detach: () => {
        calls.push('detach')
        store.delete(id)
        calls.push('emit:session/disposed')
      },
    })
  }
  const agents = new Map()
  if (id !== undefined && options.running === true) agents.set(id, { id, status: 'running', session })

  const persistence = {
    identity: Symbol('persistence'),
    async stat() { return undefined },
    async flush() { calls.push('flush') },
    async list() { return store.has(id) ? [{ header: { id } }] : [] },
  }
  const registry = {
    archivedSessionIds: [],
    pinnedSessionIds: [],
    list: () => [{ id: 'w1', sessionIds: [id], detachSession: async () => { calls.push('detachSession') } }],
    async unarchiveSession() {},
    async unpinSession() {},
  }

  const ctx = {
    logger: { warn() {}, error() {} },
    emit(name) { calls.push(`emit:${name}`) },
    async waterfall() { return [] },
    effect: (factory) => factory(),
    webServer: { register: () => () => {} },
    get(name) {
      if (name === 'sessions') {
        return {
          store,
          list: () => [...store.values()].map((entry) => entry.session),
          get: (candidate) => store.get(candidate)?.session,
        }
      }
      if (name === 'agents') {
        return { get: (candidate) => agents.get(candidate), list: () => [...agents.values()] }
      }
      if (name === 'sessionPersistence') return persistence
      if (name === 'workspaceRegistry') return registry
      return undefined
    },
  }
  return { ctx, calls, store }
}

/**
 * 通过插件注册的假路由调用 Host 的删除处理器。
 * @param ctx - 假 Host 上下文。
 * @param root - 会话根目录。
 * @param sessionId - 要删除的会话。
 */
async function callDelete(ctx, root, sessionId) {
  let handler
  const previous = process.env.DSH_REMOVE_SESSION_ROOT
  process.env.DSH_REMOVE_SESSION_ROOT = root
  try {
    mod.apply({
      ...ctx,
      webServer: {
        register(spec) {
          if (spec.path.endsWith('/delete')) handler = spec.handler
          return () => {}
        },
      },
    })
  } finally {
    if (previous === undefined) delete process.env.DSH_REMOVE_SESSION_ROOT
    else process.env.DSH_REMOVE_SESSION_ROOT = previous
  }
  assert.ok(handler !== undefined, '删除路由没有注册')

  const request = {
    method: 'POST',
    headers: { host: '127.0.0.1:1' },
    url: '/plugin/dsh-remove-session/delete',
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(JSON.stringify({ sessionId }))
    },
  }
  let payload
  const response = {
    writableEnded: false,
    writeHead() {},
    end(body) { payload = body; this.writableEnded = true },
  }
  await handler(request, response)
  return JSON.parse(payload)
}

test('先摘内存、再删目录、清归属', async () => {
  const id = 'session-flow'
  const root = await makeRoot(id)
  const { ctx, calls, store } = makeContext({ sessionId: id })
  try {
    const response = await callDelete(ctx, root, id)
    assert.equal(response.ok, true, JSON.stringify(response))
    assert.deepEqual(calls.slice(0, 2), ['flush', 'detach'], `顺序错误: ${calls.join(',')}`)
    assert.equal(store.has(id), false, '内存里仍然有该会话')
    assert.deepEqual(await readdir(join(root, '--proj--')), [], '目录未删除')
    assert.ok(calls.includes('emit:session/disposed'), '没有触发 session/disposed')
    assert.ok(
      calls.indexOf('emit:session/disposed') < calls.indexOf('detachSession'),
      '先清归属再摘内存',
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('幽灵会话（内存 live、磁盘无目录）可以被删掉', async () => {
  const id = 'session-ghost'
  const root = await makeRoot(undefined)
  const { ctx, calls, store } = makeContext({ sessionId: id })
  try {
    const response = await callDelete(ctx, root, id)
    assert.equal(response.ok, true, `幽灵会话仍被拒绝: ${JSON.stringify(response)}`)
    assert.equal(store.has(id), false, '内存里仍然有该会话')
    assert.ok(!calls.includes('flush'), '无目录时不应 flush（会 materialize 出新目录）')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('正在运行的会话被拒绝，且不做任何改动', async () => {
  const id = 'session-running'
  const root = await makeRoot(id)
  const { ctx, calls, store } = makeContext({ sessionId: id, running: true })
  try {
    const response = await callDelete(ctx, root, id)
    assert.equal(response.ok, false)
    assert.equal(response.error.code, 'session-running')
    assert.equal(store.has(id), true, '运行中的会话被摘掉了')
    assert.deepEqual(calls, [], `不应发生任何副作用: ${calls.join(',')}`)
    assert.deepEqual(await readdir(join(root, '--proj--')), [id])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('不存在的会话按幂等成功处理', async () => {
  const root = await makeRoot(undefined)
  const { ctx, calls } = makeContext({ sessionId: undefined })
  try {
    const response = await callDelete(ctx, root, 'session-none')
    assert.equal(response.ok, true, JSON.stringify(response))
    assert.ok(!calls.includes('detach'), '不存在的会话不应摘除')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('只删自己的目录，兄弟会话保留', async () => {
  const id = 'session-target'
  const root = await makeRoot(id)
  const sibling = join(root, '--proj--', encodeSegment('session-sibling'))
  await mkdir(sibling, { recursive: true })
  const { ctx } = makeContext({ sessionId: id })
  try {
    await callDelete(ctx, root, id)
    assert.deepEqual(await readdir(join(root, '--proj--')), [encodeSegment('session-sibling')])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
