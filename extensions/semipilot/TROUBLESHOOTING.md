# Semipilot Extension 故障排除

**@SpecTrace**: cap-ui-semipilot  
**更新日期**: 2026-01-09

---

## 🔥 常见错误及解决方案

### 错误 1: "EventSource is not defined"

#### 症状
```
Activating extension 'undefined_publisher.semipilot' failed: EventSource is not defined.
```

#### 原因
- VS Code Extension 运行在 **Node.js 环境**中
- `EventSource` 是**浏览器 API**，Node.js 原生不支持
- [`SseMessenger.ts`](src/messenger/SseMessenger.ts) 使用了 `new EventSource()`

#### 解决方案 ✅

**1. 安装 `eventsource` npm 包**:
```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm install eventsource
npm install --save-dev @types/eventsource
```

**2. 修改 [`SseMessenger.ts`](src/messenger/SseMessenger.ts)**:
```typescript
// 正确的导入方式:
const EventSource = require('eventsource');

// 使用:
this.eventSource = new EventSource(sseUrl);
```

**3. 重新编译**:
```bash
npm run compile
```

---

### 错误 1.1: "EventSource is not a constructor"

#### 症状
```
Activating extension 'undefined_publisher.semipilot' failed: EventSource is not a constructor.
```

#### 原因
- `eventsource` 包的导出结构是 `{ ErrorEvent, EventSource }`
- 直接 `require('eventsource')` 得到的是对象，不是构造函数
- 需要**解构导入** `EventSource`

#### 解决方案 ✅

**验证包的导出结构**:
```bash
node -e "const ES = require('eventsource'); console.log(Object.keys(ES));"
# 输出: [ 'ErrorEvent', 'EventSource' ]
```

**修改 [`SseMessenger.ts`](src/messenger/SseMessenger.ts)**:
```typescript
// ❌ 错误方式 1:
const EventSource = require('eventsource');
// typeof EventSource === 'object'
// new EventSource(url) → "EventSource is not a constructor"

// ❌ 错误方式 2:
const EventSourceImpl = require('eventsource');
this.eventSource = new EventSourceImpl(sseUrl);
// EventSourceImpl 是对象，不是构造函数

// ✅ 正确方式（解构导入）:
const { EventSource } = require('eventsource');
// typeof EventSource === 'function'
this.eventSource = new EventSource(sseUrl);  // 成功！
```

**完整代码**:
```typescript
// 在文件顶部导入（第 11 行）
const { EventSource } = require('eventsource');

// 在 connectSSE() 方法中使用
private connectSSE() {
  const sseUrl = `${this.baseUrl}/sse/events`;
  this.eventSource = new EventSource(sseUrl);
  // ...
}
```

**重新编译**:
```bash
npm run compile
```

**验证编译结果** (`out/messenger/SseMessenger.js`):
```javascript
// 第 11 行应该是:
const { EventSource } = require('eventsource');
```

---

### 错误 2: "No workspace folder found"

#### 症状
```
[Extension Host] [Semipilot] Activating extension...
Semipilot: No workspace folder found
```

#### 原因
- Extension Development Host 启动时**未打开工作区文件夹**
- `vscode.workspace.workspaceFolders` 返回 `undefined`
- 原始代码在没有工作区时直接 `return`，导致 Webview Provider 未注册

#### 解决方案 ✅

**修改 [`extension.ts`](src/extension.ts)**:
```typescript
// 修改前:
if (!workspaceRoot) {
  vscode.window.showErrorMessage('Semipilot: No workspace folder found');
  return;  // ⚠️ 直接退出
}

// 修改后:
if (!workspaceRoot) {
  console.log('[Semipilot] No workspace folder found. SpecContextProvider will not be available.');
  vscode.window.showWarningMessage('Semipilot: No workspace folder opened. Please open a folder to use @spec feature.');
  // 继续执行 - Webview Provider 仍然会被注册
} else {
  console.log('[Semipilot] Workspace root:', workspaceRoot);
  contextManager = new ContextProviderManager(workspaceRoot);
}
```

**影响**:
- ✅ 即使没有工作区，Chat Panel 也能正常显示
- ✅ @spec 功能需要工作区，会显示友好提示
- ✅ 其他功能（如聊天）不受影响

---

### 错误 3: TypeScript 类型错误

#### 症状
```
error TS2307: Cannot find module 'vscode' or its corresponding type declarations.
error TS2307: Cannot find module 'path' or its corresponding type declarations.
```

#### 原因
- `tsconfig.json` 缺少必要的类型定义
- 缺少 `node` types

