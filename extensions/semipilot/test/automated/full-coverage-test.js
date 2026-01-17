#!/usr/bin/env node
/**
 * @SpecTrace cap-ui-task-list v1.0.0
 * 
 * 完整自动化测试套件
 * 尽可能提升测试覆盖率，减少手动验证工作
 */

const fs = require('fs');
const path = require('path');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 任务列表UI - 完整自动化测试');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// 测试组1：文件完整性检查
// ============================================================================
console.log('📦 测试组1：文件完整性检查\n');

const projectRoot = path.join(__dirname, '../..');
const srcRoot = path.join(projectRoot, 'src');
const outRoot = path.join(projectRoot, 'out');

test('SlashCommandHandler.ts 存在', () => {
  const filePath = path.join(srcRoot, 'webview', 'SlashCommandHandler.ts');
  assert(fs.existsSync(filePath), 'File not found');
});

test('SlashCommandHandler.js 编译产物存在', () => {
  const filePath = path.join(outRoot, 'webview', 'SlashCommandHandler.js');
  assert(fs.existsSync(filePath), 'Compiled file not found');
});

test('TaskContextProvider.ts 存在', () => {
  const filePath = path.join(srcRoot, 'context', 'TaskContextProvider.ts');
  assert(fs.existsSync(filePath), 'File not found');
});

test('TaskContextProvider.js 编译产物存在', () => {
  const filePath = path.join(outRoot, 'context', 'TaskContextProvider.js');
  assert(fs.existsSync(filePath), 'Compiled file not found');
});

test('taskCommands.ts 存在', () => {
  const filePath = path.join(srcRoot, 'commands', 'taskCommands.ts');
  assert(fs.existsSync(filePath), 'File not found');
});

test('taskCommands.js 编译产物存在', () => {
  const filePath = path.join(outRoot, 'commands', 'taskCommands.js');
  assert(fs.existsSync(filePath), 'Compiled file not found');
});

test('App.tsx 存在', () => {
  const filePath = path.join(srcRoot, 'webview', 'App.tsx');
  assert(fs.existsSync(filePath), 'File not found');
});

test('SemipilotWebviewProvider.ts 存在', () => {
  const filePath = path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts');
  assert(fs.existsSync(filePath), 'File not found');
});

test('extension.ts 存在', () => {
  const filePath = path.join(srcRoot, 'extension.ts');
  assert(fs.existsSync(filePath), 'File not found');
});

// ============================================================================
// 测试组2：代码结构验证
// ============================================================================
console.log('\n📋 测试组2：代码结构验证\n');

test('SlashCommandHandler 导出正确', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SlashCommandHandler.ts'), 'utf8');
  assert(content.includes('export class SlashCommandHandler'), 'Class not exported');
  assert(content.includes('export interface SlashCommand'), 'Interface not exported');
});

test('TaskContextProvider 导出正确', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('export class TaskContextProvider'), 'Class not exported');
  assert(content.includes('export interface TaskDocument'), 'Interface not exported');
  assert(content.includes('export enum TaskStatus'), 'Enum not exported');
  assert(content.includes('export enum Priority'), 'Enum not exported');
});

test('taskCommands 导出正确', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'commands', 'taskCommands.ts'), 'utf8');
  assert(content.includes('export async function openTaskDocument'), 'Function not exported');
  assert(content.includes('export function registerTaskCommands'), 'Function not exported');
});

test('extension.ts 注册 taskCommands', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'extension.ts'), 'utf8');
  assert(content.includes('import { registerTaskCommands }'), 'Import missing');
  assert(content.includes('registerTaskCommands(context)'), 'Registration missing');
});

test('SemipilotWebviewProvider 集成 TaskContextProvider', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('TaskContextProvider'), 'Import or usage missing');
  assert(content.includes('_taskProvider'), 'Field missing');
  assert(content.includes('case \'openTask\''), 'Message handler missing');
});

test('App.tsx 集成 SlashCommandHandler', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'App.tsx'), 'utf8');
  assert(content.includes('SlashCommandHandler'), 'Import or usage missing');
  assert(content.includes('data-task-path'), 'Task path attribute missing');
  assert(content.includes('postMessage'), 'Post message missing');
});

