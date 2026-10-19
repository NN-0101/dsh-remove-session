# dsh-remove-session

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![DSH](https://img.shields.io/badge/DSH-0.2.x-4B6BFF)
![Platform](https://img.shields.io/badge/platform-Web%20UI-2ea44f)

**给 DeepSeek Harness（DSH）的会话「…」菜单加一项红色“删除会话”：二次确认后，会话从侧栏和磁盘上真正消失。**

> 能力分类：**会话与消息** · 许可证：**MIT** · 无外部服务 · 不收集遥测

---

## 一句话价值

安装后，你可以像删除聊天记录一样删除不再需要的 DSH 会话：不用再让无用的会话日志一直堆在 `$DSH_HOME/sessions` 里，也不用为了“眼不见”而先归档再翻筛选器。

---

## 安装

### 方式一：npm（推荐）

```bash
dsh plugin --profile web add dsh-remove-session
```

- `--profile web` 是插件市场模板里的示例 profile 名，请换成你实际使用的 profile（例如本机是 `desktop`）。
- 已发布到 npm，因此 DSH 内置的「插件中心」可以直接搜索并一键安装。
- 安装完成后刷新一次 DSH Web 页面，侧栏会话的「…」菜单末尾就会出现红色“删除会话”。

### 方式二：源码安装（GitHub）

```bash
dsh plugin --profile web add github:NN-0101/dsh-remove-session
```

本插件没有构建步骤，GitHub 上的源码可以直接安装；适合想跟最新提交或自己二次开发的情况。

### 方式三：本地目录

打开 **设置 → 插件**，选择安装本地 bundle，指向本仓库目录（或已解压的目录）即可；加载器会读取 `cordis.patch.yml` 并挂载插件。

---

## 使用

1. 在侧栏把鼠标移到任意会话行，点击右侧的「…」。
2. 菜单最后一项是红色的 **删除会话**（在“复制 Session ID”之后）。
3. 点击后弹出确认框，标题是“删除这个会话？”，正文会显示会话标题，并说明聊天记录会从磁盘移除、无法恢复。
4. 点 **删除**：会话从侧栏消失，磁盘上的会话目录、Workspace 归属、置顶/归档记录一并清理。
5. 点 **取消**、按 `Esc` 或点击遮罩：不做任何修改。

菜单和弹窗均支持中文与英文界面。

---

## 效果演示

菜单（新增项在最后，红色显示）：

```text
┌─────────────────────────────┐
│ 置顶会话                     │
│ 重命名                       │
│ 分叉会话                     │
│ 归档会话                     │
│ 复制 Session ID              │
│ ──────────────────────────  │
│ 🗑 删除会话                  │  ← 红色
└─────────────────────────────┘
```

确认框：

```text
删除这个会话？
“帮我优化一下聊天”将被永久删除，聊天记录会从磁盘移除，且无法恢复。
                                          [取消]  [删除]
```

> 仓库暂未附带界面截图。上面的菜单/弹窗文字来自实际实现；下面的“验证”一节给出了真实的接口输出。欢迎通过 PR 补充截图。

---

## 功能

- **红色删除入口**：注册在 `sidebar.workspaces.session.menu.item` 槽位，`order: 500`，排在官方“复制 Session ID”（450）之后，默认是菜单最后一行。
- **二次确认**：自定义弹窗，红色危险按钮；确认前不会执行任何删除。
- **真正的删除**：删除该会话独占的 JSONL 日志目录（`$DSH_HOME/sessions/--<项目>--/<会话ID>/`），并从 Workspace registry 中移除它的归属、置顶和归档记录。
- **即时反馈**：删除成功后客户端会话列表立刻移除该行；侧栏不会残留“幽灵会话”。
- **内存与磁盘一起删**：会话会先从 Host 的内存 store 摘除，再删除磁盘目录，所以不会留下“侧栏还在、磁盘已空”的幽灵会话。
- **不会新建会话**：删除成功后，若主视图正显示该会话，客户端只清空主视图（释放引用），不会创建新会话；删除被拒绝时也不会做任何导航。
- **安全拒绝**：正在运行的回合、进行中的子智能体/后台任务/定时提醒，都会被拒绝并给出提示。
- **中英双语**：`locale/zh.json`、`locale/en.json` 以及客户端内嵌字典。
- **图标可替换**：插件卡片使用 `icon.svg`；菜单行的删除图标取自同一份图标（以 data URL 内嵌在 `client.js`，按行内文字颜色着色），替换后运行 `npm run sync-icon` 即可同步。

---

## 安全与权限

| 项目 | 说明 |
| --- | --- |
| 读取/写入范围 | `$DSH_HOME/sessions` 下该会话自己的目录；Workspace registry 中该会话的归属、置顶、归档记录 |
| 网络 | 不访问任何外部服务；只注册两个同源本地 HTTP 接口 |
| 遥测 | 无 |
| 删除范围 | 仅该会话目录；**不会**删除附件、其他会话、Workspace 目录本身 |
| 请求校验 | `Origin` 与 `Host` 对比的同源校验；删除只接受 `POST` + JSON |
| 运行中保护 | Agent 回合仍在运行、或 `workspace/session-activity` 报告有工作时，返回错误且不写盘 |
| 不可恢复 | 删除是永久的，没有回收站；需要保留请使用“归档会话” |

> 本插件会执行**不可恢复的删除**，请只用它清理确定不需要的会话。

---

## 兼容性

| 项目 | 要求 |
| --- | --- |
| DSH | 已在 `0.2.1-rc.2` 上实测；依赖 `webServer`、`sessionPersistence`、`sessions`、`agents`、`workspaceRegistry`，同代 0.2.x 预期可用 |
| Profile | 带 Web UI 的 profile（`web` / `desktop`），需要 `workspace` 与 `ui-workspace` 已挂载 |
| 平台 | 实测 Windows；实现只使用 Node 文件 API 与同源 HTTP，macOS / Linux 设计上同样适用 |
| Node | `^22.15.0 || >=24.0.0` |
| 安装形态 | 源码安装（GitHub）或本地目录；无构建步骤 |

---

## 工作原理

| 半边 | 职责 |
| --- | --- |
| Host（`index.js`、`host/session-files.js`） | 注册同源接口 `POST /plugin/dsh-remove-session/delete`；校验会话状态与进行中的工作；flush 待写事件；**先把会话从 Host 内存 store 里摘掉**（触发 `session/disposed`，让持久化关闭写句柄、投影缓存落盘）；再删除 JSONL 会话目录；从 Workspace registry 摘除归属/置顶/归档；发出 `api-session/removed` |
| Client（`client.js`） | 在 `sidebar.workspaces.session.menu.item` 注册红色菜单行，在 `shell.overlay` 注册确认弹窗；确认后调用 Host 接口，成功后移除列表行并按需清空主视图 |

删除动作必须由 Host 完成：DSH 的 JSONL 持久化后端没有删除 API，会话日志以目录形式存放在 `$DSH_HOME/sessions` 下，因此插件直接删除该会话独占的目录，不触碰共享存储。

### 为什么必须先摘内存、再删目录

DSH 的会话列表是**“磁盘上已存储的会话”与“内存里 live 的会话”的并集**（见 `@deepseek-ai/dsh-session-query` 的 `listSessions`）。只删磁盘目录时，该会话仍以 live 身份留在列表里；而它的 Workspace 归属已被清空，于是它掉进“未分组”。再次删除时，磁盘上已经没有目录、内存里却还有会话，就会被判成“正在使用中”，永远删不掉。

0.1.3 起改为先用 `SessionStore` 表项自带的 `detach` 闭包把会话摘出内存（等价于官方 `detachEntered()`，会发出配对的 `session/disposed`），再删磁盘目录，因此不会再出现“已删除的会话跑到未分组且删不掉”的现象。

### 为什么删除被拒绝时不新建会话

0.1.3 及更早的客户端在删除前用 `uiWorkspace.startSession(workspaceId)` 离开主视图，但这个 API 会经 `connectBlank()` 真正新建一个空白会话。于是删除正在运行的会话时，Host 虽然拒绝了删除，界面上却已经多出一个新会话。

0.1.4 起改为**先请求 Host，成功后才导航**，且导航用 `uiWorkspace.clearMain()` —— 它只释放主视图持有的引用并清空选择，不会创建任何会话。删除被拒绝时（运行中、仍有进行中的工作等），界面不会有任何变化。

### 目录定位

```
$DSH_HOME/sessions/
  --<规范化后的项目路径>--/
    <转义后的会话 ID>/          # 该会话独占，整个目录被删除
      session.v4.jsonl.zstd
```

插件使用与后端相同的 id 路径转义（单射），在每个项目目录下探测该目录，因此不依赖会话启动时的工作目录是否仍然存在。

---

## 诊断接口

只读、同源：

```http
GET /plugin/dsh-remove-session/inspect?sessionId=<会话ID>
```

返回该会话是否 live、磁盘目录、是否置顶/归档、归属的 Workspace，以及 `orphaned` —— 该会话是“内存里 live、磁盘上无目录、Workspace 里无归属”的幽灵状态（0.1.2 只删目录的遗留物，0.1.3 起再次删除即可清掉）。用于排查“为什么删不掉”。

---

## 验证

Host 接口的真实输出（路径与 ID 已脱敏）：

```json
{
  "ok": true,
  "version": "0.1.4",
  "root": "C:\\Users\\<user>\\.dsh\\sessions",
  "liveSessionIds": ["session-<id>"],
  "session": {
    "id": "session-<id>",
    "live": true,
    "directories": ["C:\\Users\\<user>\\.dsh\\sessions\\--C-0101-developer-project-DSH--\\session-<id>"],
    "archived": false,
    "pinned": false,
    "workspaces": ["<workspace-id>"],
    "orphaned": false
  }
}
```

已实测：

- 不存在的会话 → `{ "ok": true }`（幂等，便于重试）；
- 正在运行的会话 → `{ "ok": false, "error": { "code": "session-running" } }`，且会话目录保持完好；
- 跨源请求 → `403`；非 `POST` → `405`；
- 临时目录单测：只删除目标会话目录，兄弟会话目录保留。

---

## 已知限制

- **不级联删除子会话**：subagent 会话仍保留在磁盘上（它们默认不出现在侧栏）。
- **投影缓存可能残留**：`$DSH_HOME/storages` 中该会话的检查点文档不会被清理；它按会话 id 读取，删除后不会被展示，也不会让会话“复活”。
- **替换图标需要同步**：`icon.svg` 是插件卡片图标；菜单行使用由它生成的 `client.js` 内嵌副本，修改图标后需运行 `npm run sync-icon`，否则菜单行仍是旧图标。
- **删除不可恢复**：没有回收站。

---

## 卸载

在 DSH 的插件管理里停用或移除本 bundle 即可。卸载只移除入口，**不会恢复已删除的会话**。

---

## 开发

```bash
# 语法、模块与删除流程检查
npm run check

# 只跑删除流程测试
npm test

# 替换 icon.svg 后，把图标同步到客户端菜单行
npm run sync-icon

# 本地安装（把路径换成你的仓库目录）
dsh plugin --profile web add C:/path/to/dsh-remove-session
```

目录：

```text
index.js                 Host 半边：HTTP 接口、删除编排、Workspace 清理
host/session-files.js    会话目录定位、ID 转义、递归删除
client.js                Client 半边：菜单行、确认弹窗、列表更新
test/delete-flow.test.mjs 删除流程测试（顺序、幽灵会话、运行中拒绝、幂等、只删自己）
scripts/sync-icon.mjs    把 icon.svg 同步成 client.js 里的内嵌图标
cordis.patch.yml         bundle 配置层
locale/{zh,en}.json      Plugin Manager 元数据与文案
icon.svg                 插件图标
```

需要 Node 22.15+ 或 24+；无第三方运行时依赖。

---

## 收录徽章

插件被 [dsh-plugin.org](https://dsh-plugin.org/zh) 收录后，可把下面的徽章放到 README 顶部（若详情页 slug 不同，替换链接中的 `NN-0101/dsh-remove-session`）：

```markdown
[![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/NN-0101/dsh-remove-session)
```

---

## License

[MIT](LICENSE) © 2026 0101

---

## English

**dsh-remove-session** adds a red **Delete session** action to every Session's “...” menu in the DeepSeek Harness Web UI. After a second confirmation, it permanently removes the Session's JSONL log directory under `$DSH_HOME/sessions`, plus its Workspace membership, pin and archive entries; the sidebar row disappears immediately.

**Install (npm, recommended):**

```bash
dsh plugin --profile web add dsh-remove-session
```

**Install (source):**

```bash
dsh plugin --profile web add github:NN-0101/dsh-remove-session
```

Replace `web` with your profile name (for example `desktop`), then refresh the page. The npm package is also listed in the in-app Plugin Center, so it can be installed in one click from there.

**Safety:** running sessions and sessions with active subagents/jobs/reminders are refused. The session is detached from the Host's live store first — the list is the union of stored and live Sessions, so removing only the directory would leave it live with no Workspace membership — and only then is its directory removed. A refused deletion performs no navigation and creates no Session; a successful one clears the main view instead of opening a new Session. Attachments and other sessions are untouched. Deletion is permanent — use Archive if you may need the conversation later.

Requires DSH 0.2.x (tested on 0.2.1-rc.2) with the Web UI; Node `^22.15.0 || >=24.0.0`. MIT licensed.
