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
import { TaskContextProvider, TaskDocument, Priority, TaskStatus } from '../context/TaskContextProvider';
import { SseMessenger } from '../messenger/SseMessenger';

export class SemipilotWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'semipilot.chatView';
  
  private _view?: vscode.WebviewView;
  private _taskProvider?: TaskContextProvider;
  private _currentSessionId?: string; // Slice 1: 缓存当前会话ID

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext,
    private readonly _messenger: SseMessenger, // Backend通信
    private readonly _contextManager?: ContextProviderManager // 可选，因为可能没有工作区
  ) {
    // 初始化TaskContextProvider
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      this._taskProvider = new TaskContextProvider(workspaceRoot);
    }
  }

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
        case 'slashCommand':
          this._handleSlashCommand(data.command, data.args);
          break;
        case 'openTask':
          this._handleOpenTask(data.filePath);
          break;
        case 'newChat':
          console.log('[SemipilotWebviewProvider] New chat requested');
          // Slice 1: 清除当前会话，下次发消息时创建新会话
          this._currentSessionId = undefined;
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

  private async _handleUserMessage(message: string, contextItems: any[], agent: string, model: string): Promise<void> {
    console.log('[SemipilotWebviewProvider] User message:', message);
    console.log('[SemipilotWebviewProvider] Context items:', contextItems);
    console.log('[SemipilotWebviewProvider] Agent:', agent, 'Model:', model);
    
    try {
      // Slice 1: 复用现有会话或创建新会话
      // TODO(Slice 2): 管理多个会话，持久化sessionId
      if (!this._currentSessionId) {
        const session = await this._messenger.request('chat/create-session', {
          title: 'Semipilot Chat',
          specId: 'cap-ui-semipilot',
          specVersion: '1.0.0',
        });
        this._currentSessionId = session.sessionId;
        console.log('[SemipilotWebviewProvider] New session created:', this._currentSessionId);
      } else {
        console.log('[SemipilotWebviewProvider] Reusing session:', this._currentSessionId);
      }
      
      // 发送消息到Backend
      const response = await this._messenger.request('chat/send-message', {
        sessionId: this._currentSessionId,
        request: {
          content: message, // Slice 1: 仅content字段
        },
      });
      
      console.log('[SemipilotWebviewProvider] Message response:', response);
      
      // 发送Agent回复给Webview
      this._view?.webview.postMessage({
        type: 'assistantMessage',
        message: {
          id: response.messageId,
          content: response.content,
          isUser: false,
          timestamp: Date.now(),
          persona: response.persona,
        },
      });
      
    } catch (error) {
      console.error('[SemipilotWebviewProvider] Error sending message:', error);
      
      // 发送错误消息给Webview
      this._view?.webview.postMessage({
        type: 'assistantMessage',
        message: {
          id: Date.now().toString(),
          content: `❗ 错误：${error instanceof Error ? error.message : String(error)}`,
          isUser: false,
          timestamp: Date.now(),
          persona: 'system',
        },
      });
    }
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

  private async _handleSlashCommand(command: string, args?: string): Promise<void> {
    console.log('[SemipilotWebviewProvider] Slash command:', command, args);
    
    switch (command) {
      case 'tasks':
        await this._handleTasksCommand();
        break;
      default:
        console.warn(`[SemipilotWebviewProvider] Unknown command: ${command}`);
    }
  }

  private async _handleTasksCommand(): Promise<void> {
    console.log('[SemipilotWebviewProvider] Executing /tasks command');
    
    // 获取工作区根目录
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      this._view?.webview.postMessage({
        type: 'slashCommandResult',
        result: '💡 提示：未检测到任务目录\n\n这可能是一个新工作区，还未创建任务。\n使用 Poe 创建第一个任务吧！'
      });
      return;
    }
    
    if (!this._taskProvider) {
      console.error('[SemipilotWebviewProvider] TaskContextProvider not initialized');
      return;
    }
    
    try {
      // 扫描并解析任务
      const tasks = await this._taskProvider.scanTasks();
      
      console.log(`[SemipilotWebviewProvider] Parsed ${tasks.length} tasks`);
      
      if (tasks.length === 0) {
        this._view?.webview.postMessage({
          type: 'slashCommandResult',
          result: '🎉 所有任务已完成！\n\n可以创建新任务或回顾已完成工作'
        });
        return;
      }
      
      // 排序任务
      const sortedTasks = this._taskProvider.sortTasks(tasks);
      
      // 生成任务列表卡片
      const taskItems = sortedTasks.map(task => {
        const priorityIcon = this.getPriorityIcon(task.priority);
        const statusText = this.getStatusText(task.status);
        const progressText = task.currentProgress ? ` - ${task.currentProgress}` : '';
        const blockedText = task.blockedTasks && task.blockedTasks.length > 0 
          ? ` | 阻塞${task.blockedTasks.length}个` 
          : '';
        
        return `  ${priorityIcon} <a href="#" data-task-path="${task.filePath}">${task.taskId}</a> [${statusText}]${progressText}${blockedText} (score: ${task.score})`;
      }).join('\n');
      
      const result = `📋 未完成任务 (${sortedTasks.length}个)

${taskItems}

提示：点击任务ID查看详情`;
      
      // 发送任务数据（用于点击处理）
      this._view?.webview.postMessage({
        type: 'slashCommandResult',
        result,
        tasks: sortedTasks.map(t => ({
          taskId: t.taskId,
          filePath: t.filePath
        }))
      });
      
    } catch (error) {
      console.error('[SemipilotWebviewProvider] Error executing /tasks:', error);
      this._view?.webview.postMessage({
        type: 'slashCommandResult',
        result: `❌ 错误：${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async _handleOpenTask(filePath: string): Promise<void> {
    console.log('[SemipilotWebviewProvider] Opening task:', filePath);
    
    try {
      // 调用VS Code命令打开文档
      await vscode.commands.executeCommand('semilabs.openTaskDocument', filePath);
    } catch (error) {
      console.error('[SemipilotWebviewProvider] Error opening task:', error);
    }
  }

  private getPriorityIcon(priority: Priority): string {
    switch (priority) {
      case Priority.HIGH:
        return '🔴';
      case Priority.MEDIUM:
        return '🟡';
      case Priority.LOW:
        return '🟢';
      default:
        return '⚪';
    }
  }

  private getStatusText(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        return 'IN_PROGRESS';
      case TaskStatus.PAUSED:
        return 'PAUSED';
      case TaskStatus.PENDING:
        return 'PENDING';
      case TaskStatus.COMPLETED:
        return 'COMPLETED';
      default:
        return 'UNKNOWN';
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
