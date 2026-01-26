"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Markdown Sidecar Parser
 *
 * 解析 Poe v11.2 Flash Translation 生成的 Sidecar Markdown Code Block:
 * - 格式: ```meta
 * - 字段: D/C/AI/I/ACT/CAPTURED
 *
 * Backend 对应实现:
 * - ReactExecutor.buildSidecarMarkdown()
 * - FlashTranslationService.translate()
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMarkdownSidecar = parseMarkdownSidecar;
exports.__testParser = __testParser;
/**
 * 解析 Markdown 消息中的 Sidecar Code Block
 *
 * @param content 原始 Markdown 内容
 * @returns 解析结果
 */
function parseMarkdownSidecar(content) {
    // Regex: 匹配 ```meta ... ``` 代码块
    const sidecarRegex = /```meta\s+([\s\S]*?)```/;
    const match = content.match(sidecarRegex);
    if (!match) {
        // 无 Sidecar,返回原内容
        return {
            cleanContent: content,
            hasSidecar: false,
        };
    }
    // 提取 Sidecar 内容
    const sidecarText = match[1];
    const sidecar = parseSidecarMetadata(sidecarText);
    // 移除 Sidecar 代码块,保留主响应
    const cleanContent = content.replace(sidecarRegex, '').trim();
    return {
        cleanContent,
        sidecar,
        hasSidecar: true,
    };
}
/**
 * 解析 Sidecar 元数据字段
 *
 * 对应后端 ReactExecutor.buildSidecarMarkdown() 格式：
 * ```meta
 * D: 45
 * C: 0.78
 * AI: 0.12
 * I: ASK
 * ACT: NONE
 *
 * CAPTURED:
 * - Redis → 分布式缓存 (c:0.90, translated)
 * - Kafka → 事件溯源 (c:0.72, translated)
 * ```
 *
 * @param text Sidecar 文本内容
 * @returns Sidecar 元数据对象
 */
function parseSidecarMetadata(text) {
    const metadata = {};
    // 解析 D (Density): 0-100
    const densityMatch = text.match(/D:\s*(\d+)/);
    if (densityMatch) {
        metadata.density = parseInt(densityMatch[1], 10);
    }
    // 解析 C (Confidence): 0.0-1.0
    const confidenceMatch = text.match(/C:\s*([\d.]+)/);
    if (confidenceMatch) {
        metadata.confidence = parseFloat(confidenceMatch[1]);
    }
    // 解析 AI (AssumptionIndex): 0.0-1.0
    const assumptionIndexMatch = text.match(/AI:\s*([\d.]+)/);
    if (assumptionIndexMatch) {
        metadata.assumptionIndex = parseFloat(assumptionIndexMatch[1]);
    }
    // 解析 I (IntentType): ASK/PROPOSAL/INFO/WARN
    const intentMatch = text.match(/I:\s*(\w+)/);
    if (intentMatch) {
        metadata.intentType = intentMatch[1].trim();
    }
    // 解析 ACT (Action): NONE/REVIEW_GHOST/CALL_ARCHI
    const actionMatch = text.match(/ACT:\s*(\w+)/);
    if (actionMatch) {
        metadata.action = actionMatch[1].trim();
    }
    // 解析 CAPTURED (Flash Translation 转译结果)
    metadata.captured = parseCapturedItems(text);
    return metadata;
}
/**
 * 解析 CAPTURED 字段中的转译项
 *
 * 对应后端 FlashTranslationService 输出格式:
 * ```
 * CAPTURED:
 * - Redis → 分布式缓存 (c:0.90, translated)
 * - Kafka → 事件溯源 (c:0.72, translated)
 * - PostgreSQL (c:0.45, need_confirm)
 * ```
 *
 * @param text Sidecar 文本内容
 * @returns CAPTURED 项数组
 */
function parseCapturedItems(text) {
    const items = [];
    // Regex: 匹配 CAPTURED 区域
    const capturedSectionMatch = text.match(/CAPTURED:\s*([\s\S]*?)(?:\n\n|$)/);
    if (!capturedSectionMatch) {
        return items;
    }
    const capturedText = capturedSectionMatch[1];
    // Regex: 匹配每一项
    // 格式: - Tech → Intent (c:confidence, status)
    // 示例: - Redis → 分布式缓存 (c:0.90, translated)
    const itemRegex = /- ([^→]+)\s*→\s*([^(]+)\s*\(c:([\d.]+),\s*(\w+)\)/g;
    let match;
    while ((match = itemRegex.exec(capturedText)) !== null) {
        const tech = match[1].trim();
        const intent = match[2].trim();
        const confidence = parseFloat(match[3]);
        const status = match[4].trim();
        items.push({
            tech,
            intent,
            confidence,
            status,
        });
    }
    return items;
}
/**
 * 测试用例 (仅用于开发验证)
 *
 * 对应后端 buildSidecarMarkdown() 实际输出格式
 */
function __testParser() {
    const testContent = `
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
  `;
    const result = parseMarkdownSidecar(testContent);
    console.log('[MarkdownSidecarParser] Test Result:', JSON.stringify(result, null, 2));
    console.log('[MarkdownSidecarParser] Density:', result.sidecar?.density);
    console.log('[MarkdownSidecarParser] Confidence:', result.sidecar?.confidence);
    console.log('[MarkdownSidecarParser] AssumptionIndex:', result.sidecar?.assumptionIndex);
    console.log('[MarkdownSidecarParser] IntentType:', result.sidecar?.intentType);
    console.log('[MarkdownSidecarParser] Action:', result.sidecar?.action);
    console.log('[MarkdownSidecarParser] Captured Items:', result.sidecar?.captured);
}
//# sourceMappingURL=MarkdownSidecarParser.js.map