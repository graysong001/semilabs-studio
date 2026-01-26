"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Staging 相关逻辑工具类
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowStateColor = exports.parseThinkingMetadata = void 0;
/**
 * 解析 ### THINKING 块中的元数据
 */
const parseThinkingMetadata = (content) => {
    const thinkingMatch = content.match(/### THINKING([\s\S]*?)(?=###|$)/);
    if (!thinkingMatch)
        return null;
    const thinkingBody = thinkingMatch[1].trim();
    const specId = thinkingBody.match(/Spec Id: (cap-[a-z0-9-]+)/i)?.[1];
    const domain = thinkingBody.match(/Domain: ([a-z-]+)/i)?.[1];
    const stage = thinkingBody.match(/Stage: ([A-Z_]+)/i)?.[1] || 'REASONING';
    return { specId, domain, stage, thinkingBody };
};
exports.parseThinkingMetadata = parseThinkingMetadata;
/**
 * 获取工作流状态对应的颜色
 */
const getWorkflowStateColor = (state) => {
    switch (state) {
        case 'DEFINING': return '#A569BD';
        case 'READY_FOR_USER_APPROVAL': return '#F1C40F';
        case 'PENDING_REVIEW': return '#BB8FCE';
        case 'READY_FOR_IMPLEMENTATION':
        case 'APPROVED': return '#27AE60';
        case 'REJECTED': return '#E74C3C';
        case 'VETOED': return '#E67E22';
        case 'MERGE_READY': return '#3498DB';
        default: return '#888';
    }
};
exports.getWorkflowStateColor = getWorkflowStateColor;
//# sourceMappingURL=StagingUtils.js.map