"use strict";
/**
 * @SpecTrace cap-ui-intent-interaction
 *
 * Tribunal Card - Chat Stream Veto 裁决面板
 *
 * 功能：
 * - 订阅 VETO_APPLIED / FIX_SUBMITTED 事件
 * - Split View 显示：
 *   * Left: "⚠️ Archi's Challenge: {reason}"
 *   * Right: "🔧 Poe's Fix: {fix_summary}"
 * - "View Diff" 按钮：vscode.diff(uri1, uri2)
 * - "Approve Fix" 按钮：调用 /api/workflow/resolve
 *
 * 技术要点：
 * - 解析 Veto block（blockquote 格式）
 * - Diff 预览：调用 /api/draft/preview
 * - 虚拟文档：scheme:semilabs
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
exports.TribunalCard = void 0;
const react_1 = __importStar(require("react"));
const TribunalCard = ({ vetoReason, vetoRequirement, fixSummary, targetFile, workflowState, onViewDiff, onApproveFix, }) => {
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [isVisible, setIsVisible] = (0, react_1.useState)(true);
    // 提取文件名
    const getFileName = (filePath) => {
        return filePath.split(/[/\\]/).pop() || filePath;
    };
    // 处理 View Diff 操作
    const handleViewDiff = () => {
        if (onViewDiff) {
            onViewDiff(targetFile);
        }
        else {
            // 默认：发送到 Extension Host
            const vscodeApi = window.__vscodeApi;
            if (vscodeApi) {
                vscodeApi.postMessage({
                    type: 'viewDiff',
                    filePath: targetFile,
                });
            }
        }
    };
    // 处理 Approve Fix 操作
    const handleApproveFix = async () => {
        setIsProcessing(true);
        try {
            await onApproveFix(targetFile);
            // 成功：淡出卡片
            setTimeout(() => {
                setIsVisible(false);
            }, 500);
        }
        catch (error) {
            console.error('[TribunalCard] Approve failed:', error);
            alert(`Failed to approve fix: ${error.message || 'Unknown error'}`);
        }
        finally {
            setIsProcessing(false);
        }
    };
    // 如果不可见，不渲染
    if (!isVisible) {
        return null;
    }
    return (react_1.default.createElement("div", { style: {
            ...styles.container,
            animation: isVisible ? 'fadeIn 0.3s ease-in-out' : 'fadeOut 0.3s ease-in-out',
        } },
        react_1.default.createElement("div", { style: styles.banner },
            react_1.default.createElement("span", { style: styles.bannerIcon }, "\u26A0\uFE0F"),
            react_1.default.createElement("span", { style: styles.bannerText }, "Architecture Conflict Detected"),
            react_1.default.createElement("span", { style: styles.bannerFile }, getFileName(targetFile))),
        react_1.default.createElement("div", { style: styles.splitView },
            react_1.default.createElement("div", { style: styles.leftPanel },
                react_1.default.createElement("div", { style: styles.panelHeader },
                    react_1.default.createElement("span", { style: styles.panelIcon }, "\uD83D\uDED1"),
                    react_1.default.createElement("span", { style: styles.panelTitle }, "Archi's Challenge")),
                react_1.default.createElement("div", { style: styles.panelContent },
                    react_1.default.createElement("div", { style: styles.vetoReason },
                        react_1.default.createElement("div", { style: styles.vetoLabel }, "Reason:"),
                        react_1.default.createElement("div", { style: styles.vetoText }, vetoReason)),
                    vetoRequirement && (react_1.default.createElement("div", { style: styles.vetoRequirement },
                        react_1.default.createElement("div", { style: styles.vetoLabel }, "Requirement:"),
                        react_1.default.createElement("div", { style: styles.vetoText }, vetoRequirement))))),
            react_1.default.createElement("div", { style: styles.rightPanel },
                react_1.default.createElement("div", { style: styles.panelHeader },
                    react_1.default.createElement("span", { style: styles.panelIcon }, "\uD83D\uDD27"),
                    react_1.default.createElement("span", { style: styles.panelTitle }, "Poe's Fix")),
                react_1.default.createElement("div", { style: styles.panelContent }, workflowState === 'FIXING' && fixSummary ? (react_1.default.createElement("div", { style: styles.fixSummary }, fixSummary)) : (react_1.default.createElement("div", { style: styles.fixPending },
                    react_1.default.createElement("span", { style: styles.pendingIcon }, "\u23F3"),
                    react_1.default.createElement("span", null, "Waiting for Poe to propose a fix...")))))),
        react_1.default.createElement("div", { style: styles.footer },
            react_1.default.createElement("button", { style: {
                    ...styles.button,
                    ...styles.viewDiffBtn,
                }, onClick: handleViewDiff, title: "View Diff" }, "\uD83D\uDD0D View Diff"),
            react_1.default.createElement("button", { style: {
                    ...styles.button,
                    ...styles.approveBtn,
                    opacity: workflowState === 'REJECTED' || isProcessing ? 0.6 : 1,
                    cursor: workflowState === 'REJECTED' || isProcessing ? 'not-allowed' : 'pointer',
                }, onClick: handleApproveFix, disabled: workflowState === 'REJECTED' || isProcessing, title: workflowState === 'REJECTED' ? 'Wait for Poe to fix first' : 'Approve Fix' }, isProcessing ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("span", { style: styles.spinner }, "\u23F3"),
                " Processing...")) : (react_1.default.createElement(react_1.default.Fragment, null, "\u2705 Approve Fix"))))));
};
exports.TribunalCard = TribunalCard;
// 样式定义（红色警告色系）
const styles = {
    container: {
        backgroundColor: '#252526',
        border: '2px solid #E74C3C', // 红色边框
        borderRadius: '8px',
        padding: '16px',
        marginTop: '12px',
        marginBottom: '12px',
        fontFamily: 'var(--vscode-font-family)',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(231, 76, 60, 0.2)', // 红色阴影
    },
    banner: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#3E2723',
        padding: '10px 12px',
        borderRadius: '6px',
        marginBottom: '16px',
        border: '1px solid #E74C3C',
    },
    bannerIcon: {
        fontSize: '20px',
        marginRight: '10px',
    },
    bannerText: {
        fontWeight: 'bold',
        color: '#E74C3C',
        fontSize: '15px',
        flex: 1,
    },
    bannerFile: {
        color: '#888',
        fontSize: '12px',
        fontStyle: 'italic',
    },
    splitView: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
    },
    leftPanel: {
        backgroundColor: '#1E1E1E',
        border: '1px solid #E74C3C',
        borderRadius: '6px',
        overflow: 'hidden',
    },
    rightPanel: {
        backgroundColor: '#1E1E1E',
        border: '1px solid #27AE60',
        borderRadius: '6px',
        overflow: 'hidden',
    },
    panelHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#2D2D30',
        borderBottom: '1px solid #3E3E42',
    },
    panelIcon: {
        fontSize: '16px',
        marginRight: '8px',
    },
    panelTitle: {
        fontWeight: 'bold',
        color: '#CCCCCC',
        fontSize: '13px',
    },
    panelContent: {
        padding: '12px',
    },
    vetoReason: {
        marginBottom: '12px',
    },
    vetoRequirement: {
        marginBottom: '0',
    },
    vetoLabel: {
        color: '#888',
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '4px',
    },
    vetoText: {
        color: '#CCCCCC',
        fontSize: '13px',
        lineHeight: '1.5',
        paddingLeft: '8px',
        borderLeft: '3px solid #E74C3C',
    },
    fixSummary: {
        color: '#CCCCCC',
        fontSize: '13px',
        lineHeight: '1.5',
        paddingLeft: '8px',
        borderLeft: '3px solid #27AE60',
    },
    fixPending: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#888',
        fontSize: '13px',
        fontStyle: 'italic',
    },
    pendingIcon: {
        fontSize: '16px',
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
    viewDiffBtn: {
        backgroundColor: '#3E3E42',
        color: '#CCCCCC',
    },
    approveBtn: {
        backgroundColor: '#27AE60', // 绿色
        color: '#FFFFFF',
    },
    spinner: {
        display: 'inline-block',
        animation: 'spin 1s linear infinite',
    },
};
//# sourceMappingURL=TribunalCard.js.map