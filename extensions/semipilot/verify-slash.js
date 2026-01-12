#!/usr/bin/env node

/**
 * @SpecTrace cap-ui-chat-slash, v1.0.0
 * 
 * Slash Command Verification Script
 * 验证 Slash Commands 功能的基本逻辑
 */

const { SlashCommandHandler } = require('./out/webview/SlashCommandHandler');

console.log('🧪 Slash Command Handler Verification\n');

// Test 1: Create handler
console.log('Test 1: Create SlashCommandHandler');
const handler = new SlashCommandHandler();
console.log('✅ Handler created\n');

// Test 2: Register commands
console.log('Test 2: Register /tasks and /help commands');
let tasksExecuted = false;
let helpExecuted = false;

handler.register({
  name: 'tasks',
  description: '显示未完成任务列表',
  handler: async () => {
    tasksExecuted = true;
    console.log('  → /tasks handler executed');
  }
});

handler.register({
  name: 'help',
  description: '显示帮助信息',
  handler: async () => {
    helpExecuted = true;
    console.log('  → /help handler executed');
  }
});

console.log('✅ Commands registered\n');

// Test 3: Parse commands
console.log('Test 3: Parse slash commands');
const test3_1 = handler.parse('/tasks');
console.log('  /tasks →', test3_1);
if (test3_1?.command === 'tasks' && test3_1?.args === undefined) {
  console.log('  ✅ Parsed correctly');
} else {
  console.log('  ❌ Parse failed');
  process.exit(1);
}

const test3_2 = handler.parse('/tasks domain-ui');
console.log('  /tasks domain-ui →', test3_2);
if (test3_2?.command === 'tasks' && test3_2?.args === 'domain-ui') {
  console.log('  ✅ Parsed with args correctly');
} else {
  console.log('  ❌ Parse with args failed');
  process.exit(1);
}

const test3_3 = handler.parse('Hello world');
console.log('  "Hello world" →', test3_3);
if (test3_3 === null) {
  console.log('  ✅ Non-command correctly identified\n');
} else {
  console.log('  ❌ Non-command detection failed\n');
  process.exit(1);
}

// Test 4: Execute commands
console.log('Test 4: Execute slash commands');
(async () => {
  const result1 = await handler.execute('/tasks');
  console.log('  /tasks execution result:', result1);
  if (result1 && tasksExecuted) {
    console.log('  ✅ /tasks executed successfully');
  } else {
    console.log('  ❌ /tasks execution failed');
    process.exit(1);
  }

  const result2 = await handler.execute('/help');
  console.log('  /help execution result:', result2);
  if (result2 && helpExecuted) {
    console.log('  ✅ /help executed successfully');
  } else {
    console.log('  ❌ /help execution failed');
    process.exit(1);
  }

  const result3 = await handler.execute('Hello world');
  console.log('  "Hello world" execution result:', result3);
  if (result3 === false) {
    console.log('  ✅ Non-command correctly rejected\n');
  } else {
    console.log('  ❌ Non-command rejection failed\n');
    process.exit(1);
  }

  // Test 5: Get commands
  console.log('Test 5: Get all commands');
  const commands = handler.getCommands();
  console.log('  Registered commands:', commands.map(c => `/${c.name}`).join(', '));
  if (commands.length === 2) {
    console.log('  ✅ Command list correct\n');
  } else {
    console.log('  ❌ Command list incorrect\n');
    process.exit(1);
  }

  // Test 6: Has command
  console.log('Test 6: Check command existence');
  const has1 = handler.hasCommand('tasks');
  const has2 = handler.hasCommand('unknown');
  console.log('  hasCommand("tasks"):', has1);
  console.log('  hasCommand("unknown"):', has2);
  if (has1 && !has2) {
    console.log('  ✅ Command existence check correct\n');
  } else {
    console.log('  ❌ Command existence check failed\n');
    process.exit(1);
  }

  console.log('🎉 All tests passed!\n');
  console.log('✅ SlashCommandHandler is working correctly');
  console.log('✅ /tasks command registered and functional');
  console.log('✅ /help command registered and functional');
  console.log('✅ Command parsing logic correct');
  console.log('✅ Command execution logic correct\n');
})();
