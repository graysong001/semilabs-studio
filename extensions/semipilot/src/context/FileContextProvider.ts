/**
 * @SpecTrace cap-ui-semipilot
 * 
 * File Context Provider
 * 
 * Provides @file mentions for chat context
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { IContextProvider, ContextItem, ContextProviderDescription } from './IContextProvider';

export class FileContextProvider implements IContextProvider {
  readonly id = 'file';
  readonly title = 'file';
  readonly displayTitle = 'Files';
  readonly description = 'Reference files from your workspace';

  constructor(private readonly workspaceRoot: string) {}

  async search(query: string): Promise<ContextItem[]> {
    if (!query || query.length < 2) {
      // Return recently opened files
      return this.getRecentFiles();
    }

    // Use VS Code's workspace file search (case-insensitive)
    const lowerQuery = query.toLowerCase();
    
    // 搜索所有文件，然后过滤（支持模糊匹配）
    const allFiles = await vscode.workspace.findFiles(
      '**/*',
      '**/node_modules/**',
      200 // 先获取更多结果用于过滤
    );

    // 模糊匹配：文件名包含查询词（不区分大小写）
    const matchedFiles = allFiles
      .filter(uri => {
        const filename = path.basename(uri.fsPath).toLowerCase();
        return filename.includes(lowerQuery);
      })
      .slice(0, 20); // 限制返回 20 个结果

    return matchedFiles.map(uri => ({
      id: uri.fsPath,
      title: path.basename(uri.fsPath),
      description: vscode.workspace.asRelativePath(uri),
      type: 'file' as const,
      icon: this.getFileIcon(uri.fsPath),
      metadata: {
        uri: uri.toString(),
        language: this.getLanguageId(uri.fsPath)
      }
    }));
  }

  async getContent(id: string): Promise<ContextItem | null> {
    try {
      const uri = vscode.Uri.file(id);
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();

      return {
        id,
        title: path.basename(id),
        description: vscode.workspace.asRelativePath(uri),
        content,
        type: 'file',
        icon: this.getFileIcon(id),
        metadata: {
          uri: uri.toString(),
          language: document.languageId,
          lineCount: document.lineCount
        }
      };
    } catch (error) {
      console.error('Failed to read file:', id, error);
      return null;
    }
  }

  getDescription(): ContextProviderDescription {
    return {
      id: this.id,
      title: this.title,
      displayTitle: this.displayTitle,
      description: this.description,
      renderInlineAs: path.basename(this.workspaceRoot)
    };
  }

  private async getRecentFiles(): Promise<ContextItem[]> {
    // Get currently open editors
    const openEditors = vscode.window.visibleTextEditors;
    
    return openEditors.map(editor => ({
      id: editor.document.uri.fsPath,
      title: path.basename(editor.document.uri.fsPath),
      description: vscode.workspace.asRelativePath(editor.document.uri),
      type: 'file' as const,
      icon: this.getFileIcon(editor.document.uri.fsPath),
      metadata: {
        uri: editor.document.uri.toString(),
        language: editor.document.languageId
      }
    }));
  }

  private getFileIcon(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const iconMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'react',
      '.js': 'javascript',
      '.jsx': 'react',
      '.java': 'java',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml'
    };
    return iconMap[ext] || 'file';
  }

  private getLanguageId(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescriptreact',
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.java': 'java',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
    return langMap[ext] || 'plaintext';
  }
}
