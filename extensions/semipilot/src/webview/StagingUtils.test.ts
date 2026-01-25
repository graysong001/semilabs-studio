/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Staging 工具类自动化测试
 */

import { parseThinkingMetadata, getWorkflowStateColor } from './StagingUtils';

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

    const result = parseThinkingMetadata(content);
    expect(result).not.toBeNull();
    expect(result!.specId).toBe('cap-auth-login');
    expect(result!.domain).toBe('auth');
    expect(result!.stage).toBe('DEFINING');
  });

  test('应当返回 null 如果没有 THINKING 块', () => {
    const result = parseThinkingMetadata('Just a regular message');
    expect(result).toBeNull();
  });

  test('应当支持不区分大小写的 Spec Id 和 Domain', () => {
    const content = `
### THINKING
Spec id: CAP-Auth-Login
domain: AUTH
`;
    const result = parseThinkingMetadata(content);
    expect(result!.specId).toBe('CAP-Auth-Login');
    expect(result!.domain).toBe('AUTH');
  });

  test('应当在缺少字段时填充默认值', () => {
    const content = '### THINKING\nSome thinking without metadata.';
    const result = parseThinkingMetadata(content);
    expect(result!.specId).toBeUndefined();
    expect(result!.domain).toBeUndefined();
    expect(result!.stage).toBe('REASONING'); // 默认值
  });
});

describe('StagingUtils - getWorkflowStateColor', () => {
  test('应当为不同的工作流状态返回正确的颜色', () => {
    expect(getWorkflowStateColor('DEFINING')).toBe('#A569BD');
    expect(getWorkflowStateColor('READY_FOR_USER_APPROVAL')).toBe('#F1C40F');
    expect(getWorkflowStateColor('PENDING_REVIEW')).toBe('#BB8FCE');
    expect(getWorkflowStateColor('APPROVED')).toBe('#27AE60');
    expect(getWorkflowStateColor('VETOED')).toBe('#E67E22');
    expect(getWorkflowStateColor('MERGE_READY')).toBe('#3498DB');
    expect(getWorkflowStateColor('UNKNOWN')).toBe('#888');
  });
});
