"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Integration Tests for AssumptionCodeActionProvider
 *
 * 测试覆盖:
 * 1. Quick Fix Accept - 执行后验证文本修改
 * 2. Quick Fix Reject - 执行后验证行删除
 * 3. 多个 Assumption 的批量处理
 * 4. 与 AssumptionDiagnosticProvider 的集成
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const AssumptionDiagnosticProvider_1 = require("../../diagnostics/AssumptionDiagnosticProvider");
const AssumptionCodeActionProvider_1 = require("../../codeactions/AssumptionCodeActionProvider");
suite('AssumptionCodeActionProvider Integration Test Suite', () => {
    let testDir;
    let testSpecFile;
    let diagnosticProvider;
    let codeActionProvider;
    setup(() => {
        // 创建临时测试目录
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semipilot-test-'));
        testSpecFile = path.join(testDir, 'cap-test-spec.md');
        diagnosticProvider = new AssumptionDiagnosticProvider_1.AssumptionDiagnosticProvider();
        codeActionProvider = new AssumptionCodeActionProvider_1.AssumptionCodeActionProvider();
    });
    teardown(async () => {
        // 清理测试文件
        if (fs.existsSync(testSpecFile)) {
            fs.unlinkSync(testSpecFile);
        }
        if (fs.existsSync(testDir)) {
            fs.rmdirSync(testDir);
        }
        // 清理所有打开的编辑器
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        diagnosticProvider.dispose();
    });
    test('Integration: Accept Quick Fix should remove (Assumption) suffix', async () => {
        const content = `# Test Spec

1. 用户登录
2. 支付失败处理 (Assumption)
3. 完成订单`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 1: DiagnosticProvider 扫描生成 Diagnostic
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri);
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const ghostDiagnostic = diagnostics.find(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.ok(ghostDiagnostic, 'Should detect ghost-assumption diagnostic');
        // Step 2: CodeActionProvider 提供 Quick Fix
        const context = {
            diagnostics: [ghostDiagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = codeActionProvider.provideCodeActions(document, ghostDiagnostic.range, context, new vscode.CancellationTokenSource().token);
        assert.ok(actions, 'Should provide code actions');
        const acceptAction = actions[0];
        // Step 3: 执行 Accept Quick Fix
        await vscode.workspace.applyEdit(acceptAction.edit);
        // Step 4: 验证文本修改
        const updatedText = document.getText();
        assert.ok(!updatedText.includes('(Assumption)'), 'Should remove (Assumption)');
        assert.ok(updatedText.includes('支付失败处理'), 'Should keep original text');
    });
    test('Integration: Reject Quick Fix should delete entire line', async () => {
        const content = `# Test Spec

1. 用户登录
2. 支付失败处理 (Assumption)
3. 完成订单`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 1: DiagnosticProvider 扫描
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri);
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const ghostDiagnostic = diagnostics.find(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        // Step 2: CodeActionProvider 提供 Quick Fix
        const context = {
            diagnostics: [ghostDiagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = codeActionProvider.provideCodeActions(document, ghostDiagnostic.range, context, new vscode.CancellationTokenSource().token);
        const rejectAction = actions[1];
        // Step 3: 执行 Reject Quick Fix
        await vscode.workspace.applyEdit(rejectAction.edit);
        // Step 4: 验证行删除
        const updatedText = document.getText();
        assert.ok(!updatedText.includes('支付失败处理'), 'Should delete the line');
        assert.ok(updatedText.includes('用户登录'), 'Should keep other lines');
        assert.ok(updatedText.includes('完成订单'), 'Should keep other lines');
    });
    test('Integration: Multiple Assumptions - Accept all', async () => {
        const content = `# Test Spec

1. 用户登录 (Assumption)
2. 支付失败处理 (Assumption)
3. 完成订单`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 1: DiagnosticProvider 扫描
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri);
        const diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 2, 'Should detect 2 ghost assumptions');
        // Step 2: 依次执行 Accept Quick Fix (从后往前，避免位置偏移)
        for (let i = diagnostics.length - 1; i >= 0; i--) {
            const diagnostic = diagnostics[i];
            const context = {
                diagnostics: [diagnostic],
                only: undefined,
                triggerKind: vscode.CodeActionTriggerKind.Automatic
            };
            const actions = codeActionProvider.provideCodeActions(document, diagnostic.range, context, new vscode.CancellationTokenSource().token);
            const acceptAction = actions[0];
            await vscode.workspace.applyEdit(acceptAction.edit);
        }
        // Step 3: 验证所有 (Assumption) 已移除
        const updatedText = document.getText();
        assert.ok(!updatedText.includes('(Assumption)'), 'Should remove all (Assumption)');
        assert.ok(updatedText.includes('用户登录'), 'Should keep text');
        assert.ok(updatedText.includes('支付失败处理'), 'Should keep text');
    });
    test('Integration: Accept after manual edit should update diagnostic', async () => {
        const content = `# Test Spec

1. 用户登录
2. 支付失败处理 (Assumption)
3. 完成订单`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 1: 初始扫描
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri);
        let diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 1, 'Should detect 1 ghost assumption');
        // Step 2: 手动编辑文档（模拟用户操作）
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, new vscode.Position(5, 0), '\n4. 新增假设 (Assumption)');
        await vscode.workspace.applyEdit(edit);
        // Step 3: DiagnosticProvider 实时更新
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri, 2000);
        diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 2, 'Should detect 2 ghost assumptions after edit');
        // Step 4: Accept 第一个 Assumption
        const firstDiagnostic = diagnostics[0];
        const context = {
            diagnostics: [firstDiagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = codeActionProvider.provideCodeActions(document, firstDiagnostic.range, context, new vscode.CancellationTokenSource().token);
        const acceptAction = actions[0];
        await vscode.workspace.applyEdit(acceptAction.edit);
        // Step 5: DiagnosticProvider 再次更新
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri, 2000);
        diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 1, 'Should detect 1 ghost assumption after accept');
    });
    test('Integration: Quick Fix should work with real file system', async () => {
        const content = `# Test Spec

1. 用户登录
2. 支付失败处理 (Assumption)
3. 完成订单`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 1: DiagnosticProvider 扫描
        diagnosticProvider.updateDiagnostics(document);
        await waitForDiagnostics(document.uri);
        const diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 1, 'Should detect 1 ghost assumption');
        // Step 2: Accept Quick Fix
        const diagnostic = diagnostics[0];
        const context = {
            diagnostics: [diagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const actions = codeActionProvider.provideCodeActions(document, diagnostic.range, context, new vscode.CancellationTokenSource().token);
        const acceptAction = actions[0];
        await vscode.workspace.applyEdit(acceptAction.edit);
        // Step 3: 保存文件
        await document.save();
        // Step 4: 验证文件系统中的文件内容
        const savedContent = fs.readFileSync(testSpecFile, 'utf8');
        assert.ok(!savedContent.includes('(Assumption)'), 'Saved file should not contain (Assumption)');
        assert.ok(savedContent.includes('支付失败处理'), 'Saved file should keep original text');
    });
});
/**
 * 等待 Diagnostic 更新（异步操作）
 */
async function waitForDiagnostics(uri, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        if (diagnostics.length > 0) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}
//# sourceMappingURL=AssumptionCodeActionProvider.integration.test.js.map