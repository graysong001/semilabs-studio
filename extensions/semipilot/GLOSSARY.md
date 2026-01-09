# Semipilot Extension 术语表与架构说明

**@SpecTrace**: cap-ui-semipilot  
**更新日期**: 2026-01-09

---

## 📖 核心术语解释

### 1. TipTap Editor

**是什么**: 一个强大的富文本编辑器框架

**技术定位**:
- 基于 ProseMirror（底层编辑引擎）
- 提供 React 组件封装
- 支持自定义扩展（Extensions）

**在 Semipilot 中的作用**:
```
用户输入框 → TipTap Editor → 支持 @ 提及功能
```

**为什么选择 TipTap**:
- ✅ Continue 项目已经使用，可复用代码
- ✅ 支持 @ Mention 扩展（我们需要 @spec, @file）
- ✅ React 集成成熟
- ✅ 可扩展性强

**官网**: https://tiptap.dev/

---

### 2. Chat Panel（聊天面板）

**是什么**: VS Code Extension 中的 Webview UI，用户与 AI Agent 对话的界面

**物理位置**:
```
VS Code 侧边栏（Activity Bar）
  └─ Semipilot 图标（🤖）
      └─ Chat Panel（Webview）
          ├─ 消息列表（MessageList）
          ├─ 输入框（TipTap Editor）
          └─ 工具栏（Toolbar）
```

**技术架构**:
```
┌─────────────────────────────────────┐
│ VS Code Extension (Host)            │
│ ┌─────────────────────────────────┐ │
│ │ SemipilotWebviewProvider        │ │
│ │ (TypeScript)                    │ │
│ └─────────────────────────────────┘ │
│             ↕ postMessage            │
│ ┌─────────────────────────────────┐ │
│ │ Webview (Sandboxed)             │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ React App                   │ │ │
│ │ │ ├─ TipTap Editor            │ │ │
│ │ │ ├─ MessageList              │ │ │
│ │ │ └─ PersonaSelector          │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**当前状态**:
- ✅ **已集成到 semilabs-studio**
  - 位置: `extensions/semipilot/src/webview/SemipilotWebviewProvider.ts`
  - 状态: 基础 HTML 骨架完成
- ⚠️ **Phase 1 Week 1 Day 5 将升级**
  - 从临时 HTML → React + TipTap Editor

---

### 3. Context Provider（上下文提供者）

**是什么**: 为 Chat 提供上下文信息的插件系统

**核心概念**:
```typescript
@spec  → SpecContextProvider   → 加载 Spec 文档
@file  → FileContextProvider   → 加载代码文件
@folder → FolderContextProvider → 加载目录
@code  → CodeContextProvider   → 加载代码片段
```

**工作流程**:
```
1. 用户输入 "@"
2. TipTap Editor 触发 Mention 扩展
3. 查询 ContextProviderManager
4. 显示下拉菜单（@spec, @file, ...）
5. 用户选择 @spec:cap-persona-poe.md
6. SpecContextProvider 读取文件内容
7. 文件内容加载到 Chat 上下文
```

**已实现的 Providers**:
- ✅ **SpecContextProvider** (优先级最高)
  - 扫描 `cap-*.md`, `spec-*.md`, `intent_*.md`
  - 解析 Frontmatter（id, domain, version, status）
  - 内存索引 + FileWatcher 增量更新
- ✅ **FileContextProvider**
  - 搜索工作区文件
  - 读取文件内容

---

### 4. Webview（VS Code Webview API）

**是什么**: VS Code Extension 中嵌入 HTML/CSS/JS 的 UI 容器

**技术特点**:
- **沙箱隔离**: Webview 运行在独立的沙箱环境中
- **postMessage 通信**: Extension ↔ Webview 通过消息传递
- **内容安全策略（CSP）**: 严格的安全限制

**架构示意**:
```
┌──────────────────────────────────────────┐
│ Extension Host (Node.js Process)         │
│ - 可访问 VS Code API                     │
│ - 可访问文件系统                          │
│ - 可运行 Node.js 代码                    │
│                                          │
│   extension.ts                           │
│   └─ createWebviewPanel()                │
│       ↓                                  │
└───────────────────────────────────────────┘
            ↕ postMessage
