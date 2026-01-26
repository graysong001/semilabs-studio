/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Assumption Diagnostic Provider (Poe v11.2 Ghost Mode)
 * 
 * 功能:
 * 1. 扫描 Spec 文件中的 (Assumption) 标记
 * 2. 生成 VS Code Diagnostic (蓝色波浪线, Severity: Information)
 * 3. 供 AssumptionCodeActionProvider 提供 Quick Fix ([Accept/Reject])
 * 
 * 格式示例:
 * ```markdown
 * 3. 如果支付失败,系统发送重试通知 (Assumption)
 * ```
 */

import * as vscode from 'vscode';

export class AssumptionDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private static readonly ASSUMPTION_REGEX = /\(Assumption\)/g;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('semipilot-assumptions');
  }

  /**
   * 更新指定文档的 Diagnostic
   * @param document VS Code TextDocument
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    // 仅处理 Markdown 文件
    if (document.languageId !== 'markdown') {
      return;
    }

    // 仅处理 Spec 文件 (文件名包含 cap- 或位于 _specs 目录)
    const fileName = document.uri.fsPath;
    const isSpecFile = fileName.includes('cap-') || 
                       fileName.includes('_specs') || 
                       fileName.includes('/specs/');
    
    if (!isSpecFile) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    // 逐行扫描 (Assumption) 标记
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const matches = [...line.matchAll(AssumptionDiagnosticProvider.ASSUMPTION_REGEX)];

      for (const match of matches) {
        if (match.index === undefined) {
          continue;
        }

        // 计算标记位置
        const startPos = new vscode.Position(lineIndex, match.index);
        const endPos = new vscode.Position(lineIndex, match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        // 提取整行内容作为 message
        const lineContent = line.trim();
        const message = `Ghost Assumption: ${lineContent}`;

        // 创建 Diagnostic
        const diagnostic = new vscode.Diagnostic(
          range,
          message,
          vscode.DiagnosticSeverity.Information // 蓝色波浪线
        );
        diagnostic.source = 'Semipilot';
        diagnostic.code = 'ghost-assumption';

        // 添加 tag (可选, 用于标识 Diagnostic 类型)
        diagnostic.tags = [vscode.DiagnosticTag.Unnecessary]; // 显示为灰色文字 (可选)

        diagnostics.push(diagnostic);
      }
    }

    // 更新 DiagnosticCollection
    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * 清除指定文档的 Diagnostic
   * @param uri Document URI
   */
  public clearDiagnostics(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  /**
   * 清除所有 Diagnostic
   */
  public clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }

  /**
   * 获取 DiagnosticCollection (供测试使用)
   */
  public getDiagnosticCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }
}
