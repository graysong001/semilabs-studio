/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Unit Tests for AssumptionDiagnosticProvider
 * 
 * 测试范围:
 * 1. 正则表达式匹配 (Assumption) 标记
 * 2. Diagnostic 位置计算 (Range)
 * 3. Markdown 文件过滤
 * 4. Spec 文件识别
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { AssumptionDiagnosticProvider } from './AssumptionDiagnosticProvider';

suite('AssumptionDiagnosticProvider Test Suite', () => {
  let provider: AssumptionDiagnosticProvider;

  setup(() => {
    provider = new AssumptionDiagnosticProvider();
  });

  teardown(() => {
    provider.dispose();
  });

  test('should detect (Assumption) marker in single line', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 1, 'Should have 1 diagnostic');
    
    const diag = diagnostics![0];
    assert.strictEqual(diag.severity, vscode.DiagnosticSeverity.Information, 'Severity should be Information');
    assert.strictEqual(diag.source, 'Semipilot', 'Source should be Semipilot');
    assert.strictEqual(diag.code, 'ghost-assumption', 'Code should be ghost-assumption');
    assert.ok(diag.message.includes('Ghost Assumption'), 'Message should contain "Ghost Assumption"');
  });

  test('should detect multiple (Assumption) markers in different lines', async () => {
    const content = `1. 用户登录 (Assumption)
2. 正常操作
3. 如果支付失败,系统发送重试通知 (Assumption)
4. 完成订单`;

    const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 2, 'Should have 2 diagnostics');
    
    // Verify first diagnostic (line 0)
    const diag1 = diagnostics![0];
    assert.strictEqual(diag1.range.start.line, 0, 'First diagnostic should be on line 0');
    
    // Verify second diagnostic (line 2)
    const diag2 = diagnostics![1];
    assert.strictEqual(diag2.range.start.line, 2, 'Second diagnostic should be on line 2');
  });

  test('should calculate correct range for (Assumption) marker', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const document = await createMockDocument(content, 'test-cap-spec.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    const diag = diagnostics![0];
    
    // (Assumption) starts at column 28
    const assumptionStartIndex = content.indexOf('(Assumption)');
    assert.strictEqual(diag.range.start.character, assumptionStartIndex, 'Start position should match');
    assert.strictEqual(diag.range.end.character, assumptionStartIndex + '(Assumption)'.length, 'End position should match');
  });

  test('should ignore non-Markdown files', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const document = await createMockDocument(content, 'test.ts', 'typescript');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics, undefined, 'Should not create diagnostics for non-Markdown files');
  });

  test('should ignore non-Spec Markdown files', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const document = await createMockDocument(content, 'README.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics, undefined, 'Should not create diagnostics for non-Spec Markdown files');
  });

  test('should process Spec files (cap- prefix)', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const document = await createMockDocument(content, 'cap-persona-poe.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 1, 'Should create diagnostic for cap- files');
  });

  test('should process Spec files (_specs directory)', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const filePath = '/workspace/_specs/domain-core/example.md';
    const document = await createMockDocument(content, filePath, 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 1, 'Should create diagnostic for _specs directory files');
  });

  test('should handle empty file', async () => {
    const content = '';
    const document = await createMockDocument(content, 'cap-test.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 0, 'Should have 0 diagnostics for empty file');
  });

  test('should handle file without (Assumption) markers', async () => {
    const content = `1. 用户登录
2. 选择商品
3. 完成支付`;

    const document = await createMockDocument(content, 'cap-test.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 0, 'Should have 0 diagnostics when no markers present');
  });

  test('should clear diagnostics when document is closed', async () => {
    const content = '3. 如果支付失败,系统发送重试通知 (Assumption)';
    const document = await createMockDocument(content, 'cap-test.md', 'markdown');

    provider.updateDiagnostics(document);
    assert.ok(provider.getDiagnosticCollection().get(document.uri), 'Diagnostics should exist');

    provider.clearDiagnostics(document.uri);
    assert.strictEqual(provider.getDiagnosticCollection().get(document.uri), undefined, 'Diagnostics should be cleared');
  });

  test('should handle multiple (Assumption) markers in same line', async () => {
    const content = '用户登录 (Assumption) 然后支付 (Assumption)';
    const document = await createMockDocument(content, 'cap-test.md', 'markdown');

    provider.updateDiagnostics(document);

    const diagnostics = provider.getDiagnosticCollection().get(document.uri);
    assert.strictEqual(diagnostics?.length, 2, 'Should detect 2 markers in same line');
  });
});

/**
 * 创建 Mock TextDocument
 */
async function createMockDocument(
  content: string, 
  fileName: string, 
  languageId: string
): Promise<vscode.TextDocument> {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: languageId
  });
  
  // Mock document.uri.fsPath
  Object.defineProperty(document.uri, 'fsPath', {
    value: `/tmp/${fileName}`,
    writable: false
  });
  
  return document;
}