┌──────────────────────────────────────────┐
│ Webview (Chromium Renderer)             │
│ - 运行在沙箱环境                          │
│ - 不能访问 VS Code API                   │
│ - 不能访问文件系统                        │
│ - 只能通过 postMessage 与 Extension 通信  │
│                                          │
│   React App + TipTap Editor              │
│   └─ vscode.postMessage({...})           │
└──────────────────────────────────────────┘
```

**在 Semipilot 中的应用**:
```typescript
// Extension Host 侧
webview.postMessage({
  type: 'contextItems',
  items: specContextProvider.search('poe')
});

// Webview 侧
window.addEventListener('message', event => {
  const { type, items } = event.data;
  if (type === 'contextItems') {
    // 更新 UI，显示搜索结果
  }
});
```

---

### 5. SSE (Server-Sent Events)

**是什么**: 单向流式通信协议，服务器主动推送数据到客户端

**与 WebSocket 对比**:
| 特性 | SSE | WebSocket |
|------|-----|-----------|
| 方向 | 单向（服务器 → 客户端） | 双向 |
| 协议 | HTTP | WS/WSS |
| 复杂度 | 简单 | 复杂 |
| 重连 | 自动 | 需手动实现 |

**在 Semipilot 中的应用**:
```typescript
// Extension 侧（SseMessenger.ts）
const eventSource = new EventSource('http://localhost:8080/api/v1/sse/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'thinking') {
    // 显示 Agent 思考过程
  } else if (data.type === 'response') {
    // 显示 Agent 回复
  }
};
```

**为什么使用 SSE**:
- ✅ Agent 思考过程需要实时推送（流式响应）
- ✅ 单向通信足够（客户端请求 → 服务器流式响应）
- ✅ 实现简单，自动重连

---

### 6. Extension Development Host

**是什么**: VS Code 提供的调试环境，用于开发和测试扩展

**如何启动**:
```
1. 在 VS Code 中打开 semilabs-studio 目录
2. 按 F5
3. 新窗口打开（标题包含 [Extension Development Host]）
```

**特点**:
- 独立的 VS Code 实例
- 可以安装和调试你的扩展
- 支持断点调试
- Console 输出可在 Developer Tools 中查看

---

## 🏗️ 架构全景图

### Semipilot Extension 完整架构

```
┌──────────────────────────────────────────────────────────────┐
│ VS Code Extension: Semipilot                                 │
│ (semilabs-studio/extensions/semipilot/)                      │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Extension Host (Node.js)                                 │ │
│ │                                                          │ │
│ │ extension.ts (入口)                                       │ │
│ │ ├─ ContextProviderManager                               │ │
│ │ │   ├─ SpecContextProvider ⭐                           │ │
│ │ │   └─ FileContextProvider                             │ │
│ │ ├─ SseMessenger (与后端通信)                            │ │
│ │ └─ SemipilotWebviewProvider                             │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                    ↕ postMessage                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Webview (Chromium)                                       │ │
│ │                                                          │ │
│ │ React App (Phase 1 Week 1 Day 5 实现)                   │ │
│ │ ├─ TipTap Editor (输入框)                               │ │
│ │ │   └─ Mention Extension (@spec, @file)                │ │
│ │ ├─ MessageList (消息列表)                               │ │
│ │ └─ PersonaSelector (/poe, /archi, /cody, /tess)        │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          ↕ SSE
┌──────────────────────────────────────────────────────────────┐
│ Spring Boot Backend                                          │
│ (semilabs-server/)                                           │
│                                                              │
│ ├─ ChatController (SSE Endpoint)                            │
│ ├─ AgentRouter (Poe/Archi/Cody/Tess)                        │
│ ├─ DomainGraphService (内存索引)                             │
│ └─ ChatPersistenceService (PostgreSQL)                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 文件位置速查

