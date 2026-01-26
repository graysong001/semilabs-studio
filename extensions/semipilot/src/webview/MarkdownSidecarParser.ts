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

/**
 * Sidecar 元数据结构
 * 
 * 对应后端 ReactExecutor.buildSidecarMarkdown() 输出格式：
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
 */
export interface SidecarMetadata {
  /**
   * D (Density): 信息密度 (0-100)
   * 示例: 45
   */
  density?: number;

  /**
   * C (Confidence): 置信度 (0.0-1.0)
   * 示例: 0.78
   */
  confidence?: number;

  /**
   * AI (AssumptionIndex): 假设指数 (0.0-1.0)
   * 示例: 0.12
   */
  assumptionIndex?: number;

  /**
   * I (Intent): 意图类型
   * - ASK: 需要提问
   * - PROPOSAL: 生成方案
   * - INFO: 信息型
   * - WARN: 警告
   */
  intentType?: string;

  /**
   * ACT (Action): 建议动作
   * - NONE: 无后续动作
   * - REVIEW_GHOST: 审查 Ghost 假设
   * - CALL_ARCHI: 召唤 Archi 审核
   */
  action?: string;

  /**
   * CAPTURED: Flash Translation 转译结果
   * 
   * 格式:
   * ```
   * CAPTURED:
   * - Redis → 分布式缓存 (c:0.90, translated)
   * - Kafka → 事件溯源 (c:0.72, translated)
   * - PostgreSQL (c:0.45, need_confirm)
   * ```
   */
  captured?: CapturedItem[];
}

/**
 * CAPTURED 项结构
 * 
 * 对应后端 FlashTranslationService 输出格式
 */
export interface CapturedItem {
  /**
   * 技术栈名称
   * 示例: "Redis", "Kafka", "PostgreSQL"
   */
  tech: string;

  /**
   * 战略意图（转译结果）
   * 示例: "分布式缓存", "事件溯源", "关系型数据库"
   */
  intent: string;

  /**
   * 置信度 (0.0-1.0)
   * 示例: 0.90, 0.72, 0.45
   */
  confidence: number;

  /**
   * 状态
   * - translated: 已转译（高置信度 >0.7）
   * - need_confirm: 需确认（中等置信度 0.4-0.7）
   * - context_only: 仅保留（低置信度 <0.4）
   */
  status: 'translated' | 'need_confirm' | 'context_only';
}

/**
 * 解析结果
 */
export interface ParsedMessage {
  /**
   * 原始消息内容 (去除 Sidecar)
   */
  cleanContent: string;

  /**
   * Sidecar 元数据 (可能为空)
   */
  sidecar?: SidecarMetadata;

  /**
   * 是否包含 Sidecar
   */
  hasSidecar: boolean;
}

/**
 * 解析 Markdown 消息中的 Sidecar Code Block
 * 
 * @param content 原始 Markdown 内容
 * @returns 解析结果
 */
export function parseMarkdownSidecar(content: string): ParsedMessage {
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
function parseSidecarMetadata(text: string): SidecarMetadata {
  const metadata: SidecarMetadata = {};

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
function parseCapturedItems(text: string): CapturedItem[] {
  const items: CapturedItem[] = [];

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
    const status = match[4].trim() as 'translated' | 'need_confirm' | 'context_only';

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
export function __testParser() {
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
