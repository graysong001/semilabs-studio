/**
 * Semipilot Extension Entry Point
 * 
 * @SpecTrace("CAP-UI-SEMIPILOT-001")
 */

import * as vscode from 'vscode';
import { SseMessenger } from './messenger/SseMessenger';

let messenger: SseMessenger;

export function activate(context: vscode.ExtensionContext) {
  console.log('[Semipilot] Activating extension...');
  
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
  
  // Register command: Open Chat
  const openChatCommand = vscode.commands.registerCommand('semipilot.openChat', async () => {
    vscode.window.showInformationMessage('Semipilot Chat Panel (Coming Soon)');
    
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