#### 解决方案 ✅

**修改 [`tsconfig.json`](tsconfig.json)**:
```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM"],
    "types": ["vscode", "node"]
  }
}
```

---

### 错误 4: Chat Panel 显示空白

#### 症状
- 左侧出现 Semipilot 图标（🤖）
- 点击图标，侧边栏展开
- Chat Panel 面板显示空白

#### 可能原因

**原因 1: Extension 提前退出**
```typescript
// 检查 Console 日志:
[Extension Host] [Semipilot] Activating extension...
Semipilot: No workspace folder found
// 没有后续日志 - Extension 提前退出了
```
→ 参考 **错误 2** 的解决方案

**原因 2: Webview HTML 加载失败**
```typescript
// 检查 Console 日志:
[SemipilotWebviewProvider] resolveWebviewView called
[SemipilotWebviewProvider] ERROR: Failed to set HTML
```
→ 检查 CSP (Content Security Policy) 配置

**原因 3: JavaScript 执行失败**
```typescript
// Webview Console 中没有任何日志
// 或者显示 CSP 违规错误
```
→ 检查 nonce 值是否正确传递

#### 诊断步骤

1. **打开 Developer Tools** (Help → Toggle Developer Tools)
2. **切换到 Console 标签页**
3. **查看 Extension Host 日志**:
   - 是否有 `[Semipilot] Extension activated successfully`?
   - 是否有 `[SemipilotWebviewProvider] resolveWebviewView called`?
4. **查看 Webview 日志**:
   - 是否有 `[Webview] Script started`?
   - 是否有 `[Webview] ✅ VSCode API acquired`?

---

## 🎯 完整诊断流程

### Step 1: 编译检查
```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run compile
```

**预期**: 无错误输出

### Step 2: 自动化测试
```bash
node test-extension.js
```

**预期**: 所有检查项 ✅

### Step 3: 启动 Extension Development Host
```
在 VS Code 中按 F5
```

**预期**:
1. 新窗口打开
2. Extension Host 启动完成（查看 Console）
3. 左侧出现 Semipilot 图标

### Step 4: 验证 Webview
```
点击 Semipilot 图标
```

**预期**:
1. ✅ 右下角出现 "✅ Webview Ready" 提示（3秒）
2. ✅ VS Code 右下角通知："Semipilot Chat Panel is ready!"
3. ✅ Chat Panel 显示 UI（标题、输入框、发送按钮）

---

## 🛠️ 一键修复脚本

创建 `fix-all.sh`:

```bash
#!/bin/bash

set -e

echo "🔧 Semipilot Extension 一键修复"
echo "================================="

cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

echo "📦 Step 1: 清理旧文件..."
rm -rf node_modules out test-report.json

echo "📦 Step 2: 安装依赖..."
npm install

echo "📦 Step 3: 确保关键依赖已安装..."
npm install eventsource
npm install --save-dev @types/eventsource

echo "🔨 Step 4: 编译..."
npm run compile

echo "✅ Step 5: 运行自动化测试..."
node test-extension.js

echo ""
echo "================================="
echo "✅ 修复完成！"
echo ""
echo "下一步: 在 VS Code 中按 F5 启动调试"
```

**使用方法**:
```bash
chmod +x fix-all.sh
./fix-all.sh
```

---

## 📞 如何获取帮助

1. **查看日志**: Help → Toggle Developer Tools → Console
2. **查看测试报告**: `cat test-report.json`
3. **完整重置**: 运行 `fix-all.sh`
4. **查看文档**:
   - [GLOSSARY.md](GLOSSARY.md) - 术语表
   - [HOW_TO_RUN.md](HOW_TO_RUN.md) - 运行指南
   - [AUTO_TEST_GUIDE.md](AUTO_TEST_GUIDE.md) - 自动化测试指南

---

## 📝 常见问题速查

| 问题 | 快速检查 | 解决方案 |
|------|---------|---------|
| Extension 无法激活 | Console 有 "EventSource is not defined"? | 安装 eventsource 包 |
| Chat Panel 空白 | Console 有 "No workspace folder found"? | 修改 extension.ts 或打开工作区 |
| 编译失败 | 运行 `npm run compile` | 修复 TypeScript 错误 |
| 依赖缺失 | 检查 node_modules 目录 | 运行 `npm install` |

---

## 🎓 学习资源

- [VS Code Extension API 文档](https://code.visualstudio.com/api)
- [Webview API 指南](https://code.visualstudio.com/api/extension-guides/webview)
- [EventSource polyfill for Node.js](https://www.npmjs.com/package/eventsource)
