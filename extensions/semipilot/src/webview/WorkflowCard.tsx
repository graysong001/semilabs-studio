/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Workflow Deck Component (V7 S3)
 * 
 * 展示当前项目下所有 Staging Spec 列表及其状态
 */

import React, { useState, useEffect } from 'react';

export interface StagingSpec {
  specId: string;
  domain: string;
  path: string;
  workflowState?: string;
  densityPhase?: string;
}

export interface WorkflowEvent {
  type: 'DRAFT_UPDATED' | 'PROPOSAL_READY' | 'REVIEW_SUBMITTED' | 'VETO_APPLIED' | 'FIX_SUBMITTED' | 'WORKFLOW_APPROVED' | 'PHASE_STARTED' | 'PHASE_COMPLETED' | 'STAGING_UPDATED' | 'STAGING_MERGE_READY' | 'STAGING_MERGED';
  target: string; // Spec 文件路径
  workflowState: string; // 当前 workflow_state
  payload?: Record<string, any>;
  timestamp?: string;
}

interface WorkflowCardProps {
  onAction: (action: 'submit' | 'veto' | 'approve' | 'archive', domain: string, specId: string, params?: any) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [specs, setSpecs] = useState<StagingSpec[]>([]);
  const [lastEvent, setLastEvent] = useState<WorkflowEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 监听来自 Extension Host 的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.type === 'stagingListUpdated') {
        setSpecs(message.specs || []);
        setIsConnected(true);
      } else if (message.type === 'workflowEvent') {
        setLastEvent(message.event);
        // 收到事件时刷新列表
        const vscode = (window as any).__vscodeApi;
        if (vscode) {
          vscode.postMessage({ type: 'refreshStagingList' });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // 初始获取列表
    const vscode = (window as any).__vscodeApi;
    if (vscode) {
      vscode.postMessage({ type: 'refreshStagingList' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 获取状态色
  const getStateColor = (state?: string) => {
    switch (state) {
      case 'DEFINING': return '#A569BD'; // 浅紫
      case 'READY_FOR_USER_APPROVAL': return '#F1C40F'; // 警告黄 (需要确认)
      case 'PENDING_REVIEW': return '#BB8FCE'; // 柔紫
      case 'READY_FOR_IMPLEMENTATION': return '#27AE60'; // 成功绿
      case 'VETOED': return '#E67E22'; // 橙色 (被驳回)
      case 'REJECTED': return '#E74C3C'; // 警告红
      case 'MERGE_READY': return '#3498DB'; // 进度蓝
      default: return '#888';
    }
  };

  // const getFileName = (path: string) => path.split(/[/\\]/).pop() || path;

  const canArchiveAll = specs.length > 0 && specs.every(s => s.workflowState === 'MERGE_READY');

  const handleArchiveAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to archive all ${specs.length} specs and clear the staging area?`)) {
      specs.forEach(spec => onAction('archive', spec.domain, spec.specId));
    }
  };

  // 获取事件描述文本 (V7 Visibility)
  const getEventDisplayText = (event: WorkflowEvent) => {
    if (event.type === 'PHASE_STARTED') {
      const persona = event.payload?.persona || 'Agent';
      const phase = event.payload?.phase || event.workflowState;
      const loop = event.payload?.loopCount !== undefined ? ` (Round ${event.payload.loopCount + 1})` : '';
      return `${persona} is ${phase}${loop}...`;
    }
    if (event.type === 'VETO_APPLIED') {
      return `🛑 ARCHI VETO (Round ${event.payload?.loopCount + 1})`;
    }
    return event.type;
  };

  return (
    <div style={styles.container}>
      {/* Deck Header */}
      <div 
        style={{
          ...styles.header,
          backgroundColor: isExpanded ? '#2D2D30' : '#252526',
          borderBottom: isExpanded ? '1px solid #3E3E42' : 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{
          ...styles.expandIcon,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>▸</span>
        <span style={styles.title}>STAGING DECK</span>
        <span style={styles.countBadge}>{specs.length}</span>
        
        <div style={{ flex: 1 }} />
        
        {canArchiveAll && (
          <button 
            style={{...styles.miniButton, backgroundColor: '#27AE60', marginRight: '12px'}} 
            onClick={handleArchiveAll}
          >
            🚢 Archive All
          </button>
        )}
        
        {lastEvent && (
          <span style={{ 
            ...styles.lastEvent, 
            color: getStateColor(lastEvent.workflowState),
            animation: 'breathe 2s ease-in-out infinite',
          }}>
            {lastEvent.workflowState === 'REJECTED' || lastEvent.type === 'VETO_APPLIED' ? '⚠️' : '✨'} {getEventDisplayText(lastEvent)}
          </span>
        )}
        
        <span style={{
          ...styles.connectionStatus,
          color: isConnected ? '#27AE60' : '#888',
        }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Deck Content (List of Specs) */}
      {isExpanded && (
        <div style={styles.content}>
          {specs.length === 0 ? (
            <div style={styles.emptyText}>No active staging specs.</div>
          ) : (
            <div style={styles.specList}>
              {specs.map(spec => (
                <div key={`${spec.domain}-${spec.specId}`} style={styles.specItem}>
                  <div style={styles.specInfo}>
                    <div style={styles.specName}>{spec.specId}</div>
                    <div style={styles.specMeta}>
                      <span style={styles.domainTag}>{spec.domain.toUpperCase()}</span>
                      <span style={styles.separator}>•</span>
                      <span style={{ 
                        color: getStateColor(spec.workflowState),
                        fontSize: '9px',
                        fontWeight: 'bold',
                      }}>
                        {spec.workflowState || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.specActions}>
                    {(spec.workflowState === 'DEFINING' || spec.workflowState === 'VETOED') && (
                      <button style={styles.miniButton} onClick={(e) => { e.stopPropagation(); onAction('submit', spec.domain, spec.specId); }}>Submit</button>
                    )}
                    {spec.workflowState === 'READY_FOR_USER_APPROVAL' && (
                      <button style={{...styles.miniButton, backgroundColor: '#F1C40F', color: '#000'}} onClick={(e) => { e.stopPropagation(); onAction('submit', spec.domain, spec.specId); }}>Confirm & Submit</button>
                    )}
                    {spec.workflowState === 'PENDING_REVIEW' && (
                      <>
                        <button style={{...styles.miniButton, backgroundColor: '#27AE60'}} onClick={(e) => { e.stopPropagation(); onAction('approve', spec.domain, spec.specId); }}>Approve</button>
                        <button style={{...styles.miniButton, backgroundColor: '#E74C3C'}} onClick={(e) => { e.stopPropagation(); 
                          const reason = prompt('Veto Reason:');
                          if (reason) onAction('veto', spec.domain, spec.specId, { reason });
                        }}>Veto</button>
                      </>
                    )}
                    {spec.workflowState === 'MERGE_READY' && (
                      <button style={{...styles.miniButton, backgroundColor: '#3498DB'}} onClick={(e) => { e.stopPropagation(); onAction('archive', spec.domain, spec.specId); }}>Ship It</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#252526',
    border: '1px solid #3E3E42',
    borderRadius: '6px',
    marginBottom: '12px',
    overflow: 'hidden',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: '11px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
    color: '#888',
    fontSize: '14px',
    display: 'inline-block',
  },
  title: { 
    fontWeight: 'bold', 
    color: '#AAA', 
    marginRight: '8px',
    letterSpacing: '0.5px',
  },
  countBadge: {
    backgroundColor: '#3E3E42',
    color: '#CCC',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '9px',
    fontWeight: 'bold',
  },
  lastEvent: {
    fontSize: '9px',
    marginRight: '12px',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  connectionStatus: { 
    fontSize: '9px', 
    fontWeight: 'bold',
    opacity: 0.6,
  },
  content: {
    padding: '10px',
    backgroundColor: '#1E1E1E',
  },
  emptyText: { color: '#666', textAlign: 'center', padding: '15px' },
  specList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  specItem: {
    backgroundColor: '#2D2D30',
    padding: '10px',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid transparent',
    transition: 'border-color 0.2s',
  },
  specInfo: { flex: 1 },
  specName: { 
    fontWeight: 'bold', 
    color: '#EEE', 
    marginBottom: '4px',
    fontSize: '12px',
  },
  specMeta: { fontSize: '10px', color: '#888', display: 'flex', alignItems: 'center' },
  domainTag: { 
    color: '#8E44AD',
    fontWeight: 'bold',
  },
  separator: { margin: '0 6px', opacity: 0.3 },
  specActions: { display: 'flex', gap: '6px' },
  miniButton: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: '3px',
    backgroundColor: '#8E44AD',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'filter 0.2s',
  }
};