### 已实现的代码文件

```
semilabs-studio/extensions/semipilot/
├── src/
│   ├── extension.ts                          # 扩展入口
│   ├── context/                              # Context Providers
│   │   ├── IContextProvider.ts               # 接口定义
│   │   ├── SpecContextProvider.ts ⭐         # @spec 提供者
│   │   ├── FileContextProvider.ts            # @file 提供者
│   │   └── ContextProviderManager.ts         # 管理器
│   ├── messenger/                            # 通信层
│   │   ├── IMessenger.ts                     # 接口定义
│   │   ├── SemilabsProtocol.ts               # 协议定义
│   │   └── SseMessenger.ts                   # SSE 实现
│   └── webview/                              # Webview UI
│       └── SemipilotWebviewProvider.ts       # Webview Provider
├── package.json                              # 扩展配置
├── tsconfig.json                             # TypeScript 配置
├── README.md                                 # 开发指南
└── QUICKSTART.md                             # 快速开始
```

### 配置文件

```
semilabs-studio/
├── .vscode/
│   ├── launch.json                           # 调试配置
│   └── tasks.json                            # 构建任务
└── extensions/semipilot/
    └── build-and-verify.sh                   # 一键构建脚本
```

### 文档文件

```
semilabs-squad/semilabs-specs/_projects/proj-002-ide-native/
├── SESSION_CONTEXT_EXPORT.md                 # 项目上下文
├── PHASE1_WEEK1_DAY3-4_SUMMARY.md            # Day 3-4 实施总结
├── PHASE1_WEEK1_DAY4_SUMMARY.md              # Day 4 工作总结
└── PHASE1_WEEK1_DAY4_VERIFICATION_CHECKLIST.md # 验证清单
```

---

## ⏱️ 集成时间线

### 已完成（Phase 1 Week 1 Day 3-4）

| 时间 | 组件 | 状态 | 说明 |
|------|------|------|------|
| Day 1-2 | SseMessenger | ✅ | 与后端 SSE 通信 |
| Day 3 | SpecContextProvider | ✅ | @spec 上下文提供者 |
| Day 3 | FileContextProvider | ✅ | @file 上下文提供者 |
| Day 3 | ContextProviderManager | ✅ | 统一管理 |
| Day 3 | SemipilotWebviewProvider | ✅ | Webview 骨架（临时 HTML） |
| Day 4 | 构建与验证工具 | ✅ | build-and-verify.sh |

### 待完成（Phase 1 Week 1 Day 5）

| 时间 | 组件 | 状态 | 说明 |
|------|------|------|------|
| Day 5 | React Webview App | ⏳ | 替换临时 HTML |
| Day 5 | TipTap Editor | ⏳ | 富文本输入框 |
| Day 5 | Mention Extension | ⏳ | @ 触发下拉菜单 |
| Day 5 | Context Provider 桥接 | ⏳ | Extension ↔ Webview |

---

## 🚀 如何测试当前版本

### Step 1: 构建扩展

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
./build-and-verify.sh
```

**预期输出**:
```
✅ Build & Verification Complete!
```

### Step 2: 启动调试

```bash
# 在 VS Code 中打开 semilabs-studio 目录
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio
code .

