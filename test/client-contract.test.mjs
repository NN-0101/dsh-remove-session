// Client 半边的静态回归测试。
//
// client.js 是浏览器 bundle（依赖 window.__ModuleLoader__ 与 React），不能直接
// 在 Node 里执行；这里只锁定这次修复的关键约束，避免以后又改回“删除前先
// 新建会话”的写法。
//
// 运行：node --test "test/*.test.mjs"
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')

/** 取出 deleteSession 函数体，用于检查内部顺序。 */
function deleteSessionBody(text) {
  const start = text.indexOf('async function deleteSession(')
  assert.notEqual(start, -1, '找不到 deleteSession 函数')
  const end = text.indexOf('\n    }', start)
  assert.notEqual(end, -1, '找不到 deleteSession 结束位置')
  return text.slice(start, end)
}

test('删除流程不再调用 startSession（它会新建会话）', () => {
  const body = deleteSessionBody(source)
  assert.ok(
    !body.includes('startSession'),
    'deleteSession 里不应出现 startSession：该 API 经 connectBlank() 会真正新建一个空白会话',
  )
})

test('删除成功后才导航，且用 clearMain', () => {
  const body = deleteSessionBody(source)
  const call = body.indexOf('callDeleteEndpoint(')
  const clear = body.indexOf('clearMain(')
  assert.notEqual(call, -1, 'deleteSession 应调用 Host 删除接口')
  assert.notEqual(clear, -1, '删除成功后应调用 clearMain() 离开主视图')
  assert.ok(
    call < clear,
    '必须先请求 Host 删除、确认成功后才导航；否则删除被拒绝时也会改动界面',
  )
})

test('uiWorkspace 已加入 inject，确保服务可解析', () => {
  assert.ok(
    /inject:\s*\[[^\]]*'uiWorkspace'/.test(source),
    'client inject 列表需要包含 uiWorkspace',
  )
})
