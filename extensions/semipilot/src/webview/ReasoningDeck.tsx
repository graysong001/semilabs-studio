/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Reasoning Deck Component (V7 S3)
 * 
 * 投影 OODA THINKING 的关键节点，展示 Spec Id, Domain 和约束
 */

import React from 'react';

interface ReasoningDeckProps {
  content: string;
}

export const ReasoningDeck: React.FC<ReasoningDeckProps> = ({ content }) => {
  // 提取 ### THINKING 块
  const thinkingMatch = content.match(/### THINKING([\s\S]*?)(?=###|$)/);
  if (!thinkingMatch) return null;

  const thinkingBody = thinkingMatch[1];
  
  // 提取关键元数据（基于 ReactExecutor 的输出格式）
  const specId = thinkingBody.match(/Spec Id: (cap-[a-z0-9-]+)/i)?.[1];
  const domain = thinkingBody.match(/Domain: ([a-z-]+)/i)?.[1];
  const stage = thinkingBody.match(/Stage: ([A-Z_]+)/i)?.[1] || 'REASONING';

  return (
    <div className="reasoning-deck">
      <div className="reasoning-header">
        <span className="reasoning-icon">🔮</span>
        <span className="reasoning-title">THINKING PROJECTION</span>
        <div style={{ flex: 1 }} />
        <span className="meta-chip">{stage}</span>
      </div>
      
      <div className="reasoning-body">
        {thinkingBody.trim().split('\n')[0].replace(/^[*-]\s*/, '')}
      </div>

      <div className="reasoning-meta">
        {specId && (
          <div className="meta-chip" onClick={() => openSpec(specId)} style={{ cursor: 'pointer' }}>
            SPEC: {specId}
          </div>
        )}
        {domain && (
          <div className="meta-chip">
            DOMAIN: {domain}
          </div>
        )}
      </div>
    </div>
  );
};

const openSpec = (specId: string) => {
  const vscode = (window as any).__vscodeApi;
  if (vscode) {
    vscode.postMessage({ type: 'openTask', filePath: specId });
  }
};

