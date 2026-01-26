"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Unit Tests for AssumptionCodeActionProvider
 *
 * 测试覆盖:
 * 1. 为 ghost-assumption Diagnostic 提供 Quick Fix
 * 2. Accept Action - 移除 (Assumption) 后缀
 * 3. Reject Action - 删除整行
 * 4. 忽略非 ghost-assumption Diagnostic
 * 5. 多个 Diagnostic 处理
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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const AssumptionCodeActionProvider_1 = require("./AssumptionCodeActionProvider");
suite('AssumptionCodeActionProvider Test Suite', () => {
    let provider;
    setup(() => {
        provider = new AssumptionCodeActionProvider_1.AssumptionCodeActionProvider();
    });
    test('should provide Accept and Reject actions for ghost-assumption diagnostic', async () => {
        const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 24, 0, 37), 'Ghost Assumption: 如果支付失败,系统发送重试通知 (Assumption)', vscode.DiagnosticSeverity.Information);
        diagnostic.source = 'Semipilot';
        diagnostic.code = 'ghost-assumption';
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(0, 0, 0, 0), context, new vscode.CancellationTokenSource().token);
        assert.ok(actions, 'Should provide code actions');
        assert.strictEqual(actions.length, 2, 'Should provide 2 actions (Accept + Reject)');
        assert.strictEqual(actions[0].title, '✅ Accept Assumption');
        assert.strictEqual(actions[1].title, '❌ Reject Assumption');
    });
    test('Accept action should remove (Assumption) suffix', async () => {
        const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 24, 0, 37), 'Ghost Assumption', vscode.DiagnosticSeverity.Information);
        diagnostic.source = 'Semipilot';
        diagnostic.code = 'ghost-assumption';
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(0, 0, 0, 0), context, new vscode.CancellationTokenSource().token);
        const acceptAction = actions[0];
        assert.strictEqual(acceptAction.kind, vscode.CodeActionKind.QuickFix);
        assert.strictEqual(acceptAction.isPreferred, true, 'Accept should be preferred action');
        // 验证 WorkspaceEdit
        const edits = acceptAction.edit.get(document.uri);
        assert.ok(edits, 'Should have edits');
        assert.strictEqual(edits.length, 1, 'Should have 1 edit');
        const edit = edits[0];
        assert.strictEqual(edit.newText, '3. 如果支付失败,系统发送重试通知', 'Should remove (Assumption)');
    });
    test('Reject action should delete entire line', async () => {
        const content = '1. 正常流程\n2. 异常处理 (Assumption)\n3. 完成';
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(1, 11, 1, 24), 'Ghost Assumption', vscode.DiagnosticSeverity.Information);
        diagnostic.source = 'Semipilot';
        diagnostic.code = 'ghost-assumption';
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(1, 0, 1, 0), context, new vscode.CancellationTokenSource().token);
        const rejectAction = actions[1];
        assert.strictEqual(rejectAction.kind, vscode.CodeActionKind.QuickFix);
        // 验证 WorkspaceEdit
        const edits = rejectAction.edit.get(document.uri);
        assert.ok(edits, 'Should have edits');
        assert.strictEqual(edits.length, 1, 'Should have 1 edit');
        const edit = edits[0];
        assert.strictEqual(edit.newText, '', 'Should delete the line');
    });
    test('should not provide actions for non-ghost-assumption diagnostics', async () => {
        const content = '3. 如果支付失败,系统发送重试通知';
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 10), 'Some other diagnostic', vscode.DiagnosticSeverity.Warning);
        diagnostic.source = 'OtherSource';
        diagnostic.code = 'other-code';
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(0, 0, 0, 0), context, new vscode.CancellationTokenSource().token);
        assert.strictEqual(actions, undefined, 'Should not provide actions for non-ghost diagnostics');
    });
    test('should handle multiple ghost-assumption diagnostics', async () => {
        const content = `1. 正常流程 (Assumption)
2. 异常处理 (Assumption)
3. 完成`;
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic1 = new vscode.Diagnostic(new vscode.Range(0, 8, 0, 21), 'Ghost Assumption', vscode.DiagnosticSeverity.Information);
        diagnostic1.source = 'Semipilot';
        diagnostic1.code = 'ghost-assumption';
        const diagnostic2 = new vscode.Diagnostic(new vscode.Range(1, 8, 1, 21), 'Ghost Assumption', vscode.DiagnosticSeverity.Information);
        diagnostic2.source = 'Semipilot';
        diagnostic2.code = 'ghost-assumption';
        const context = {
            diagnostics: [diagnostic1, diagnostic2],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(0, 0, 0, 0), context, new vscode.CancellationTokenSource().token);
        assert.ok(actions, 'Should provide code actions');
        assert.strictEqual(actions.length, 4, 'Should provide 4 actions (2 diagnostics × 2 actions)');
    });
    test('Accept action should handle whitespace before (Assumption)', async () => {
        const content = '3. 如果支付失败,系统发送重试通知   (Assumption)';
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 27, 0, 40), 'Ghost Assumption', vscode.DiagnosticSeverity.Information);
        diagnostic.source = 'Semipilot';
        diagnostic.code = 'ghost-assumption';
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(0, 0, 0, 0), context, new vscode.CancellationTokenSource().token);
        const acceptAction = actions[0];
        const edits = acceptAction.edit.get(document.uri);
        const edit = edits[0];
        assert.strictEqual(edit.newText, '3. 如果支付失败,系统发送重试通知', 'Should remove whitespace + (Assumption)');
    });
    test('should set Accept as preferred action', async () => {
        const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
        const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 24, 0, 37), 'Ghost Assumption', vscode.DiagnosticSeverity.Information);
        diagnostic.source = 'Semipilot';
        diagnostic.code = 'ghost-assumption';
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = provider.provideCodeActions(document, new vscode.Range(0, 0, 0, 0), context, new vscode.CancellationTokenSource().token);
        const acceptAction = actions[0];
        const rejectAction = actions[1];
        assert.strictEqual(acceptAction.isPreferred, true, 'Accept should be preferred');
        assert.strictEqual(rejectAction.isPreferred, undefined, 'Reject should not be preferred');
    });
});
/**
 * 创建 Mock Document 用于测试
 */
async function createMockDocument(content, _fileName, languageId) {
    const document = await vscode.workspace.openTextDocument({
        content: content,
        language: languageId
    });
    return document;
}
//# sourceMappingURL=AssumptionCodeActionProvider.test.js.map