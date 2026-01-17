# Semipilot Chat Panel 完整测试用例

## 📋 测试策略

### 1. 冒烟测试（Smoke Test）
基本功能验证，确保核心流程可用

### 2. 边界测试（Boundary Test）
极限场景验证，如窄屏、长文本

### 3. 异常测试（Exception Test）
错误场景验证，如无网络、无工作区

---

## ✅ 冒烟测试用例

### TC-001: 扩展正常启动
**前置条件**：VS Code 已安装，semilabs-studio 项目已打开

**测试步骤**：
1. 按 F5 启动 Extension Development Host
2. 等待新窗口打开

**预期结果**：
- ✅ 新窗口正常打开（2秒内）
- ✅ Activity Bar 显示 Semipilot 图标
- ✅ Console 无 Semipilot 相关错误
- ✅ Extension Host 日志显示：`[Semipilot] Extension activated successfully`

---

### TC-002: Chat Panel 正常显示
**前置条件**：扩展已启动

**测试步骤**：
1. 点击 Activity Bar 的 Semipilot 图标
2. 观察 Chat Panel

**预期结果**：
- ✅ Chat Panel 在侧边栏打开
- ✅ 顶部显示：`SEMIPILOT: CHAT` + 机器人图标 + 3个按钮
- ✅ 中间显示：💬✨ "Build with Semipilot"
- ✅ 底部显示：输入区域（3层结构）
  - "Add Context..." 按钮
  - 输入框
  - Agent/Model 下拉 + 发送按钮

---

### TC-003: 输入普通文本
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 点击输入框
2. 输入："Hello World"
3. 观察界面变化

**预期结果**：
- ✅ 光标出现在输入框
- ✅ 文字正常显示
- ✅ Placeholder 消失
- ✅ 发送按钮变为启用状态（蓝色）

---

### TC-004: Enter 键发送消息
**前置条件**：输入框有内容 "Hello World"

**测试步骤**：
1. 按 Enter 键

**预期结果**：
- ✅ 消息立即发送（<100ms）
- ✅ 输入框清空
- ✅ 消息显示在聊天区域
- ✅ 发送按钮变为禁用状态（灰色）
- ✅ Extension Host Console 显示：
  ```
  [App] handleSend called: {content: "Hello World", contextItems: []}
  [SemipilotWebviewProvider] User message: Hello World
  ```

---

### TC-005: 点击发送按钮发送消息
**前置条件**：输入框有内容 "Test message"

**测试步骤**：
1. 点击右下角发送按钮（箭头图标）

**预期结果**：
- ✅ 消息发送（同 TC-004）
- ✅ Console 显示：`[App] Send button clicked, hasContent: true`

---

### TC-006: @ 提及功能
**前置条件**：Chat Panel 已打开，工作区有 spec 文件

**测试步骤**：
1. 在输入框输入 `@`
2. 输入 `spec`
3. 等待下拉菜单

**预期结果**：
- ✅ 下拉菜单弹出（<500ms）
- ✅ 显示工作区中的 spec 文件列表
- ✅ 可以用上下箭头选择
- ✅ 按 Enter 或点击插入文件

**测试步骤（续）**：
4. 选择 `cap-persona-poe.md`
5. 按 Enter

**预期结果（续）**：
- ✅ 输入框显示 `@cap-persona-poe` 徽章
- ✅ 下拉菜单关闭
- ✅ 发送按钮启用

---

## 🔬 边界测试用例

### TC-101: 窄屏宽度测试（核心边界场景）
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 拖动侧边栏宽度从 400px 缩小到 200px
2. 观察布局变化

**预期结果**：
- ✅ 输入区域宽度自适应收缩
- ✅ **发送按钮始终可见**（不被挤出视野）
- ✅ Agent/Model 下拉可能显示省略号
- ✅ 工具栏不换行
- ✅ 最小宽度 200px 时仍可操作

**测试步骤（续）**：
3. 在窄屏状态下输入 "Test"
4. 点击发送按钮

**预期结果（续）**：
- ✅ **发送按钮可点击**
- ✅ 消息正常发送
- ✅ Console 显示：`[App] Send button clicked`

---

### TC-102: 极窄屏幕测试（150px）
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 拖动侧边栏宽度到最小（约 150px）
2. 观察布局

**预期结果**：
- ✅ 发送按钮仍然可见（min-width: 32px）
- ✅ Agent/Model 下拉显示省略号
- ✅ 输入框仍可点击和输入
- ✅ 不出现横向滚动条

---

### TC-103: 超长文本输入
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 在输入框输入 1000 字的文本
2. 观察输入框变化

