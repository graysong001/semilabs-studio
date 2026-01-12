/**
 * @SpecTrace cap-ui-task-list, v1.0.0
 * 
 * Task Context Provider
 * 负责扫描、解析、排序spec-task-*.md文件
 */

import * as vscode from 'vscode';
import * as path from 'path';

// 任务状态
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

// 优先级
export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// 任务文档接口
export interface TaskDocument {
  taskId: string;
  filePath: string;
  status: TaskStatus;
  priority: Priority;
  domain?: string;
  estimatedHours?: number;
  currentProgress?: string;
  parentTask?: string;
  dependencies?: Record<string, string>;  // { "cap-xxx": "v1.0.0" }
  blockedTasks?: string[];  // 阻塞的任务ID列表
  updatedAt: Date;
  score: number;  // 排序分数
}

// Frontmatter元数据
interface TaskMetadata {
  task_id?: string;
  status?: string;
  priority?: string;
  domain?: string;
  estimated_hours?: number;
  parent_task?: string;
  dependencies_locked?: Record<string, string>;
  current_checkpoint?: string;
}

export class TaskContextProvider {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * 扫描并解析所有任务文件
   */
  async scanTasks(): Promise<TaskDocument[]> {
    console.log('[TaskContextProvider] Scanning tasks...');
    
    const pattern = new vscode.RelativePattern(
      this.workspaceRoot,
      '**/spec-task-*.md'
    );
    
    const files = await vscode.workspace.findFiles(
      pattern,
      '**/node_modules/**'
    );
    
    console.log(`[TaskContextProvider] Found ${files.length} task files`);
    
    const tasks: TaskDocument[] = [];
    
    for (const uri of files) {
      try {
        const task = await this.parseTaskFile(uri);
        if (task) {
          tasks.push(task);
        }
      } catch (error) {
        console.warn(`[TaskContextProvider] Failed to parse ${uri.fsPath}:`, error);
      }
    }
    
    // 计算阻塞关系
    this.calculateBlockedTasks(tasks);
    
    // 计算排序分数
    this.calculateScores(tasks);
    
    return tasks;
  }

  /**
   * 解析单个任务文件
   */
  private async parseTaskFile(uri: vscode.Uri): Promise<TaskDocument | null> {
    const content = await vscode.workspace.fs.readFile(uri);
    const text = Buffer.from(content).toString('utf8');
    
    // 解析Frontmatter
    const metadata = this.parseFrontmatter(text);
    
    if (!metadata.task_id) {
      console.warn(`[TaskContextProvider] Missing task_id in ${uri.fsPath}`);
      return null;
    }
    
    // 提取当前进度
    const progress = this.extractProgress(text);
    
    // 获取文件修改时间
    const stat = await vscode.workspace.fs.stat(uri);
    
    return {
      taskId: metadata.task_id,
      filePath: uri.fsPath,
      status: this.parseStatus(metadata.status),
      priority: this.parsePriority(metadata.priority),
      domain: metadata.domain,
      estimatedHours: metadata.estimated_hours,
      currentProgress: progress,
      parentTask: metadata.parent_task,
      dependencies: metadata.dependencies_locked,
      blockedTasks: [],
      updatedAt: new Date(stat.mtime),
      score: 0
    };
  }

  /**
   * 解析Frontmatter (YAML格式)
   */
  private parseFrontmatter(content: string): TaskMetadata {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
      return {};
    }
    
    const yamlText = match[1];
    const metadata: TaskMetadata = {};
    
