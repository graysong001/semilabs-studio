"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * E2E Tests for Ghost Mode (Poe v11.2)
 *
 * 测试完整流程:
 * 1. 用户通过 Chat 与 Poe 对话
 * 2. Poe 返回包含 (Assumption) 的响应
 * 3. 响应被写入 Spec 文件
 * 4. AssumptionDiagnosticProvider 自动检测并显示蓝色波浪线
 * 5. 用户通过 Quick Fix 接受/拒绝假设（Task 11，当前仅验证 Diagnostic）
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
const AssumptionCodeActionProvider_1 = require("../../codeactions/AssumptionCodeActionProvider");
suite('Ghost Mode E2E Test Suite', () => {
    let testWorkspaceDir;
    let testSpecFile;
    setup(async () => {
        testWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semipilot-e2e-'));
        testSpecFile = path.join(testWorkspaceDir, 'cap-payment-flow.md');
    });
    teardown(async () => {
        // 清理
        if (fs.existsSync(testSpecFile)) {
            fs.unlinkSync(testSpecFile);
        }
        if (fs.existsSync(testWorkspaceDir)) {
            fs.rmdirSync(testWorkspaceDir);
        }
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('E2E: Complete flow - Chat → Spec with (Assumption) → Diagnostic', async () => {
        // Step 1: 模拟 Poe 生成包含 Ghost 假设的 Spec 内容
        const poeResponse = `# Payment Flow Spec

## User Journey

1. 用户选择支付方式
2. 输入支付信息
3. 支付失败时系统发送重试通知 (Assumption)
4. 完成支付后跳转到订单页面

## Technical Requirements

- 支持支付宝和微信支付
- 支付超时时间为 30 秒 (Assumption)
- 失败重试最多 3 次`;
        // Step 2: 写入 Spec 文件（模拟 Poe 自动写入）
        fs.writeFileSync(testSpecFile, poeResponse, 'utf8');
        // Step 3: 打开 Spec 文件
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 4: 等待 AssumptionDiagnosticProvider 扫描
        await waitForDiagnostics(document.uri, 2000);
        // Step 5: 验证 Diagnostic
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const ghostDiagnostics = diagnostics.filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(ghostDiagnostics.length, 2, 'Should detect 2 (Assumption) markers');
        // 验证第一个 Diagnostic（支付失败重试）
        const diag1 = ghostDiagnostics[0];
        assert.strictEqual(diag1.severity, vscode.DiagnosticSeverity.Information, 'Should be Information severity');
        assert.ok(diag1.message.includes('Ghost Assumption'), 'Message should mention Ghost Assumption');
        assert.strictEqual(diag1.range.start.line, 5, 'Should be on line 5');
        // 验证第二个 Diagnostic（支付超时）
        const diag2 = ghostDiagnostics[1];
        assert.strictEqual(diag2.range.start.line, 10, 'Should be on line 10');
        console.log('[E2E] ✅ Ghost Mode flow validated successfully');
    });
    test('E2E: Multiple Spec files with Ghost assumptions', async () => {
        // 创建多个 Spec 文件
        const loginSpecFile = path.join(testWorkspaceDir, 'cap-login.md');
        const orderSpecFile = path.join(testWorkspaceDir, 'cap-order.md');
        const loginContent = `# Login Flow

1. 用户输入账号密码
2. 支持 OAuth 登录 (Assumption)
3. 完成登录`;
        const orderContent = `# Order Management

1. 查看订单列表
2. 支持订单筛选 (Assumption)
3. 导出订单数据 (Assumption)`;
        fs.writeFileSync(loginSpecFile, loginContent, 'utf8');
        fs.writeFileSync(orderSpecFile, orderContent, 'utf8');
        // 打开两个文件
        const loginDoc = await vscode.workspace.openTextDocument(loginSpecFile);
        const orderDoc = await vscode.workspace.openTextDocument(orderSpecFile);
        await vscode.window.showTextDocument(loginDoc);
        await vscode.window.showTextDocument(orderDoc);
        // 等待扫描
        await waitForDiagnostics(loginDoc.uri, 1000);
        await waitForDiagnostics(orderDoc.uri, 1000);
        // 验证
        const loginDiagnostics = vscode.languages.getDiagnostics(loginDoc.uri).filter(d => d.source === 'Semipilot');
        const orderDiagnostics = vscode.languages.getDiagnostics(orderDoc.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(loginDiagnostics.length, 1, 'Login spec should have 1 assumption');
        assert.strictEqual(orderDiagnostics.length, 2, 'Order spec should have 2 assumptions');
        // 清理
        fs.unlinkSync(loginSpecFile);
        fs.unlinkSync(orderSpecFile);
        console.log('[E2E] ✅ Multiple Spec files validated successfully');
    });
    test('E2E: Real-time Diagnostic update when editing Spec', async () => {
        // 创建初始 Spec（无 Assumption）
        const initialContent = `# Feature Spec

1. User registration
2. Email verification`;
        fs.writeFileSync(testSpecFile, initialContent, 'utf8');
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        const editor = await vscode.window.showTextDocument(document);
        await sleep(500);
        // 初始状态：无 Diagnostic
        let diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diagnostics.length, 0, 'Should have no diagnostics initially');
        // 模拟用户编辑：添加 (Assumption)
        await editor.edit(editBuilder => {
            const lastLine = document.lineCount - 1;
            const endPos = new vscode.Position(lastLine, document.lineAt(lastLine).text.length);
            editBuilder.insert(endPos, '\n3. Password reset via email (Assumption)');
        });
        // 等待 Diagnostic 更新
        await waitForDiagnostics(document.uri, 1000);
        diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diagnostics.length, 1, 'Should have 1 diagnostic after adding (Assumption)');
        // 再次编辑：移除 (Assumption)
        await editor.edit(editBuilder => {
            const lastLine = document.lineCount - 1;
            const lineText = document.lineAt(lastLine).text;
            const range = new vscode.Range(new vscode.Position(lastLine, 0), new vscode.Position(lastLine, lineText.length));
            editBuilder.replace(range, '3. Password reset via email');
        });
        await sleep(500);
        diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diagnostics.length, 0, 'Should have no diagnostics after removing (Assumption)');
        console.log('[E2E] ✅ Real-time update validated successfully');
    });
    test('E2E: Diagnostic survives file save and reopen', async () => {
        const content = `# Payment Gateway

1. Integrate with Stripe
2. Support refunds (Assumption)`;
        fs.writeFileSync(testSpecFile, content, 'utf8');
        let document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        await waitForDiagnostics(document.uri, 1000);
        // 验证初始 Diagnostic
        let diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diagnostics.length, 1, 'Should have 1 diagnostic before save');
        // 保存文件
        await document.save();
        // 关闭并重新打开
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await sleep(200);
        document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        await waitForDiagnostics(document.uri, 1000);
        // 验证 Diagnostic 仍然存在
        diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot');
        assert.strictEqual(diagnostics.length, 1, 'Should still have 1 diagnostic after reopen');
        console.log('[E2E] ✅ Diagnostic persistence validated successfully');
    });
    test('E2E: Complete Ghost Mode flow - Diagnostic → Quick Fix (Accept) → Text Update', async () => {
        // Step 1: 模拟 Poe 生成包含 Ghost 假设的 Spec 内容
        const poeResponse = `# Payment Flow Spec

## User Journey
1. 用户选择支付方式
2. 输入支付信息
3. 支付失败时系统发送重试通知 (Assumption)
4. 完成支付后跳转到订单页面

## Technical Requirements
- 支持支付宝和微信支付
- 支付超时时间为 30 秒 (Assumption)
- 失败重试最多 3 次`;
        // Step 2: 写入 Spec 文件
        fs.writeFileSync(testSpecFile, poeResponse, 'utf8');
        // Step 3: 打开 Spec 文件
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 4: 等待 Diagnostic 扫描
        await waitForDiagnostics(document.uri, 2000);
        // Step 5: 验证 Diagnostic
        let diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 2, 'Should detect 2 (Assumption) markers');
        // Step 6: 执行 Quick Fix (Accept)
        const firstDiagnostic = diagnostics[0];
        const context = {
            diagnostics: [firstDiagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const codeActionProvider = new AssumptionCodeActionProvider_1.AssumptionCodeActionProvider();
        const actions = codeActionProvider.provideCodeActions(document, firstDiagnostic.range, context, new vscode.CancellationTokenSource().token);
        assert.ok(actions, 'Should provide code actions');
        assert.strictEqual(actions[0].title, '✅ Accept Assumption');
        // Step 7: 执行 Accept Action
        await vscode.workspace.applyEdit(actions[0].edit);
        // Step 8: 验证文本修改
        const updatedText = document.getText();
        const lines = updatedText.split('\n');
        assert.ok(lines.some(line => line.includes('支付失败时系统发送重试通知') && !line.includes('(Assumption)')), 'Should remove (Assumption) from accepted line');
        assert.ok(lines.some(line => line.includes('支付超时时间为 30 秒') && line.includes('(Assumption)')), 'Should keep other (Assumption) markers');
        // Step 9: 验证 Diagnostic 更新
        await new Promise(resolve => setTimeout(resolve, 500));
        diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 1, 'Should have 1 remaining diagnostic after accept');
        console.log('[E2E] ✅ Accept Quick Fix validated successfully');
    });
    test('E2E: Complete Ghost Mode flow - Diagnostic → Quick Fix (Reject) → Line Delete', async () => {
        // Step 1: 创建包含 Assumption 的 Spec
        const specContent = `# Test Spec

1. 用户登录
2. 支付失败处理 (Assumption)
3. 完成订单
4. 发送通知 (Assumption)`;
        fs.writeFileSync(testSpecFile, specContent, 'utf8');
        // Step 2: 打开文件
        const document = await vscode.workspace.openTextDocument(testSpecFile);
        await vscode.window.showTextDocument(document);
        // Step 3: 等待 Diagnostic
        await waitForDiagnostics(document.uri, 2000);
        let diagnostics = vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Semipilot' && d.code === 'ghost-assumption');
        assert.strictEqual(diagnostics.length, 2, 'Should detect 2 assumptions');
        // Step 4: 执行 Reject Quick Fix
        const firstDiagnostic = diagnostics[0];
        const context = {
            diagnostics: [firstDiagnostic],
            only: undefined,
            triggerKind: vscode.CodeActionTriggerKind.Automatic
        };
        const codeActionProvider = new AssumptionCodeActionProvider_1.AssumptionCodeActionProvider();
        const actions = codeActionProvider.provideCodeActions(document, firstDiagnostic.range, context, new vscode.CancellationTokenSource().token);
        assert.strictEqual(actions[1].title, '❌ Reject Assumption');
        // Step 5: 执行 Reject Action
        await vscode.workspace.applyEdit(actions[1].edit);
        // Step 6: 验证行删除
        const updatedText = document.getText();
        assert.ok(!updatedText.includes('支付失败处理'), 'Should delete rejected line');
        assert.ok(updatedText.includes('用户登录'), 'Should keep other lines');
        assert.ok(updatedText.includes('完成订单'), 'Should keep other lines');
        assert.ok(updatedText.includes('发送通知'), 'Should keep other assumptions');
        console.log('[E2E] ✅ Reject Quick Fix validated successfully');
    });
});
/**
 * 等待 Diagnostic 出现
 */
async function waitForDiagnostics(uri, timeout = 2000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        const semipilotDiagnostics = diagnostics.filter(d => d.source === 'Semipilot');
        if (semipilotDiagnostics.length > 0) {
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
//# sourceMappingURL=Ghost%20Mode.e2e.test.js.map