# Semipilot Webview 调试指南

## 问题症状
✅ Extension Host 日志显示 "Webview initialized successfully"  
❌ 但聊天输入区域和顶部按钮都不显示

## 调试步骤

### 1. 查看 Webview Console
Webview 有独立的 Console，需要单独打开：

**方法 A: 通过命令面板**
```
1. 按 Cmd+Shift+P (Mac) 或 Ctrl+Shift+P (Windows/Linux)
2. 输入 "Developer: Open Webview Developer Tools"
3. 选择 "Semipilot Chat" webview
4. 查看 Console 标签页的错误信息
```

**方法 B: 通过右键菜单**
```
1. 右键点击 Semipilot Chat Panel 区域
2. 选择 "Inspect Element"（如果有）
3. 查看 Console 标签页
```

### 2. 常见错误排查

#### 错误 1: React 未定义
```
Uncaught ReferenceError: React is not defined
```
**原因**: esbuild 打包问题  
**解决**: 确认 React 和 ReactDOM 已正确打包到 webview.js

#### 错误 2: CSP 阻止脚本执行
```
Refused to execute inline script because it violates CSP
```
**原因**: Content Security Policy 太严格  
**解决**: 已在 SemipilotWebviewProvider 中添加 nonce

#### 错误 3: 找不到 #root 元素
```
Target container is not a DOM element
```
**原因**: React 尝试在 DOM 加载前挂载  
**解决**: 确认脚本在 `</body>` 前加载

#### 错误 4: CSS 未加载
```
界面显示但没有样式
```
**原因**: CSS 没有正确内联到 JS  
**解决**: 使用 esbuild CSS inline plugin

### 3. 验证打包结果

检查 webview.js 文件大小：
```bash
ls -lh out/webview.js
# 应该在 1-2MB（包含 React + TipTap + 所有依赖）
```

检查文件内容（搜索关键字）：
```bash
grep -o "React" out/webview.js | head -1
grep -o "ReactDOM" out/webview.js | head -1
grep -o "TipTap" out/webview.js | head -1
```

### 4. 临时降级方案

如果 React 打包有问题，可以临时使用简化版 HTML：

```typescript
// src/webview/SemipilotWebviewProvider.ts
private _getHtmlForWebview(webview: vscode.Webview): string {
  const nonce = this._getNonce();
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Semipilot Chat</title>
    <style>
        body { font-family: var(--vscode-font-family); margin: 0; padding: 20px; }
        .test { color: var(--vscode-foreground); }
    </style>
</head>
<body>
    <div class="test">
        <h1>Semipilot Chat - 测试页面</h1>
        <p>如果你能看到这段文字，说明 Webview HTML 加载成功。</p>
        <input type="text" placeholder="测试输入框" />
        <button onclick="alert('按钮点击成功')">测试按钮</button>
    </div>
    <script nonce="${nonce}">
        console.log('[Webview] 测试脚本执行成功');
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ type: 'test', message: 'Webview 脚本正常' });
    </script>
</body>
</html>`;
}
```

### 5. 手动验证 React 应用

在浏览器中测试 React 应用：

```bash
# 创建临时 HTML 文件
cat > /tmp/test-react.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test</title>
</head>
<body>
    <div id="root"></div>
    <script src="file:///Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot/out/webview.js"></script>
</body>
</html>
EOF

# 在浏览器中打开
open /tmp/test-react.html
```

### 6. 检查 esbuild 输出

查看详细的构建日志：
```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
npm run compile:webview 2>&1 | tee build.log
```

## 快速修复建议

### 修复 1: 确保 CSS 正确加载

修改 `src/webview/index.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// 直接在 JS 中注入 CSS
const css = `
body {
  font-family: var(--vscode-font-family);
  color: var(--vscode-foreground);
  background-color: var(--vscode-sideBar-background);
  margin: 0;
  padding: 0;
}
/* ... 其他样式 */
`;

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 修复 2: 添加错误边界

创建 `src/webview/ErrorBoundary.tsx`:
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'var(--vscode-errorForeground)' }}>
          <h1>Something went wrong</h1>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

然后在 `index.tsx` 中使用：
```typescript
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

## 当前状态检查

运行以下命令检查当前状态：

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot

echo "=== 1. 检查文件存在 ==="
ls -lh out/webview.js

echo -e "\n=== 2. 检查 React 打包 ==="
grep -c "React" out/webview.js || echo "未找到 React"

echo -e "\n=== 3. 检查 CSS 内联 ==="
grep -c "font-family" out/webview.js || echo "未找到 CSS"

echo -e "\n=== 4. 重新编译 ==="
npm run compile && npm run compile:webview

echo -e "\n=== 5. 完成，请按 Cmd+R 重新加载 Extension Development Host ==="
```

## 预期结果

✅ **成功的标志**:
- Webview Console 显示: `[Webview] Loading React app...`
- Webview Console 显示: `[Webview] Script executed successfully`
- 顶部标题栏显示: 🤖 SEMIPILOT: CHAT + [操作按钮]
- 底部输入框正常显示

❌ **失败的标志**:
- Webview Console 有红色错误
- 界面完全空白
- 只看到白色/黑色背景

## 下一步

请按照以下顺序操作：

1. **在 Extension Development Host 中按 Cmd+Shift+P**
2. **输入 "Developer: Open Webview Developer Tools"**
3. **选择 Semipilot Chat webview**
4. **截图 Console 标签页的内容**
5. **告诉我看到了什么错误信息**

然后我可以针对性地修复问题！
