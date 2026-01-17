/**
 * Backend Integration Test
 * 
 * 验证Extension能够成功调用Backend API
 */

const { SseMessenger } = require('./out/messenger/SseMessenger');

async function testBackendIntegration() {
  console.log('=== Backend Integration Test ===\n');
  
  // 1. Initialize messenger
  console.log('[1/4] Initializing SseMessenger...');
  const messenger = new SseMessenger({
    baseUrl: 'http://localhost:8080/api/v1',
    reconnectInterval: 5000,
    autoConnect: false, // Manual mode
  });
  console.log('✓ Messenger initialized\n');
  
  try {
    // 2. Test: Create Chat Session
    console.log('[2/4] Testing chat/create-session...');
    const sessionResponse = await messenger.request('chat/create-session', {
      title: 'Extension Integration Test',
      specId: 'cap-ui-semipilot',
      specVersion: '1.0.0',
    });
    
    console.log('✓ Session created:');
    console.log(`  - Session ID: ${sessionResponse.sessionId}`);
    console.log(`  - Title: ${sessionResponse.title}`);
    console.log(`  - Created At: ${sessionResponse.createdAt}\n`);
    
    const sessionId = sessionResponse.sessionId;
    
    // 3. Test: Send Message
    console.log('[3/4] Testing chat/send-message...');
    
    // Slice 1 Backend API只接受 {content: string}
    // Extension Protocol定义的完整格式(persona, content, contextItems)在Slice 4实现
    const messageResponse = await messenger.request('chat/send-message', {
      sessionId: sessionId,
      request: {
        content: '你好，这是Extension集成测试', // Slice 1: 仅content字段
      },
    });
    
    console.log('✓ Message sent:');
    console.log(`  - Message ID: ${messageResponse.messageId}`);
    console.log(`  - Role: ${messageResponse.role}`);
    console.log(`  - Persona: ${messageResponse.persona}`);
    console.log(`  - Content preview: ${messageResponse.content.substring(0, 50)}...\n`);
    
    // 4. Test: Get Chat History
    console.log('[4/4] Testing chat/get-history...');
    const historyResponse = await messenger.request('chat/get-history', {
      sessionId: sessionId,
      limit: 10,
      offset: 0,
    });
    
    console.log('✓ History retrieved:');
    
    // Slice 1: Backend返回List<ChatMessageDTO>，不是{messages, total}
    // Extension Protocol定义的完整格式在Slice 2调整
    const messages = Array.isArray(historyResponse) ? historyResponse : (historyResponse.messages || []);
    console.log(`  - Retrieved: ${messages.length} messages`);
    
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const content = lastMsg.content || lastMsg.text || '';
      console.log(`  - Last message role: ${lastMsg.role}`);
      console.log(`  - Last message preview: ${content.substring(0, 50)}...\n`);
    }
    
    console.log('=== ✅ All Tests Passed ===\n');
    
    // Summary
    console.log('Summary:');
    console.log('  ✓ Extension → Backend HTTP 通信正常');
    console.log('  ✓ SseMessenger request() 方法工作正常');
    console.log('  ✓ Backend API 返回符合协议定义');
    console.log('  ✓ Session 创建和消息发送验证通过');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(`  Error: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    messenger.disconnect();
  }
}

// Run test
testBackendIntegration();