**预期结果**：
- ✅ 输入框自动扩展高度（最大 200px）
- ✅ 超出 200px 后出现滚动条
- ✅ 发送按钮保持启用
- ✅ 按 Enter 正常发送

---

### TC-104: 多个 @ 提及
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 输入："Review @spec:cap-persona-poe and @spec:cap-agent-workflow"
2. 观察徽章显示

**预期结果**：
- ✅ 两个徽章都正确显示
- ✅ 发送后 contextItems 包含两个文件
- ✅ Extension Host Console 显示：
  ```
  [SemipilotWebviewProvider] Context items: [
    {id: '...', label: 'cap-persona-poe', type: 'spec'},
    {id: '...', label: 'cap-agent-workflow', type: 'spec'}
  ]
  ```

---

### TC-105: Shift+Enter 换行
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 输入："Line 1"
2. 按 Shift+Enter
3. 输入："Line 2"
4. 观察输入框

**预期结果**：
- ✅ 输入框显示两行内容
- ✅ 不发送消息
- ✅ 发送按钮保持启用

**测试步骤（续）**：
5. 按 Enter（不按 Shift）

**预期结果（续）**：
- ✅ 发送包含换行的消息
- ✅ 消息区域显示两行内容

---

### TC-106: 输入为空时禁用发送
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 确保输入框为空
2. 观察发送按钮状态

**预期结果**：
- ✅ 发送按钮禁用（灰色，opacity: 0.4）
- ✅ 鼠标悬停显示：`cursor: not-allowed`
- ✅ Tooltip 显示："Type a message first"

**测试步骤（续）**：
3. 点击发送按钮

**预期结果（续）**：
- ✅ 无反应，不发送消息
- ✅ Console 无 `[App] Send button clicked` 日志

---

### TC-107: 输入空格不算有内容
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 在输入框输入多个空格："     "
2. 观察发送按钮状态

**预期结果**：
- ✅ 发送按钮保持禁用（因为 `content.trim().length === 0`）

---

### TC-108: 下拉菜单打开时 Enter 不发送
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 输入 `@spec`
2. 等待下拉菜单打开
3. 在下拉菜单可见时按 Enter

**预期结果**：
- ✅ 选中下拉菜单的第一项
- ✅ 插入文件徽章
- ✅ **不发送消息**
- ✅ 下拉菜单关闭

---

## ⚠️ 异常测试用例

### TC-201: 无工作区启动
**前置条件**：Extension Development Host 未打开任何文件夹

**测试步骤**：
1. 启动扩展
2. 打开 Chat Panel
3. 尝试输入 `@spec`

**预期结果**：
- ✅ Chat Panel 正常显示
- ✅ 输入框可正常输入
- ✅ 输入 `@` 后下拉菜单显示空列表或错误提示
- ✅ Console 显示：`[App] Context provider query: spec, ...`
- ✅ Extension Host Console 显示：`[SemipilotWebviewProvider] ContextProviderManager not available`

---

### TC-202: 后端未启动
**前置条件**：扩展已启动，后端服务器未运行

**测试步骤**：
1. 确认 `http://localhost:8080` 不可访问
2. 在 Chat Panel 输入消息并发送

**预期结果**：
- ✅ 扩展启动时不尝试连接后端
- ✅ Console 显示：`[Semipilot] SseMessenger initialized in manual mode`
- ✅ 无 `ERR [SseMessenger] SSE connection error` 错误
- ✅ 消息可以正常输入和显示（但不会真正发送到后端）

---

### TC-203: Webview Console 错误检查
**前置条件**：Chat Panel 已打开

**测试步骤**：
1. 按 Cmd+Shift+P
2. 输入："Developer: Open Webview Developer Tools"
3. 选择 "Semipilot Chat"
4. 查看 Console 标签页

**预期结果**：
- ✅ 无 "Uncaught SyntaxError" 错误
- ✅ 无 "acquireVsCodeApi already been acquired" 错误
- ✅ 显示初始化日志：
  ```
  [Webview] HTML loaded
  [Webview] VS Code API acquired and saved to window.__vscodeApi
  [Webview] React root created
  [Webview] React app rendered
  [App] VS Code API retrieved successfully
  ```

---

### TC-204: React 渲染错误处理
**前置条件**：扩展已启动

**测试步骤**：
1. 模拟 React 组件错误（通过 DevTools 注入错误代码）
2. 观察界面

**预期结果**：
- ✅ 显示错误边界提示
- ✅ Console 显示详细错误堆栈
- ✅ 不导致整个 VS Code 崩溃

---

### TC-205: CSS 样式缺失检查
**前置条件**：扩展已启动

**测试步骤**：
1. 检查 `out/webview.js` 文件大小
2. 用文本编辑器搜索 "font-family" 关键词

