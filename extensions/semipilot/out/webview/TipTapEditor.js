"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * TipTap Editor Component for Semipilot Chat Panel
 *
 * 基于 Continue 的 TipTap Editor 简化版本
 * 核心功能：
 * - @ 提及功能（@spec, @file, @folder, @code）
 * - 自动完成下拉菜单
 * - Enter 发送消息
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipTapEditor = void 0;
const react_1 = __importStar(require("react"));
const react_2 = require("@tiptap/react");
const starter_kit_1 = __importDefault(require("@tiptap/starter-kit"));
const extension_placeholder_1 = __importDefault(require("@tiptap/extension-placeholder"));
const extension_mention_1 = __importDefault(require("@tiptap/extension-mention"));
const react_3 = require("@tiptap/react");
const tippy_js_1 = __importDefault(require("tippy.js"));
// Mention 下拉菜单组件
const MentionList = react_1.default.forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(0);
    const selectItem = (index) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.label });
        }
    };
    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };
    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };
    const enterHandler = () => {
        selectItem(selectedIndex);
    };
    (0, react_1.useEffect)(() => setSelectedIndex(0), [props.items]);
    react_1.default.useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));
    return (react_1.default.createElement("div", { className: "mention-dropdown" }, props.items.length ? (props.items.map((item, index) => (react_1.default.createElement("button", { className: `mention-item ${index === selectedIndex ? 'selected' : ''}`, key: item.id, onClick: () => selectItem(index) },
        react_1.default.createElement("div", { className: "mention-item-content" },
            react_1.default.createElement("span", { className: "mention-item-icon" }, item.type === 'spec' ? '📄' :
                item.type === 'file' ? '📁' :
                    item.type === 'folder' ? '📂' : '💬'),
            react_1.default.createElement("div", { className: "mention-item-text" },
                react_1.default.createElement("div", { className: "mention-item-label" }, item.label),
                item.description && (react_1.default.createElement("div", { className: "mention-item-desc" }, item.description)))))))) : (react_1.default.createElement("div", { className: "mention-empty" }, "No results"))));
});
MentionList.displayName = 'MentionList';
exports.TipTapEditor = react_1.default.forwardRef(({ onSend, onContextProvider, onContentChange, placeholder = 'Ask Semipilot or type / for commands...' }, ref) => {
    const [contextItems, setContextItems] = (0, react_1.useState)([]);
    const tippyInstanceRef = (0, react_1.useRef)(null);
    const editor = (0, react_2.useEditor)({
        extensions: [
            starter_kit_1.default,
            extension_placeholder_1.default.configure({
                placeholder,
            }),
            extension_mention_1.default.configure({
                HTMLAttributes: {
                    class: 'mention-badge',
                },
                suggestion: {
                    items: async ({ query }) => {
                        // 检测 @ 后面的字符，判断类型
                        const type = query.startsWith('spec') ? 'spec' :
                            query.startsWith('file') ? 'file' :
                                query.startsWith('folder') ? 'folder' :
                                    query.startsWith('code') ? 'code' : 'spec';
                        // 调用 Context Provider
                        const results = await onContextProvider(type, query);
                        return results;
                    },
                    render: () => {
                        let component;
                        let popup;
                        return {
                            onStart: (props) => {
                                component = new react_3.ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });
                                if (!props.clientRect) {
                                    return;
                                }
                                popup = (0, tippy_js_1.default)('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                                tippyInstanceRef.current = popup[0];
                            },
                            onUpdate(props) {
                                component.updateProps(props);
                                if (!props.clientRect) {
                                    return;
                                }
                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown(props) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown?.(props) || false;
                            },
                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                                tippyInstanceRef.current = null;
                            },
                        };
                    },
                },
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
            },
        },
        onUpdate: ({ editor }) => {
            // 提取所有 @ 提及的项目
            const json = editor.getJSON();
            const mentions = [];
            const extractMentions = (node) => {
                if (node.type === 'mention') {
                    mentions.push({
                        id: node.attrs.id,
                        label: node.attrs.label,
                        type: 'spec', // 从 attrs 中获取实际类型
                    });
                }
                if (node.content) {
                    node.content.forEach(extractMentions);
                }
            };
            if (json.content) {
                json.content.forEach(extractMentions);
            }
            setContextItems(mentions);
            // 通知父组件内容变化
            const hasContent = editor.getText().trim().length > 0;
            onContentChange?.(hasContent);
        },
    });
    // 处理 Enter 发送
    const handleSend = (0, react_1.useCallback)(() => {
        if (!editor)
            return;
        const content = editor.getText();
        if (content.trim()) {
            onSend(content, contextItems);
            editor.commands.clearContent();
            setContextItems([]);
        }
    }, [editor, contextItems, onSend]);
    // 监听 Enter 键
    (0, react_1.useEffect)(() => {
        if (!editor)
            return;
        const handleKeyDown = (event) => {
            // Enter 发送，Shift+Enter 换行
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                // 如果下拉菜单打开，不发送
                if (tippyInstanceRef.current?.state.isVisible) {
                    return;
                }
                handleSend();
            }
        };
        editor.view.dom.addEventListener('keydown', handleKeyDown);
        return () => {
            editor.view.dom.removeEventListener('keydown', handleKeyDown);
        };
    }, [editor, handleSend]);
    // 暴露方法给父组件
    react_1.default.useImperativeHandle(ref, () => ({
        send: handleSend,
        hasContent: () => !!editor && editor.getText().trim().length > 0
    }));
    return (react_1.default.createElement("div", { className: "tiptap-editor-wrapper" },
        react_1.default.createElement(react_2.EditorContent, { editor: editor, className: "tiptap-editor-content" })));
});
//# sourceMappingURL=TipTapEditor.js.map