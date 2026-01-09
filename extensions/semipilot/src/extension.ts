/**
 * Semipilot Extension Entry Point
 * 
 * @SpecTrace("CAP-UI-SEMIPILOT-001")
 */

import * as vscode from 'vscode';
import { SseMessenger } from './messenger/SseMessenger';
import { SemipilotWebviewProvider } from './webview/SemipilotWebviewProvider';
import { ContextProviderManager } from './context/ContextProviderManager';

let messenger: SseMessenger;
let contextManager: ContextProviderManager;

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
  
  // Initialize messenger
  const backendUrl = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
  messenger = new SseMessenger({
    baseUrl: backendUrl,
    reconnectInterval: 5000,
  });
  
  // Register error handler
  messenger.onError((message, error) => {
    vscode.window.showErrorMessage(`Semipilot Error: ${error.message}`);
  });
  
  // Register webview provider
  const webviewProvider = new SemipilotWebviewProvider(
    context.extensionUri,
    context
  );
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SemipilotWebviewProvider.viewType,
      webviewProvider
    )
  );
  
  // Register command: Open Chat
  const openChatCommand = vscode.commands.registerCommand('semipilot.openChat', async () => {
    // The webview will be shown automatically when command is triggered
    // Focus on the webview panel
    await vscode.commands.executeCommand('semipilot.chatView.focus');
    
    vscode.window.showInformationMessage('Semipilot Chat Panel opened');
    
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
  
  console.log('[Semipilot] Extension activated successfully');
}

export function deactivate() {
  messenger?.disconnect();
  console.log('[Semipilot] Extension deactivated');
}