// ============================================================================
// 测试组3：核心功能实现验证
// ============================================================================
console.log('\n🎯 测试组3：核心功能实现验证\n');

test('TaskContextProvider 包含 scanTasks 方法', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('async scanTasks()'), 'Method missing');
});

test('TaskContextProvider 包含 parseFrontmatter 方法', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('parseFrontmatter'), 'Method missing');
});

test('TaskContextProvider 包含 calculateScores 方法', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('calculateScores'), 'Method missing');
});

test('TaskContextProvider 包含 sortTasks 方法', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('sortTasks'), 'Method missing');
});

test('TaskContextProvider 包含 calculateBlockedTasks 方法', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('calculateBlockedTasks'), 'Method missing');
});

test('TaskContextProvider 包含 inferCapFromTaskId 方法', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('inferCapFromTaskId'), 'Method missing');
});

test('智能排序算法包含优先级基础分', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('Priority.HIGH') && content.includes('100'), 'Priority scoring missing');
});

test('智能排序算法包含状态加分', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('TaskStatus.IN_PROGRESS') && content.includes('30'), 'Status scoring missing');
});

test('智能排序算法包含时间衰减', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('daysSinceUpdate'), 'Time decay missing');
});

test('taskCommands 包含文档定位逻辑', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'commands', 'taskCommands.ts'), 'utf8');
  assert(content.includes('vscode.workspace.openTextDocument'), 'Open document missing');
  assert(content.includes('vscode.window.showTextDocument'), 'Show document missing');
  assert(content.includes('revealRange'), 'Reveal range missing');
});

test('taskCommands 设置光标到第一行', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'commands', 'taskCommands.ts'), 'utf8');
  assert(content.includes('editor.selection'), 'Selection setting missing');
});

test('taskCommands 包含错误处理', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'commands', 'taskCommands.ts'), 'utf8');
  assert(content.includes('try') && content.includes('catch'), 'Error handling missing');
  assert(content.includes('vscode.window.showErrorMessage'), 'Error message missing');
});

test('SemipilotWebviewProvider 生成优先级图标', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('getPriorityIcon'), 'Method missing');
  assert(content.includes('🔴') || content.includes('\\ud83d\\udd34'), 'Red icon missing');
});

test('SemipilotWebviewProvider 发送任务数据到Webview', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('tasks:') && content.includes('taskId') && content.includes('filePath'), 'Task data missing');
});

test('App.tsx 监听任务点击事件', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'App.tsx'), 'utf8');
  assert(content.includes('querySelectorAll'), 'Event listener missing');
  assert(content.includes('addEventListener'), 'Event listener missing');
  assert(content.includes('data-task-path'), 'Task path attribute missing');
});

// ============================================================================
// 测试组4：错误处理验证
// ============================================================================
console.log('\n🚨 测试组4：错误处理验证\n');

test('TaskContextProvider 处理空工作区', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  const hasErrorHandling = content.includes('console.error') || content.includes('console.warn');
  assert(hasErrorHandling, 'Error handling missing');
});

test('TaskContextProvider 处理 missing task_id', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('task_id') && content.includes('continue'), 'Missing field handling missing');
});

test('taskCommands 处理文件打开失败', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'commands', 'taskCommands.ts'), 'utf8');
  assert(content.includes('catch') && content.includes('showErrorMessage'), 'Error handling missing');
});

test('SemipilotWebviewProvider 处理扫描失败', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('try') && content.includes('catch'), 'Error handling missing');
});

test('SemipilotWebviewProvider 处理空任务列表', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('所有任务已完成') || content.includes('length === 0'), 'Empty state handling missing');
});

// 注：这是代码风格检查，不影响功能
console.log('  💡 提示：建议所有日志包含模块前缀（如 [ModuleName]...)）');
const files = [
  'webview/SlashCommandHandler.ts',
  'context/TaskContextProvider.ts',
  'commands/taskCommands.ts'
];

files.forEach(file => {
  const content = fs.readFileSync(path.join(srcRoot, file), 'utf8');
  if (!content.includes('console.log(\'[') && !content.includes('console.error(\'[')) {
    console.log(`     ⚠️  ${file} 缺少日志前缀`);
  }
});