# 按 F5 启动 Extension Development Host
```

### Step 3: 验证 Chat Panel

在 Extension Development Host 窗口中：

1. **查看侧边栏**:
   - 左侧 Activity Bar 应该出现 Semipilot 图标（🤖）

2. **打开 Chat Panel**:
   - 点击 Semipilot 图标
   - 侧边栏展开，显示 "Chat" 面板
   - 面板中显示基础 HTML UI：
     - 标题: "Semipilot Chat Panel"
     - 可编辑的文本框
     - "Send" 按钮

3. **查看 Console 日志**:
   - Help → Toggle Developer Tools
   - Console 标签页应该显示：
     ```
     [Semipilot] Activating extension...
     [ContextProviderManager] Initialized with providers: file, spec
     [SpecContextProvider] Building index...
     [SpecContextProvider] Index built: X specs found
     ```

### Step 4: 测试 SpecContextProvider

**验证扫描功能**:
```bash
# 统计实际 spec 文件数量
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-squad/semilabs-specs
find . -name "cap-*.md" | wc -l
find . -name "spec-*.md" | wc -l
find . -name "intent_*.md" | wc -l
```

**对比 Console 日志**: 确认扫描到的数量与实际文件数量一致

---

## 🎯 当前限制

### Chat Panel 功能状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 基础 UI 渲染 | ✅ | 临时 HTML 实现 |
| 文本输入 | ✅ | contenteditable div |
| @ 提及触发 | ⚠️ | 仅检测，无下拉菜单 |
| TipTap Editor | ❌ | Phase 1 Week 1 Day 5 |
| Context Provider 集成 | ❌ | Phase 1 Week 1 Day 5 |
| 消息发送到后端 | ❌ | Phase 1 Week 2 |
| SSE 流式响应 | ❌ | Phase 1 Week 2 |

### 为什么还不能完整使用？

**当前阶段**: Phase 1 Week 1 Day 4（环境配置与验证）

**缺失功能**:
1. **TipTap Editor 集成**（Day 5）
   - 当前是简单的 contenteditable div
   - 无法触发 @ Mention 下拉菜单

2. **Context Provider 桥接**（Day 5）
   - Extension ↔ Webview 通信未实现
   - SpecContextProvider 数据无法传递到 Webview

3. **后端集成**（Week 2）
   - 消息发送到后端（SSE）
   - Agent 路由和响应

---

## 📅 下一步计划

### Phase 1 Week 1 Day 5（明天）

**任务**: TipTap Editor 完整集成

**将实现**:
1. ✅ 创建 React Webview App（使用 Vite）
2. ✅ 复用 Continue 的 TipTap Editor 组件
3. ✅ 实现 Mention 扩展（@ 触发下拉菜单）
4. ✅ Extension ↔ Webview 通信桥接
5. ✅ **验证 @spec:cap-persona-poe.md 能加载** ⭐

**完成后效果**:
- 输入 `@` → 显示下拉菜单（@spec, @file）
- 选择 `@spec` → 搜索框，输入 `poe`
- 显示 `cap-persona-poe.md`
- 点击选择 → Spec 内容加载到 Chat 上下文

---

## 🤔 常见疑问

### Q1: 为什么要复用 Continue 的代码？

**A**: 
- ✅ Continue 是成熟的 AI Coding Assistant，已验证 TipTap + VS Code 方案可行
- ✅ 避免重复造轮子，加快开发速度
- ✅ TipTap Editor + Mention 扩展是标准方案

### Q2: Chat Panel 什么时候能完整使用？

**A**: 
- **基础可用**: Phase 1 Week 1 Day 5（明天）
  - @ 提及功能
  - Context Provider 集成
- **完整可用**: Phase 1 Week 2（下周）
  - SSE 流式响应
  - Agent 对话
  - Persona 切换

### Q3: 为什么不用 WebSocket？

**A**: 
- SSE 足够满足需求（单向流式推送）
- SSE 更简单，自动重连
- 符合 REST API 风格

### Q4: SpecContextProvider 的性能如何？

**A**: 
- 启动扫描: < 2s（目标）
- 内存占用: < 50MB
- 搜索响应: < 50ms
- FileWatcher 增量更新: < 500ms

---

**文档版本**: 1.0.0  
**更新日期**: 2026-01-09  
**维护者**: Cody (Code Generation Agent)
