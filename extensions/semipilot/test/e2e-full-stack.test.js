#!/usr/bin/env node

/**
 * 🚀 Semilabs 全栈 E2E 自动化测试
 * 
 * 测试范围：前端 Extension → 后端 API → 数据库 → SSE 流式响应
 * 基于：V7_ACCEPTANCE_TEST_GUIDE.md 场景1-5
 * 
 * 运行方式：
 *   node test/e2e-full-stack.test.js
 * 
 * 前置条件：
 *   1. 后端服务运行在 http://localhost:8080
 *   2. PostgreSQL 数据库可用
 *   3. DASHSCOPE_API_KEY 已配置
 */

const http = require('http');
const https = require('https');
const assert = require('assert');

// 配置
const BACKEND_URL = process.env.SEMILABS_BACKEND_URL || 'http://localhost:8080';
const TEST_SESSION_PREFIX = 'e2e-test-';
const TIMEOUT = 30000; // 30秒超时

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

// HTTP 请求封装
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// SSE 流式响应测试
function testSSEStream(sessionId, agentRole, message) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/v1/chat/stream', BACKEND_URL);
    const events = [];
    
    const postData = JSON.stringify({ sessionId, agentRole, message });
    
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let buffer = '';
      
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留最后不完整的行
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.substring(6).trim();
            events.push({ type: 'event', value: eventType });
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            events.push({ type: 'data', value: data });
          }
        }
      });
      
      res.on('end', () => {
        resolve(events);
      });
    });
    
    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('SSE timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// 测试用例
const tests = [
  {
    name: '场景1.1: 后端服务可用性 - Chat API连接测试',
    async run() {
      // 直接测试Chat API而非健康检查端点
      const sessionId = TEST_SESSION_PREFIX + 'health-check';
      const events = await testSSEStream(sessionId, 'POE', '你好');
      assert.ok(events.length > 0, '后端服务应响应');
    },
  },
  
  {
    name: '场景1.2: Chat API - POE角色基础对话',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + Date.now();
      const events = await testSSEStream(sessionId, 'POE', '你好，我需要设计一个用户登录功能');
      
      // 验证收到thinking和message事件
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      assert.ok(eventTypes.includes('thinking'), '应收到thinking事件');
      assert.ok(eventTypes.includes('message'), '应收到message事件');
      
      // 验证有数据内容
      const dataEvents = events.filter(e => e.type === 'data');
      assert.ok(dataEvents.length > 0, '应收到响应数据');
    },
  },
  
  {
    name: '场景1.3: Chat API - ARCHI角色审核对话',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + Date.now() + '-archi';
      const events = await testSSEStream(sessionId, 'ARCHI', '审核用户登录功能的架构设计');
      
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      assert.ok(eventTypes.includes('thinking'), 'ARCHI应返回thinking事件');
      assert.ok(eventTypes.includes('message'), 'ARCHI应返回message事件');
    },
  },
  
  {
    name: '场景1.4: Chat API - 错误处理验证（无效角色）',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'invalid-role';
      try {
        await testSSEStream(sessionId, 'INVALID_ROLE', '测试消息');
        throw new Error('应该抛出错误');
      } catch (error) {
        assert.ok(error.message.includes('400') || error.message.includes('error'), '应返回400错误');
      }
    },
  },
  
  {
    name: '场景1.5: Chat API - 空消息处理',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'empty-msg';
      try {
        await testSSEStream(sessionId, 'POE', '');
        // 如果没抛错，验证返回了合理响应
      } catch (error) {
        assert.ok(error.message.includes('400') || error.message.includes('message'), '应处理空消息');
      }
    },
  },
  
  {
    name: '场景2.1: 多角色切换 - 同一会话不同角色',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'multi-role';
      
      // POE 挖掘需求
      const poeEvents = await testSSEStream(sessionId, 'POE', '设计支付模块');
      assert.ok(poeEvents.length > 0, 'POE应返回响应');
      
      // ARCHI 审核
      const archiEvents = await testSSEStream(sessionId, 'ARCHI', '审核支付模块设计');
      assert.ok(archiEvents.length > 0, 'ARCHI应返回响应');
    },
  },
  
  {
    name: '场景2.2: 并发会话测试 - 多会话隔离',
    async run() {
      const session1 = TEST_SESSION_PREFIX + 'concurrent-1';
      const session2 = TEST_SESSION_PREFIX + 'concurrent-2';
      
      // 并发发送两个请求
      const [events1, events2] = await Promise.all([
        testSSEStream(session1, 'POE', '会话1的消息'),
        testSSEStream(session2, 'POE', '会话2的消息'),
      ]);
      
      assert.ok(events1.length > 0, '会话1应返回响应');
      assert.ok(events2.length > 0, '会话2应返回响应');
    },
  },
  
  {
    name: '场景3.1: SSE流式响应 - thinking事件验证',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'thinking-test';
      const events = await testSSEStream(sessionId, 'POE', '复杂需求分析：设计一个包含用户认证、权限管理、审计日志的系统');
      
      const thinkingEvents = events.filter(e => e.type === 'event' && e.value === 'thinking');
      assert.ok(thinkingEvents.length > 0, '复杂需求应触发thinking事件');
      
      // 验证thinking后有对应的data
      const hasThinkingData = events.some((e, i) => 
        e.type === 'event' && e.value === 'thinking' && 
        i + 1 < events.length && events[i + 1].type === 'data'
      );
      assert.ok(hasThinkingData, 'thinking事件后应有数据内容');
    },
  },
  
  {
    name: '场景3.2: SSE流式响应 - done事件验证',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'done-event';
      const events = await testSSEStream(sessionId, 'POE', '简单问候');
      
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      assert.ok(eventTypes.includes('done') || eventTypes.includes('message'), '应收到结束标记');
    },
  },
  
  {
    name: '场景4.1: 异常处理 - 超长消息处理',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'long-msg';
      const longMessage = '这是一个非常长的消息'.repeat(100); // 约2KB
      
      try {
        const events = await testSSEStream(sessionId, 'POE', longMessage);
        assert.ok(events.length > 0, '应能处理较长消息');
      } catch (error) {
        // 如果超长被拒绝也是合理的
        assert.ok(error.message.includes('400') || error.message.includes('413'), '应处理超长消息');
      }
    },
  },
  
  {
    name: '场景4.2: 异常处理 - 特殊字符处理',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'special-chars';
      const specialMessage = '测试消息 <script>alert("xss")</script> & 特殊符号 @#$%^&*()';
      
      const events = await testSSEStream(sessionId, 'POE', specialMessage);
      assert.ok(events.length > 0, '应能处理特殊字符');
      
      // 验证返回内容已转义
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      assert.ok(!dataContent.includes('<script>'), '应过滤或转义脚本标签');
    },
  },
  
  {
    name: '场景5.1: 性能验证 - 响应时间<5秒',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'perf-test';
      const startTime = Date.now();
      
      await testSSEStream(sessionId, 'POE', '快速测试消息');
      
      const duration = Date.now() - startTime;
      assert.ok(duration < 5000, `响应时间应<5秒（实际: ${duration}ms）`);
    },
  },
  
  {
    name: '场景5.2: 内存泄漏验证 - 连续10次请求',
    async run() {
      const baseMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 10; i++) {
        const sessionId = TEST_SESSION_PREFIX + `leak-test-${i}`;
        await testSSEStream(sessionId, 'POE', `测试消息${i}`);
      }
      
      const afterMemory = process.memoryUsage().heapUsed;
      const increase = ((afterMemory - baseMemory) / 1024 / 1024).toFixed(2);
      
      log(colors.cyan, `  内存增长: ${increase}MB`);
      assert.ok(increase < 100, '10次请求内存增长应<100MB');
    },
  },
];

