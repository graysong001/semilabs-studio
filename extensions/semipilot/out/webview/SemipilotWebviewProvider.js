"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemipilotWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
const TaskContextProvider_1 = require("../context/TaskContextProvider");
class SemipilotWebviewProvider {
    addContextFromFile(filePath) {
        if (!this._view) {
            vscode.window.showWarningMessage('Semipilot: Chat Panel 尚未初始化，请先打开 Chat 视图。');
            return;
        }
        this._view.webview.postMessage({
            type: 'addContextFromFile',
            filePath,
        });
    }
    constructor(_extensionUri, _extensionContext, _messenger, // Backend通信
    _contextManager // 可选，因为可能没有工作区
    ) {
        this._extensionUri = _extensionUri;
        this._extensionContext = _extensionContext;
        this._messenger = _messenger;
        this._contextManager = _contextManager;
        // 初始化TaskContextProvider
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            this._taskProvider = new TaskContextProvider_1.TaskContextProvider(workspaceRoot);
        }
        // 监听 Workflow SSE 事件
        this._messenger.on('workflow/event', (message) => {
            this._handleWorkflowEvent(message.data);
        });
    }
    resolveWebviewView(webviewView, context, _token) {
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
        }
        catch (error) {
            console.error('[SemipilotWebviewProvider] Error setting webview HTML:', error);
        }
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage((data) => {
            console.log('[SemipilotWebviewProvider] Message received from webview:', data);
            switch (data.type) {
                case 'webviewReady':
                    console.log('[SemipilotWebviewProvider] ✅ Webview initialized successfully');
                    // 不显示通知，避免遮挡界面
                    // vscode.window.showInformationMessage('Semipilot Chat Panel is ready!');
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
                case 'stopGeneration':
                    // 🐛 修复问题2：停止AI生成
                    this._handleStopGeneration();
                    break;
                case 'openSettings':
                    console.log('[SemipilotWebviewProvider] Settings requested');
                    break;
                case 'moreOptions':
                    console.log('[SemipilotWebviewProvider] More options requested');
                    break;
                case 'workflowAction':
                    // Slice 4: 处理 Workflow 操作（Submit / Veto / Resolve）
                    this._handleWorkflowAction(data.action, data.target, data.params);
                    break;
            }
        });
        console.log('[SemipilotWebviewProvider] Webview fully initialized');
    }
    /**
     * 处理 Workflow SSE 事件
     * Slice 4: 转发给 webview，由 WorkflowCard 组件处理
     */
    _handleWorkflowEvent(event) {
        console.log('[SemipilotWebviewProvider] Workflow event received:', event);
        if (!this._view) {
            console.warn('[SemipilotWebviewProvider] Webview not ready, skipping workflow event');
            return;
        }
        // 转发给 webview
        this._view.webview.postMessage({
            type: 'workflowEvent',
            event: {
                type: event.type,
                target: event.target,
                workflowState: event.workflowState,
                payload: event.payload,
                timestamp: event.timestamp || new Date().toISOString(),
            },
        });
    }
    /**
     * 处理 Workflow 操作（Submit / Veto / Resolve）
     * Slice 4: 调用后端 Workflow REST API
     */
    async _handleWorkflowAction(action, target, params) {
        console.log('[SemipilotWebviewProvider] Workflow action:', action, target, params);
        try {
            let endpoint;
            let body;
            switch (action) {
                case 'submit':
                    endpoint = 'workflow/submit';
                    body = { filePath: target };
                    break;
                case 'veto':
                    endpoint = 'workflow/veto';
                    body = {
                        filePath: target,
                        reason: params?.reason || '需要修改',
                        suggestion: params?.suggestion,
                    };
                    break;
                case 'resolve':
                    endpoint = 'workflow/resolve';
                    body = {
                        filePath: target,
                        userApproved: params?.userApproved !== false,
                    };
                    break;
                default:
                    throw new Error(`Unknown workflow action: ${action}`);
            }
            // 调用后端 API（通过 SseMessenger）
            // 注：这里需要在 SseMessenger 中新增对 Workflow REST API 的支持
            // 暂时直接使用 fetch
            const baseUrl = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
            const response = await fetch(`${baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            console.log('[SemipilotWebviewProvider] Workflow action result:', result);
            // 发送成功消息给 webview
            this._view?.webview.postMessage({
                type: 'assistantMessage',
                message: {
                    id: Date.now().toString(),
                    content: `✅ Workflow 操作成功：**${action}**

目标：\`${target.split(/[\/\\]/).pop()}\`
状态：${result.data?.workflowState || '已更新'}`,
                    isUser: false,
                    timestamp: Date.now(),
                },
            });
        }
        catch (error) {
            console.error('[SemipilotWebviewProvider] Workflow action error:', error);
            // 发送错误消息给 webview
            this._view?.webview.postMessage({
                type: 'assistantMessage',
                message: {
                    id: Date.now().toString(),
                    content: `❌ Workflow 操作失败：${error instanceof Error ? error.message : String(error)}`,
                    isUser: false,
                    timestamp: Date.now(),
                },
            });
        }
    }
    _getHtmlForWebview(webview) {
        // 获取打包后的 webview.js 文件路径
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js'));
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
    async _handleUserMessage(message, contextItems, agent, model) {
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
            }
            else {
                console.log('[SemipilotWebviewProvider] Reusing session:', this._currentSessionId);
            }
            // 在发送前解析上下文项内容（根据类型从对应 Provider 读取全文）
            let resolvedContextItems;
            if (this._contextManager && Array.isArray(contextItems) && contextItems.length > 0) {
                const collected = [];
                for (const item of contextItems) {
                    try {
                        const providerId = item.type === 'spec' ? 'spec' :
                            item.type === 'file' ? 'file' :
                                item.type === 'folder' ? 'file' :
                                    item.type === 'code' ? 'file' : undefined;
                        if (!providerId) {
                            continue;
                        }
                        const provider = this._contextManager.getProvider(providerId);
                        if (!provider) {
                            continue;
                        }
                        const full = await provider.getContent(item.id);
                        if (!full || !full.content) {
                            continue;
                        }
                        collected.push({
                            id: full.id,
                            type: full.type,
                            content: full.content,
                        });
                    }
                    catch (error) {
                        console.error('[SemipilotWebviewProvider] Failed to resolve context item:', item.id, error);
                    }
                }
                if (collected.length > 0) {
                    resolvedContextItems = collected;
                }
            }
            // 发送消息到Backend
            const requestBody = {
                content: message,
            };
            if (resolvedContextItems && resolvedContextItems.length > 0) {
                requestBody.contextItems = resolvedContextItems;
            }
            const response = await this._messenger.request('chat/send-message', {
                sessionId: this._currentSessionId,
                request: requestBody,
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
        }
        catch (error) {
            console.error('[SemipilotWebviewProvider] Error sending message:', error);
            // 优化错误消息，提供更明确的描述
            let errorMessage = '未知错误';
            if (error instanceof Error) {
                // 网络连接错误
                if (error.message.includes('fetch failed') ||
                    error.message.includes('ECONNREFUSED') ||
                    error.message.includes('network') ||
                    error.message.includes('timeout')) {
                    errorMessage = '网络连接失败，请确认Backend服务是否启动（http://localhost:8080）';
                }
                // API错误
                else if (error.message.includes('404') || error.message.includes('Not Found')) {
                    errorMessage = 'API接口不存在，请检查Backend版本';
                }
                // 超时错误
                else if (error.message.includes('timeout')) {
                    errorMessage = '请求超时，AI响应时间过长，请稍后重试';
                }
                // 其他错误
                else {
                    errorMessage = error.message;
                }
            }
            else {
                errorMessage = String(error);
            }
            // 发送错误消息给Webview
            this._view?.webview.postMessage({
                type: 'assistantMessage',
                message: {
                    id: Date.now().toString(),
                    content: `❗ ${errorMessage}`,
                    isUser: false,
                    timestamp: Date.now(),
                    persona: 'system',
                },
            });
        }
    }
    // 🐛 修复问题2：停止AI生成
    async _handleStopGeneration() {
        console.log('[SemipilotWebviewProvider] Stop generation requested');
        // TODO: Backend实现abort endpoint后解注
        // if (this._currentSessionId) {
        //   try {
        //     await this._messenger.request('chat/abort', {
        //       sessionId: this._currentSessionId
        //     });
        //     console.log('[SemipilotWebviewProvider] Generation stopped');
        //   } catch (error) {
        //     console.error('[SemipilotWebviewProvider] Error stopping generation:', error);
        //   }
        // }
        // Slice 1: 仅日志，等待Backend实现
        console.log('[SemipilotWebviewProvider] ⚠️ Stop endpoint not implemented in Backend yet');
    }
    async _handleContextProvider(providerId, query) {
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
            let results = [];
            // 将 folder/code 映射到 file Provider，避免无结果
            const effectiveProviderId = (providerId === 'folder' || providerId === 'code')
                ? 'file'
                : providerId;
            if (effectiveProviderId === 'all') {
                const specProvider = this._contextManager.getProvider('spec');
                const fileProvider = this._contextManager.getProvider('file');
                const [specResults, fileResults] = await Promise.all([
                    specProvider ? specProvider.search(query) : Promise.resolve([]),
                    fileProvider ? fileProvider.search(query) : Promise.resolve([]),
                ]);
                const seen = new Set();
                const merged = [];
                for (const item of specResults) {
                    if (!seen.has(item.id)) {
                        seen.add(item.id);
                        merged.push(item);
                    }
                }
                for (const item of fileResults) {
                    if (!seen.has(item.id)) {
                        seen.add(item.id);
                        merged.push(item);
                    }
                }
                results = merged;
            }
            else {
                const provider = this._contextManager.getProvider(effectiveProviderId);
                if (!provider) {
                    console.warn(`[SemipilotWebviewProvider] Provider not found: ${effectiveProviderId}`);
                    this._view?.webview.postMessage({
                        type: 'contextProviderResults',
                        providerId,
                        query,
                        results: []
                    });
                    return;
                }
                // 调用 provider 的 search 方法
                results = await provider.search(query);
            }
            console.log(`[SemipilotWebviewProvider] Found ${results.length} results for "${query}" (provider: ${providerId})`);
            // 返回结果给 Webview
            this._view?.webview.postMessage({
                type: 'contextProviderResults',
                providerId,
                query,
                results: results.map((item) => ({
                    id: item.id,
                    label: item.title, // 主标签：文件名
                    type: item.type,
                    description: item.description, // 副标签：工作区相对路径
                    metadata: item.metadata
                }))
            });
        }
        catch (error) {
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
    async _handleSlashCommand(command, args) {
        console.log('[SemipilotWebviewProvider] Slash command:', command, args);
        switch (command) {
            case 'tasks':
                await this._handleTasksCommand();
                break;
            default:
                console.warn(`[SemipilotWebviewProvider] Unknown command: ${command}`);
        }
    }
    async _handleTasksCommand() {
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
        }
        catch (error) {
            console.error('[SemipilotWebviewProvider] Error executing /tasks:', error);
            this._view?.webview.postMessage({
                type: 'slashCommandResult',
                result: `❌ 错误：${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    async _handleOpenTask(filePath) {
        console.log('[SemipilotWebviewProvider] Opening task:', filePath);
        try {
            // 调用VS Code命令打开文档
            await vscode.commands.executeCommand('semilabs.openTaskDocument', filePath);
        }
        catch (error) {
            console.error('[SemipilotWebviewProvider] Error opening task:', error);
        }
    }
    getPriorityIcon(priority) {
        switch (priority) {
            case TaskContextProvider_1.Priority.HIGH:
                return '🔴';
            case TaskContextProvider_1.Priority.MEDIUM:
                return '🟡';
            case TaskContextProvider_1.Priority.LOW:
                return '🟢';
            default:
                return '⚪';
        }
    }
    getStatusText(status) {
        switch (status) {
            case TaskContextProvider_1.TaskStatus.IN_PROGRESS:
                return 'IN_PROGRESS';
            case TaskContextProvider_1.TaskStatus.PAUSED:
                return 'PAUSED';
            case TaskContextProvider_1.TaskStatus.PENDING:
                return 'PENDING';
            case TaskContextProvider_1.TaskStatus.COMPLETED:
                return 'COMPLETED';
            default:
                return 'UNKNOWN';
        }
    }
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.SemipilotWebviewProvider = SemipilotWebviewProvider;
SemipilotWebviewProvider.viewType = 'semipilot.chatView';
//# sourceMappingURL=SemipilotWebviewProvider.js.map