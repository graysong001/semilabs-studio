/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Semipilot Webview Provider - 简化测试版本
 * 
 * 用于验证 Webview 基础功能是否正常
 */

import * as vscode from 'vscode';

export class SemipilotWebviewProviderTest implements vscode.WebviewViewProvider {
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
    console.log('[TEST] resolveWebviewView called');
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out')
      ]
    };

    console.log('[TEST] Setting webview HTML...');
    webviewView.webview.html = this._getTestHtml(webviewView.webview);
    console.log('[TEST] Webview HTML set');

    // Handle messages
    webviewView.webview.onDidReceiveMessage((data) => {
      console.log('[TEST] Message from webview:', data);
      
      if (data.type === 'test') {
        vscode.window.showInformationMessage('✅ Webview 测试成功！收到消息: ' + data.message);
      }
    });
  }

  private _getTestHtml(webview: vscode.Webview): string {
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Semipilot Test</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
        }
        h1 {
            color: var(--vscode-foreground);
            margin-top: 0;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }
        .success {
            color: var(--vscode-testing-iconPassed);
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            margin: 5px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        input {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px;
            width: 300px;
            border-radius: 4px;
        }
        .log {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Semipilot Chat - 测试模式</h1>
        
        <div class="status success" id="status">
            ✅ Webview HTML 加载成功！
        </div>
        
        <div class="status">
            <strong>测试项目：</strong>
            <ul id="tests">
                <li>HTML 渲染: <span class="success">✅</span></li>
                <li>CSS 样式: <span class="success">✅</span></li>
                <li id="jsTest">JavaScript 执行: ⏳ 等待...</li>
                <li id="vscodeApiTest">VS Code API: ⏳ 等待...</li>
                <li id="messageTest">消息通信: ⏳ 等待...</li>
            </ul>
        </div>
        
        <div>
            <h3>交互测试</h3>
            <input type="text" id="testInput" placeholder="输入测试文本..." />
            <button class="button" onclick="sendTestMessage()">发送测试消息</button>
            <button class="button" onclick="clearLog()">清空日志</button>
        </div>
        
        <div class="log" id="log"></div>
    </div>

    <script nonce="${nonce}">
        const log = document.getElementById('log');
        const jsTest = document.getElementById('jsTest');
        const vscodeApiTest = document.getElementById('vscodeApiTest');
        const messageTest = document.getElementById('messageTest');
        
        function addLog(message) {
            const time = new Date().toLocaleTimeString();
            log.innerHTML += \`[\${time}] \${message}<br>\`;
            log.scrollTop = log.scrollHeight;
        }
        
        function clearLog() {
            log.innerHTML = '';
        }
        
        // 测试 1: JavaScript 执行
        try {
            addLog('[测试 1] JavaScript 引擎正常');
            jsTest.innerHTML = 'JavaScript 执行: <span class="success">✅</span>';
        } catch (e) {
            jsTest.innerHTML = 'JavaScript 执行: ❌ ' + e;
        }
        
        // 测试 2: VS Code API
        let vscode;
        try {
            vscode = acquireVsCodeApi();
            addLog('[测试 2] VS Code API 可用');
            vscodeApiTest.innerHTML = 'VS Code API: <span class="success">✅</span>';
        } catch (e) {
            addLog('[测试 2] VS Code API 失败: ' + e);
            vscodeApiTest.innerHTML = 'VS Code API: ❌ ' + e;
        }
        
        // 测试 3: 消息通信
        function sendTestMessage() {
            const input = document.getElementById('testInput');
            const message = input.value || '测试消息';
            
            if (vscode) {
                try {
                    addLog('[发送] ' + message);
                    vscode.postMessage({
                        type: 'test',
                        message: message
                    });
                    messageTest.innerHTML = '消息通信: <span class="success">✅</span>';
                    input.value = '';
                } catch (e) {
                    addLog('[错误] 发送失败: ' + e);
                    messageTest.innerHTML = '消息通信: ❌ ' + e;
                }
            } else {
                addLog('[错误] VS Code API 不可用');
            }
        }
        
        // 自动发送初始化消息
        if (vscode) {
            vscode.postMessage({
                type: 'test',
                message: 'Webview 初始化成功'
            });
        }
        
        addLog('[启动] Semipilot 测试模式已加载');
        addLog('[提示] 请点击"发送测试消息"按钮测试通信');
    </script>
</body>
</html>`;
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
