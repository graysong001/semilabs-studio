"use strict";
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
exports.AssumptionCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
class AssumptionCodeActionProvider {
    /**
     * 为 Diagnostic 提供 Code Action
     */
    provideCodeActions(document, _range, context, _token) {
        // 仅处理 Semipilot ghost-assumption Diagnostic
        const ghostDiagnostics = context.diagnostics.filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        if (ghostDiagnostics.length === 0) {
            return undefined;
        }
        const actions = [];
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
    createAcceptAction(document, diagnostic) {
        const action = new vscode.CodeAction('✅ Accept Assumption', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true; // 设置为首选操作
        // 定位到整行
        const line = document.lineAt(diagnostic.range.start.line);
        const lineText = line.text;
        // 移除 (Assumption) 后缀（保留其他内容）
        const newText = lineText.replace(/\s*\(Assumption\)/, '');
        // 创建 WorkspaceEdit
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, line.range, newText);
        return action;
    }
    /**
     * 创建 Reject Code Action
     * 删除整行
     */
    createRejectAction(document, diagnostic) {
        const action = new vscode.CodeAction('❌ Reject Assumption', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        // 定位到整行（包括换行符）
        const line = document.lineAt(diagnostic.range.start.line);
        const rangeToDelete = new vscode.Range(line.range.start, document.lineAt(Math.min(line.lineNumber + 1, document.lineCount - 1)).range.start);
        // 创建 WorkspaceEdit
        action.edit = new vscode.WorkspaceEdit();
        action.edit.delete(document.uri, rangeToDelete);
        return action;
    }
}
exports.AssumptionCodeActionProvider = AssumptionCodeActionProvider;
AssumptionCodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
];
//# sourceMappingURL=AssumptionCodeActionProvider.js.map