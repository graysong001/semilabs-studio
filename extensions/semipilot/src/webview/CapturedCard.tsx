/**
 * @SpecTrace cap-ui-semipilot
 * 
 * CAPTURED Card Component (Poe v11.2 Flash Translation)
 * 
 * 折叠式Status Footer,展示Flash Translation转译结果:
 * - 折叠状态: 显示摘要 (如"2 items translated, 1 needs confirmation")
 * - 展开状态: 显示详细CAPTURED列表
 */

import React, { useState } from 'react';
import { CapturedItem } from './MarkdownSidecarParser';

interface CapturedCardProps {
  /**
   * CAPTURED 项列表
   */
  items: CapturedItem[];
  
  /**
   * 确认回调 (用户点击Confirm按钮)
   */
  onConfirm?: (item: CapturedItem) => void;
}

export const CapturedCard: React.FC<CapturedCardProps> = ({ items, onConfirm }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null; // 无CAPTURED项时不显示
  }

  // 统计已转译、需确认和仅保留的数量
  const translatedCount = items.filter(item => item.status === 'translated').length;
  const needsConfirmCount = items.filter(item => item.status === 'need_confirm').length;
  const contextOnlyCount = items.filter(item => item.status === 'context_only').length;

  return (
    <div className="captured-card">
      {/* 折叠/展开按钮 */}
      <div 
        className="captured-card-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="captured-card-summary">
          <span className="captured-icon">⚡</span>
          <span className="captured-title">Flash Translation</span>
          <span className="captured-stats">
            {translatedCount > 0 && (
              <span className="stat-badge stat-success">
                ✅ {translatedCount} translated
              </span>
            )}
            {needsConfirmCount > 0 && (
              <span className="stat-badge stat-warning">
                ⚠️ {needsConfirmCount} needs confirmation
              </span>
            )}
            {contextOnlyCount > 0 && (
              <span className="stat-badge stat-info">
                💭 {contextOnlyCount} context only
              </span>
            )}
          </span>
        </div>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="captured-card-body">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`captured-item ${
                item.status === 'translated' ? 'item-success' : 
                item.status === 'need_confirm' ? 'item-warning' : 'item-info'
              }`}
            >
              <div className="item-left">
                <span className="item-icon">
                  {item.status === 'translated' ? '✅' : 
                   item.status === 'need_confirm' ? '⚠️' : '💭'}
                </span>
                <div className="item-content">
                  <span className="item-tech">{item.tech}</span>
                  {item.intent && (
                    <span className="item-intent"> → {item.intent}</span>
                  )}
                  <span className="item-confidence"> (c:{item.confidence.toFixed(2)})</span>
                </div>
              </div>
              <div className="item-right">
                {item.status === 'translated' ? (
                  <span className="item-action-label">NFR写入</span>
                ) : item.status === 'need_confirm' ? (
                  <button 
                    className="item-confirm-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirm?.(item);
                    }}
                  >
                    Confirm
                  </button>
                ) : (
                  <span className="item-action-label context-only">仅保留</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
