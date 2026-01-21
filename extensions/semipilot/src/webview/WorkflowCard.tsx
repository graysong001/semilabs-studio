/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Workflow Card Component
 * 
 * 可折叠 Workflow 状态卡片，位于 Chat 消息流和输入框之间
 * - 默认折叠，仅显示动态状态卡片头
 * - 梦幻紫色系（#8E44AD 主色 + 状态色映射）
 * - Submit / Veto / Resolve 操作按钮
 * - 操作行为写入 Chat 流（类似 Tool Card）
 */

import React, { useState, useEffect } from 'react';

export interface WorkflowEvent {
  type: 'DRAFT_UPDATED' | 'PROPOSAL_READY' | 'REVIEW_SUBMITTED' | 'VETO_APPLIED' | 'FIX_SUBMITTED' | 'WORKFLOW_APPROVED';
  target: string; // Spec 文件路径
  workflowState: string; // 当前 workflow_state
  payload?: Record<string, any>;
  timestamp?: string;
}

interface WorkflowCardProps {
  onAction: (action: 'submit' | 'veto' | 'resolve', target: string, params?: any) => void;
}

interface StatusDisplay {
  text: string;
  color: string;
  icon: string;
  animate: boolean;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<WorkflowEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<WorkflowEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // 监听来自 Extension Host 的 workflow 事件
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'workflowEvent') {
        const workflowEvent: WorkflowEvent = message.event;
        
        // 更新当前事件
        setCurrentEvent(workflowEvent);
        
        // 添加到历史（最多保留 5 条）
        setRecentEvents(prev => {
          const updated = [workflowEvent, ...prev].slice(0, 5);
          return updated;
        });
        
        // 自动展开 REJECTED / FIXING 等需要用户决策的状态
        if (workflowEvent.workflowState === 'REJECTED' || workflowEvent.workflowState === 'FIXING') {
          setIsExpanded(true);
        }
        
        setIsConnected(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 获取状态展示信息
  const getStatusDisplay = (event: WorkflowEvent | null): StatusDisplay => {
    if (!event) {
      return {
        text: '等待 Workflow 事件...',
        color: '#888',
        icon: '⏳',
        animate: false,
      };
    }

    switch (event.type) {
      case 'DRAFT_UPDATED':
        return {
          text: '📝 草稿更新中...',
          color: '#A569BD',
          icon: '📝',
          animate: false,
        };
      case 'REVIEW_SUBMITTED':
        return {
          text: '🔄 已提交给 Archi 审批',
          color: '#BB8FCE',
          icon: '🔄',
          animate: true, // 呼吸 + 旋转
        };
      case 'VETO_APPLIED':
        return {
          text: '❌ Archi 打回 - 需修复',
          color: '#E74C3C',
          icon: '❌',
          animate: false,
        };
      case 'FIX_SUBMITTED':
        return {
          text: '🔧 修复中，待重新审批',
          color: '#A569BD',
          icon: '🔧',
          animate: false,
        };
      case 'WORKFLOW_APPROVED':
        return {
          text: '✅ Archi 已批准',
          color: '#27AE60',
          icon: '✅',
          animate: false,
        };
      default:
        return {
          text: event.workflowState,
          color: '#8E44AD',
          icon: '📋',
          animate: false,
        };
    }
  };

  const statusDisplay = getStatusDisplay(currentEvent);

  // 获取文件名（从路径提取）
  const getFileName = (filePath: string): string => {
    return filePath.split(/[/\\]/).pop() || filePath;
  };

  // 处理操作按钮点击
  const handleAction = (action: 'submit' | 'veto' | 'resolve') => {
    if (!currentEvent) return;

    // 根据操作类型收集参数
    let params: any = {};
    if (action === 'veto') {
      const reason = prompt('请输入 Veto 原因：');
      if (!reason) return;
      params.reason = reason;
      params.suggestion = prompt('请输入改进建议（可选）：') || '';
    } else if (action === 'resolve') {
      const confirmed = confirm('确认已修复问题？');
      if (!confirmed) return;
      params.userApproved = true;
    }

    onAction(action, currentEvent.target, params);
  };

  // 如果没有事件且未连接，不渲染
  if (!currentEvent && !isConnected) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* 卡片头（折叠态） */}
      <div 
        style={{
          ...styles.header,
          backgroundColor: isExpanded ? '#2D2D30' : '#252526',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.expandIcon}>
          {isExpanded ? '▼' : '▸'}
        </span>
        <span style={styles.title}>Workflow</span>
        <span style={styles.separator}>|</span>
        
        {/* 动态状态文案 */}
        <span 
          style={{
            ...styles.statusText,
            color: statusDisplay.color,
            animation: statusDisplay.animate ? 'breathe 2s ease-in-out infinite' : 'none',
          }}
        >
          {statusDisplay.icon} {statusDisplay.text}
        </span>
        
        {currentEvent && (
          <>
            <span style={styles.separator}>|</span>
            <span style={styles.fileName}>{getFileName(currentEvent.target)}</span>
            <span style={styles.separator}>•</span>
            <span style={styles.state}>{currentEvent.workflowState}</span>
          </>
        )}
        
        <span style={styles.separator}>|</span>
        <span style={{
          ...styles.connectionStatus,
          color: isConnected ? '#27AE60' : '#888',
        }}>
          {isConnected ? '● Live' : '○ Disconnected'}
        </span>
      </div>

      {/* 展开态内容 */}
      {isExpanded && currentEvent && (
        <div style={styles.content}>
          {/* 顶部：当前状态概览 */}
          <div style={styles.overview}>
            <div style={styles.overviewRow}>
              <span style={styles.label}>当前阶段：</span>
              <span style={{ color: statusDisplay.color, fontWeight: 'bold' }}>
                {currentEvent.workflowState}
              </span>
            </div>
            {currentEvent.timestamp && (
              <div style={styles.overviewRow}>
                <span style={styles.label}>最近更新：</span>
                <span style={styles.timestamp}>
                  {new Date(currentEvent.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* 中部：最近 5 条事件时间线 */}
          {recentEvents.length > 0 && (
            <div style={styles.timeline}>
              <div style={styles.timelineTitle}>最近事件</div>
              {recentEvents.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} style={styles.timelineItem}>
                  <span style={styles.timelineIcon}>{getStatusDisplay(event).icon}</span>
                  <span style={styles.timelineType}>{event.type}</span>
                  <span style={styles.timelineSeparator}>-</span>
                  <span style={styles.timelineTarget}>{getFileName(event.target)}</span>
                  {event.timestamp && (
                    <span style={styles.timelineTime}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 底部：操作按钮区 */}
          <div style={styles.actions}>
            <button
              style={{
                ...styles.button,
                ...styles.buttonSubmit,
              }}
              onClick={() => handleAction('submit')}
              disabled={currentEvent.workflowState === 'PENDING_REVIEW' || currentEvent.workflowState === 'DESIGNED'}
            >
              Submit for Review
            </button>
            <button
              style={{
                ...styles.button,
                ...styles.buttonVeto,
              }}
              onClick={() => handleAction('veto')}
            >
              Veto
            </button>
            <button
              style={{
                ...styles.button,
                ...styles.buttonResolve,
              }}
              onClick={() => handleAction('resolve')}
              disabled={currentEvent.workflowState !== 'REJECTED' && currentEvent.workflowState !== 'FIXING'}
            >
              Resolve
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 样式定义（梦幻紫色系）
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#252526',
    border: '1px solid #3E3E42',
    borderRadius: '4px',
    marginBottom: '12px',
    overflow: 'hidden',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: '13px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s',
  },
  expandIcon: {
    marginRight: '8px',
    color: '#CCCCCC',
    fontSize: '12px',
  },
  title: {
    fontWeight: 'bold',
    color: '#CCCCCC',
    marginRight: '8px',
  },
  separator: {
    color: '#666',
    margin: '0 6px',
  },
  statusText: {
    fontWeight: '500',
    flex: 1,
  },
  fileName: {
    color: '#CCCCCC',
    fontSize: '12px',
  },
  state: {
    color: '#888',
    fontSize: '11px',
  },
  connectionStatus: {
    fontSize: '11px',
    fontWeight: 'bold',
  },
  content: {
    padding: '12px',
    borderTop: '1px solid #3E3E42',
  },
  overview: {
    marginBottom: '12px',
  },
  overviewRow: {
    marginBottom: '4px',
  },
  label: {
    color: '#888',
    marginRight: '8px',
  },
  timestamp: {
    color: '#CCCCCC',
    fontSize: '12px',
  },
  timeline: {
    marginBottom: '12px',
    backgroundColor: '#1E1E1E',
    padding: '8px',
    borderRadius: '4px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  timelineTitle: {
    color: '#888',
    fontSize: '11px',
    marginBottom: '6px',
    fontWeight: 'bold',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '12px',
    color: '#CCCCCC',
  },
  timelineIcon: {
    marginRight: '6px',
  },
  timelineType: {
    color: '#8E44AD',
    fontWeight: '500',
    marginRight: '4px',
  },
  timelineSeparator: {
    color: '#666',
    margin: '0 4px',
  },
  timelineTarget: {
    flex: 1,
    color: '#CCCCCC',
  },
  timelineTime: {
    color: '#666',
    fontSize: '10px',
    marginLeft: '8px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'opacity 0.2s',
  },
  buttonSubmit: {
    backgroundColor: '#8E44AD',
    color: '#FFFFFF',
  },
  buttonVeto: {
    backgroundColor: '#E74C3C',
    color: '#FFFFFF',
  },
  buttonResolve: {
    backgroundColor: '#27AE60',
    color: '#FFFFFF',
  },
};
