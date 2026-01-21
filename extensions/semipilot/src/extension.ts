/**
 * Semipilot Extension Entry Point
 * 
 * @SpecTrace("CAP-UI-SEMIPILOT-001")
 */

import * as vscode from 'vscode';
import { SseMessenger } from './messenger/SseMessenger';
import { SemipilotWebviewProvider } from './webview/SemipilotWebviewProvider';
import { ContextProviderManager } from './context/ContextProviderManager';
import { registerTaskCommands } from './commands/taskCommands';

let messenger: SseMessenger;
let contextManager: ContextProviderManager;
let webviewProvider: SemipilotWebviewProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('[Semipilot] Activating extension...');
  
  // Get workspace root
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    console.log('[Semipilot] No workspace folder found. SpecContextProvider will not be available.');
    vscode.window.showWarningMessage('Semipilot: No workspace folder opened. Please open a folder to use @spec feature.');
    // Continue execution - Webview Provider should still be registered
  } else {
    console.log('[Semipilot] Workspace root:', workspaceRoot);
    // Initialize Context Provider Manager only when workspace is available
    contextManager = new ContextProviderManager(workspaceRoot);
  }
  
  // Initialize messenger (manual mode - won't auto-connect)
  const backendUrl = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
  messenger = new SseMessenger({
    baseUrl: backendUrl,
    reconnectInterval: 5000,
    autoConnect: false, // Phase 1: 不自动连接，等待用户手动触发
  });
  
  console.log('[Semipilot] SseMessenger initialized in manual mode');
  console.log('[Semipilot] Backend will connect when user sends first message');
  
  // Register error handler
  messenger.onError((message, error) => {
    vscode.window.showErrorMessage(`Semipilot Error: ${error.message}`);
  });
  
  const webviewProviderInstance = new SemipilotWebviewProvider(
    context.extensionUri,
    context,
    messenger, // 传递 messenger
    contextManager // 传递 contextManager
  );
  webviewProvider = webviewProviderInstance;
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SemipilotWebviewProvider.viewType,
      webviewProviderInstance
    )
  );
  
  // Register task commands
  registerTaskCommands(context);
  
  // Register command: Open Chat
  const openChatCommand = vscode.commands.registerCommand('semipilot.openChat', async () => {
    // The webview will be shown automatically when command is triggered
    // Focus on the webview panel
    await vscode.commands.executeCommand('semipilot.chatView.focus');
    
    vscode.window.showInformationMessage('Semipilot Chat Panel opened');
    
    // Slice 4: 启动 Workflow SSE 连接
    if (!messenger.isWorkflowConnectedToBackend()) {
      console.log('[Semipilot] Connecting to Workflow SSE...');
      messenger.connectWorkflow();
    }
    
    // TODO: Remove this test code after Phase 1 Week 2
    // Test: Send Hello World to Backend
    try {
      const snapshot = await messenger.request('domain-graph/get-snapshot', undefined as any);
      vscode.window.showInformationMessage(
        `Domain Graph: ${snapshot.totalDomains} domains found`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get domain graph: ${error}`);
    }
  });
  
  context.subscriptions.push(openChatCommand);

  // Register command: Add Active File to Chat Context
  const addActiveFileCommand = vscode.commands.registerCommand('semipilot.addActiveFileToContext', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showWarningMessage('Semipilot: 当前没有活动文件，无法注入上下文。');
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;

    if (!webviewProvider) {
      vscode.window.showWarningMessage('Semipilot: Chat Panel 尚未初始化，请先打开 Chat 视图。');
      return;
    }

    webviewProvider.addContextFromFile(filePath);
    vscode.window.showInformationMessage(`Semipilot: 已将当前文件加入本轮对话上下文。`);
  });

  context.subscriptions.push(addActiveFileCommand);
  
  console.log('[Semipilot] Extension activated successfully');
}

export function deactivate() {
  messenger?.disconnect();
  console.log('[Semipilot] Extension deactivated');
}
