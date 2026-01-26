"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Staging 工具类自动化测试
 */
Object.defineProperty(exports, "__esModule", { value: true });
const StagingUtils_1 = require("./StagingUtils");
describe('StagingUtils - parseThinkingMetadata', () => {
    test('应当正确解析 THINKING 块中的 Spec Id, Domain 和 Stage', () => {
        const content = `
### THINKING
*   Spec Id: cap-auth-login
*   Domain: auth
*   Stage: DEFINING
*   Context analysis...

Regular message content.
`;
        const result = (0, StagingUtils_1.parseThinkingMetadata)(content);
        expect(result).not.toBeNull();
        expect(result.specId).toBe('cap-auth-login');
        expect(result.domain).toBe('auth');
        expect(result.stage).toBe('DEFINING');
    });
    test('应当返回 null 如果没有 THINKING 块', () => {
        const result = (0, StagingUtils_1.parseThinkingMetadata)('Just a regular message');
        expect(result).toBeNull();
    });
    test('应当支持不区分大小写的 Spec Id 和 Domain', () => {
        const content = `
### THINKING
Spec id: CAP-Auth-Login
domain: AUTH
`;
        const result = (0, StagingUtils_1.parseThinkingMetadata)(content);
        expect(result.specId).toBe('CAP-Auth-Login');
        expect(result.domain).toBe('AUTH');
    });
    test('应当在缺少字段时填充默认值', () => {
        const content = '### THINKING\nSome thinking without metadata.';
        const result = (0, StagingUtils_1.parseThinkingMetadata)(content);
        expect(result.specId).toBeUndefined();
        expect(result.domain).toBeUndefined();
        expect(result.stage).toBe('REASONING'); // 默认值
    });
});
describe('StagingUtils - getWorkflowStateColor', () => {
    test('应当为不同的工作流状态返回正确的颜色', () => {
        expect((0, StagingUtils_1.getWorkflowStateColor)('DEFINING')).toBe('#A569BD');
        expect((0, StagingUtils_1.getWorkflowStateColor)('READY_FOR_USER_APPROVAL')).toBe('#F1C40F');
        expect((0, StagingUtils_1.getWorkflowStateColor)('PENDING_REVIEW')).toBe('#BB8FCE');
        expect((0, StagingUtils_1.getWorkflowStateColor)('APPROVED')).toBe('#27AE60');
        expect((0, StagingUtils_1.getWorkflowStateColor)('VETOED')).toBe('#E67E22');
        expect((0, StagingUtils_1.getWorkflowStateColor)('MERGE_READY')).toBe('#3498DB');
        expect((0, StagingUtils_1.getWorkflowStateColor)('UNKNOWN')).toBe('#888');
    });
});
//# sourceMappingURL=StagingUtils.test.js.map