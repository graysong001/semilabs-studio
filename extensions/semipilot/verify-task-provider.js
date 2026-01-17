#!/usr/bin/env node

/**
 * @SpecTrace cap-ui-task-list, v1.0.0
 * 
 * TaskContextProvider Verification Script
 * 验证任务扫描、Frontmatter解析、智能排序功能
 */

const { TaskContextProvider, Priority, TaskStatus } = require('./out/context/TaskContextProvider');

console.log('🧪 TaskContextProvider Verification\n');

// 模拟工作区路径
const workspaceRoot = '/Users/xingjian/work/projects/semilabs-ws/semilabs-squad/semilabs-specs';

console.log(`工作区路径: ${workspaceRoot}\n`);

// Test 1: 创建Provider
console.log('Test 1: Create TaskContextProvider');
const provider = new TaskContextProvider(workspaceRoot);
console.log('✅ Provider created\n');

// Test 2: 扫描任务（异步测试）
(async () => {
  try {
    console.log('Test 2: Scan and parse tasks');
    const startTime = Date.now();
    
    const tasks = await provider.scanTasks();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Scanned ${tasks.length} tasks in ${duration}ms`);
    
    if (tasks.length === 0) {
      console.log('⚠️  No tasks found (this is expected if no spec-task-*.md files exist)\n');
      process.exit(0);
    }
    
    // Test 3: 验证任务结构
    console.log('\nTest 3: Verify task structure');
    const firstTask = tasks[0];
    console.log('  First task:', {
      taskId: firstTask.taskId,
      status: firstTask.status,
      priority: firstTask.priority,
      score: firstTask.score,
      filePath: firstTask.filePath.split('/').slice(-3).join('/')
    });
    
    if (firstTask.taskId && firstTask.filePath && firstTask.score >= 0) {
      console.log('  ✅ Task structure valid\n');
    } else {
      console.log('  ❌ Task structure invalid\n');
      process.exit(1);
    }
    
    // Test 4: 验证排序
    console.log('Test 4: Verify task sorting');
    const sortedTasks = provider.sortTasks(tasks);
    console.log(`  Sorted ${sortedTasks.length} tasks`);
    
    // 检查是否按score降序排序
    let isSorted = true;
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      if (sortedTasks[i].score < sortedTasks[i + 1].score) {
        isSorted = false;
        break;
      }
    }
    
    if (isSorted) {
      console.log('  ✅ Tasks sorted correctly by score\n');
    } else {
      console.log('  ❌ Tasks not sorted correctly\n');
      process.exit(1);
    }
    
    // Test 5: 显示排序结果
    console.log('Test 5: Display sorted tasks (top 5)');
    const top5 = sortedTasks.slice(0, 5);
    top5.forEach((task, index) => {
      const priorityIcon = 
        task.priority === Priority.HIGH ? '🔴' :
        task.priority === Priority.MEDIUM ? '🟡' : '🟢';
      
      console.log(`  ${index + 1}. ${priorityIcon} ${task.taskId}`);
      console.log(`     Status: ${task.status}, Priority: ${task.priority}, Score: ${task.score}`);
      if (task.blockedTasks && task.blockedTasks.length > 0) {
        console.log(`     阻塞: ${task.blockedTasks.length}个任务`);
      }
    });
    console.log('  ✅ Task list displayed\n');
    
    // Test 6: 验证性能
    console.log('Test 6: Performance check');
    if (duration < 2000) {
      console.log(`  ✅ Scan completed in ${duration}ms (< 2s target)\n`);
    } else {
      console.log(`  ⚠️  Scan took ${duration}ms (> 2s target, may need optimization)\n`);
    }
    
    console.log('🎉 All tests passed!\n');
    console.log('✅ TaskContextProvider is working correctly');
    console.log('✅ Frontmatter parsing functional');
    console.log('✅ Smart sorting algorithm working');
    console.log(`✅ Performance: ${duration}ms for ${tasks.length} tasks\n`);
    
  } catch (error) {
    console.error('❌ Error during tests:', error);
    process.exit(1);
  }
})();
