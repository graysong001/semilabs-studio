"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * CAPTURED Card Component (Poe v11.2 Flash Translation)
 *
 * 折叠式Status Footer,展示Flash Translation转译结果:
 * - 折叠状态: 显示摘要 (如"2 items translated, 1 needs confirmation")
 * - 展开状态: 显示详细CAPTURED列表
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
exports.CapturedCard = void 0;
const react_1 = __importStar(require("react"));
const CapturedCard = ({ items, onConfirm }) => {
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    if (!items || items.length === 0) {
        return null; // 无CAPTURED项时不显示
    }
    // 统计已转译、需确认和仅保留的数量
    const translatedCount = items.filter(item => item.status === 'translated').length;
    const needsConfirmCount = items.filter(item => item.status === 'need_confirm').length;
    const contextOnlyCount = items.filter(item => item.status === 'context_only').length;
    return (react_1.default.createElement("div", { className: "captured-card" },
        react_1.default.createElement("div", { className: "captured-card-header", onClick: () => setIsExpanded(!isExpanded), style: { cursor: 'pointer' } },
            react_1.default.createElement("div", { className: "captured-card-summary" },
                react_1.default.createElement("span", { className: "captured-icon" }, "\u26A1"),
                react_1.default.createElement("span", { className: "captured-title" }, "Flash Translation"),
                react_1.default.createElement("span", { className: "captured-stats" },
                    translatedCount > 0 && (react_1.default.createElement("span", { className: "stat-badge stat-success" },
                        "\u2705 ",
                        translatedCount,
                        " translated")),
                    needsConfirmCount > 0 && (react_1.default.createElement("span", { className: "stat-badge stat-warning" },
                        "\u26A0\uFE0F ",
                        needsConfirmCount,
                        " needs confirmation")),
                    contextOnlyCount > 0 && (react_1.default.createElement("span", { className: "stat-badge stat-info" },
                        "\uD83D\uDCAD ",
                        contextOnlyCount,
                        " context only")))),
            react_1.default.createElement("span", { className: "expand-icon" }, isExpanded ? '▼' : '▶')),
        isExpanded && (react_1.default.createElement("div", { className: "captured-card-body" }, items.map((item, index) => (react_1.default.createElement("div", { key: index, className: `captured-item ${item.status === 'translated' ? 'item-success' :
                item.status === 'need_confirm' ? 'item-warning' : 'item-info'}` },
            react_1.default.createElement("div", { className: "item-left" },
                react_1.default.createElement("span", { className: "item-icon" }, item.status === 'translated' ? '✅' :
                    item.status === 'need_confirm' ? '⚠️' : '💭'),
                react_1.default.createElement("div", { className: "item-content" },
                    react_1.default.createElement("span", { className: "item-tech" }, item.tech),
                    item.intent && (react_1.default.createElement("span", { className: "item-intent" },
                        " \u2192 ",
                        item.intent)),
                    react_1.default.createElement("span", { className: "item-confidence" },
                        " (c:",
                        item.confidence.toFixed(2),
                        ")"))),
            react_1.default.createElement("div", { className: "item-right" }, item.status === 'translated' ? (react_1.default.createElement("span", { className: "item-action-label" }, "NFR\u5199\u5165")) : item.status === 'need_confirm' ? (react_1.default.createElement("button", { className: "item-confirm-btn", onClick: (e) => {
                    e.stopPropagation();
                    onConfirm?.(item);
                } }, "Confirm")) : (react_1.default.createElement("span", { className: "item-action-label context-only" }, "\u4EC5\u4FDD\u7559"))))))))));
};
exports.CapturedCard = CapturedCard;
//# sourceMappingURL=CapturedCard.js.map