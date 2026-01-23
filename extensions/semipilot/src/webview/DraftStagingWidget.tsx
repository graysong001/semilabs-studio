/**
 * @SpecTrace cap-ui-intent-interaction
 * 
 * Draft Staging Widget - Sticky Top 草稿暂存区
 * 
 * 功能：
 * - 订阅 DRAFT_UPDATED 事件
 * - 解析 intent_draft.md (FrontMatter + Section)
 * - Collapsible Accordion
 *   * Collapsed: "📝 Draft: N items"
 *   * Expanded: 显示 OBJECTIVE/CONSTRAINT/QUESTION 列表
 * - "Open File" 按钮：vscode.open(temp/intent_draft.md)
 * 
 * 技术要点：
 * - 状态管理：监听 window.addEventListener('message')
 * - 数据解析：解析 Section 1/2/3 的 Markdown 列表
 * - UI 风格：紧凑布局 + 字体放大
 */

import React, { useState, useEffect } from 'react';

interface DraftItem {
  type: 'OBJECTIVE' | 'CONSTRAINT' | 'QUESTION';
  content: string;
  checked: boolean;
}

interface DraftContent {
  objectives: DraftItem[];
  constraints: DraftItem[];
  questions: DraftItem[];
}

interface DraftStagingWidgetProps {
  onOpenFile?: (filePath: string) => void;
}