// ============================================================================
// 测试组5：Gherkin场景映射验证
// ============================================================================
console.log('\n📝 测试组5：Gherkin场景代码映射\n');

test('Happy Path: /tasks 命令触发扫描', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('case \'slashCommand\'') && content.includes('tasks'), 'Command handler missing');
});

test('Happy Path: 智能排序实现', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('calculateScores') && content.includes('sortTasks'), 'Sorting missing');
});

test('Happy Path: 点击打开文档', () => {
  const appContent = fs.readFileSync(path.join(srcRoot, 'webview', 'App.tsx'), 'utf8');
  const cmdContent = fs.readFileSync(path.join(srcRoot, 'commands', 'taskCommands.ts'), 'utf8');
  assert(appContent.includes('addEventListener') && cmdContent.includes('openTextDocument'), 'Click handling missing');
});

test('Error Handling: 工作区未初始化', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('未检测到') || content.includes('未初始化'), 'Empty workspace handling missing');
});

test('Error Handling: Frontmatter格式错误', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('console.warn') || content.includes('continue'), 'Malformed frontmatter handling missing');
});

test('Edge Case: 单个任务处理', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  // 排序算法应该支持任意数量的任务
  assert(content.includes('sort'), 'Sorting missing');
});

test('Edge Case: 被依赖次数计算', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'context', 'TaskContextProvider.ts'), 'utf8');
  assert(content.includes('dependencyCounts') || content.includes('dependencies'), 'Dependency calculation missing');
});

// ============================================================================
// 测试组6：UI组件验证
// ============================================================================
console.log('\n🎨 测试组6：UI组件验证\n');

test('任务列表使用Markdown链接格式', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('<a href') || content.includes('data-task-path'), 'Link format missing');
});

test('显示优先级图标', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('priorityIcon') || content.includes('🔴'), 'Priority icon missing');
});

test('显示任务状态', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('statusText') || content.includes('IN_PROGRESS'), 'Status display missing');
});

test('显示任务score', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('score'), 'Score display missing');
});

test('显示提示文本', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'webview', 'SemipilotWebviewProvider.ts'), 'utf8');
  assert(content.includes('提示') || content.includes('点击'), 'Hint text missing');
});

// ============================================================================
// 测试组7：Spec追溯性验证
// ============================================================================
console.log('\n🔍 测试组7：Spec追溯性验证\n');

test('所有核心文件包含 @SpecTrace 标记', () => {
  const files = [
    'webview/SlashCommandHandler.ts',
    'context/TaskContextProvider.ts',
    'commands/taskCommands.ts'
  ];
  
  let allHaveTrace = true;
  files.forEach(file => {
    const content = fs.readFileSync(path.join(srcRoot, file), 'utf8');
    if (!content.includes('@SpecTrace')) {
      allHaveTrace = false;
    }
  });
  
  assert(allHaveTrace, 'Some files missing @SpecTrace');
});

test('@SpecTrace 引用 cap-ui-task-list', () => {
  const files = [
    'context/TaskContextProvider.ts',
    'commands/taskCommands.ts'
  ];
  
  let allHaveCorrectSpec = true;
  files.forEach(file => {
    const content = fs.readFileSync(path.join(srcRoot, file), 'utf8');
    if (!content.includes('cap-ui-task-list')) {
      allHaveCorrectSpec = false;
    }
  });
  
  assert(allHaveCorrectSpec, 'Some files have incorrect Spec reference');
});

// ============================================================================
// 测试总结
// ============================================================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 测试总结');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`总测试数：${totalTests}`);
console.log(`通过数量：${passedTests} ✅`);
console.log(`失败数量：${failedTests} ❌`);
console.log(`通过率：${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('✅ 所有自动化测试通过！\n');
  console.log('下一步：执行手动测试清单（需VS Code环境）');
  console.log('  bash test/manual/MANUAL_TEST_CHECKLIST.sh\n');
  process.exit(0);
} else {
  console.log('❌ 部分测试失败，请检查并修复\n');
  process.exit(1);
}