**预期结果**：
- ✅ `webview.js` 大小约 1.8M
- ✅ 文件中包含 CSS 样式（至少 4 次 "font-family"）
- ✅ 界面样式正常显示（不是纯白背景）

---

## 📊 测试结果记录表

| 测试用例 | 优先级 | 状态 | 执行时间 | 备注 |
|---------|--------|------|---------|------|
| TC-001  | P0     | ⏳   | -       | 冒烟测试 |
| TC-002  | P0     | ⏳   | -       | 冒烟测试 |
| TC-003  | P0     | ⏳   | -       | 冒烟测试 |
| TC-004  | P0     | ⏳   | -       | 冒烟测试 |
| TC-005  | P0     | ⏳   | -       | 冒烟测试 |
| TC-006  | P0     | ⏳   | -       | 冒烟测试 |
| TC-101  | **P0** | ⏳   | -       | **核心边界场景** - 窄屏 |
| TC-102  | P1     | ⏳   | -       | 极限场景 |
| TC-103  | P1     | ⏳   | -       | 长文本 |
| TC-104  | P1     | ⏳   | -       | 多提及 |
| TC-105  | P1     | ⏳   | -       | 换行 |
| TC-106  | **P0** | ⏳   | -       | **核心边界场景** - 空内容禁用 |
| TC-107  | P1     | ⏳   | -       | 空格处理 |
| TC-108  | P1     | ⏳   | -       | 下拉菜单交互 |
| TC-201  | P1     | ⏳   | -       | 无工作区 |
| TC-202  | P1     | ⏳   | -       | 无后端 |
| TC-203  | P0     | ⏳   | -       | Console 错误 |
| TC-204  | P2     | ⏳   | -       | React 错误 |
| TC-205  | P1     | ⏳   | -       | CSS 检查 |

**优先级说明**：
- P0：核心功能，必须通过
- P1：重要功能，建议通过
- P2：辅助功能，可延后

---

## 🔧 本次修复清单

### 修复 1：窄屏时发送按钮消失
**问题**：`.toolbar-right` 没有 `flex-shrink: 0`，窄屏时被挤出视野

**修复代码**：
```css
.toolbar-right {
  flex-shrink: 0; /* 不允许收缩 */
}

.toolbar-send-btn {
  min-width: 32px; /* 确保最小宽度 */
  flex-shrink: 0; /* 不允许收缩 */
}
```

**验证方法**：TC-101, TC-102

---

### 修复 2：发送按钮点击无反应
**问题**：`disabled={!editorRef.current?.hasContent()}` 在 React 中不会实时更新

**修复方案**：
1. TipTapEditor 添加 `onContentChange` 回调
2. App 组件使用 `useState` 追踪 `hasContent`
3. 每次编辑器内容变化时触发回调

**修复代码**：
```typescript
// TipTapEditor.tsx
onUpdate: ({ editor }) => {
  // ...
  const hasContent = editor.getText().trim().length > 0;
  onContentChange?.(hasContent);
}

// App.tsx
const [hasContent, setHasContent] = useState(false);
<button disabled={!hasContent} onClick={...} />
```

**验证方法**：TC-005, TC-106, TC-107

---

### 修复 3：窄屏时工具栏布局优化
**问题**：Agent/Model 下拉在窄屏时可能溢出

**修复代码**：
```css
.toolbar-left {
  flex: 1; /* 允许收缩 */
  min-width: 0; /* 允许收缩到 0 */
  overflow: hidden; /* 隐藏溢出 */
}

.toolbar-select {
  white-space: nowrap; /* 防止换行 */
  text-overflow: ellipsis; /* 显示省略号 */
  min-width: 60px; /* 最小宽度 */
  max-width: 150px; /* 最大宽度 */
}
```

**验证方法**：TC-101, TC-102

---

## 🎯 测试执行建议

### 第一轮：冒烟测试（必须通过）
执行 TC-001 ~ TC-006，确保基本功能可用

### 第二轮：核心边界测试（必须通过）
执行 TC-101, TC-106，确保关键边界场景正常

### 第三轮：扩展测试（建议通过）
执行 TC-102 ~ TC-108，验证其他边界场景

### 第四轮：异常测试（可选）
执行 TC-201 ~ TC-205，验证异常处理

---

## 📝 测试报告模板

**测试人员**：________________
**测试时间**：________________
**测试环境**：
- VS Code 版本：________________
- Node.js 版本：________________
- 操作系统：________________

**测试结果**：
- ✅ 通过：__ / __
- ❌ 失败：__ / __
- ⏭️ 跳过：__ / __

**失败用例详情**：
| 用例编号 | 失败原因 | 复现步骤 | 错误截图 |
|---------|---------|---------|---------|
|         |         |         |         |

**备注**：
