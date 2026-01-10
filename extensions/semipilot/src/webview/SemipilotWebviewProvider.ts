/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Semipilot Webview Provider - React + TipTap Edition
 * 
 * Responsibilities:
 * - Create and manage the Chat Panel webview
 * - Load React + TipTap Editor UI
 * - Bridge VS Code Extension <-> Webview communication
 */

import * as vscode from 'vscode';
import { ContextProviderManager } from '../context/ContextProviderManager';

export class SemipilotWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'semipilot.chatView';
  
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext,
    private readonly _contextManager?: ContextProviderManager // 可选，因为可能没有工作区
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void | Thenable<void> {
    console.log('[SemipilotWebviewProvider] resolveWebviewView called');
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out')
      ]
    };

    console.log('[SemipilotWebviewProvider] Setting webview HTML...');
    try {
      webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
      console.log('[SemipilotWebviewProvider] Webview HTML set successfully');
    } catch (error) {
      console.error('[SemipilotWebviewProvider] Error setting webview HTML:', error);
    }

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((data) => {
      console.log('[SemipilotWebviewProvider] Message received from webview:', data);
      switch (data.type) {
        case 'webviewReady':
          console.log('[SemipilotWebviewProvider] ✅ Webview initialized successfully');
          vscode.window.showInformationMessage('Semipilot Chat Panel is ready!');
          break;
        case 'userMessage':
          this._handleUserMessage(data.message, data.contextItems, data.agent, data.model);
          break;
        case 'contextProvider':
          this._handleContextProvider(data.providerId, data.query);
          break;
        case 'newChat':
          console.log('[SemipilotWebviewProvider] New chat requested');
          break;
        case 'openSettings':
          console.log('[SemipilotWebviewProvider] Settings requested');
          break;
        case 'moreOptions':
          console.log('[SemipilotWebviewProvider] More options requested');
          break;
      }
    });

    console.log('[SemipilotWebviewProvider] Webview fully initialized');
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // 获取打包后的 webview.js 文件路径
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js')
    );
    
    console.log('[SemipilotWebviewProvider] Generating HTML for webview...');
    const nonce = this._getNonce();
    console.log('[SemipilotWebviewProvider] Generated nonce:', nonce);
    console.log('[SemipilotWebviewProvider] Script URI:', scriptUri.toString());

    // 宽松的 CSP 配置，允许所有 vscode-webview 资源
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} https: data:`,
      `script-src 'nonce-${nonce}'`,
      `connect-src ${webview.cspSource} https: data:` // 允许 sourcemap 和其他连接
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
        }
        #root {
            width: 100%;
            height: 100vh;
        }
        /* 加载提示 */
        #loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div id="root">
        <div id="loading">Loading Semipilot Chat...</div>
    </div>
    <script nonce="${nonce}">
        console.log('[Webview] HTML loaded');
        
        // 添加全局错误处理
        window.addEventListener('error', function(e) {
            console.error('[Webview] Global error:', e.error || e.message);
            var rootEl = document.getElementById('root');
            if (rootEl) {
                rootEl.innerHTML = '<div style="padding:20px;color:var(--vscode-errorForeground);"><h2>Error Loading Chat Panel</h2><pre>' + (e.error ? e.error.stack : e.message) + '</pre></div>';
            }
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.error('[Webview] Unhandled rejection:', e.reason);
        });
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _handleUserMessage(message: string, contextItems: any[], agent: string, model: string): void {
    console.log('[SemipilotWebviewProvider] User message:', message);
    console.log('[SemipilotWebviewProvider] Context items:', contextItems);
    console.log('[SemipilotWebviewProvider] Agent:', agent, 'Model:', model);
    // TODO: Phase 1 Week 2 - Send to backend via SSE
  }

  private async _handleContextProvider(providerId: string, query: string): Promise<void> {
    console.log('[SemipilotWebviewProvider] Context provider query:', providerId, query);
    
    if (!this._contextManager) {
      console.warn('[SemipilotWebviewProvider] ContextProviderManager not available');
      this._view?.webview.postMessage({
        type: 'contextProviderResults',
        providerId,
        query,
        results: [],
        error: 'No workspace folder opened'
      });
      return;
    }
    
    try {
      const provider = this._contextManager.getProvider(providerId);
      if (!provider) {
        console.warn(`[SemipilotWebviewProvider] Provider not found: ${providerId}`);
        this._view?.webview.postMessage({
          type: 'contextProviderResults',
          providerId,
          query,
          results: []
        });
        return;
      }
      
      // 调用 provider 的 search 方法
      const results = await provider.search(query);
      console.log(`[SemipilotWebviewProvider] Found ${results.length} results for "${query}"`);
      
      // 返回结果给 Webview
      this._view?.webview.postMessage({
        type: 'contextProviderResults',
        providerId,
        query,
        results: results.map(item => ({
          id: item.id,
          label: item.title,
          type: item.type,
          description: item.description,
          metadata: item.metadata
        }))
      });
    } catch (error) {
      console.error('[SemipilotWebviewProvider] Error querying context provider:', error);
      this._view?.webview.postMessage({
        type: 'contextProviderResults',
        providerId,
        query,
        results: [],
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