export const DraftStagingWidget: React.FC<DraftStagingWidgetProps> = ({ onOpenFile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftContent, setDraftContent] = useState<DraftContent>({
    objectives: [],
    constraints: [],
    questions: [],
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [draftFilePath, setDraftFilePath] = useState<string>('temp/intent_draft.md');

  // 监听来自 Extension Host 的 DRAFT_UPDATED 事件
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'workflowEvent') {
        const workflowEvent = message.event;

        if (workflowEvent.type === 'DRAFT_UPDATED') {
          // 解析 Draft 内容
          const parsed = parseDraftContent(workflowEvent.payload?.content || '');
          setDraftContent(parsed);
          setLastUpdated(new Date());

          // 更新文件路径
          if (workflowEvent.target) {
            setDraftFilePath(workflowEvent.target);
          }

          // 闪烁提示（可选，通过 CSS 动画实现）
          // 这里通过更新时间戳触发 re-render
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  /**
   * 解析 Draft 内容（简化版）
   * 实际应该从 Backend 获取完整解析结果，这里模拟客户端解析
   */
  const parseDraftContent = (content: string): DraftContent => {
    const lines = content.split('\n');
    const result: DraftContent = {
      objectives: [],
      constraints: [],
      questions: [],
    };

    let currentSection: 'objectives' | 'constraints' | 'questions' | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // 检测 Section 标题
      if (trimmed.startsWith('## 1. Core Objectives')) {
        currentSection = 'objectives';
        continue;
      } else if (trimmed.startsWith('## 2. Constraints & Rules')) {
        currentSection = 'constraints';
        continue;
      } else if (trimmed.startsWith('## 3. Pending Questions')) {
        currentSection = 'questions';
        continue;
      }

      // 解析列表项
      if (currentSection && trimmed.startsWith('- [')) {
        const checked = trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]');
        const content = trimmed.replace(/^- \[[xX ]?\] /, '');

        if (content) {
          result[currentSection].push({
            type: currentSection.toUpperCase() as 'OBJECTIVE' | 'CONSTRAINT' | 'QUESTION',
            content,
            checked,
          });
        }
      }
    }

    return result;
  };

  // 计算总条目数
  const getTotalItems = (): number => {
    return draftContent.objectives.length + draftContent.constraints.length + draftContent.questions.length;
  };

  // 处理 Open File 操作
  const handleOpenFile = () => {
    if (onOpenFile) {
      onOpenFile(draftFilePath);
    } else {
      // 默认：发送到 Extension Host
      const vscodeApi = (window as any).__vscodeApi;
      if (vscodeApi) {
        vscodeApi.postMessage({
          type: 'openFile',
          filePath: draftFilePath,
        });
      }
    }
  };

  const totalItems = getTotalItems();

  // 如果没有内容且未更新过，不渲染
  if (totalItems === 0 && !lastUpdated) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* 标题栏（折叠态） */}
      <div
        style={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.expandIcon}>
          {isExpanded ? '▼' : '▸'}
        </span>
        <span style={styles.icon}>📝</span>
        <span style={styles.title}>
          Draft: {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
        {!isExpanded && lastUpdated && (
          <span style={styles.timestamp}>
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button
          style={styles.openBtn}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenFile();
          }}
          title="Open intent_draft.md"
        >
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="14" height="14">
            <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
            <path d="M4.646 8.146a.5.5 0 0 1 .708 0L8 10.793l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      {/* 展开态内容 */}
      {isExpanded && (
        <div style={styles.content}>
          {/* Section 1: Core Objectives */}
          {draftContent.objectives.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>🎯 Core Objectives</div>
              <ul style={styles.list}>
                {draftContent.objectives.map((item, index) => (
                  <li key={`obj-${index}`} style={styles.listItem}>
                    <span style={item.checked ? styles.checkedItem : styles.uncheckedItem}>
                      {item.checked ? '✅' : '⬜'} {item.content}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 2: Constraints & Rules */}
          {draftContent.constraints.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>⚙️ Constraints & Rules</div>
              <ul style={styles.list}>
                {draftContent.constraints.map((item, index) => (
                  <li key={`const-${index}`} style={styles.listItem}>
                    <span style={item.checked ? styles.checkedItem : styles.uncheckedItem}>
                      {item.checked ? '✅' : '⬜'} {item.content}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 3: Pending Questions */}
          {draftContent.questions.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>❓ Pending Questions</div>
              <ul style={styles.list}>
                {draftContent.questions.map((item, index) => (
                  <li key={`quest-${index}`} style={styles.listItem}>
                    <span style={item.checked ? styles.checkedItem : styles.uncheckedItem}>
                      {item.checked ? '✅' : '⬜'} {item.content}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 底部：最近更新时间 */}
          {lastUpdated && (
            <div style={styles.footer}>
              <span style={styles.footerText}>
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 样式定义（紧凑布局 + 字体放大）
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#252526',
    border: '1px solid #3E3E42',
    borderRadius: '6px',
    marginBottom: '12px',
    overflow: 'hidden',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: '14px', // 字体放大
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px', // 紧凑布局
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: '#2D2D30',
    transition: 'background-color 0.2s',
  },
  expandIcon: {
    marginRight: '8px',
    color: '#CCCCCC',
    fontSize: '12px',
  },
  icon: {
    marginRight: '8px',
    fontSize: '16px', // 图标放大
  },
  title: {
    fontWeight: 'bold',
    color: '#CCCCCC',
    flex: 1,
    fontSize: '14px', // 字体放大
  },
  timestamp: {
    color: '#888',
    fontSize: '12px',
    marginRight: '8px',
  },
  openBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #3E3E42',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    color: '#CCCCCC',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  content: {
    padding: '12px 14px',
    borderTop: '1px solid #3E3E42',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#A569BD', // 梦幻紫色
    fontSize: '13px',
    marginBottom: '8px',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  listItem: {
    marginBottom: '6px',
    paddingLeft: '4px',
  },
  uncheckedItem: {
    color: '#CCCCCC',
    fontSize: '13px',
  },
  checkedItem: {
    color: '#888',
    fontSize: '13px',
    textDecoration: 'line-through',
  },
  footer: {
    borderTop: '1px solid #3E3E42',
    paddingTop: '8px',
    marginTop: '12px',
  },
  footerText: {
    color: '#666',
    fontSize: '11px',
  },
};
