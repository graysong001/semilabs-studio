"use strict";
/**
 * @SpecTrace cap-ui-task-list, v1.0.0
 *
 * Task Commands
 * 任务相关的VS Code命令
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
exports.openTaskDocument = openTaskDocument;
exports.registerTaskCommands = registerTaskCommands;
const vscode = __importStar(require("vscode"));
/**
 * 打开任务文档并定位到顶部
 * @param filePath 任务文档的文件路径
 */
async function openTaskDocument(filePath) {
    try {
        console.log(`[taskCommands] Opening task document: ${filePath}`);
        // 1. 打开文档
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        // 2. 在新标签页显示
        const editor = await vscode.window.showTextDocument(doc, {
            preview: false, // 不使用预览模式，确保新标签页
            viewColumn: vscode.ViewColumn.One // 在主编辑区打开
        });
        // 3. 滚动到文件顶部（前10行可见）
        const topRange = new vscode.Range(0, 0, 10, 0);
        editor.revealRange(topRange, vscode.TextEditorRevealType.InCenter);
        // 4. 设置光标到第一行
        editor.selection = new vscode.Selection(0, 0, 0, 0);
        console.log(`[taskCommands] Task document opened successfully: ${filePath}`);
    }
    catch (error) {
        console.error(`[taskCommands] Error opening task document:`, error);
        vscode.window.showErrorMessage(`无法打开任务文档: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * 注册任务相关命令
 * @param context Extension上下文
 */
function registerTaskCommands(context) {
    // 注册打开任务文档命令
    const openTaskCmd = vscode.commands.registerCommand('semilabs.openTaskDocument', async (filePath) => {
        await openTaskDocument(filePath);
    });
    context.subscriptions.push(openTaskCmd);
    console.log('[taskCommands] Task commands registered');
}
//# sourceMappingURL=taskCommands.js.map