"use strict";
/**
 * @SpecTrace cap-ui-intent-interaction
 *
 * Intent Proposal Card - Chat Stream 需求结晶提示
 *
 * 功能：
 * - 订阅 PROPOSAL_READY 事件
 * - 显示 "🚀 Ready to Crystallize?" 提示
 * - 显示目标文件："Target: cap-login.md"
 * - "Generate Spec" 按钮：调用 /api/draft/commit
 * - 成功后关闭卡片
 *
 * 技术要点：
 * - 卡片插入位置：Chat 消息末尾
 * - API 调用：SemilabsProtocol.commitDraft()
 * - 成功反馈：Toast 提示 + 卡片淡出
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
exports.IntentProposalCard = void 0;
const react_1 = __importStar(require("react"));
const IntentProposalCard = ({ summary, targetFile, confidence = 0, onGenerate, onCancel, }) => {
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [isVisible, setIsVisible] = (0, react_1.useState)(true);
    // 提取文件名
    const getFileName = (filePath) => {
        return filePath.split(/[/\\]/).pop() || filePath;
    };
    // 处理 Generate Spec 操作
    const handleGenerate = async () => {
        setIsProcessing(true);
        try {
            // 调用父组件传入的 onGenerate 回调
            await onGenerate(targetFile);
            // 成功：淡出卡片
            setTimeout(() => {
                setIsVisible(false);
            }, 500);
        }
        catch (error) {
            console.error('[IntentProposalCard] Generate failed:', error);
            alert(`Failed to generate Spec: ${error.message || 'Unknown error'}`);
        }
        finally {
            setIsProcessing(false);
        }
    };
    // 处理取消操作
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        setIsVisible(false);
    };
    // 如果不可见，不渲染
    if (!isVisible) {
        return null;
    }
    return (react_1.default.createElement("div", { style: {
            ...styles.container,
            animation: isVisible ? 'fadeIn 0.3s ease-in-out' : 'fadeOut 0.3s ease-in-out',
        } },
        react_1.default.createElement("div", { style: styles.header },
            react_1.default.createElement("span", { style: styles.icon }, "\uD83D\uDE80"),
            react_1.default.createElement("span", { style: styles.title }, "Ready to Crystallize?"),
            confidence > 0 && (react_1.default.createElement("span", { style: styles.confidence },
                "Confidence: ",
                Math.round(confidence * 100),
                "%"))),
        react_1.default.createElement("div", { style: styles.body },
            summary && (react_1.default.createElement("div", { style: styles.summary }, summary)),
            react_1.default.createElement("div", { style: styles.targetRow },
                react_1.default.createElement("span", { style: styles.targetLabel }, "Target:"),
                react_1.default.createElement("code", { style: styles.targetFile }, getFileName(targetFile)))),
        react_1.default.createElement("div", { style: styles.footer },
            react_1.default.createElement("button", { style: {
                    ...styles.button,
                    ...styles.cancelBtn,
                }, onClick: handleCancel, disabled: isProcessing }, "Cancel"),
            react_1.default.createElement("button", { style: {
                    ...styles.button,
                    ...styles.generateBtn,
                    opacity: isProcessing ? 0.6 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                }, onClick: handleGenerate, disabled: isProcessing }, isProcessing ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("span", { style: styles.spinner }, "\u23F3"),
                " Generating...")) : (react_1.default.createElement(react_1.default.Fragment, null, "\u2705 Generate Spec"))))));
};
exports.IntentProposalCard = IntentProposalCard;
// 样式定义（梦幻紫色系）
const styles = {
    container: {
        backgroundColor: '#252526',
        border: '2px solid #A569BD', // 梦幻紫色边框
        borderRadius: '8px',
        padding: '16px',
        marginTop: '12px',
        marginBottom: '12px',
        fontFamily: 'var(--vscode-font-family)',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(165, 105, 189, 0.2)', // 紫色阴影
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
    },
    icon: {
        fontSize: '24px',
        marginRight: '10px',
    },
    title: {
        fontWeight: 'bold',
        color: '#CCCCCC',
        fontSize: '16px',
        flex: 1,
    },
    confidence: {
        color: '#888',
        fontSize: '12px',
        fontStyle: 'italic',
    },
    body: {
        marginBottom: '16px',
    },
    summary: {
        color: '#CCCCCC',
        fontSize: '13px',
        lineHeight: '1.5',
        marginBottom: '12px',
        paddingLeft: '8px',
        borderLeft: '3px solid #A569BD',
    },
    targetRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    targetLabel: {
        color: '#888',
        fontSize: '13px',
        fontWeight: '500',
    },
    targetFile: {
        backgroundColor: '#1E1E1E',
        color: '#A569BD',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'monospace',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    button: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'opacity 0.2s, background-color 0.2s',
    },
    cancelBtn: {
        backgroundColor: '#3E3E42',
        color: '#CCCCCC',
    },
    generateBtn: {
        backgroundColor: '#A569BD', // 梦幻紫色
        color: '#FFFFFF',
    },
    spinner: {
        display: 'inline-block',
        animation: 'spin 1s linear infinite',
    },
};
//# sourceMappingURL=IntentProposalCard.js.map