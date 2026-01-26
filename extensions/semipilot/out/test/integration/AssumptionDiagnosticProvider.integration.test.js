"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Integration Tests for AssumptionDiagnosticProvider
 *
 * 测试范围:
 * 1. 文件打开时自动扫描
 * 2. 文件编辑时动态更新 Diagnostic
 * 3. 文件关闭时清除 Diagnostic
 * 4. Extension 生命周期管理
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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
suite('AssumptionDiagnosticProvider Integration Test Suite', () => {
    let testWorkspaceDir;
    let testSpecFile;
    setup(async () => {
        // 创建临时测试目录
        testWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semipilot-test-'));
        testSpecFile = path.join(testWorkspaceDir, 'cap-test-spec.md');
    });
    teardown(async () => {
        // 清理临时文件
        if (fs.existsSync(testSpecFile)) {
            fs.unlinkSync(testSpecFile);
        }
        if (fs.existsSync(testWorkspaceDir)) {
            fs.rmdirSync(testWorkspaceDir);
        }
        // 关闭所有打开的编辑器
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('Integration: should auto-scan when Spec file is opened', async () => {
        // 创建包含 (Assumption) 的 Spec 文件
        const content = `# Test Spec

1. 用户登录
2. 支付失败处理 (Assumption)
3. 完成订单`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        // 打开文件
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // 等待 Diagnostic 更新
        await waitForDiagnostics(document.uri);
        // 验证 Diagnostic
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        assert.ok(diagnostics.length > 0, 'Should have diagnostics after file opened');
        assert.ok(diagnostics.some(d => d.source === 'Semipilot' && d.code === 'ghost-assumption'), 'Should have ghost-assumption diagnostic');
    });
    test('Integration: should update diagnostics when file content changes', async () => {
        // 创建初始文件（无 Assumption）
        const initialContent = `# Test Spec

1. 用户登录
2. 完成支付`;
        fs.writeFileSync(testSpecFile, initialContent, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        const editor = await vscode.window.showTextDocument(document);
        // 等待初始 Diagnostic 扫描
        await waitForDiagnostics(document.uri);
        let diagnostics = vscode.languages.getDiagnostics(document.uri);
        const initialCount = diagnostics.filter(d => d.source === 'Semipilot').length;
        // 编辑文档，添加 (Assumption)
        await editor.edit(editBuilder => {
            const lastLine = document.lineCount - 1;
            const endPosition = new vscode.Position(lastLine, document.lineAt(lastLine).text.length);
            editBuilder.insert(endPosition, '\n3. 支付失败处理 (Assumption)');
        });
        // 等待 Diagnostic 更新
        await waitForDiagnostics(document.uri, 500);
        diagnostics = vscode.languages.getDiagnostics(document.uri);
        const updatedCount = diagnostics.filter(d => d.source === 'Semipilot').length;
        assert.ok(updatedCount > initialCount, 'Should have more diagnostics after adding (Assumption)');
    });
    test('Integration: should clear diagnostics when file is closed', async () => {
        const content = '1. 用户登录 (Assumption)';
        fs.writeFileSync(testSpecFile, content, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // 等待 Diagnostic 更新
        await waitForDiagnostics(document.uri);
        let diagnostics = vscode.languages.getDiagnostics(document.uri);
        assert.ok(diagnostics.length > 0, 'Should have diagnostics while file is open');
        // 关闭文档
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        // 等待清除
        await sleep(200);
        diagnostics = vscode.languages.getDiagnostics(document.uri);
        const semipilotDiagnostics = diagnostics.filter(d => d.source === 'Semipilot');
        assert.strictEqual(semipilotDiagnostics.length, 0, 'Should clear diagnostics after file closed');
    });
    test('Integration: should handle multiple Spec files simultaneously', async () => {
        // 创建两个 Spec 文件
        const file1 = path.join(testWorkspaceDir, 'cap-spec-1.md');
        const file2 = path.join(testWorkspaceDir, 'cap-spec-2.md');
        fs.writeFileSync(file1, '1. Feature A (Assumption)', 'utf8');
        fs.writeFileSync(file2, '2. Feature B (Assumption)\n3. Feature C (Assumption)', 'utf8');
        // 打开两个文件
        const doc1 = await vscode.workspace.openTextDocument(file1);
        const doc2 = await vscode.workspace.openTextDocument(file2);
        await vscode.window.showTextDocument(doc1);
        await vscode.window.showTextDocument(doc2);
        // 等待 Diagnostic 更新
        await waitForDiagnostics(doc1.uri);
        await waitForDiagnostics(doc2.uri);
        // 验证两个文件都有 Diagnostic
        const diag1 = vscode.languages.getDiagnostics(doc1.uri).filter(d => d.source === 'Semipilot');
        const diag2 = vscode.languages.getDiagnostics(doc2.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diag1.length, 1, 'File 1 should have 1 diagnostic');
        assert.strictEqual(diag2.length, 2, 'File 2 should have 2 diagnostics');
        // 清理
        fs.unlinkSync(file1);
        fs.unlinkSync(file2);
    });
    test('Integration: should not affect non-Spec files', async () => {
        const nonSpecFile = path.join(testWorkspaceDir, 'README.md');
        fs.writeFileSync(nonSpecFile, '# README\n\nThis is a test (Assumption)', 'utf8');
        const document = await vscode.workspace.openTextDocument(nonSpecFile);
        await vscode.window.showTextDocument(document);
        await sleep(200);
        const diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diagnostics.length, 0, 'Should not create diagnostics for non-Spec files');
        fs.unlinkSync(nonSpecFile);
    });
});
/**
 * 等待 Diagnostic 更新
 */
async function waitForDiagnostics(uri, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        if (diagnostics.length > 0) {
            return;
        }
        await sleep(50);
    }
}
/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=AssumptionDiagnosticProvider.integration.test.js.map