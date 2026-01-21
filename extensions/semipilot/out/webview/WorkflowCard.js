"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCard = void 0;
const react_1 = __importStar(require("react"));
const WorkflowCard = ({ onAction }) => {
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const [currentEvent, setCurrentEvent] = (0, react_1.useState)(null);
    const [recentEvents, setRecentEvents] = (0, react_1.useState)([]);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    // 监听来自 Extension Host 的 workflow 事件
    (0, react_1.useEffect)(() => {
        const handleMessage = (event) => {
            const message = event.data;
            if (message.type === 'workflowEvent') {
                const workflowEvent = message.event;
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
    const getStatusDisplay = (event) => {
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
    const getFileName = (filePath) => {
        return filePath.split(/[/\\]/).pop() || filePath;
    };
    // 处理操作按钮点击
    const handleAction = (action) => {
        if (!currentEvent)
            return;
        // 根据操作类型收集参数
        let params = {};
        if (action === 'veto') {
            const reason = prompt('请输入 Veto 原因：');
            if (!reason)
                return;
            params.reason = reason;
            params.suggestion = prompt('请输入改进建议（可选）：') || '';
        }
        else if (action === 'resolve') {
            const confirmed = confirm('确认已修复问题？');
            if (!confirmed)
                return;
            params.userApproved = true;
        }
        onAction(action, currentEvent.target, params);
    };
    // 如果没有事件且未连接，不渲染
    if (!currentEvent && !isConnected) {
        return null;
    }
    return (react_1.default.createElement("div", { style: styles.container },
        react_1.default.createElement("div", { style: {
                ...styles.header,
                backgroundColor: isExpanded ? '#2D2D30' : '#252526',
            }, onClick: () => setIsExpanded(!isExpanded) },
            react_1.default.createElement("span", { style: styles.expandIcon }, isExpanded ? '▼' : '▸'),
            react_1.default.createElement("span", { style: styles.title }, "Workflow"),
            react_1.default.createElement("span", { style: styles.separator }, "|"),
            react_1.default.createElement("span", { style: {
                    ...styles.statusText,
                    color: statusDisplay.color,
                    animation: statusDisplay.animate ? 'breathe 2s ease-in-out infinite' : 'none',
                } },
                statusDisplay.icon,
                " ",
                statusDisplay.text),
            currentEvent && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("span", { style: styles.separator }, "|"),
                react_1.default.createElement("span", { style: styles.fileName }, getFileName(currentEvent.target)),
                react_1.default.createElement("span", { style: styles.separator }, "\u2022"),
                react_1.default.createElement("span", { style: styles.state }, currentEvent.workflowState))),
            react_1.default.createElement("span", { style: styles.separator }, "|"),
            react_1.default.createElement("span", { style: {
                    ...styles.connectionStatus,
                    color: isConnected ? '#27AE60' : '#888',
                } }, isConnected ? '● Live' : '○ Disconnected')),
        isExpanded && currentEvent && (react_1.default.createElement("div", { style: styles.content },
            react_1.default.createElement("div", { style: styles.overview },
                react_1.default.createElement("div", { style: styles.overviewRow },
                    react_1.default.createElement("span", { style: styles.label }, "\u5F53\u524D\u9636\u6BB5\uFF1A"),
                    react_1.default.createElement("span", { style: { color: statusDisplay.color, fontWeight: 'bold' } }, currentEvent.workflowState)),
                currentEvent.timestamp && (react_1.default.createElement("div", { style: styles.overviewRow },
                    react_1.default.createElement("span", { style: styles.label }, "\u6700\u8FD1\u66F4\u65B0\uFF1A"),
                    react_1.default.createElement("span", { style: styles.timestamp }, new Date(currentEvent.timestamp).toLocaleString())))),
            recentEvents.length > 0 && (react_1.default.createElement("div", { style: styles.timeline },
                react_1.default.createElement("div", { style: styles.timelineTitle }, "\u6700\u8FD1\u4E8B\u4EF6"),
                recentEvents.map((event, index) => (react_1.default.createElement("div", { key: `${event.timestamp}-${index}`, style: styles.timelineItem },
                    react_1.default.createElement("span", { style: styles.timelineIcon }, getStatusDisplay(event).icon),
                    react_1.default.createElement("span", { style: styles.timelineType }, event.type),
                    react_1.default.createElement("span", { style: styles.timelineSeparator }, "-"),
                    react_1.default.createElement("span", { style: styles.timelineTarget }, getFileName(event.target)),
                    event.timestamp && (react_1.default.createElement("span", { style: styles.timelineTime }, new Date(event.timestamp).toLocaleTimeString()))))))),
            react_1.default.createElement("div", { style: styles.actions },
                react_1.default.createElement("button", { style: {
                        ...styles.button,
                        ...styles.buttonSubmit,
                    }, onClick: () => handleAction('submit'), disabled: currentEvent.workflowState === 'PENDING_REVIEW' || currentEvent.workflowState === 'DESIGNED' }, "Submit for Review"),
                react_1.default.createElement("button", { style: {
                        ...styles.button,
                        ...styles.buttonVeto,
                    }, onClick: () => handleAction('veto') }, "Veto"),
                react_1.default.createElement("button", { style: {
                        ...styles.button,
                        ...styles.buttonResolve,
                    }, onClick: () => handleAction('resolve'), disabled: currentEvent.workflowState !== 'REJECTED' && currentEvent.workflowState !== 'FIXING' }, "Resolve"))))));
};
exports.WorkflowCard = WorkflowCard;
// 样式定义（梦幻紫色系）
const styles = {
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
//# sourceMappingURL=WorkflowCard.js.map