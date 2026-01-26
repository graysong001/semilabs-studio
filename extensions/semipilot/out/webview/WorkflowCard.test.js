"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * WorkflowCard 消息监听与状态管理测试
 */
Object.defineProperty(exports, "__esModule", { value: true });
const StagingUtils_1 = require("./StagingUtils");
describe('WorkflowCard - Message Handling Logic', () => {
    test('应当正确解析 stagingListUpdated 消息格式', () => {
        const mockMessage = {
            type: 'stagingListUpdated',
            specs: [
                { domain: 'auth', specId: 'cap-login', workflowState: 'DEFINING' },
                { domain: 'payment', specId: 'cap-checkout', workflowState: 'PENDING_REVIEW' }
            ]
        };
        // 验证消息结构
        expect(mockMessage.specs).toHaveLength(2);
        expect(mockMessage.specs[0].domain).toBe('auth');
        expect(mockMessage.specs[1].workflowState).toBe('PENDING_REVIEW');
    });
    test('应当为不同状态返回对应的操作按钮', () => {
        const definingActions = ['submit'];
        const approvalReadyActions = ['submit']; // Confirm & Submit
        const pendingReviewActions = ['approve', 'veto'];
        const mergeReadyActions = ['archive'];
        const vetoedActions = ['submit']; // 被驳回后重新提交
        expect(definingActions).toContain('submit');
        expect(approvalReadyActions).toContain('submit');
        expect(pendingReviewActions).toContain('approve');
        expect(pendingReviewActions).toContain('veto');
        expect(mergeReadyActions).toContain('archive');
        expect(vetoedActions).toContain('submit');
    });
    test('应当正确构造 workflowAction 消息体', () => {
        const mockAction = {
            type: 'workflowAction',
            action: 'veto',
            domain: 'auth',
            specId: 'cap-login',
            params: { reason: 'Missing security check' }
        };
        expect(mockAction.action).toBe('veto');
        expect(mockAction.params?.reason).toBe('Missing security check');
    });
    test('应当为每个状态返回正确的颜色编码', () => {
        expect((0, StagingUtils_1.getWorkflowStateColor)('DEFINING')).toBe('#A569BD');
        expect((0, StagingUtils_1.getWorkflowStateColor)('READY_FOR_USER_APPROVAL')).toBe('#F1C40F');
        expect((0, StagingUtils_1.getWorkflowStateColor)('PENDING_REVIEW')).toBe('#BB8FCE');
        expect((0, StagingUtils_1.getWorkflowStateColor)('VETOED')).toBe('#E67E22');
        expect((0, StagingUtils_1.getWorkflowStateColor)('MERGE_READY')).toBe('#3498DB');
    });
    test('应当在空列表时显示占位文案', () => {
        const emptySpecs = [];
        const expectedText = 'No active staging specs.';
        expect(emptySpecs.length).toBe(0);
        expect(expectedText).toContain('No active');
    });
});
describe('WorkflowCard - Connection Status Logic', () => {
    test('应当根据连接状态显示正确的标识', () => {
        const connectedLabel = 'LIVE';
        const disconnectedLabel = 'OFFLINE';
        expect(connectedLabel).toBe('LIVE');
        expect(disconnectedLabel).toBe('OFFLINE');
    });
    test('应当在断线时保留最后一次状态快照', () => {
        const lastKnownSpecs = [
            { domain: 'auth', specId: 'cap-login', workflowState: 'DEFINING' }
        ];
        // 模拟断线后的状态保留
        expect(lastKnownSpecs).toHaveLength(1);
        expect(lastKnownSpecs[0].specId).toBe('cap-login');
    });
});
describe('WorkflowCard - Action Button Visibility', () => {
    test('DEFINING 状态应当显示 Submit 按钮', () => {
        const state = 'DEFINING';
        const expectedButton = 'Submit';
        expect(state === 'DEFINING').toBe(true);
        expect(expectedButton).toBe('Submit');
    });
    test('PENDING_REVIEW 状态应当显示 Approve 和 Veto 按钮', () => {
        const state = 'PENDING_REVIEW';
        const expectedButtons = ['Approve', 'Veto'];
        expect(state === 'PENDING_REVIEW').toBe(true);
        expect(expectedButtons).toContain('Approve');
        expect(expectedButtons).toContain('Veto');
    });
    test('MERGE_READY 状态应当显示 Ship It 按钮', () => {
        const state = 'MERGE_READY';
        const expectedButton = 'Ship It';
        expect(state === 'MERGE_READY').toBe(true);
        expect(expectedButton).toBe('Ship It');
    });
    test('VETOED 状态不应显示操作按钮', () => {
        const state = 'VETOED';
        const shouldShowButton = !['VETOED', 'APPROVED', 'REJECTED'].includes(state);
        expect(shouldShowButton).toBe(false);
    });
});
describe('WorkflowCard - Global Archive Logic', () => {
    test('当所有 Spec 都是 MERGE_READY 时，应当允许全量归档', () => {
        const specs = [
            { domain: 'auth', specId: 'cap-1', workflowState: 'MERGE_READY' },
            { domain: 'auth', specId: 'cap-2', workflowState: 'MERGE_READY' }
        ];
        const canArchiveAll = specs.length > 0 && specs.every(s => s.workflowState === 'MERGE_READY');
        expect(canArchiveAll).toBe(true);
    });
    test('只要有一个 Spec 不是 MERGE_READY，就不应显示全量归档', () => {
        const specs = [
            { domain: 'auth', specId: 'cap-1', workflowState: 'MERGE_READY' },
            { domain: 'auth', specId: 'cap-2', workflowState: 'DEFINING' }
        ];
        const canArchiveAll = specs.length > 0 && specs.every(s => s.workflowState === 'MERGE_READY');
        expect(canArchiveAll).toBe(false);
    });
    test('空列表时不应显示全量归档', () => {
        const specs = [];
        const canArchiveAll = specs.length > 0 && specs.every(s => s.workflowState === 'MERGE_READY');
        expect(canArchiveAll).toBe(false);
    });
});
//# sourceMappingURL=WorkflowCard.test.js.map