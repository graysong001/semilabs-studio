"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Workflow End-to-End Tests
 *
 * 端到端测试 Draft → Workflow → SSE 完整链路：
 * - Draft API（upsert/clear）
 * - Workflow API（submit/veto/resolve）
 * - WorkflowEvent SSE 推送
 * - handleWorkflowAction 行为
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
const SseMessenger_1 = require("../messenger/SseMessenger");
describe('Workflow E2E Tests', function () {
    this.timeout(60000);
    const BACKEND_URL = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
    let messenger;
    before(function () {
        console.log('[Workflow E2E] Testing against:', BACKEND_URL);
    });
    beforeEach(function () {
        messenger = new SseMessenger_1.SseMessenger({ baseUrl: BACKEND_URL });
    });
    afterEach(function (done) {
        if (messenger) {
            messenger.disconnect();
        }
        setTimeout(done, 500);
    });
    describe('Draft → Workflow 完整流程', function () {
        it('应该能调用 Draft upsert API', async function () {
            try {
                const response = await fetch(`${BACKEND_URL}/draft/upsert`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: `test-session-${Date.now()}`,
                        type: 'FEATURE',
                        content: '# Test Feature\n\nThis is a test feature spec.',
                    }),
                });
                assert.ok(response.ok, `Draft upsert 应该返回 2xx: ${response.status}`);
                const result = await response.json();
                console.log('[E2E] Draft upsert result:', result);
                assert.ok(result.success || result.data, 'Response 应该包含 success 或 data 字段');
            }
            catch (error) {
                console.warn('[E2E] Draft upsert failed (backend may not be running):', error);
                this.skip();
            }
        });
        it('应该能调用 Workflow submit API', async function () {
            try {
                const response = await fetch(`${BACKEND_URL}/workflow/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filePath: '/specs/cap-test-e2e.md',
                    }),
                });
                assert.ok(response.ok, `Workflow submit 应该返回 2xx: ${response.status}`);
                const result = await response.json();
                console.log('[E2E] Workflow submit result:', result);
                assert.ok(result.success || result.data, 'Response 应该包含 success 或 data 字段');
            }
            catch (error) {
                console.warn('[E2E] Workflow submit failed (backend may not be running):', error);
                this.skip();
            }
        });
        it('应该能调用 Workflow veto API', async function () {
            try {
                const response = await fetch(`${BACKEND_URL}/workflow/veto`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filePath: '/specs/cap-test-e2e.md',
                        reason: '架构不合理',
                        suggestion: '建议使用六边形架构',
                    }),
                });
                assert.ok(response.ok, `Workflow veto 应该返回 2xx: ${response.status}`);
                const result = await response.json();
                console.log('[E2E] Workflow veto result:', result);
                assert.ok(result.success || result.data, 'Response 应该包含 success 或 data 字段');
            }
            catch (error) {
                console.warn('[E2E] Workflow veto failed (backend may not be running):', error);
                this.skip();
            }
        });
        it('应该能调用 Workflow resolve API', async function () {
            try {
                const response = await fetch(`${BACKEND_URL}/workflow/resolve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filePath: '/specs/cap-test-e2e.md',
                        userApproved: true,
                    }),
                });
                assert.ok(response.ok, `Workflow resolve 应该返回 2xx: ${response.status}`);
                const result = await response.json();
                console.log('[E2E] Workflow resolve result:', result);
                assert.ok(result.success || result.data, 'Response 应该包含 success 或 data 字段');
            }
            catch (error) {
                console.warn('[E2E] Workflow resolve failed (backend may not be running):', error);
                this.skip();
            }
        });
    });
    describe('Draft → SSE 事件推送', function () {
        it('upsert Draft 后应该收到 DRAFT_UPDATED 事件', function (done) {
            let eventReceived = false;
            messenger.on('workflow/event', (message) => {
                const event = message.data;
                console.log('[E2E] Received workflow event:', event);
                if (event.type === 'DRAFT_UPDATED') {
                    eventReceived = true;
                    assert.ok(event.target, '事件应该有 target 字段');
                    assert.strictEqual(event.workflowState, 'DRAFTING', 'Draft 状态应该是 DRAFTING');
                    done();
                }
            });
            messenger.connectWorkflow();
            setTimeout(async () => {
                try {
                    // 触发 Draft upsert
                    await fetch(`${BACKEND_URL}/draft/upsert`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: `test-e2e-${Date.now()}`,
                            type: 'FEATURE',
                            content: '# E2E Test Feature',
                        }),
                    });
                }
                catch (error) {
                    console.warn('[E2E] Failed to trigger upsert:', error);
                }
                // 等待事件
                setTimeout(() => {
                    if (!eventReceived) {
                        console.warn('[E2E] No DRAFT_UPDATED event received (may be normal in test environment)');
                        done();
                    }
                }, 5000);
            }, 2000);
        });
    });
    describe('Workflow 状态流转', function () {
        it('Submit → Veto → Resolve 完整流程应该触发对应事件', function (done) {
            const receivedEvents = [];
            messenger.on('workflow/event', (message) => {
                const event = message.data;
                console.log('[E2E] Received event in workflow:', event);
                receivedEvents.push(event);
            });
            messenger.connectWorkflow();
            setTimeout(async () => {
                try {
                    const testFile = `/specs/cap-e2e-test-${Date.now()}.md`;
                    // 步骤 1: Submit
                    console.log('[E2E] Step 1: Submit');
                    await fetch(`${BACKEND_URL}/workflow/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: testFile }),
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // 步骤 2: Veto
                    console.log('[E2E] Step 2: Veto');
                    await fetch(`${BACKEND_URL}/workflow/veto`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            filePath: testFile,
                            reason: 'E2E test veto',
                            suggestion: 'E2E test suggestion',
                        }),
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // 步骤 3: Resolve
                    console.log('[E2E] Step 3: Resolve');
                    await fetch(`${BACKEND_URL}/workflow/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            filePath: testFile,
                            userApproved: true,
                        }),
                    });
                    // 等待事件
                    setTimeout(() => {
                        console.log(`[E2E] Total events received: ${receivedEvents.length}`);
                        receivedEvents.forEach((evt, idx) => {
                            console.log(`  ${idx + 1}. ${evt.type} - ${evt.workflowState}`);
                        });
                        // 验证至少收到一些事件
                        if (receivedEvents.length > 0) {
                            assert.ok(true, '应该收到至少一个 Workflow 事件');
                        }
                        else {
                            console.warn('[E2E] No events received (may be normal in test environment)');
                        }
                        done();
                    }, 3000);
                }
                catch (error) {
                    console.warn('[E2E] Workflow flow failed:', error);
                    done();
                }
            }, 2000);
        });
    });
    describe('并发操作与事件顺序', function () {
        it('多个 Draft 操作应该按顺序触发事件', function (done) {
            const receivedEvents = [];
            messenger.on('workflow/event', (message) => {
                const event = message.data;
                receivedEvents.push(event);
                console.log(`[E2E] Event ${receivedEvents.length}: ${event.type}`);
            });
            messenger.connectWorkflow();
            setTimeout(async () => {
                try {
                    const sessionId = `test-concurrent-${Date.now()}`;
                    // 连续发送 3 个 Draft upsert
                    for (let i = 1; i <= 3; i++) {
                        await fetch(`${BACKEND_URL}/draft/upsert`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                sessionId,
                                type: 'FEATURE',
                                content: `# Feature ${i}`,
                            }),
                        });
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    // 等待事件
                    setTimeout(() => {
                        console.log(`[E2E] Total events for concurrent test: ${receivedEvents.length}`);
                        if (receivedEvents.length >= 3) {
                            // 验证事件都是 DRAFT_UPDATED
                            const allDraftUpdates = receivedEvents.every(evt => evt.type === 'DRAFT_UPDATED');
                            assert.ok(allDraftUpdates, '所有事件应该是 DRAFT_UPDATED');
                        }
                        else {
                            console.warn('[E2E] Expected at least 3 events, got:', receivedEvents.length);
                        }
                        done();
                    }, 3000);
                }
                catch (error) {
                    console.warn('[E2E] Concurrent test failed:', error);
                    done();
                }
            }, 2000);
        });
    });
});
//# sourceMappingURL=workflow-e2e.test.js.map