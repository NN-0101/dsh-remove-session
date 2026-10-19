window.__ModuleLoader__.load({
  id: 'dsh-remove-session',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** 本 bundle 独占的 locale 命名空间。 */
    const NS = 'dsh-remove-session'
    /** 由本 bundle 的 Host 半边安装的删除接口。 */
    const DELETE_ENDPOINT = '/plugin/dsh-remove-session/delete'
    /** 插件图标（icon.svg）的 base64 data URL，由 `npm run sync-icon` 生成，菜单行复用它绘制删除图标。 */
    const ICON_DATA_URL = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzkyMzk1ODAzMzYzIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjU2MTMiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTM1OC45MjU2NzIgNTk2LjgxNDY4OHYzMC40NTA1MjJjMCAxNy4yNDg4NDkgMTMuOTg1NTI2IDMxLjIzMzM1MiAzMS4yMzMzNTIgMzEuMjMzMzUyIDE3LjI0ODg0OSAwIDMxLjIzMzM1Mi0xMy45ODU1MjYgMzEuMjMzMzUyLTMxLjIzMzM1MnYtMzAuNDUwNTIyYzAtMTcuMjQ4ODQ5LTEzLjk4NTUyNi0zMS4yMzMzNTItMzEuMjMzMzUyLTMxLjIzMzM1Mi0xNy4yNDg4NDkgMC0zMS4yMzMzNTIgMTMuOTg1NTI2LTMxLjIzMzM1MiAzMS4yMzMzNTJ6TTYwMi41MDYzMTcgNTk2LjgxNDY4OHYzMC40NTA1MjJjMCAxNy4yNDg4NDkgMTMuOTg1NTI2IDMxLjIzMzM1MiAzMS4yMzMzNTIgMzEuMjMzMzUyczMxLjIzMzM1Mi0xMy45ODU1MjYgMzEuMjMzMzUxLTMxLjIzMzM1MnYtMzAuNDUwNTIyYzAtMTcuMjQ4ODQ5LTEzLjk4NDUwMy0zMS4yMzMzNTItMzEuMjMzMzUxLTMxLjIzMzM1MnMtMzEuMjMzMzUyIDEzLjk4NTUyNi0zMS4yMzMzNTIgMzEuMjMzMzUyek00MzcuMDQ3OTM3IDY5OS42ODY2MzZjLTE0LjY1MDY3NSA5LjEwNDM1NS0xOS4xNTUyNjkgMjguMzYwOTMxLTEwLjA0OTg5IDQzLjAxMjYzIDExLjAxNTg5MSAxNy43MzE4NSA0MS4yMzgyMTYgNDcuNzQwMzA0IDg0LjY1MTk4MiA0Ny43NDAzMDQgNDMuMTk1ODAxIDAgNzMuNzkzNjgtMjkuNzgwMjU3IDg1LjA1OTI1OC00Ny4zNzkwNzcgOS4yMTY5MTktMTQuMzkxNzc4IDUuMDMyNjItMzMuMzM4MjkzLTkuMjM3Mzg1LTQyLjc0MjQ3Ny0xNC4yNzAwMDUtOS4zOTM5NTEtMzMuNTc2NzIzLTUuNDA5MTk3LTQzLjE1OTk4NSA4LjczOTAzNS0wLjEyNjg5IDAuMTg4Mjg4LTEzLjA0OTIwMSAxOC45MTU4MTUtMzIuNjYxODg4IDE4LjkxNTgxNS0xOS4wMjgzNzkgMC0zMC45Mzg2NC0xNy4yNzQ0MzItMzEuNzcyNjM0LTE4LjUzMDAyOC05LjE3NTk4Ny0xNC40MTIyNDQtMjguMjU5NjI0LTE4Ljc4ODkyNS00Mi44Mjk0NTgtOS43NTYyMDJ6TTkwNy41NzY0MDcgMTYwLjA4Mjk1Mkg2OTkuMzUyMDE1di0yNi44ODIyNTRjMC00MC4xNDUzMjUtMzIuNjkyNTg2LTcyLjgwNzIxMy03Mi44Nzg4NDQtNzIuODA3MjEzaC0yMjkuMDQ2NjI2Yy00MC4xODYyNTggMC03Mi44Nzg4NDQgMzIuNjYxODg3LTcyLjg3ODg0NCA3Mi44MDcyMTN2MjYuODgyMjU0SDExNi4zMjMzMDljLTE3LjI0ODg0OSAwLTMxLjIzMzM1MiAxMy45ODQ1MDMtMzEuMjMzMzUyIDMxLjIzMzM1MnMxMy45ODQ1MDMgMzEuMjMzMzUyIDMxLjIzMzM1MiAzMS4yMzMzNTFoNzkxLjI1MzA5OGMxNy4yNDg4NDkgMCAzMS4yMzMzNTItMTMuOTg0NTAzIDMxLjIzMzM1Mi0zMS4yMzMzNTFzLTEzLjk4NTUyNi0zMS4yMzMzNTItMzEuMjMzMzUyLTMxLjIzMzM1MnogbS0yNzAuNjkyMTE5IDBIMzg3LjAxNDQwNHYtMjYuODgyMjU0YzAtNS42MDc3MTggNC43Njg2MDctMTAuMzQwNTA5IDEwLjQxMTExNy0xMC4zNDA1MDloMjI5LjA0NjYyN2M1LjY0MjUxIDAgMTAuNDExMTE3IDQuNzMyNzkxIDEwLjQxMTExNyAxMC4zNDA1MDl2MjYuODgyMjU0eiIgZmlsbD0iIzk5OTk5OSIgcC1pZD0iNTYxNCI+PC9wYXRoPjxwYXRoIGQ9Ik04MjQuMjg2NDQ2IDI1OS4yNzkxODVjLTE3LjI0ODg0OSAwLTMxLjIzMzM1MiAxMy45ODQ1MDMtMzEuMjMzMzUyIDMxLjIzMzM1MnY1MzAuMDcyNjFjMCA0MC4wODkwNDQtMzIuNjkyNTg2IDcyLjcwNTkwNS03Mi44Nzg4NDQgNzIuNzA1OTA2SDMwMy43MjU0NjZjLTQwLjE4NjI1OCAwLTcyLjg3ODg0NC0zMi42MTY4NjItNzIuODc4ODQ0LTcyLjcwNTkwNnYtNTMwLjA3MjYxYzAtMTcuMjQ4ODQ5LTEzLjk4NDUwMy0zMS4yMzMzNTItMzEuMjMzMzUyLTMxLjIzMzM1MnMtMzEuMjMzMzUyIDEzLjk4NDUwMy0zMS4yMzMzNTIgMzEuMjMzMzUydjUzMC4wNzI2MWMwIDc0LjUzNTU3NyA2MC43MTM3OCAxMzUuMTcyNjA5IDEzNS4zNDU1NDggMTM1LjE3MjYwOWg0MTYuNDQ4Nzg0Yzc0LjYzMjc5MSAwIDEzNS4zNDU1NDgtNjAuNjM3MDMyIDEzNS4zNDU1NDgtMTM1LjE3MjYwOXYtNTMwLjA3MjYxYzAtMTcuMjQ4ODQ5LTEzLjk4NDUwMy0zMS4yMzMzNTItMzEuMjMzMzUyLTMxLjIzMzM1MnoiIGZpbGw9IiM5OTk5OTkiIHAtaWQ9IjU2MTUiPjwvcGF0aD48cGF0aCBkPSJNMzU1Ljc4MTA1MiAyNTkuMjc5MTg1Yy0xNy4yNDg4NDkgMC0zMS4yMzMzNTIgMTMuOTg0NTAzLTMxLjIzMzM1MSAzMS4yMzMzNTJ2MTY3LjQ5NDc1OGMwIDE3LjI0ODg0OSAxMy45ODU1MjYgMzEuMjMzMzUyIDMxLjIzMzM1MSAzMS4yMzMzNTIgMTcuMjQ4ODQ5IDAgMzEuMjMzMzUyLTEzLjk4NTUyNiAzMS4yMzMzNTItMzEuMjMzMzUydi0xNjcuNDk0NzU4YzAtMTcuMjQ4ODQ5LTEzLjk4NDUwMy0zMS4yMzMzNTItMzEuMjMzMzUyLTMxLjIzMzM1MnpNNjk5LjM1MjAxNSA0NTguMDA3Mjk1di0xNjcuNDk0NzU4YzAtMTcuMjQ4ODQ5LTEzLjk4NDUwMy0zMS4yMzMzNTItMzEuMjMzMzUxLTMxLjIzMzM1MnMtMzEuMjMzMzUyIDEzLjk4NDUwMy0zMS4yMzMzNTIgMzEuMjMzMzUydjE2Ny40OTQ3NThjMCAxNy4yNDg4NDkgMTMuOTg1NTI2IDMxLjIzMzM1MiAzMS4yMzMzNTIgMzEuMjMzMzUyczMxLjIzMzM1Mi0xMy45ODQ1MDMgMzEuMjMzMzUxLTMxLjIzMzM1MnpNNTExLjk0OTg1OCA0ODkuMjQwNjQ3YzE3LjI0ODg0OSAwIDMxLjIzMzM1Mi0xMy45ODU1MjYgMzEuMjMzMzUyLTMxLjIzMzM1MnYtMTY3LjQ5NDc1OGMwLTE3LjI0ODg0OS0xMy45ODU1MjYtMzEuMjMzMzUyLTMxLjIzMzM1Mi0zMS4yMzMzNTJzLTMxLjIzMzM1MiAxMy45ODQ1MDMtMzEuMjMzMzUyIDMxLjIzMzM1MnYxNjcuNDk0NzU4Yy0wLjAwMTAyMyAxNy4yNDg4NDkgMTMuOTg0NTAzIDMxLjIzMzM1MiAzMS4yMzMzNTIgMzEuMjMzMzUyeiIgZmlsbD0iIzk5OTk5OSIgcC1pZD0iNTYxNiI+PC9wYXRoPjwvc3ZnPg=='
    /** 菜单位置：排在官方“复制 Session ID”（450）之后，确保它是最后一行。 */
    const MENU_ORDER = 500

    /**
     * 界面文案。同一命名空间也写在 JSON 里供 Plugin Manager 元数据使用；
     * 模块加载器无法读取 JSON，所以界面文案在这里再保留一份。
     */
    const zh = {
      'menu.delete': '删除会话',
      'dialog.title': '删除这个会话？',
      'dialog.description': '“{title}”将被永久删除，聊天记录会从磁盘移除，且无法恢复。',
      'dialog.untitled': '这个会话',
      'dialog.cancel': '取消',
      'dialog.confirm': '删除',
      'dialog.deleting': '正在删除…',
      'dialog.close': '关闭',
      'error.inUse': '该会话正在使用中，请先切换到其他会话再试。',
      'error.running': '该会话正在运行，请先停止当前回合再删除。',
      'error.active': '该会话仍有进行中的工作（回合、子智能体、后台任务或定时提醒），请先停止这些工作。',
      'error.unsupported': '当前环境不支持删除会话（未挂载会话存储服务）。',
      'error.failed': '删除失败，请稍后重试。',
    }
    const en = {
      'menu.delete': 'Delete session',
      'dialog.title': 'Delete this session?',
      'dialog.description': '“{title}” will be permanently deleted. Its chat history is removed from disk and cannot be recovered.',
      'dialog.untitled': 'This session',
      'dialog.cancel': 'Cancel',
      'dialog.confirm': 'Delete',
      'dialog.deleting': 'Deleting…',
      'dialog.close': 'Close',
      'error.inUse': 'This session is in use. Switch to another session and try again.',
      'error.running': 'This session is running. Stop the current turn before deleting it.',
      'error.active': 'This session still has work in progress (a turn, subagents, background jobs, or scheduled reminders). Stop that work first.',
      'error.unsupported': 'Session deletion is unavailable here because session storage is not mounted.',
      'error.failed': 'Deletion failed. Please try again.',
    }

    const CSS = `
.drs-menu-separator{height:.5px;margin:3px 2px;background:var(--dsw-alias-border-l2)}
.drs-menu-item{display:flex;align-items:center;gap:6px;width:100%;min-height:34px;padding:6px 8px;border:none;border-radius:var(--dsw-radius-md);background:transparent;cursor:pointer;font-size:13px;line-height:20px;text-align:left;color:var(--dsw-alias-state-error-primary)}
.drs-menu-item:hover,.drs-menu-item:focus-visible{background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover));outline:none}
.drs-menu-icon{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center;color:inherit}
.drs-menu-icon-art{display:block;width:14px;height:14px;background:currentColor;-webkit-mask:var(--drs-menu-icon) center/contain no-repeat;mask:var(--drs-menu-icon) center/contain no-repeat}
.drs-menu-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drs-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:max(24px,var(--dsh-frame-overlay-top,24px)) 24px;pointer-events:auto}
.drs-mask{position:absolute;inset:var(--dsh-frame-chrome-top,0px) 0 0;background:var(--dsw-alias-bg-mask-1,color-mix(in srgb,var(--dsw-alias-bg-base) 40%,transparent));backdrop-filter:var(--dsw-mask-blur)}
.drs-dialog{position:relative;z-index:1;box-sizing:border-box;display:flex;flex-direction:column;gap:20px;width:min(400px,100%);padding:22px 24px 24px;border-radius:var(--dsw-radius-panel);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary)}
.drs-dialog:focus{outline:none}
.drs-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.drs-title{margin:0;font-size:16px;line-height:24px;font-weight:500;color:var(--dsw-alias-label-primary)}
.drs-close{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;margin:-4px -6px 0 0;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.drs-close:hover{background:var(--dsw-alias-interactive-bg-hover)}
.drs-close svg{width:14px;height:14px}
.drs-description{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.drs-error{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-state-error-primary)}
.drs-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px}
.drs-button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;border:none;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;cursor:pointer}
.drs-button:disabled{cursor:not-allowed;opacity:.4}
.drs-button:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}
.drs-button-outline{border:.5px solid var(--dsw-alias-border-l3)}
.drs-button-outline:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.drs-button-danger{border:.5px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.drs-button-danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover))}
@media(prefers-reduced-motion:reduce){.drs-menu-item,.drs-button{transition:none}}
`

    // #region 辅助函数

    /**
     * 一个可被槽位 hook 消费的最小可观察值源。
     *
     * @param {unknown} initial - 初始值。
     * @returns {{ getSnapshot: () => unknown, subscribe: (listener: () => void) => () => void, set: (next: unknown) => void }} store。
     */
    function createStore(initial) {
      let value = initial
      const listeners = new Set()
      return {
        getSnapshot: () => value,
        subscribe: (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
        set: (next) => {
          value = next
          for (const listener of [...listeners]) listener()
        },
      }
    }

    /**
     * 优先通过槽位翻译器取界面文案；翻译器不可用时回退到内嵌字典。
     *
     * @param {((key: string, params?: Record<string, unknown>) => string) | undefined} t - 槽位翻译器。
     * @param {string} key - 字典键。
     * @param {Record<string, unknown>} [params] - 插值参数。
     * @returns {string} 本地化文案。
     */
    function translate(t, key, params) {
      if (typeof t === 'function') {
        try {
          const text = t(key, params)
          if (typeof text === 'string' && text !== '' && text !== key) return text
        } catch {
          // 落到内嵌字典
        }
      }
      let template = zh[key] ?? en[key] ?? key
      if (params !== undefined) {
        for (const [name, value] of Object.entries(params)) template = template.split(`{${name}}`).join(String(value))
      }
      return template
    }

    /**
     * 把删除失败转换成一句本地化提示。
     *
     * @param {Error & { code?: string }} error - 删除流程抛出的失败。
     * @param {((key: string, params?: Record<string, unknown>) => string) | undefined} t - 槽位翻译器。
     * @returns {string} 面向用户的提示。
     */
    function failureText(error, t) {
      const code = error && typeof error === 'object' ? error.code : undefined
      if (code === 'session-in-use') return translate(t, 'error.inUse')
      if (code === 'session-running') return translate(t, 'error.running')
      if (code === 'session-active') return translate(t, 'error.active')
      if (code === 'unsupported') return translate(t, 'error.unsupported')
      return translate(t, 'error.failed')
    }

    /**
     * 调用一次 Host 删除接口。
     *
     * @param {string} sessionId - 要删除的会话。
     * @returns {Promise<{ ok: boolean, error?: { code?: string, message?: string, detail?: string } }>} Host 返回结果。
     */
    async function callDeleteEndpoint(sessionId) {
      const response = await fetch(DELETE_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!response.ok) {
        const error = new Error(`delete endpoint returned HTTP ${String(response.status)}`)
        error.code = 'http'
        throw error
      }
      return await response.json()
    }

    /**
     * 端到端删除一个会话：请求 Host 删除，成功后让主视图离开并移除列表行。
     *
     * 顺序很重要：先请求 Host，被拒绝时不做任何导航。离开主视图必须用
     * `clearMain()` —— 它只释放主视图持有的引用、清空选择，不会创建会话。
     * 不能用 `startSession()`：它会经 `connectBlank()` 真的新建一个空白会话，
     * 于是删除被拒绝（例如回合仍在运行）时也会凭空多出一个新会话。
     *
     * @param {import('@deepseek-ai/cordis').Context} ctx - Client 插件上下文。
     * @param {{ sessionId: string, displayTitle?: string }} request - 待处理的请求。
     * @returns {Promise<void>} 会话消失后 resolve。
     */
    async function deleteSession(ctx, request) {
      const sessionId = request.sessionId
      const sessions = ctx.get('sessions')
      const summary = sessions && sessions.list ? sessions.list.getSnapshot().byId[sessionId] : undefined
      const heldByMainView = summary !== undefined && summary.retainedBy !== undefined && (summary.retainedBy.mainView ?? 0) > 0

      const result = await callDeleteEndpoint(sessionId)
      if (!result.ok) {
        const error = new Error((result.error && result.error.message) || 'session deletion failed')
        error.code = (result.error && result.error.code) || 'delete-failed'
        error.detail = result.error && result.error.detail
        throw error
      }

      // 删除已经成功。主视图仍持有该会话的引用时，先离开它，让客户端释放
      // 引用并把界面切空白；clearMain() 不会创建任何会话。
      if (heldByMainView) {
        const uiWorkspace = ctx.get('uiWorkspace')
        if (uiWorkspace !== undefined && typeof uiWorkspace.clearMain === 'function') {
          try {
            uiWorkspace.clearMain()
          } catch (error) {
            console.warn('dsh-remove-session: leaving the deleted session failed:', error)
          }
        }
      }

      if (sessions !== undefined) {
        if (typeof sessions.handleSessionRemoved === 'function') sessions.handleSessionRemoved(sessionId)
        else if (typeof sessions.refresh === 'function') sessions.refresh()
      }
    }

    // #endregion

    // #region 图标

    /** 菜单行里的删除图标：用当前文字颜色绘制插件图标，替换 icon.svg 即可同步更新。 */
    function MenuIcon() {
      return h('span', { className: 'drs-menu-icon', 'aria-hidden': 'true' },
        h('span', {
          className: 'drs-menu-icon-art',
          style: { '--drs-menu-icon': `url("${ICON_DATA_URL}")` },
        }))
    }

    /** 确认弹窗右上角的关闭图标。 */
    function CloseIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        h('path', { d: 'M4 4l8 8M12 4l-8 8', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }))
    }

    // #endregion

    // #region 组件

    /**
     * 会话“...”菜单里的一行：红色“删除会话”。
     *
     * 这一行自己渲染 `role="menuitem"` 按钮，菜单的键盘遍历和焦点归还因此能
     * 识别它；它通过注入的 `useMenuOpenState` 钩子关闭菜单，然后再打开二次
     * 确认。
     *
     * @param {object} props - 行所属会话、菜单开关状态、请求回调和翻译器。
     * @returns {unknown} 菜单行。
     */
    function RemoveSessionMenuItem(props) {
      const { sessionId, displayTitle, useMenuOpenState, requestDelete, t } = props
      const [, setMenuOpen] = useMenuOpenState()
      const label = translate(t, 'menu.delete')
      return h(React.Fragment, null,
        h('div', { className: 'drs-menu-separator', role: 'separator' }),
        h('button', {
          type: 'button',
          role: 'menuitem',
          className: 'drs-menu-item',
          onClick: () => {
            setMenuOpen(false)
            requestDelete({ sessionId, displayTitle: typeof displayTitle === 'string' ? displayTitle : '' })
          },
        },
          h(MenuIcon),
          h('span', { className: 'drs-menu-label' }, label)))
    }

    /**
     * `shell.overlay` 里的条目：没有删除请求时不渲染任何内容。
     *
     * @param {object} props - 请求 hook、删除回调、请求清理和翻译器。
     * @returns {unknown} 打开的弹窗，或 null。
     */
    function RemoveSessionDialog(props) {
      const request = props.useDeleteRequest((value) => value)
      if (request === null || request === undefined) return null
      return h(DeleteSessionForm, {
        key: request.sessionId,
        request,
        deleteSession: props.deleteSession,
        settleDelete: props.settleDelete,
        t: props.t,
      })
    }

    /**
     * 单个确认弹窗：进行中和错误状态随这次请求一起销毁。
     *
     * @param {{ request: { sessionId: string, displayTitle?: string }, deleteSession: (request: unknown) => Promise<void>, settleDelete: () => void, t?: Function }} props - 弹窗输入。
     * @returns {unknown} 弹窗。
     */
    function DeleteSessionForm(props) {
      const { request, deleteSession, settleDelete, t } = props
      const [pending, setPending] = React.useState(false)
      const [failure, setFailure] = React.useState(null)
      const pendingRef = React.useRef(false)
      const cancelRef = React.useRef(null)
      const restoreRef = React.useRef(null)
      pendingRef.current = pending

      React.useEffect(() => {
        restoreRef.current = document.activeElement
        if (cancelRef.current !== null) cancelRef.current.focus()
        const onKeyDown = (event) => {
          if (event.key !== 'Escape' || pendingRef.current) return
          event.preventDefault()
          event.stopPropagation()
          settleDelete()
        }
        window.addEventListener('keydown', onKeyDown, true)
        return () => {
          window.removeEventListener('keydown', onKeyDown, true)
          const restore = restoreRef.current
          if (restore !== null && typeof restore.focus === 'function') restore.focus()
        }
      }, [])

      const close = () => {
        if (pendingRef.current) return
        settleDelete()
      }

      const confirm = () => {
        if (pendingRef.current) return
        pendingRef.current = true
        setPending(true)
        setFailure(null)
        Promise.resolve()
          .then(() => deleteSession(request))
          .then(() => {
            settleDelete()
          })
          .catch((error) => {
            pendingRef.current = false
            setPending(false)
            setFailure(error instanceof Error ? error : new Error(String(error)))
          })
      }

      const title = request.displayTitle !== undefined && request.displayTitle !== '' ? request.displayTitle : translate(t, 'dialog.untitled')
      const description = translate(t, 'dialog.description', { title })

      return h('div', { className: 'drs-overlay' },
        h('div', { className: 'drs-mask', onClick: close, 'aria-hidden': 'true' }),
        h('div', {
          className: 'drs-dialog',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'drs-dialog-title',
          'aria-describedby': 'drs-dialog-description',
          onClick: (event) => event.stopPropagation(),
        },
          h('div', { className: 'drs-header' },
            h('h2', { className: 'drs-title', id: 'drs-dialog-title' }, translate(t, 'dialog.title')),
            h('button', {
              type: 'button',
              className: 'drs-close',
              'aria-label': translate(t, 'dialog.close'),
              title: translate(t, 'dialog.close'),
              disabled: pending,
              onClick: close,
            }, h(CloseIcon))),
          h('p', { className: 'drs-description', id: 'drs-dialog-description' }, description),
          failure === null ? null : h('p', { className: 'drs-error', role: 'alert' }, failureText(failure, t)),
          h('div', { className: 'drs-footer' },
            h('button', {
              type: 'button',
              ref: cancelRef,
              className: 'drs-button drs-button-outline',
              disabled: pending,
              onClick: close,
            }, translate(t, 'dialog.cancel')),
            h('button', {
              type: 'button',
              className: 'drs-button drs-button-danger',
              disabled: pending,
              onClick: confirm,
            }, pending ? translate(t, 'dialog.deleting') : translate(t, 'dialog.confirm')))))
    }

    // #endregion

    /**
     * 安装侧栏菜单行和它的确认浮层。
     *
     * @param {import('@deepseek-ai/cordis').Context} ctx - Client 插件上下文。
     * @returns {void}
     */
    function apply(ctx) {
      const requestStore = createStore(null)

      const style = document.createElement('style')
      style.setAttribute('data-plugin', NS)
      style.textContent = CSS
      document.head.append(style)
      ctx.effect(() => () => {
        style.remove()
      }, 'dsh-remove-session: styles')

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-remove-session: dictionaries')

      ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({
        name: 'sidebar.workspaces.session.menu.item',
        id: 'dsh-remove-session',
        order: MENU_ORDER,
        locale: NS,
        inject: () => ({
          requestDelete: (request) => requestStore.set(request),
        }),
      }, RemoveSessionMenuItem))

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'dsh-remove-session:confirm',
        order: 1000,
        locale: NS,
        inject: () => ({
          hooks: { deleteRequest: requestStore },
          deleteSession: (request) => deleteSession(ctx, request),
          settleDelete: () => requestStore.set(null),
        }),
      }, RemoveSessionDialog))
    }

    return {
      inject: ['slots', 'sessions', 'locale', 'uiWorkspace'],
      apply,
    }
  },
})
