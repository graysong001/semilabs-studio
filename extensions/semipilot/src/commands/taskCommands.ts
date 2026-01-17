/**
 * @SpecTrace cap-ui-task-list, v1.0.0
 * 
 * Task Commands
 * 任务相关的VS Code命令
 */

import * as vscode from 'vscode';

/**
 * 打开任务文档并定位到顶部
 * @param filePath 任务文档的文件路径
 */
export async function openTaskDocument(filePath: string): Promise<void> {
  try {
    console.log(`[taskCommands] Opening task document: ${filePath}`);
    
    // 1. 打开文档
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    
    // 2. 在新标签页显示
    const editor = await vscode.window.showTextDocument(doc, {
      preview: false,  // 不使用预览模式，确保新标签页
      viewColumn: vscode.ViewColumn.One  // 在主编辑区打开
    });
    
    // 3. 滚动到文件顶部（前10行可见）
    const topRange = new vscode.Range(0, 0, 10, 0);
    editor.revealRange(topRange, vscode.TextEditorRevealType.InCenter);
    
    // 4. 设置光标到第一行
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    
    console.log(`[taskCommands] Task document opened successfully: ${filePath}`);
  } catch (error) {
    console.error(`[taskCommands] Error opening task document:`, error);
    vscode.window.showErrorMessage(`无法打开任务文档: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 注册任务相关命令
 * @param context Extension上下文
 */
export function registerTaskCommands(context: vscode.ExtensionContext): void {
  // 注册打开任务文档命令
  const openTaskCmd = vscode.commands.registerCommand(
    'semilabs.openTaskDocument',
    async (filePath: string) => {
      await openTaskDocument(filePath);
    }
  );
  
  context.subscriptions.push(openTaskCmd);
  
  console.log('[taskCommands] Task commands registered');
}
