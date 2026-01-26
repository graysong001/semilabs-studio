"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Reasoning Deck Component (V7 S3)
 *
 * 投影 OODA THINKING 的关键节点，展示 Spec Id, Domain 和约束
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReasoningDeck = void 0;
const react_1 = __importDefault(require("react"));
const ReasoningDeck = ({ content }) => {
    // 提取 ### THINKING 块
    const thinkingMatch = content.match(/### THINKING([\s\S]*?)(?=###|$)/);
    if (!thinkingMatch)
        return null;
    const thinkingBody = thinkingMatch[1];
    // 提取关键元数据（基于 ReactExecutor 的输出格式）
    const specId = thinkingBody.match(/Spec Id: (cap-[a-z0-9-]+)/i)?.[1];
    const domain = thinkingBody.match(/Domain: ([a-z-]+)/i)?.[1];
    const stage = thinkingBody.match(/Stage: ([A-Z_]+)/i)?.[1] || 'REASONING';
    return (react_1.default.createElement("div", { className: "reasoning-deck" },
        react_1.default.createElement("div", { className: "reasoning-header" },
            react_1.default.createElement("span", { className: "reasoning-icon" }, "\uD83D\uDD2E"),
            react_1.default.createElement("span", { className: "reasoning-title" }, "THINKING PROJECTION"),
            react_1.default.createElement("div", { style: { flex: 1 } }),
            react_1.default.createElement("span", { className: "meta-chip" }, stage)),
        react_1.default.createElement("div", { className: "reasoning-body" }, thinkingBody.trim().split('\n')[0].replace(/^[*-]\s*/, '')),
        react_1.default.createElement("div", { className: "reasoning-meta" },
            specId && (react_1.default.createElement("div", { className: "meta-chip", onClick: () => openSpec(specId), style: { cursor: 'pointer' } },
                "SPEC: ",
                specId)),
            domain && (react_1.default.createElement("div", { className: "meta-chip" },
                "DOMAIN: ",
                domain)))));
};
exports.ReasoningDeck = ReasoningDeck;
const openSpec = (specId) => {
    const vscode = window.__vscodeApi;
    if (vscode) {
        vscode.postMessage({ type: 'openTask', filePath: specId });
    }
};
//# sourceMappingURL=ReasoningDeck.js.map