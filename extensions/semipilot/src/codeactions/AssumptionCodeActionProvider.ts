/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Assumption Code Action Provider (Poe v11.2 Ghost Mode)
 * 
 * 功能:
 * 1. 为 (Assumption) Diagnostic 提供 Quick Fix
 * 2. [✅ Accept Assumption] - 移除 (Assumption) 后缀，将文本变为实色
 * 3. [❌ Reject Assumption] - 删除整行
 * 
 * 使用场景:
 * ```markdown
 * 3. 如果支付失败,系统发送重试通知 (Assumption)
 *    ^^^^^^^^^^^^^^^^^^^^^^^
 *    蓝色波浪线
 *    Quick Fix: [✅ Accept] / [❌ Reject]
 * ```
 */

import * as vscode from 'vscode';

export class AssumptionCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  /**
   * 为 Diagnostic 提供 Code Action
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] | undefined {
    // 仅处理 Semipilot ghost-assumption Diagnostic
    const ghostDiagnostics = context.diagnostics.filter(
      d => d.source === 'Semipilot' && d.code === 'ghost-assumption'
    );

    if (ghostDiagnostics.length === 0) {
      return undefined;
    }

    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of ghostDiagnostics) {
      // 创建 [✅ Accept Assumption] Code Action
      actions.push(this.createAcceptAction(document, diagnostic));
      
      // 创建 [❌ Reject Assumption] Code Action
      actions.push(this.createRejectAction(document, diagnostic));
    }

    return actions;
  }

  /**
   * 创建 Accept Code Action
   * 移除 (Assumption) 后缀
   */
  private createAcceptAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '✅ Accept Assumption',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true; // 设置为首选操作

    // 定位到整行
    const line = document.lineAt(diagnostic.range.start.line);
    const lineText = line.text;

    // 移除 (Assumption) 后缀（保留其他内容）
    const newText = lineText.replace(/\s*\(Assumption\)/, '');

    // 创建 WorkspaceEdit
    action.edit = new vscode.WorkspaceEdit();
    action.edit.replace(
      document.uri,
      line.range,
      newText
    );

    return action;
  }

  /**
   * 创建 Reject Code Action
   * 删除整行
   */
  private createRejectAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '❌ Reject Assumption',
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diagnostic];

    // 定位到整行（包括换行符）
    const line = document.lineAt(diagnostic.range.start.line);
    const rangeToDelete = new vscode.Range(
      line.range.start,
      document.lineAt(Math.min(line.lineNumber + 1, document.lineCount - 1)).range.start
    );

    // 创建 WorkspaceEdit
    action.edit = new vscode.WorkspaceEdit();
    action.edit.delete(document.uri, rangeToDelete);

    return action;
  }
}
