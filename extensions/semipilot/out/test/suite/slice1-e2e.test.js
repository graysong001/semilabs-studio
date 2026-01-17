"use strict";
/**
 * Slice 1端到端自动化测试
 *
 * 覆盖完整对话流程：UI → Extension → Backend → 响应
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
const SseMessenger_1 = require("../../messenger/SseMessenger");
suite('Slice 1 E2E Tests', () => {
    let messenger;
    const backendUrl = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';
    suiteSetup(() => {
        messenger = new SseMessenger_1.SseMessenger({
            baseUrl: backendUrl,
            reconnectInterval: 5000,
            autoConnect: false,
        });
    });
    suiteTeardown(() => {
        messenger.disconnect();
    });
    suite('Backend Communication', () => {
        test('创建会话成功', async () => {
            // Given: Backend运行正常
            // When: 创建会话
            const session = await messenger.request('chat/create-session', {
                title: 'E2E Test Session',
                specId: 'test-spec',
                specVersion: '1.0.0',
            });
            // Then: 返回会话ID
            assert.ok(session, 'Session应创建成功');
            assert.ok(session.sessionId, 'Session应有ID');
            assert.strictEqual(session.title, 'E2E Test Session');
        });
        test('发送消息并接收回复', async () => {
            // Given: 已创建会话
            const session = await messenger.request('chat/create-session', {
                title: 'Message Test',
                specId: 'test-spec',
                specVersion: '1.0.0',
            });
            // When: 发送消息
            const response = await messenger.request('chat/send-message', {
                sessionId: session.sessionId,
                request: {
                    content: '测试消息',
                },
            });
            // Then: 接收Agent回复
            assert.ok(response, '应返回响应');
            assert.ok(response.messageId, '响应应有messageId');
            assert.strictEqual(response.role, 'assistant');
            assert.strictEqual(response.persona, 'poe');
            assert.ok(response.content, '应有回复内容');
            assert.ok(response.content.length > 0, '回复内容不应为空');
        });
        test('多轮对话', async () => {
            // Given: 已创建会话
            const session = await messenger.request('chat/create-session', {
                title: 'Multi-turn Test',
                specId: 'test-spec',
                specVersion: '1.0.0',
            });
            // When: 发送3轮对话
            const messages = ['你好', '介绍Slice 1', '谢谢'];
            const responses = [];
            for (const msg of messages) {
                const resp = await messenger.request('chat/send-message', {
                    sessionId: session.sessionId,
                    request: { content: msg },
                });
                responses.push(resp);
            }
            // Then: 每轮都应有回复
            assert.strictEqual(responses.length, 3);
            responses.forEach((resp, index) => {
                assert.ok(resp.messageId, `第${index + 1}轮应有messageId`);
                assert.ok(resp.content, `第${index + 1}轮应有回复内容`);
            });
        });
        test('Backend响应格式验证', async () => {
            // Given: 已创建会话
            const session = await messenger.request('chat/create-session', {
                title: 'Format Test',
                specId: 'test-spec',
                specVersion: '1.0.0',
            });
            // When: 发送消息
            const response = await messenger.request('chat/send-message', {
                sessionId: session.sessionId,
                request: { content: '格式测试' },
            });
            // Then: 验证响应字段
            assert.ok(response.messageId, '必须有messageId');
            assert.ok(['user', 'assistant', 'system'].includes(response.role), 'role必须有效');
            assert.ok(response.content, '必须有content');
            assert.ok(response.createdAt, '必须有createdAt');
            // 可选字段验证
            if (response.persona) {
                assert.ok(['poe', 'archi', 'cody', 'tess'].includes(response.persona), 'persona必须有效');
            }
        });
    });
    suite('Error Handling', () => {
        test('Backend不可用时优雅降级', async () => {
            // Given: Backend URL错误
            const badMessenger = new SseMessenger_1.SseMessenger({
                baseUrl: 'http://localhost:9999/api/v1',
                reconnectInterval: 1000,
                autoConnect: false,
            });
            // When & Then: 应抛出连接错误
            try {
                await badMessenger.request('chat/create-session', {
                    title: 'Test',
                    specId: 'test',
                    specVersion: '1.0.0',
                });
                assert.fail('应抛出错误');
            }
            catch (error) {
                assert.ok(error, '应有错误对象');
                assert.ok(error instanceof Error, '应是Error实例');
            }
            badMessenger.disconnect();
        });
        test('无效请求返回400', async () => {
            // When & Then: 空消息应失败
            try {
                const session = await messenger.request('chat/create-session', {
                    title: 'Empty Message Test',
                    specId: 'test',
                    specVersion: '1.0.0',
                });
                await messenger.request('chat/send-message', {
                    sessionId: session.sessionId,
                    request: { content: '' }, // 空消息
                });
                assert.fail('应抛出验证错误');
            }
            catch (error) {
                assert.ok(error, '应有错误');
            }
        });
    });
    suite('Performance', () => {
        test('创建会话响应时间 < 1s', async () => {
            const start = Date.now();
            await messenger.request('chat/create-session', {
                title: 'Performance Test',
                specId: 'test',
                specVersion: '1.0.0',
            });
            const duration = Date.now() - start;
            assert.ok(duration < 1000, `创建会话耗时${duration}ms，应<1000ms`);
        });
        test('消息发送响应时间 < 3s', async () => {
            // Given: 已创建会话
            const session = await messenger.request('chat/create-session', {
                title: 'Performance Test',
                specId: 'test',
                specVersion: '1.0.0',
            });
            // When: 发送消息并计时
            const start = Date.now();
            await messenger.request('chat/send-message', {
                sessionId: session.sessionId,
                request: { content: '性能测试' },
            });
            const duration = Date.now() - start;
            // Then: 响应时间应<3秒
            assert.ok(duration < 3000, `消息响应耗时${duration}ms，应<3000ms`);
        });
        test('并发10个会话创建', async () => {
            // When: 并发创建10个会话
            const start = Date.now();
            const promises = Array(10).fill(null).map((_, i) => messenger.request('chat/create-session', {
                title: `Concurrent Test ${i}`,
                specId: 'test',
                specVersion: '1.0.0',
            }));
            const sessions = await Promise.all(promises);
            const duration = Date.now() - start;
            // Then: 所有会话都应创建成功
            assert.strictEqual(sessions.length, 10);
            sessions.forEach(s => assert.ok(s.sessionId, '每个会话都应有ID'));
            // 并发性能应合理（平均每个<500ms）
            const avgTime = duration / 10;
            assert.ok(avgTime < 500, `平均创建时间${avgTime}ms，应<500ms`);
        });
    });
    suite('Integration Scenarios', () => {
        test('完整对话流程：创建会话→发送消息→验证持久化', async () => {
            // Scenario: 用户打开Extension，发起对话
            // Step 1: 创建会话
            const session = await messenger.request('chat/create-session', {
                title: 'Integration Test',
                specId: 'cap-ui-semipilot',
                specVersion: '1.0.0',
            });
            assert.ok(session.sessionId, 'Step 1: 会话创建成功');
            // Step 2: 用户发送消息
            const response1 = await messenger.request('chat/send-message', {
                sessionId: session.sessionId,
                request: { content: '你好' },
            });
            assert.ok(response1.content, 'Step 2: 收到第一条回复');
            // Step 3: 用户继续对话
            const response2 = await messenger.request('chat/send-message', {
                sessionId: session.sessionId,
                request: { content: '请介绍Slice 1功能' },
            });
            assert.ok(response2.content, 'Step 3: 收到第二条回复');
            // Step 4: 验证完整流程
            assert.strictEqual(response1.persona, 'poe', 'Persona应为poe');
            assert.strictEqual(response2.persona, 'poe', 'Persona应为poe');
        });
    });
});
//# sourceMappingURL=slice1-e2e.test.js.map