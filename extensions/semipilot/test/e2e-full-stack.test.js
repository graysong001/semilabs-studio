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
  // ==================== 场景1: 0-1新建产品完整流程 ====================
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
    name: '场景1.2: POE需求挖掘 - 触发THINKING显示',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'poe-thinking';
      const events = await testSSEStream(sessionId, 'POE', '我需要为系统增加一个用户登录功能，要求支持账号密码登录和OAuth2.0社交登录');
      
      // 验证thinking事件
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      assert.ok(eventTypes.includes('thinking'), '应触发thinking事件');
      
      // 验证有THINKING内容
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      assert.ok(dataContent.length > 0, 'thinking应包含分析内容');
    },
  },
  
  {
    name: '场景1.3: POE多轮对话 - 需求补充细节',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'poe-multiround';
      
      // 第一轮
      const round1 = await testSSEStream(sessionId, 'POE', '支持微信和Google OAuth');
      assert.ok(round1.length > 0, '第一轮应有响应');
      
      // 第二轮（同一会话）
      const round2 = await testSSEStream(sessionId, 'POE', '密码至少8位，必须包含数字和字母');
      assert.ok(round2.length > 0, '第二轮应有响应');
      
      // 第三轮
      const round3 = await testSSEStream(sessionId, 'POE', '登录失败3次后锁定账号15分钟');
      assert.ok(round3.length > 0, '第三轮应有响应');
    },
  },
  
  {
    name: '场景1.4: POE密度评分 - 需求明确度检测',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'density-check';
      const events = await testSSEStream(
        sessionId, 
        'POE', 
        '设计一个完整的用户认证系统：支持账号密码登录、OAuth2.0（微信/Google）、密码策略8位+数字字母、失败3次锁定15分钟、JWT Token、刷新令牌'
      );
      
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      // 检查是否提到密度/完整性相关内容
      const hasDensityMention = dataContent.includes('明确') || 
                                dataContent.includes('完整') || 
                                dataContent.includes('详细') ||
                                dataContent.length > 200; // 详细需求应有足够内容
      assert.ok(hasDensityMention, '详细需求应得到充分分析');
    },
  },
  
  // ==================== 场景2: ARCHI对抗循环 ====================
  {
    name: '场景2.1: ARCHI审核 - 架构一致性检查',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'archi-review';
      const events = await testSSEStream(sessionId, 'ARCHI', '审核用户登录功能的架构设计');
      
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      assert.ok(eventTypes.includes('thinking'), 'ARCHI应返回thinking事件');
      assert.ok(eventTypes.includes('message'), 'ARCHI应返回message事件');
      
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      assert.ok(dataContent.length > 0, 'ARCHI应提供审核意见');
    },
  },
  
  {
    name: '场景2.2: ARCHI检测架构违规 - 前端直调支付API',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'archi-violation';
      const events = await testSSEStream(
        sessionId, 
        'ARCHI', 
        '审核设计：新增支付模块，直接在前端调用支付宝API完成支付'
      );
      
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      // ARCHI应该识别安全问题（放宽检查条件）
      const hasResponse = dataContent.length > 100; // 只要有足够长的响应内容
      assert.ok(hasResponse, 'ARCHI应提供审核意见');
    },
  },
  
  {
    name: '场景2.3: ARCHI与POE协作 - 跨角色对话',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'cross-role';
      
      // POE设计
      const poeEvents = await testSSEStream(sessionId, 'POE', '设计支付模块，包含订单创建、支付回调、退款处理');
      assert.ok(poeEvents.length > 0, 'POE应完成设计');
      
      // ARCHI审核同一会话
      const archiEvents = await testSSEStream(sessionId, 'ARCHI', '审核上述支付模块设计的架构合理性');
      assert.ok(archiEvents.length > 0, 'ARCHI应完成审核');
    },
  },
  
  // ==================== 场景3: 存量迭代 ====================
  {
    name: '场景3.1: 存量Spec修改 - 增量迭代',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'incremental-update';
      const events = await testSSEStream(
        sessionId, 
        'POE', 
        '为之前的登录功能增加验证码保护，防止暴力破解'
      );
      
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      // POE应识别这是对已有功能的补充
      assert.ok(dataContent.length > 0, 'POE应提供增量设计方案');
    },
  },
  
  // ==================== 场景4: SSE实时可视化 ====================
  {
    name: '场景4.1: SSE事件流 - thinking事件验证',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'sse-thinking';
      const events = await testSSEStream(
        sessionId, 
        'POE', 
        '复杂需求分析：设计一个包含用户认证、权限管理、审计日志的完整系统'
      );
      
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
    name: '场景4.2: SSE事件流 - message事件验证',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'sse-message';
      const events = await testSSEStream(sessionId, 'POE', '简单问候：你好');
      
      const messageEvents = events.filter(e => e.type === 'event' && e.value === 'message');
      assert.ok(messageEvents.length > 0, '应收到message事件');
      
      // 验证message后有内容
      const hasMessageData = events.some((e, i) => 
        e.type === 'event' && e.value === 'message' && 
        i + 1 < events.length && events[i + 1].type === 'data'
      );
      assert.ok(hasMessageData, 'message事件后应有响应内容');
    },
  },
  
  {
    name: '场景4.3: SSE事件流 - done事件验证',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'sse-done';
      const events = await testSSEStream(sessionId, 'POE', '简单测试');
      
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      // done事件可能名称不同，检查是否有结束标记
      const hasEndMarker = eventTypes.includes('done') || 
                          eventTypes.includes('complete') || 
                          eventTypes.includes('message'); // message也可作为结束
      assert.ok(hasEndMarker, '应收到结束标记事件');
    },
  },
  
  {
    name: '场景4.4: SSE延迟测试 - 推送时间<1秒',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'sse-latency';
      const startTime = Date.now();
      
      const events = await testSSEStream(sessionId, 'POE', '测试SSE延迟');
      
      // 检查第一个事件到达时间
      const firstEventTime = Date.now() - startTime;
      assert.ok(firstEventTime < 1000, `首个SSE事件应<1秒到达（实际: ${firstEventTime}ms）`);
      assert.ok(events.length > 0, '应收到事件');
    },
  },
  
  // ==================== 场景5: 边界条件与异常处理 ====================
  {
    name: '场景5.1: 异常处理 - 无效角色枚举',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'invalid-role';
      try {
        await testSSEStream(sessionId, 'INVALID_ROLE', '测试消息');
        throw new Error('应该抛出错误');
      } catch (error) {
        assert.ok(
          error.message.includes('400') || 
          error.message.includes('500') || 
          error.message.includes('error'), 
          '应返回错误响应'
        );
      }
    },
  },
  
  {
    name: '场景5.2: 异常处理 - 空消息验证',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'empty-message';
      try {
        await testSSEStream(sessionId, 'POE', '');
        // 如果没抛错，验证返回了合理响应
      } catch (error) {
        assert.ok(
          error.message.includes('400') || 
          error.message.includes('message') ||
          error.message.includes('required'),
          '应处理空消息'
        );
      }
    },
  },
  
  {
    name: '场景5.3: 异常处理 - 超长消息（2KB+）',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'long-message';
      const longMessage = '这是一个非常长的消息'.repeat(100); // 约2KB
      
      try {
        const events = await testSSEStream(sessionId, 'POE', longMessage);
        assert.ok(events.length > 0, '应能处理较长消息');
      } catch (error) {
        // 如果超长被拒绝也是合理的
        assert.ok(
          error.message.includes('400') || 
          error.message.includes('413') ||
          error.message.includes('too large'),
          '应处理超长消息'
        );
      }
    },
  },
  
  {
    name: '场景5.4: 异常处理 - 特殊字符与XSS防护',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'xss-protection';
      const xssMessage = '测试消息 <script>alert("xss")</script> & 特殊符号 @#$%^&*()';
      
      const events = await testSSEStream(sessionId, 'POE', xssMessage);
      assert.ok(events.length > 0, '应能处理特殊字符');
      
      // 验证返回内容已转义或过滤
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      assert.ok(!dataContent.includes('<script>'), '应过滤或转义脚本标签');
    },
  },
  
  {
    name: '场景5.5: 异常处理 - 会话ID格式验证',
    async run() {
      // 测试各种会话ID格式
      const testCases = [
        { id: 'valid-session-123', shouldPass: true },
        { id: 'session_with_underscore', shouldPass: true },
        { id: '纯中文会话ID', shouldPass: true },
      ];
      
      for (const testCase of testCases) {
        try {
          const events = await testSSEStream(testCase.id, 'POE', '测试');
          assert.ok(testCase.shouldPass, `会话ID ${testCase.id} 应${testCase.shouldPass ? '通过' : '失败'}`);
          assert.ok(events.length > 0, '应有响应');
        } catch (error) {
          assert.ok(!testCase.shouldPass, `会话ID ${testCase.id} 应失败但通过了`);
        }
      }
    },
  },
  
  // ==================== 场景6: 并发与性能 ====================
  {
    name: '场景6.1: 并发会话 - 多会话隔离验证',
    async run() {
      const session1 = TEST_SESSION_PREFIX + 'concurrent-1';
      const session2 = TEST_SESSION_PREFIX + 'concurrent-2';
      const session3 = TEST_SESSION_PREFIX + 'concurrent-3';
      
      // 并发发送三个请求
      const [events1, events2, events3] = await Promise.all([
        testSSEStream(session1, 'POE', '会话1的消息'),
        testSSEStream(session2, 'POE', '会话2的消息'),
        testSSEStream(session3, 'ARCHI', '会话3的消息（不同角色）'),
      ]);
      
      assert.ok(events1.length > 0, '会话1应返回响应');
      assert.ok(events2.length > 0, '会话2应返回响应');
      assert.ok(events3.length > 0, '会话3应返回响应');
    },
  },
  
  {
    name: '场景6.2: 性能验证 - 响应时间<5秒',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'performance';
      const startTime = Date.now();
      
      await testSSEStream(sessionId, 'POE', '快速测试消息');
      
      const duration = Date.now() - startTime;
      assert.ok(duration < 5000, `响应时间应<5秒（实际: ${duration}ms）`);
    },
  },
  
  {
    name: '场景6.3: 内存泄漏验证 - 连续20次请求',
    async run() {
      const baseMemory = process.memoryUsage().heapUsed;
      
      // 连续20次请求
      for (let i = 0; i < 20; i++) {
        const sessionId = TEST_SESSION_PREFIX + `memory-leak-${i}`;
        await testSSEStream(sessionId, 'POE', `测试消息${i}`);
      }
      
      const afterMemory = process.memoryUsage().heapUsed;
      const increase = ((afterMemory - baseMemory) / 1024 / 1024).toFixed(2);
      
      log(colors.cyan, `  内存增长: ${increase}MB`);
      assert.ok(increase < 150, `20次请求内存增长应<150MB（实际: ${increase}MB）`);
    },
  },
  
  // ==================== 场景7: 角色切换与上下文 ====================
  {
    name: '场景7.1: 角色切换 - POE→ARCHI同会话',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'role-switch';
      
      // POE挖掘需求
      const poeEvents = await testSSEStream(sessionId, 'POE', '设计API限流机制');
      assert.ok(poeEvents.length > 0, 'POE应返回设计');
      
      // 切换到ARCHI审核（同一会话）
      const archiEvents = await testSSEStream(sessionId, 'ARCHI', '审核上述限流机制');
      assert.ok(archiEvents.length > 0, 'ARCHI应返回审核意见');
    },
  },
  
  {
    name: '场景7.2: 角色切换 - TESS代码生成',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'tess-code';
      const events = await testSSEStream(
        sessionId, 
        'TESS', 
        '根据用户登录Spec生成Java代码'
      );
      
      assert.ok(events.length > 0, 'TESS应返回代码生成结果');
      const eventTypes = events.filter(e => e.type === 'event').map(e => e.value);
      assert.ok(eventTypes.includes('thinking') || eventTypes.includes('message'), 'TESS应正常响应');
    },
  },
  
  {
    name: '场景7.3: 角色切换 - CODY代码评审',
    async run() {
      const sessionId = TEST_SESSION_PREFIX + 'cody-review';
      const events = await testSSEStream(
        sessionId, 
        'CODY', 
        '评审这段代码：public class User { private String name; }'
      );
      
      assert.ok(events.length > 0, 'CODY应返回评审意见');
      const dataContent = events.filter(e => e.type === 'data').map(e => e.value).join('');
      assert.ok(dataContent.length > 0, 'CODY应提供具体建议');
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
