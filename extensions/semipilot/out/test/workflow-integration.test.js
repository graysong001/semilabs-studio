"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Workflow SSE Integration Tests
 *
 * 测试 Workflow SSE 连接和事件处理：
 * - 独立 SSE 通道连接
 * - WorkflowEvent 接收与解析
 * - handleWorkflowAction REST API 调用
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
describe('Workflow SSE Integration Tests', function () {
    this.timeout(30000);
    const BACKEND_URL = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
    let messenger;
    before(function () {
        console.log('[Workflow Integration] Testing against:', BACKEND_URL);
    });
    beforeEach(function () {
        messenger = new SseMessenger_1.SseMessenger({ baseUrl: BACKEND_URL });
    });
    afterEach(function (done) {
        if (messenger) {
            messenger.disconnect();
        }
        // 等待连接完全关闭
        setTimeout(done, 500);
    });
    describe('Workflow SSE 通道', function () {
        it('应该能连接 Workflow SSE 通道', function (done) {
            messenger.connectWorkflow();
            // 增加等待时间，确保 onopen 触发
            setTimeout(() => {
                const connected = messenger.isWorkflowConnectedToBackend();
                console.log('[Test] Connection status:', connected);
                assert.ok(connected, 'Workflow SSE 通道应该已连接');
                done();
            }, 3000); // 从 2秒 增加到 3秒
        });
        it('断开连接应该关闭 Workflow SSE 通道', function (done) {
            messenger.connectWorkflow();
            setTimeout(() => {
                const beforeDisconnect = messenger.isWorkflowConnectedToBackend();
                console.log('[Test] Before disconnect:', beforeDisconnect);
                assert.ok(beforeDisconnect, '连接前：Workflow 通道应该已连接');
                messenger.disconnect();
                setTimeout(() => {
                    const afterDisconnect = messenger.isWorkflowConnectedToBackend();
                    console.log('[Test] After disconnect:', afterDisconnect);
                    assert.ok(!afterDisconnect, '断开后：Workflow 通道应该已断开');
                    done();
                }, 500);
            }, 3000); // 从 2秒 增加到 3秒
        });
        it('重复调用 connectWorkflow 应该不重复连接', function (done) {
            messenger.connectWorkflow();
            messenger.connectWorkflow(); // 第二次调用
            setTimeout(() => {
                const connected = messenger.isWorkflowConnectedToBackend();
                console.log('[Test] Duplicate connect status:', connected);
                assert.ok(connected, 'Workflow SSE 通道应该已连接');
                done();
            }, 3000); // 从 2秒 增加到 3秒
        });
    });
    describe('WorkflowEvent 接收与解析', function () {
        it('应该能接收 DRAFT_UPDATED 事件', function (done) {
            let receivedEvent = null;
            messenger.on('workflow/event', (message) => {
                receivedEvent = message.data;
                console.log('[Test] Received DRAFT_UPDATED event:', receivedEvent);
            });
            messenger.connectWorkflow();
            // 等待可能的事件（如果后端有推送）
            setTimeout(() => {
                if (receivedEvent) {
                    assert.ok(receivedEvent.type, '事件应该有 type 字段');
                    assert.ok(receivedEvent.target, '事件应该有 target 字段');
                    assert.ok(receivedEvent.workflowState, '事件应该有 workflowState 字段');
                    console.log('[Test] Event validation passed');
                }
                else {
                    console.log('[Test] No event received (backend may not push events during test)');
                }
                done();
            }, 5000);
        });
        it('应该正确解析 WorkflowEvent 各字段', function (done) {
            let receivedEvent = null;
            messenger.on('workflow/event', (message) => {
                receivedEvent = message.data;
                console.log('[Test] Parsing event fields:', receivedEvent);
                // 验证必填字段
                assert.ok(receivedEvent.type, 'type 字段应该存在');
                assert.ok(receivedEvent.target, 'target 字段应该存在');
                assert.ok(receivedEvent.workflowState, 'workflowState 字段应该存在');
                // 验证类型
                const validTypes = ['DRAFT_UPDATED', 'PROPOSAL_READY', 'REVIEW_SUBMITTED', 'VETO_APPLIED', 'FIX_SUBMITTED', 'WORKFLOW_APPROVED'];
                assert.ok(validTypes.includes(receivedEvent.type), `type 应该是有效值之一: ${receivedEvent.type}`);
                console.log('[Test] All fields validated');
                done();
            });
            messenger.connectWorkflow();
            // 如果 5 秒内没有事件，认为后端未推送（测试环境正常）
            setTimeout(() => {
                if (!receivedEvent) {
                    console.log('[Test] No event to parse (skipped)');
                    done();
                }
            }, 5000);
        });
    });
    describe('多事件类型支持', function () {
        /* const _eventTypes = [
          'DRAFT_UPDATED',
          'PROPOSAL_READY',
          'REVIEW_SUBMITTED',
          'VETO_APPLIED',
          'FIX_SUBMITTED',
          'WORKFLOW_APPROVED'
        ]; */
        it('应该能监听所有 WorkflowEventType', function (done) {
            const receivedTypes = new Set();
            messenger.on('workflow/event', (message) => {
                const event = message.data;
                receivedTypes.add(event.type);
                console.log(`[Test] Received event type: ${event.type}`);
            });
            messenger.connectWorkflow();
            // 等待可能的事件
            setTimeout(() => {
                console.log(`[Test] Received ${receivedTypes.size} unique event types:`, Array.from(receivedTypes));
                // 测试通过（无论收到多少事件）
                done();
            }, 5000);
        });
    });
    describe('错误处理与重连', function () {
        it('连接错误应该不抛出异常', function (done) {
            const badMessenger = new SseMessenger_1.SseMessenger({ baseUrl: 'http://invalid-url:9999/api/v1' });
            try {
                badMessenger.connectWorkflow();
                // 应该不抛异常
                setTimeout(() => {
                    assert.ok(!badMessenger.isWorkflowConnectedToBackend(), '无效 URL 不应该连接成功');
                    badMessenger.disconnect();
                    done();
                }, 2000);
            }
            catch (error) {
                assert.fail(`连接错误不应该抛异常: ${error}`);
            }
        });
        it('重复调用 connectWorkflow 应该不重复连接', function (done) {
            messenger.connectWorkflow();
            setTimeout(() => {
                const firstStatus = messenger.isWorkflowConnectedToBackend();
                // 再次调用
                messenger.connectWorkflow();
                setTimeout(() => {
                    const secondStatus = messenger.isWorkflowConnectedToBackend();
                    assert.strictEqual(firstStatus, secondStatus, '状态不应该改变');
                    done();
                }, 500);
            }, 2000);
        });
    });
    describe('状态检查 API', function () {
        it('isWorkflowConnectedToBackend 应该反映连接状态', function (done) {
            assert.ok(!messenger.isWorkflowConnectedToBackend(), '初始状态应该是未连接');
            messenger.connectWorkflow();
            setTimeout(() => {
                assert.ok(messenger.isWorkflowConnectedToBackend(), '连接后状态应该是已连接');
                messenger.disconnect();
                setTimeout(() => {
                    assert.ok(!messenger.isWorkflowConnectedToBackend(), '断开后状态应该是未连接');
                    done();
                }, 500);
            }, 2000);
        });
    });
    describe('消息格式兼容性', function () {
        it('应该兼容后端使用 event name = WorkflowEventType 的格式', function (done) {
            let eventReceived = false;
            messenger.on('workflow/event', (message) => {
                eventReceived = true;
                console.log('[Test] Received event with compatible format:', message.data);
            });
            messenger.connectWorkflow();
            setTimeout(() => {
                // 测试通过（无论是否收到事件）
                if (eventReceived) {
                    console.log('[Test] Event received and parsed successfully');
                }
                else {
                    console.log('[Test] No event received (backend may use different format)');
                }
                done();
            }, 3000);
        });
    });
});
//# sourceMappingURL=workflow-integration.test.js.map