    // 简单的YAML解析（只支持key: value格式）
    const lines = yamlText.split('\n');
    let currentKey: string | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // key: value 格式
      if (line.match(/^[a-z_]+:/)) {
        const colonIndex = line.indexOf(':');
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        if (value) {
          // 单行值
          this.setMetadataValue(metadata, key, value);
          currentKey = null;
        } else {
          // 多行值（如dependencies_locked）
          currentKey = key;
          if (key === 'dependencies_locked') {
            metadata.dependencies_locked = {};
          }
        }
      } else if (currentKey === 'dependencies_locked' && trimmed) {
        // 依赖项：  cap-xxx: v1.0.0
        const depMatch = trimmed.match(/^([a-z-]+):\s*(.+)$/);
        if (depMatch && metadata.dependencies_locked) {
          metadata.dependencies_locked[depMatch[1]] = depMatch[2];
        }
      }
    }
    
    return metadata;
  }

  /**
   * 设置元数据值
   */
  private setMetadataValue(metadata: TaskMetadata, key: string, value: string) {
    switch (key) {
      case 'task_id':
        metadata.task_id = value;
        break;
      case 'status':
        metadata.status = value;
        break;
      case 'priority':
        metadata.priority = value;
        break;
      case 'domain':
        metadata.domain = value;
        break;
      case 'estimated_hours':
        metadata.estimated_hours = parseInt(value, 10);
        break;
      case 'parent_task':
        metadata.parent_task = value === 'null' ? undefined : value;
        break;
      case 'current_checkpoint':
        metadata.current_checkpoint = value;
        break;
    }
  }

  /**
   * 提取当前进度信息
   */
  private extractProgress(content: string): string | undefined {
    // 查找 "### 当前状态？" 章节
    const statusMatch = content.match(/###\s*当前状态[？?]\s*\n([^\n]+)/);
    if (statusMatch) {
      return statusMatch[1].trim();
    }
    return undefined;
  }

  /**
   * 解析状态
   */
  private parseStatus(status?: string): TaskStatus {
    switch (status?.toUpperCase()) {
      case 'IN_PROGRESS':
        return TaskStatus.IN_PROGRESS;
      case 'PAUSED':
        return TaskStatus.PAUSED;
      case 'COMPLETED':
        return TaskStatus.COMPLETED;
      default:
        return TaskStatus.PENDING;
    }
  }

  /**
   * 解析优先级
   */
  private parsePriority(priority?: string): Priority {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return Priority.HIGH;
      case 'LOW':
        return Priority.LOW;
      default:
        return Priority.MEDIUM;
    }
  }

  /**
   * 计算阻塞关系
   */
  private calculateBlockedTasks(tasks: TaskDocument[]): void {
    // 构建依赖图
    const taskMap = new Map<string, TaskDocument>();
    tasks.forEach(task => taskMap.set(task.taskId, task));
    
    // 找出每个任务阻塞的任务
    for (const task of tasks) {
      const blockedTasks: string[] = [];
      
      // 检查parent_task关系
      for (const otherTask of tasks) {
        if (otherTask.parentTask === task.taskId) {
          blockedTasks.push(otherTask.taskId);
        }
      }
      
      task.blockedTasks = blockedTasks;
    }
  }

  /**
   * 计算排序分数
   */
  private calculateScores(tasks: TaskDocument[]): void {
    const now = Date.now();
    
    // 计算被依赖次数（有多少任务依赖这个任务实现的Spec）
    const dependencyCounts = new Map<string, number>();
    
    for (const task of tasks) {
      if (task.dependencies) {
        // 从task_id推断实现的cap（假设task-xxx-001实现cap-xxx）
        const capName = this.inferCapFromTaskId(task.taskId);
        
        for (const otherTask of tasks) {
          if (otherTask.dependencies && otherTask.dependencies[capName]) {
            dependencyCounts.set(capName, (dependencyCounts.get(capName) || 0) + 1);
          }
        }
      }
    }
    
    for (const task of tasks) {
      let score = 0;
      
      // 1. 优先级基础分
      switch (task.priority) {
        case Priority.HIGH:
          score += 100;
          break;
        case Priority.MEDIUM:
          score += 50;
          break;
        case Priority.LOW:
          score += 0;
          break;
      }
      
      // 2. 状态加分
      if (task.status === TaskStatus.IN_PROGRESS) {
        score += 30;  // 避免任务切换
      } else if (task.status === TaskStatus.PAUSED) {
        score += 20;
      }
      
      // 3. 阻塞关系加分
      if (task.blockedTasks && task.blockedTasks.length > 0) {
        score += task.blockedTasks.length * 10;
      }
      
      // 4. 被依赖关系加分
      const capName = this.inferCapFromTaskId(task.taskId);
      const depCount = dependencyCounts.get(capName) || 0;
      score += depCount * 10;
      
      // 5. 更新时间衰减（超过1天的任务，每天-2分）
      const daysSinceUpdate = Math.floor((now - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      score -= daysSinceUpdate * 2;
      
      task.score = Math.max(0, score);  // 确保分数非负
    }
  }

  /**
   * 从task_id推断实现的cap
   * 例如：task-auth-login-001 -> cap-auth-login
   */
  private inferCapFromTaskId(taskId: string): string {
    // 移除 "task-" 前缀和时间戳后缀
    const parts = taskId.replace(/^task-/, '').split('-');
    // 保留前面的部分，通常是领域名
    if (parts.length >= 2) {
      return `cap-${parts[0]}-${parts[1]}`;
    }
    return `cap-${parts[0]}`;
  }

  /**
   * 按分数排序任务
   */
  sortTasks(tasks: TaskDocument[]): TaskDocument[] {
    return tasks
      .filter(task => task.status !== TaskStatus.COMPLETED)
      .sort((a, b) => b.score - a.score);
  }
}
