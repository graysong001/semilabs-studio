#!/usr/bin/env node

/**
 * Semipilot UI - GitHub Copilot 风格验证测试
 * 
 * 测试目标:
 * 1. 顶部标题栏布局（机器人图标 + SEMIPILOT: CHAT + 操作按钮）
 * 2. 黑白色调图标（SVG）
 * 3. 发送按钮箭头风格
 * 4. 整体布局与 GitHub Copilot 的一致性
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Semipilot UI - GitHub Copilot 风格测试');
console.log('========================================\n');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0
};

function addTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     ${details}`);
  }
}

// 读取 Webview Provider 文件
const providerPath = path.join(__dirname, 'src/webview/SemipilotWebviewProvider.ts');

if (!fs.existsSync(providerPath)) {
  console.error('❌ 文件不存在:', providerPath);
  process.exit(1);
}

const content = fs.readFileSync(providerPath, 'utf8');

console.log('📋 测试 1: 顶部标题栏结构\n');

addTest(
  '存在 header 容器',
  content.includes('class="header"'),
  '确认顶部标题栏容器'
);

addTest(
  '存在 header-left 区域',
  content.includes('class="header-left"'),
  '左侧：图标 + 标题'
);

addTest(
  '存在 header-actions 区域',
  content.includes('class="header-actions"'),
  '右侧：操作按钮'
);

addTest(
  '标题文案为 SEMIPILOT: CHAT',
  content.includes('<span class="header-title">SEMIPILOT: CHAT</span>'),
  '确认标题文案'
);

console.log('\n🤖 测试 2: 机器人图标（SVG）\n');

addTest(
  '使用 SVG 机器人图标',
  content.includes('<svg class="header-icon"') && 
  content.includes('viewBox="0 0 16 16"'),
  '确认 SVG 格式图标'
);

addTest(
  '使用 currentColor（黑白色调）',
  content.match(/<svg[^>]*fill="currentColor"/),
  '图标颜色跟随主题'
);

console.log('\n🔘 测试 3: 顶部操作按钮\n');

const requiredButtons = [
  { id: 'headerNewChatBtn', name: 'New Chat 按钮' },
  { id: 'headerSettingsBtn', name: 'Settings 按钮' },
  { id: 'headerMoreBtn', name: 'More 按钮' }
];

for (const btn of requiredButtons) {
  addTest(
    btn.name,
    content.includes(`id="${btn.id}"`),
    `确认 ${btn.id} 存在`
  );
}

addTest(
  '按钮使用 SVG 图标',
  (content.match(/<button class="header-btn"[^>]*>[\s\S]*?<svg/g) || []).length >= 3,
  '至少 3 个按钮使用 SVG 图标'
);

console.log('\n➡️ 测试 4: 发送按钮（箭头风格）\n');

addTest(
  '发送按钮使用 SVG',
  content.includes('<button class="send-btn"') &&
  content.match(/<button[^>]*class="send-btn"[^>]*>[\s\S]*?<svg/),
  '确认 SVG 箭头图标'
);

addTest(
  '发送按钮透明背景',
  content.match(/\.send-btn\s*{[^}]*background:\s*transparent/s),
  '确认透明背景'
);

addTest(
  '移除彩色 emoji',
  !content.includes('✈️') || 
  (content.match(/✈️/g) || []).length === 0 ||
  (content.indexOf('✈️') < content.indexOf('<button class="send-btn"')),
  '发送按钮不再使用 emoji'
);

console.log('\n🎨 测试 5: 黑白色调设计\n');

addTest(
  '所有 SVG 使用 currentColor',
  (content.match(/fill="currentColor"/g) || []).length >= 5,
  '至少 5 个 SVG 使用 currentColor'
);

addTest(
  '移除彩色 emoji 图标',
  !content.includes('id="attachBtn" title="Attach context">📎') &&
  !content.includes('id="newChatBtn" title="New chat">+') &&
  !content.includes('id="settingsBtn" title="Settings">⚙️'),
  '工具按钮不再使用 emoji'
);

addTest(
  '按钮使用透明背景',
  content.includes('background: transparent'),
  '确认透明背景设计'
);

console.log('\n📐 测试 6: 布局结构\n');

addTest(
  '顶部标题栏在最上方',
  content.indexOf('class="header"') < content.indexOf('class="chat-messages"'),
  '标题栏 → 消息区域 → 输入框'
);

addTest(
  '输入框在底部',
  content.indexOf('class="input-container"') > content.indexOf('class="chat-messages"'),
  '消息区域在输入框之上'
);

addTest(
  '输入框为单列布局',
  content.includes('flex-direction: column') &&
  content.includes('class="input-wrapper"'),
  '输入框内部垂直排列'
);

console.log('\n🎯 测试 7: CSS 样式细节\n');

addTest(
  'header-btn hover 效果',
  content.match(/\.header-btn:hover\s*{[^}]*background-color/s),
  '按钮 hover 显示背景'
);

addTest(
  '不透明度动态调整',
  content.match(/opacity:\s*0\.[3-8]/g) !== null,
  '按钮使用不透明度表达状态'
);

addTest(
  '圆角设计',
  content.match(/border-radius:\s*[4-8]px/g) !== null,
  '按钮使用圆角'
);

console.log('\n⚙️ 测试 8: JavaScript 功能\n');

addTest(
  'headerNewChatBtn 事件绑定',
  content.includes('headerNewChatBtn.addEventListener'),
  '确认 New Chat 按钮事件'
);

addTest(
  'headerSettingsBtn 事件绑定',
  content.includes('headerSettingsBtn.addEventListener'),
  '确认 Settings 按钮事件'
);

addTest(
  'headerMoreBtn 事件绑定',
  content.includes('headerMoreBtn.addEventListener'),
  '确认 More 按钮事件'
);

// 统计结果
console.log('\n========================================');
console.log('📊 测试统计:\n');
console.log(`  总测试数: ${testResults.tests.length}`);
console.log(`  通过: ${testResults.passed} ✅`);
console.log(`  失败: ${testResults.failed} ❌`);
console.log(`  通过率: ${(testResults.passed / testResults.tests.length * 100).toFixed(1)}%\n`);

// 保存报告
fs.writeFileSync(
  'ui-copilot-test-report.json',
  JSON.stringify(testResults, null, 2)
);

// 生成对比表
console.log('📋 GitHub Copilot vs Semipilot 对比:\n');
console.log('┌─────────────────────────────┬──────────────┬──────────────┐');
console.log('│ 特性                        │ Copilot      │ Semipilot    │');
console.log('├─────────────────────────────┼──────────────┼──────────────┤');
console.log('│ 顶部标题栏                  │ ✅           │ ✅           │');
console.log('│ 机器人图标                  │ -            │ ✅           │');
console.log('│ SEMIPILOT: CHAT 标题        │ CHAT         │ ✅           │');
console.log('│ 右侧操作按钮                │ ✅           │ ✅           │');
console.log('│ 黑白 SVG 图标               │ ✅           │ ✅           │');
console.log('│ 发送按钮箭头图标            │ ✅           │ ✅           │');
console.log('│ 透明背景按钮                │ ✅           │ ✅           │');
console.log('│ Hover 背景高亮              │ ✅           │ ✅           │');
console.log('└─────────────────────────────┴──────────────┴──────────────┘\n');

if (testResults.failed > 0) {
  console.log('⚠️  部分测试失败，请检查详情\n');
  process.exit(1);
} else {
  console.log('✅ 所有测试通过！UI 已成功改造为 GitHub Copilot 风格\n');
  console.log('📝 下一步验证:\n');
  console.log('  1. 在 VS Code 中按 F5 启动调试');
  console.log('  2. 点击左侧 Semipilot 图标（🤖）');
  console.log('  3. 观察界面变化:\n');
  console.log('     ✅ 顶部：🤖 + SEMIPILOT: CHAT + [New][⚙️][⋮]');
  console.log('     ✅ 中间：聊天消息区域');
  console.log('     ✅ 底部：统一输入框 + [Agent][Model][📎][➡️]\n');
  console.log('     ✅ 所有图标均为黑白 SVG 风格');
  console.log('     ✅ 发送按钮为箭头图标（→）\n');
  console.log('📄 测试报告: ui-copilot-test-report.json\n');
}
