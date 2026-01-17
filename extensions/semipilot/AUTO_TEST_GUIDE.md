# Semipilot Extension 自动化测试指南

**@SpecTrace**: cap-ui-semipilot  
**更新日期**: 2026-01-09

---

## 🚀 高效调试方案

### 方案 1: 一键自动化测试（推荐）⭐

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
node test-extension.js
```

**功能**:
- ✅ 自动编译 TypeScript
- ✅ 检查关键文件是否存在
- ✅ 验证 package.json 配置
- ✅ 生成测试报告 (test-report.json)
- ✅ 显示下一步操作指引

**输出示例**:
```
🚀 Semipilot Extension 自动化测试
=====================================

📦 Step 1: 编译 TypeScript...
✅ 编译成功

🔍 Step 2: 检查关键文件...
  ✅ out/extension.js
  ✅ out/webview/SemipilotWebviewProvider.js
  ✅ out/context/SpecContextProvider.js

✅ 所有关键文件存在

📊 Step 3: 生成配置检查报告...
  配置检查:
    Main Entry: ✅
    Webview View: ✅
    Command: ✅

=====================================
✅ 自动化测试完成！
```

---

### 方案 2: Webview 自动诊断（内置）

Webview 现在包含**自动诊断代码**：

#### 功能特性

1. **启动日志**:
   ```
   [Webview] Script started at 2026-01-09T10:30:00.000Z
   [Webview] ✅ VSCode API acquired successfully
   [Webview] DOM elements check:
     - root: ✅
     - editor: ✅
     - sendBtn: ✅
   [Webview] ✅ Initialization complete in 15ms
   ```

2. **视觉反馈**:
   - 右下角显示 "✅ Webview Ready" 状态提示（3秒后自动消失）
   - 如果初始化失败，屏幕中央显示错误信息

3. **自动通知**:
   - 初始化成功后，Extension 会显示通知："Semipilot Chat Panel is ready!"

4. **错误处理**:
   - 捕获所有初始化错误
   - 在界面上显示友好的错误提示
   - Console 输出详细堆栈信息

---

## 📋 完整测试流程

### Step 1: 运行自动化测试

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
node test-extension.js
```

### Step 2: 启动 Extension Development Host

在 VS Code 中：
```
1. 打开 semilabs-studio 目录
2. 按 F5
```

### Step 3: 验证 Webview 加载

在 Extension Development Host 窗口中：

**自动验证标志**:
1. ✅ 右下角出现 "✅ Webview Ready" 提示（3秒）
2. ✅ VS Code 右下角通知："Semipilot Chat Panel is ready!"
3. ✅ Chat Panel 显示正常 UI（标题、输入框、按钮）

**如果失败**:
- ❌ 屏幕中央显示错误信息
- ❌ 打开 Developer Tools 查看详细日志

### Step 4: 查看日志（可选）

打开 Developer Tools (Help → Toggle Developer Tools):

**Extension Host 日志**:
```
[Semipilot] Activating extension...
[ContextProviderManager] Initialized with providers: file, spec
[SpecContextProvider] Building index...
[SemipilotWebviewProvider] resolveWebviewView called
[SemipilotWebviewProvider] Setting webview HTML...
[SemipilotWebviewProvider] Webview HTML set successfully
[SemipilotWebviewProvider] ✅ Webview initialized successfully
```

**Webview 日志**:
```
[Webview] Script started at 2026-01-09T10:30:00.000Z
[Webview] ✅ VSCode API acquired successfully
[Webview] DOM elements check: all ✅
[Webview] ✅ Initialization complete in 15ms
```

---

## 🎯 问题诊断矩阵

| 症状 | 可能原因 | 解决方案 |
|------|---------|---------|
| Chat Panel 空白 | HTML 未加载 | 查看 Console 日志 |
| 无 "Webview Ready" 提示 | JavaScript 执行失败 | 检查 CSP 设置 |
| 无 VS Code 通知 | postMessage 失败 | 检查 vscode API |
| 编译失败 | TypeScript 错误 | 运行 `npm run compile` 查看详情 |

---

## 🛠️ 一键修复命令

### 完全重置

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

# 清理
rm -rf node_modules out

# 重新安装
npm install

# 编译
npm run compile

# 测试
node test-extension.js
```

### 快速重编译

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run compile && node test-extension.js
```

---

## 📊 测试报告

自动化测试会生成 `test-report.json`:

```json
{
  "timestamp": "2026-01-09T10:30:00.000Z",
  "name": "semipilot",
  "version": "0.1.0",
  "checks": {
    "mainEntry": true,
    "webviewView": true,
    "command": true
  },
  "files": {
    "extensionJs": true,
    "webviewProvider": true,
    "specProvider": true
  }
}
```

---

## 🚦 CI/CD 集成（未来）

可以将自动化测试集成到 CI/CD 流程：

```yaml
# .github/workflows/test-extension.yml
name: Test Extension

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install
        working-directory: extensions/semipilot
      - name: Run tests
        run: node test-extension.js
        working-directory: extensions/semipilot
```

---

## 💡 最佳实践

### 开发流程

```bash
# 1. 修改代码
vim src/webview/SemipilotWebviewProvider.ts

# 2. 快速测试
node test-extension.js

# 3. 在 VS Code 中按 F5

# 4. 在 Extension Development Host 中按 Cmd+R 重新加载

# 5. 观察自动诊断结果
```

### 调试技巧

1. **使用自动诊断**: 观察 "Webview Ready" 提示
2. **查看 Console**: 完整的初始化日志
3. **利用通知**: VS Code 通知确认成功
4. **错误提示**: 界面上的错误信息

---

## 📚 相关文档

- [QUICKSTART.md](./QUICKSTART.md) - 快速开始
- [HOW_TO_RUN.md](./HOW_TO_RUN.md) - 运行指南
- [GLOSSARY.md](./GLOSSARY.md) - 术语表
- [TEST_RESULTS.md](./TEST_RESULTS.md) - 测试结果

---

**更新日期**: 2026-01-09  
**维护者**: Cody (Code Generation Agent)  
**状态**: ✅ READY FOR AUTOMATION
