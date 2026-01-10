"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * File Context Provider
 *
 * Provides @file mentions for chat context
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
exports.FileContextProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class FileContextProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.id = 'file';
        this.title = 'file';
        this.displayTitle = 'Files';
        this.description = 'Reference files from your workspace';
    }
    async search(query) {
        if (!query || query.length < 2) {
            // Return recently opened files
            return this.getRecentFiles();
        }
        // Use VS Code's workspace file search
        const files = await vscode.workspace.findFiles(`**/*${query}*`, '**/node_modules/**', 20 // Limit to 20 results
        );
        return files.map(uri => ({
            id: uri.fsPath,
            title: path.basename(uri.fsPath),
            description: vscode.workspace.asRelativePath(uri),
            type: 'file',
            icon: this.getFileIcon(uri.fsPath),
            metadata: {
                uri: uri.toString(),
                language: this.getLanguageId(uri.fsPath)
            }
        }));
    }
    async getContent(id) {
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
        }
        catch (error) {
            console.error('Failed to read file:', id, error);
            return null;
        }
    }
    getDescription() {
        return {
            id: this.id,
            title: this.title,
            displayTitle: this.displayTitle,
            description: this.description,
            renderInlineAs: path.basename(this.workspaceRoot)
        };
    }
    async getRecentFiles() {
        // Get currently open editors
        const openEditors = vscode.window.visibleTextEditors;
        return openEditors.map(editor => ({
            id: editor.document.uri.fsPath,
            title: path.basename(editor.document.uri.fsPath),
            description: vscode.workspace.asRelativePath(editor.document.uri),
            type: 'file',
            icon: this.getFileIcon(editor.document.uri.fsPath),
            metadata: {
                uri: editor.document.uri.toString(),
                language: editor.document.languageId
            }
        }));
    }
    getFileIcon(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const iconMap = {
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
    getLanguageId(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const langMap = {
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
exports.FileContextProvider = FileContextProvider;
//# sourceMappingURL=FileContextProvider.js.map