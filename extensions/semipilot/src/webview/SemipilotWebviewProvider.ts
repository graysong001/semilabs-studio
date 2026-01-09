/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Semipilot Webview Provider
 * 
 * Responsibilities:
 * - Create and manage the Chat Panel webview
 * - Load TipTap Editor UI
 * - Bridge VS Code Extension <-> Webview communication
 */

import * as vscode from 'vscode';

export class SemipilotWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'semipilot.chatView';
  
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext
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
        vscode.Uri.joinPath(this._extensionUri, 'out'),
        vscode.Uri.joinPath(this._extensionUri, 'webview-ui')
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
          this._handleUserMessage(data.message);
          break;
        case 'contextProvider':
          this._handleContextProvider(data.providerId, data.query);
          break;
      }
    });

    console.log('[SemipilotWebviewProvider] Webview fully initialized');
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // For now, use a simple inline HTML with React mount point
    // TODO: Phase 1 Week 2 - Build actual React app with Webpack/Vite
    
    console.log('[SemipilotWebviewProvider] Generating HTML for webview...');
    const nonce = this._getNonce();
    console.log('[SemipilotWebviewProvider] Generated nonce:', nonce);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Semipilot Chat</title>
    <style>
        body {
            padding: 10px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            font-family: var(--vscode-font-family);
        }
        #root {
            width: 100%;
            height: 100vh;
        }
        .editor-container {
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 8px;
            min-height: 100px;
            background-color: var(--vscode-input-background);
            position: relative;
        }
        .editor-container[data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: var(--vscode-input-placeholderForeground);
            pointer-events: none;
            position: absolute;
            left: 8px;
            top: 8px;
        }
        .editor-container.is-empty:before {
            content: attr(data-placeholder);
            color: var(--vscode-input-placeholderForeground);
            pointer-events: none;
            position: absolute;
            left: 8px;
            top: 8px;
        }
        .toolbar {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
            gap: 8px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div id="root">
        <h3>Semipilot Chat Panel</h3>
        <div class="editor-container" 
             contenteditable="true" 
             id="editor"
             data-placeholder="Type @ to mention context providers...">
        </div>
        <div class="toolbar">
            <button id="sendBtn">Send</button>
        </div>
    </div>

    <script nonce="${nonce}">
        // 自动诊断脚本
        (function() {
            const startTime = Date.now();
            console.log('[Webview] Script started at', new Date().toISOString());
            
            try {
                const vscode = acquireVsCodeApi();
                console.log('[Webview] ✅ VSCode API acquired successfully');
                
                // 发送初始化成功消息
                vscode.postMessage({
                    type: 'webviewReady',
                    timestamp: Date.now()
                });
                
                const editor = document.getElementById('editor');
                const sendBtn = document.getElementById('sendBtn');
                const root = document.getElementById('root');
                
                console.log('[Webview] DOM elements check:');
                console.log('  - root:', root ? '✅' : '❌');
                console.log('  - editor:', editor ? '✅' : '❌');
                console.log('  - sendBtn:', sendBtn ? '✅' : '❌');
                
                if (!editor || !sendBtn) {
                    throw new Error('Missing required DOM elements');
                }

                // 初始化时确保显示 placeholder
                function updatePlaceholder() {
                    const isEmpty = !editor.textContent || editor.textContent.trim() === '';
                    if (isEmpty) {
                        editor.classList.add('is-empty');
                    } else {
                        editor.classList.remove('is-empty');
                    }
                }
                
                // 初始检查
                updatePlaceholder();

                // Simple @ mention detection (placeholder for TipTap)
                editor.addEventListener('input', (e) => {
                    updatePlaceholder();
                    const text = editor.textContent;
                    if (text.includes('@')) {
                        console.log('[Webview] @ detected - TipTap will show dropdown here');
                    }
                });
                
                // 焦点事件也更新 placeholder
                editor.addEventListener('focus', updatePlaceholder);
                editor.addEventListener('blur', updatePlaceholder);

                sendBtn.addEventListener('click', () => {
                    const message = editor.textContent.trim();
                    if (message) {
                        console.log('[Webview] Sending message:', message);
                        vscode.postMessage({
                            type: 'userMessage',
                            message: message
                        });
                        editor.textContent = '';
                        editor.classList.add('is-empty'); // 清空后立即显示 placeholder
                    }
                });
                
                const loadTime = Date.now() - startTime;
                console.log('[Webview] OK Initialization complete in ' + loadTime + 'ms');
                console.log('[Webview] Semipilot Webview initialized (Phase 1 Week 1 Day 3 - Basic skeleton)');
                
                // 添加视觉反馈：在界面上显示状态
                const statusDiv = document.createElement('div');
                statusDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; padding: 4px 8px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-radius: 3px; font-size: 11px;';
                statusDiv.textContent = 'OK Webview Ready';
                document.body.appendChild(statusDiv);
                
                // 3秒后移除状态提示
                setTimeout(() => {
                    statusDiv.style.transition = 'opacity 0.5s';
                    statusDiv.style.opacity = '0';
                    setTimeout(() => statusDiv.remove(), 500);
                }, 3000);
                
            } catch (error) {
                console.error('[Webview] ERROR Initialization failed:', error);
                
                // 显示错误信息在界面上
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); border: 1px solid var(--vscode-inputValidation-errorBorder); border-radius: 4px; max-width: 80%; text-align: center;';
                errorDiv.innerHTML = '<strong>ERROR: Webview Initialization Failed</strong><br><br>' +
                    error.message + '<br><br>' +
                    '<small>Please open Developer Tools for details</small>';
                document.body.appendChild(errorDiv);
            }
        })();
    </script>
</body>
</html>`;
  }

  private _handleUserMessage(message: string): void {
    console.log('User message received:', message);
    // TODO: Phase 1 Week 2 - Send to backend via SSE
  }

  private _handleContextProvider(providerId: string, query: string): void {
    console.log('Context provider query:', providerId, query);
    // TODO: Phase 1 Week 1 Day 4 - Implement @spec provider
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
