"use strict";
/**
 * Semipilot Extension Entry Point
 *
 * @SpecTrace("CAP-UI-SEMIPILOT-001")
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const SseMessenger_1 = require("./messenger/SseMessenger");
const SemipilotWebviewProvider_1 = require("./webview/SemipilotWebviewProvider");
const ContextProviderManager_1 = require("./context/ContextProviderManager");
const taskCommands_1 = require("./commands/taskCommands");
let messenger;
let contextManager;
function activate(context) {
    console.log('[Semipilot] Activating extension...');
    // Get workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        console.log('[Semipilot] No workspace folder found. SpecContextProvider will not be available.');
        vscode.window.showWarningMessage('Semipilot: No workspace folder opened. Please open a folder to use @spec feature.');
        // Continue execution - Webview Provider should still be registered
    }
    else {
        console.log('[Semipilot] Workspace root:', workspaceRoot);
        // Initialize Context Provider Manager only when workspace is available
        contextManager = new ContextProviderManager_1.ContextProviderManager(workspaceRoot);
    }
    // Initialize messenger (manual mode - won't auto-connect)
    const backendUrl = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
    messenger = new SseMessenger_1.SseMessenger({
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
    // Register webview provider
    const webviewProvider = new SemipilotWebviewProvider_1.SemipilotWebviewProvider(context.extensionUri, context, contextManager // 传递 contextManager
    );
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(SemipilotWebviewProvider_1.SemipilotWebviewProvider.viewType, webviewProvider));
    // Register task commands
    (0, taskCommands_1.registerTaskCommands)(context);
    // Register command: Open Chat
    const openChatCommand = vscode.commands.registerCommand('semipilot.openChat', async () => {
        // The webview will be shown automatically when command is triggered
        // Focus on the webview panel
        await vscode.commands.executeCommand('semipilot.chatView.focus');
        vscode.window.showInformationMessage('Semipilot Chat Panel opened');
        // TODO: Remove this test code after Phase 1 Week 2
        // Test: Send Hello World to Backend
        try {
            const snapshot = await messenger.request('domain-graph/get-snapshot', undefined);
            vscode.window.showInformationMessage(`Domain Graph: ${snapshot.totalDomains} domains found`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to get domain graph: ${error}`);
        }
    });
    context.subscriptions.push(openChatCommand);
    console.log('[Semipilot] Extension activated successfully');
}
function deactivate() {
    messenger?.disconnect();
    console.log('[Semipilot] Extension deactivated');
}
//# sourceMappingURL=extension.js.map