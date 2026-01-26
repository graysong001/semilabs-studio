/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Markdown Sidecar Parser 单元测试
 */

import * as assert from 'assert';
import { parseMarkdownSidecar } from './MarkdownSidecarParser';

suite('MarkdownSidecarParser', () => {
  /**
   * Test 1: 解析完整的 Sidecar (高置信度场景)
   * 
   * 对应后端 ReactExecutor.buildSidecarMarkdown() 输出格式
   */
  test('should parse complete sidecar with CAPTURED items', () => {
    const content = `
好的,我已将 Redis 转译为分布式缓存约束。

回到战略层：**高并发是这个编辑器的核心价值吗？** 还是我们更关注 Block 数据结构的灵活性？

\`\`\`meta
D: 30
C: 0.78
AI: 0.12
I: ASK
ACT: NONE

CAPTURED:
- Redis → 分布式缓存 (c:0.90, translated)
- Kafka → 事件溯源 (c:0.72, translated)
- PostgreSQL (c:0.45, need_confirm)
\`\`\`
    `.trim();

    const result = parseMarkdownSidecar(content);

    // 验证: hasSidecar = true
    assert.strictEqual(result.hasSidecar, true);

    // 验证: cleanContent 不包含 Sidecar 代码块
    assert.ok(!result.cleanContent.includes('```meta'));
    assert.ok(result.cleanContent.includes('好的,我已将 Redis 转译为分布式缓存约束'));

    // 验证: Sidecar 元数据
    assert.ok(result.sidecar !== undefined);
    assert.strictEqual(result.sidecar!.density, 30);
    assert.strictEqual(result.sidecar!.confidence, 0.78);
    assert.strictEqual(result.sidecar!.assumptionIndex, 0.12);
    assert.strictEqual(result.sidecar!.intentType, 'ASK');
    assert.strictEqual(result.sidecar!.action, 'NONE');

    // 验证: CAPTURED 项
    assert.strictEqual(result.sidecar!.captured!.length, 3);
    
    const capturedItems = result.sidecar!.captured!;
    
    // Item 1: Redis → 分布式缓存 (translated)
    assert.strictEqual(capturedItems[0].tech, 'Redis');
    assert.strictEqual(capturedItems[0].intent, '分布式缓存');
    assert.strictEqual(capturedItems[0].confidence, 0.90);
    assert.strictEqual(capturedItems[0].status, 'translated');
    
    // Item 2: Kafka → 事件溯源 (translated)
    assert.strictEqual(capturedItems[1].tech, 'Kafka');
    assert.strictEqual(capturedItems[1].intent, '事件溯源');
    assert.strictEqual(capturedItems[1].confidence, 0.72);
    assert.strictEqual(capturedItems[1].status, 'translated');
    
    // Item 3: PostgreSQL (need_confirm)
    assert.strictEqual(capturedItems[2].tech, 'PostgreSQL');
    assert.strictEqual(capturedItems[2].intent, '');
    assert.strictEqual(capturedItems[2].confidence, 0.45);
    assert.strictEqual(capturedItems[2].status, 'need_confirm');
  });

  /**
   * Test 2: 无 Sidecar 的普通消息
   */
  test('should return original content when no sidecar present', () => {
    const content = `
这是一个普通的回复,没有 Sidecar。

## 代码示例
\`\`\`javascript
console.log('Hello World');
\`\`\`
    `.trim();

    const result = parseMarkdownSidecar(content);

    // 验证: hasSidecar = false
    assert.strictEqual(result.hasSidecar, false);
    assert.strictEqual(result.sidecar, undefined);
    assert.strictEqual(result.cleanContent, content);
  });

  /**
   * Test 3: 解析部分字段缺失的 Sidecar
   * 
   * 对应后端 InfoD 很高，但没有 CAPTURED 项的场景
   */
  test('should handle sidecar with missing fields gracefully', () => {
    const content = `
回复内容...

\`\`\`meta
D: 85
C: 0.95
\`\`\`
    `.trim();

    const result = parseMarkdownSidecar(content);

    assert.strictEqual(result.hasSidecar, true);
    assert.ok(result.sidecar !== undefined);
    assert.strictEqual(result.sidecar!.density, 85);
    assert.strictEqual(result.sidecar!.confidence, 0.95);
    assert.strictEqual(result.sidecar!.assumptionIndex, undefined);
    assert.strictEqual(result.sidecar!.intentType, undefined);
    assert.strictEqual(result.sidecar!.captured!.length, 0);
  });

  /**
   * Test 4: 边界情况 - 空字符串
   */
  test('should handle empty string', () => {
    const result = parseMarkdownSidecar('');
    
    assert.strictEqual(result.hasSidecar, false);
    assert.strictEqual(result.cleanContent, '');
  });
});
