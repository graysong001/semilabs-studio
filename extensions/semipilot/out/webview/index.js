"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Semipilot Webview React 入口
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const App_1 = require("./App");
require("./styles.css");
console.log('[Webview] index.tsx loaded');
console.log('[Webview] window.acquireVsCodeApi:', typeof window.acquireVsCodeApi);
// 先获取 VS Code API（只能调用一次），并保存到 window 对象
try {
    if (typeof window.acquireVsCodeApi === 'function') {
        // ⚠️ acquireVsCodeApi() 只能调用一次，保存到 window.__vscodeApi
        window.__vscodeApi = window.acquireVsCodeApi();
        console.log('[Webview] VS Code API acquired and saved to window.__vscodeApi');
        // 通知 Extension Host Webview 已准备就绪
        window.__vscodeApi.postMessage({
            type: 'webviewReady',
            timestamp: Date.now()
        });
    }
    else {
        console.error('[Webview] acquireVsCodeApi is not available');
    }
}
catch (error) {
    console.error('[Webview] Error acquiring VS Code API:', error);
}
// 然后挂载 React 应用
try {
    const rootElement = document.getElementById('root');
    console.log('[Webview] Root element:', rootElement);
    if (!rootElement) {
        throw new Error('Root element not found');
    }
    const root = client_1.default.createRoot(rootElement);
    console.log('[Webview] React root created');
    root.render(react_1.default.createElement(react_1.default.StrictMode, null,
        react_1.default.createElement(App_1.App, null)));
    console.log('[Webview] React app rendered');
}
catch (error) {
    console.error('[Webview] Error mounting React app:', error);
    // 显示错误信息
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `
      <div style="padding: 20px; color: #f48771;">
        <h2>Error Loading Chat Panel</h2>
        <pre>${error instanceof Error ? error.stack : String(error)}</pre>
      </div>
    `;
    }
}
//# sourceMappingURL=index.js.map