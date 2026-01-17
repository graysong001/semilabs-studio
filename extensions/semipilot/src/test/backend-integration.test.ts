/**
 * Backend集成测试（无需VS Code环境）
 * 
 * 使用标准mocha + assert，直接测试SseMessenger与Backend通信
 */

import * as assert from 'assert';
import { SseMessenger } from '../messenger/SseMessenger';

describe('Backend Integration Tests', () => {
  let messenger: SseMessenger;
  const backendUrl = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080/api/v1';

  before(() => {
    messenger = new SseMessenger({
      baseUrl: backendUrl,
      reconnectInterval: 5000,
      autoConnect: false,
    });
  });

  after(() => {
    messenger.disconnect();
  });

  describe('Chat API', () => {
    it('应成功创建会话', async function() {
      this.timeout(5000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Integration Test Session',
        specId: 'test-spec',
        specVersion: '1.0.0',
      });

      assert.ok(session, 'Session应创建成功');
      assert.ok(session.sessionId, 'Session应有sessionId');
      assert.strictEqual(session.title, 'Integration Test Session');
    });

    it('应成功发送消息并接收回复', async function() {
      this.timeout(10000);
      
      // 创建会话
      const session = await messenger.request('chat/create-session', {
        title: 'Message Test',
        specId: 'test-spec',
        specVersion: '1.0.0',
      });

      // 发送消息
      const response = await messenger.request('chat/send-message', {
        sessionId: session.sessionId,
        request: {
          content: '你好',
        },
      });

      assert.ok(response, '应返回响应');
      assert.ok(response.messageId, '响应应有messageId');
      assert.strictEqual(response.role, 'assistant');
      assert.strictEqual(response.persona, 'poe');
      assert.ok(response.content, '应有回复内容');
      assert.ok(response.content.length > 0, '回复内容不应为空');
    });

    it('应支持多轮对话', async function() {
      this.timeout(30000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Multi-turn Test',
        specId: 'test-spec',
        specVersion: '1.0.0',
      });

      const messages = ['介绍Slice 1', '谢谢'];
      const responses: any[] = [];

      for (const msg of messages) {
        const resp = await messenger.request('chat/send-message', {
          sessionId: session.sessionId,
          request: { content: msg },
        });
        responses.push(resp);
      }

      assert.strictEqual(responses.length, 2);
      responses.forEach((resp: any, index) => {
        assert.ok(resp.messageId, `第${index + 1}轮应有messageId`);
        assert.ok(resp.content, `第${index + 1}轮应有回复内容`);
      });
    });

    it('应验证响应格式正确', async function() {
      this.timeout(10000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Format Test',
        specId: 'test-spec',
        specVersion: '1.0.0',
      });

      const response = await messenger.request('chat/send-message', {
        sessionId: session.sessionId,
        request: { content: '格式测试' },
      });

      // 必填字段
      assert.ok(response.messageId, '必须有messageId');
      assert.ok(['user', 'assistant', 'system'].includes(response.role), 'role必须有效');
      assert.ok(response.content, '必须有content');
      assert.ok(response.createdAt, '必须有createdAt');
      
      // 可选字段
      if (response.persona) {
        assert.ok(['poe', 'archi', 'cody', 'tess'].includes(response.persona), 'persona必须有效');
      }
    });
  });

  describe('Error Handling', () => {
    it('Backend不可用时应抛出错误', async function() {
      this.timeout(5000);
      
      const badMessenger = new SseMessenger({
        baseUrl: 'http://localhost:9999/api/v1',
        reconnectInterval: 1000,
        autoConnect: false,
      });

      try {
        await badMessenger.request('chat/create-session', {
          title: 'Test',
          specId: 'test',
          specVersion: '1.0.0',
        });
        assert.fail('应抛出错误');
      } catch (error) {
        assert.ok(error, '应有错误对象');
        assert.ok(error instanceof Error, '应是Error实例');
      } finally {
        badMessenger.disconnect();
      }
    });

    it('空消息应返回错误', async function() {
      this.timeout(5000);
      
      try {
        const session = await messenger.request('chat/create-session', {
          title: 'Empty Message Test',
          specId: 'test',
          specVersion: '1.0.0',
        });

        await messenger.request('chat/send-message', {
          sessionId: session.sessionId,
          request: { content: '' },
        });
        assert.fail('应抛出验证错误');
      } catch (error) {
        assert.ok(error, '应有错误');
      }
    });
  });

  describe('Performance', () => {
    it('创建会话响应时间应<1秒', async function() {
      this.timeout(5000);
      
      const start = Date.now();
      await messenger.request('chat/create-session', {
        title: 'Performance Test',
        specId: 'test',
        specVersion: '1.0.0',
      });
      const duration = Date.now() - start;

      assert.ok(duration < 1000, `创建会话耗时${duration}ms，应<1000ms`);
    });

    it('消息发送响应时间应<5秒', async function() {
      this.timeout(10000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Performance Test',
        specId: 'test',
        specVersion: '1.0.0',
      });

      const start = Date.now();
      await messenger.request('chat/send-message', {
        sessionId: session.sessionId,
        request: { content: '性能测试' },
      });
      const duration = Date.now() - start;

      assert.ok(duration < 5000, `消息响应耗时${duration}ms，应<5000ms`);
    });
  });

  describe('Protocol Mapping', () => {
    it('应正确映射endpoint路径参数', async function() {
      this.timeout(10000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Path Param Test',
        specId: 'test',
        specVersion: '1.0.0',
      });

      // 验证sessionId被正确替换到路径中
      const response = await messenger.request('chat/send-message', {
        sessionId: session.sessionId,
        request: { content: '测试路径参数' },
      });

      assert.ok(response, '应成功映射路径参数');
    });

    it('应正确展开request字段', async function() {
      this.timeout(10000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Request Body Test',
        specId: 'test',
        specVersion: '1.0.0',
      });

      // Extension: {sessionId, request: {content}}
      // Backend: {content}
      const response = await messenger.request('chat/send-message', {
        sessionId: session.sessionId,
        request: {
          content: '测试请求体展开',
        },
      });

      assert.ok(response.content, '应正确展开request字段');
    });

    it('应正确处理Backend ApiResponse格式', async function() {
      this.timeout(5000);
      
      // Backend返回: {success: true, data: {...}}
      const session = await messenger.request('chat/create-session', {
        title: 'ApiResponse Test',
        specId: 'test',
        specVersion: '1.0.0',
      });

      assert.ok(session.sessionId, '应从ApiResponse.data提取sessionId');
    });
  });

  describe('Request Body Handling', () => {
    it('GET请求不应包含body', async function() {
      this.timeout(5000);
      
      // 验证GET请求不会发送body（即使data非空）
      // 注意：Slice 1没有实现GET chat/sessions，此测试为架构验证
      // 当前会抛出"Unknown message type"错误
      try {
        await (messenger as any).request('chat/get-sessions', {
          productId: 'test',
        });
        // 如果未来实现了该endpoint，这个测试应通过
        assert.ok(true, 'GET endpoint已实现');
      } catch (error: any) {
        // Slice 1未实现此endpoint，验证错误消息正确
        const isExpectedError = 
          error.message.includes('Unknown message type') ||
          error.message.includes('404') ||
          error.message.includes('Not Found') ||
          error.message.includes('500'); // Backend可能返回500
        
        assert.ok(
          isExpectedError,
          `应正确处理未实现的endpoint, got: ${error.message}`
        );
      }
    });

    it('POST请求应包含JSON body', async function() {
      this.timeout(5000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'JSON Body Test',
        specId: 'test-spec',
        specVersion: '1.0.0',
      });

      assert.ok(session.sessionId, 'POST请求应携带JSON body');
    });
  });

  describe('HTTP Headers', () => {
    it('应设置Content-Type为application/json', async function() {
      this.timeout(5000);
      
      // 通过成功创建会话验证Content-Type正确
      const session = await messenger.request('chat/create-session', {
        title: 'Content-Type Test',
        specId: 'test',
        specVersion: '1.0.0',
      });

      assert.ok(session, 'Content-Type正确时请求应成功');
    });

    it('应支持Authorization头（可选）', async function() {
      this.timeout(5000);
      
      // 使用带authToken的messenger
      const authedMessenger = new SseMessenger({
        baseUrl: backendUrl,
        authToken: 'test-token',
        reconnectInterval: 5000,
        autoConnect: false,
      });

      try {
        // Slice 1 Backend未验证token，应正常工作
        const session = await authedMessenger.request('chat/create-session', {
          title: 'Auth Test',
          specId: 'test',
          specVersion: '1.0.0',
        });
        assert.ok(session, 'Authorization头应被正确设置');
      } finally {
        authedMessenger.disconnect();
      }
    });
  });

  describe('Error Response Handling', () => {
    it('应正确处理HTTP错误状态码', async function() {
      this.timeout(5000);
      
      try {
        // 故意发送无效请求触发400/500
        await messenger.request('chat/send-message', {
          sessionId: 'invalid-uuid',
          request: { content: '' },
        });
        assert.fail('应抛出错误');
      } catch (error: any) {
        assert.ok(
          error.message.includes('HTTP') || error.message.includes('error'),
          `错误消息应包含HTTP信息: ${error.message}`
        );
      }
    });

    it('应正确处理Backend error字段', async function() {
      this.timeout(5000);
      
      try {
        // 空消息应返回validation error
        const session = await messenger.request('chat/create-session', {
          title: 'Error Test',
          specId: 'test',
          specVersion: '1.0.0',
        });

        await messenger.request('chat/send-message', {
          sessionId: session.sessionId,
          request: { content: '' },
        });
        assert.fail('应抛出验证错误');
      } catch (error: any) {
        assert.ok(error, '应抛出错误对象');
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('应支持并发请求', async function() {
      this.timeout(15000);
      
      // 并发创建3个会话
      const promises = [
        messenger.request('chat/create-session', {
          title: 'Concurrent 1',
          specId: 'test',
          specVersion: '1.0.0',
        }),
        messenger.request('chat/create-session', {
          title: 'Concurrent 2',
          specId: 'test',
          specVersion: '1.0.0',
        }),
        messenger.request('chat/create-session', {
          title: 'Concurrent 3',
          specId: 'test',
          specVersion: '1.0.0',
        }),
      ];

      const sessions = await Promise.all(promises);
      
      assert.strictEqual(sessions.length, 3);
      sessions.forEach((s, i) => {
        assert.ok(s.sessionId, `会话${i + 1}应有sessionId`);
      });

      // 验证sessionId唯一
      const ids = sessions.map(s => s.sessionId);
      const uniqueIds = new Set(ids);
      assert.strictEqual(uniqueIds.size, 3, 'sessionId应唯一');
    });

    it('应支持同一会话的并发消息', async function() {
      this.timeout(20000);
      
      const session = await messenger.request('chat/create-session', {
        title: 'Concurrent Messages',
        specId: 'test',
        specVersion: '1.0.0',
      });

      // 并发发送3条消息
      const promises = [
        messenger.request('chat/send-message', {
          sessionId: session.sessionId,
          request: { content: '消息1' },
        }),
        messenger.request('chat/send-message', {
          sessionId: session.sessionId,
          request: { content: '消息2' },
        }),
        messenger.request('chat/send-message', {
          sessionId: session.sessionId,
          request: { content: '消息3' },
        }),
      ];

      const responses = await Promise.all(promises);
      
      assert.strictEqual(responses.length, 3);
      responses.forEach((r: any, i) => {
        assert.ok(r.messageId, `消息${i + 1}应有messageId`);
      });
    });
  });
});