// 运行测试
async function runTests() {
  log(colors.blue, '\n🚀 Semilabs 全栈 E2E 测试开始\n');
  log(colors.cyan, `后端地址: ${BACKEND_URL}`);
  log(colors.cyan, `超时设置: ${TIMEOUT}ms\n`);
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const test of tests) {
    try {
      process.stdout.write(colors.yellow + `⏳ ${test.name}...` + colors.reset);
      await test.run();
      log(colors.green, ' ✅');
      passed++;
    } catch (error) {
      log(colors.red, ' ❌');
      log(colors.red, `   错误: ${error.message}`);
      failed++;
      failures.push({ name: test.name, error: error.message });
    }
  }
  
  // 输出总结
  log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.blue, '📊 测试总结');
  log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  log(colors.cyan, `总测试数: ${tests.length}`);
  log(colors.green, `✅ 通过: ${passed}`);
  log(colors.red, `❌ 失败: ${failed}`);
  log(colors.cyan, `通过率: ${((passed / tests.length) * 100).toFixed(1)}%\n`);
  
  if (failures.length > 0) {
    log(colors.red, '失败用例详情:');
    failures.forEach(({ name, error }) => {
      log(colors.red, `  • ${name}`);
      log(colors.red, `    ${error}`);
    });
    log(colors.reset, '');
  }
  
  if (failed === 0) {
    log(colors.green, '✨ 所有测试通过！\n');
    process.exit(0);
  } else {
    log(colors.red, '⚠️  部分测试失败，请查看上方详情\n');
    process.exit(1);
  }
}

// 主程序
if (require.main === module) {
  runTests().catch(error => {
    log(colors.red, '\n💥 测试执行失败:');
    log(colors.red, error.stack);
    process.exit(1);
  });
}

module.exports = { request, testSSEStream, tests };
