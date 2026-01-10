/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Semipilot Webview React 入口
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

console.log('[Webview] index.tsx loaded');
console.log('[Webview] window.acquireVsCodeApi:', typeof (window as any).acquireVsCodeApi);

// 先获取 VS Code API（只能调用一次），并保存到 window 对象
try {
  if (typeof (window as any).acquireVsCodeApi === 'function') {
    // ⚠️ acquireVsCodeApi() 只能调用一次，保存到 window.__vscodeApi
    (window as any).__vscodeApi = (window as any).acquireVsCodeApi();
    console.log('[Webview] VS Code API acquired and saved to window.__vscodeApi');
    
    // 通知 Extension Host Webview 已准备就绪
    (window as any).__vscodeApi.postMessage({
      type: 'webviewReady',
      timestamp: Date.now()
    });
  } else {
    console.error('[Webview] acquireVsCodeApi is not available');
  }
} catch (error) {
  console.error('[Webview] Error acquiring VS Code API:', error);
}

// 然后挂载 React 应用
try {
  const rootElement = document.getElementById('root');
  console.log('[Webview] Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('[Webview] React root created');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[Webview] React app rendered');
} catch (error) {
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
