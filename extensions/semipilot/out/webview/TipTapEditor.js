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
const react_dom_1 = __importDefault(require("react-dom"));
const react_2 = require("@tiptap/react");
const starter_kit_1 = __importDefault(require("@tiptap/starter-kit"));
const extension_placeholder_1 = __importDefault(require("@tiptap/extension-placeholder"));
const extension_mention_1 = __importDefault(require("@tiptap/extension-mention"));
const react_3 = require("@tiptap/react");
const tippy_js_1 = __importDefault(require("tippy.js"));
// Mention 下拉菜单组件
const MentionList = react_1.default.forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(0);
    const itemRefs = (0, react_1.useRef)([]);
    const selectItem = (index) => {
        const item = props.items[index];
        if (item) {
            // 传递 type 属性，用于 mention 节点
            props.command({ id: item.id, label: item.label, type: item.type });
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
    // 自动滚动到选中项
    (0, react_1.useEffect)(() => {
        const selectedElement = itemRefs.current[selectedIndex];
        if (selectedElement) {
            selectedElement.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);
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
    return (react_1.default.createElement("div", { className: "mention-dropdown" }, props.items.length ? (props.items.map((item, index) => (react_1.default.createElement("button", { ref: (el) => (itemRefs.current[index] = el), className: `mention-item ${index === selectedIndex ? 'selected' : ''}`, key: item.id, onClick: () => selectItem(index) },
        react_1.default.createElement("div", { className: "mention-item-content" },
            react_1.default.createElement("span", { className: "mention-item-icon" }, item.type === 'spec' ? '📄' :
                item.type === 'file' ? '📁' :
                    item.type === 'folder' ? '📂' : '💬'),
            react_1.default.createElement("div", { className: "mention-item-text" },
                react_1.default.createElement("div", { className: "mention-item-label" }, item.label),
                item.description && (react_1.default.createElement("div", { className: "mention-item-desc" }, item.description)))))))) : (react_1.default.createElement("div", { className: "mention-empty" }, "No results"))));
});
MentionList.displayName = 'MentionList';
// Slash命令下拉菜单组件
const SlashCommandList = react_1.default.forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(0);
    const selectItem = (index) => {
        const cmd = props.commands[index];
        if (cmd) {
            props.onSelect(cmd.name);
        }
    };
    const upHandler = () => {
        setSelectedIndex((prev) => (prev + props.commands.length - 1) % props.commands.length);
    };
    const downHandler = () => {
        setSelectedIndex((prev) => (prev + 1) % props.commands.length);
    };
    const enterHandler = () => {
        selectItem(selectedIndex);
    };
    (0, react_1.useEffect)(() => setSelectedIndex(0), [props.commands]);
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
    return (react_1.default.createElement("div", { style: {
            backgroundColor: 'var(--vscode-editorWidget-background)',
            border: '1px solid var(--vscode-editorWidget-border)',
            borderRadius: '4px',
            padding: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: '250px',
            maxWidth: '400px',
            maxHeight: '200px',
            overflowY: 'auto'
        } }, props.commands.map((cmd, index) => (react_1.default.createElement("div", { key: cmd.name, style: {
            padding: '6px 10px',
            cursor: 'pointer',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backgroundColor: index === selectedIndex ? 'var(--vscode-list-hoverBackground)' : 'transparent'
        }, onMouseEnter: () => setSelectedIndex(index), onClick: () => selectItem(index) },
        react_1.default.createElement("span", { style: {
                color: 'var(--vscode-symbolIcon-methodForeground)',
                fontWeight: 'bold',
                fontSize: '13px'
            } },
            "/",
            cmd.name),
        react_1.default.createElement("span", { style: {
                color: 'var(--vscode-descriptionForeground)',
                fontSize: '11px',
                marginLeft: '2px'
            } }, cmd.description))))));
});
SlashCommandList.displayName = 'SlashCommandList';
exports.TipTapEditor = react_1.default.forwardRef(({ onSend, onContextProvider, onSlashCommand, onContentChange, placeholder = 'Ask Semipilot or type / for commands...' }, ref) => {
    const [contextItems, setContextItems] = (0, react_1.useState)([]);
    const [showSlashMenu, setShowSlashMenu] = (0, react_1.useState)(false);
    const tippyInstanceRef = (0, react_1.useRef)(null);
    const slashMenuRef = (0, react_1.useRef)(null); // Slash菜单的ref
    const slashTippyRef = (0, react_1.useRef)(null); // 修改为单个Instance
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
                renderLabel({ node }) {
                    // 自定义显示：显示完整文件名（包含扩展名）
                    return `@${node.attrs.label}`;
                },
                suggestion: {
                    items: async ({ query }) => {
                        // 检测 @ 后面的字符，判断类型（支持通用 @ 搜索）
                        const providerId = query.startsWith('spec') ? 'spec' :
                            query.startsWith('file') ? 'file' :
                                query.startsWith('folder') ? 'folder' :
                                    query.startsWith('code') ? 'code' : 'all';
                        // 根据前缀裁剪查询词（保留原始 query 作为兜底）
                        const trimmedQuery = providerId === 'all'
                            ? query
                            : query.replace(/^(spec|file|folder|code)/, '').trim() || query;
                        // 调用 Context Provider
                        const results = await onContextProvider(providerId, trimmedQuery);
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
                        type: node.attrs.type || 'spec', // 从 attrs 中获取实际类型
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
            // 检测是否输入了 /
            const text = editor.getText();
            // 检查是否输入了斜杠命令
            const trimmedText = text.trim();
            if (trimmedText.startsWith('/') && onSlashCommand) {
                const commandPrefix = trimmedText.slice(1); // 移除开头的 /
                // 如果只输入了 / 或者输入了命令前缀，显示菜单
                if (commandPrefix.length === 0 || commandPrefix.length > 0) {
                    setShowSlashMenu(true);
                    // 过滤命令列表
                    const allCommands = onSlashCommand();
                    const filteredCommands = commandPrefix.length === 0
                        ? allCommands
                        : allCommands.filter(cmd => cmd.name.toLowerCase().startsWith(commandPrefix.toLowerCase()));
                    // 如果没有匹配的命令，隐藏菜单
                    if (filteredCommands.length === 0) {
                        if (slashTippyRef.current) {
                            slashTippyRef.current.destroy();
                            slashTippyRef.current = null;
                        }
                        setShowSlashMenu(false);
                        return;
                    }
                    // 使用tippy显示菜单
                    if (!slashTippyRef.current && editor.view.dom) {
                        const menuContainer = document.createElement('div');
                        // 渲染SlashCommandList组件
                        const handleSelect = (commandName) => {
                            editor.commands.clearContent();
                            editor.commands.insertContent(`/${commandName}`);
                            setShowSlashMenu(false);
                            // 销毁tippy
                            if (slashTippyRef.current) {
                                slashTippyRef.current.destroy();
                                slashTippyRef.current = null;
                            }
                        };
                        // 使用React.createElement和临时容器渲染
                        const renderMenu = () => {
                            const element = react_1.default.createElement(SlashCommandList, {
                                commands: filteredCommands,
                                onSelect: handleSelect,
                                ref: slashMenuRef
                            });
                            // 使用临时root渲染（避免React 18警告）
                            const root = document.createElement('div');
                            react_dom_1.default.render(element, root);
                            menuContainer.appendChild(root.firstChild);
                        };
                        renderMenu();
                        // 创建tippy实例
                        const getCursorCoords = () => {
                            const { from } = editor.state.selection;
                            const coords = editor.view.coordsAtPos(from);
                            return {
                                top: coords.top,
                                left: coords.left,
                                bottom: coords.bottom,
                                right: coords.right,
                                width: 0,
                                height: coords.bottom - coords.top,
                                x: coords.left,
                                y: coords.top,
                                toJSON: () => ({})
                            };
                        };
                        slashTippyRef.current = (0, tippy_js_1.default)(document.body, {
                            getReferenceClientRect: getCursorCoords,
                            appendTo: () => document.body,
                            content: menuContainer,
                            showOnCreate: true,
                            interactive: true,
                            trigger: 'manual',
                            placement: 'bottom-start',
                            maxWidth: 'none'
                        });
                    }
                    else if (slashTippyRef.current) {
                        // 更新已存在的菜单
                        const menuContainer = document.createElement('div');
                        const handleSelect = (commandName) => {
                            editor.commands.clearContent();
                            editor.commands.insertContent(`/${commandName}`);
                            setShowSlashMenu(false);
                            if (slashTippyRef.current) {
                                slashTippyRef.current.destroy();
                                slashTippyRef.current = null;
                            }
                        };
                        const renderMenu = () => {
                            const element = react_1.default.createElement(SlashCommandList, {
                                commands: filteredCommands,
                                onSelect: handleSelect,
                                ref: slashMenuRef
                            });
                            const root = document.createElement('div');
                            react_dom_1.default.render(element, root);
                            menuContainer.appendChild(root.firstChild);
                        };
                        renderMenu();
                        slashTippyRef.current.setContent(menuContainer);
                    }
                }
            }
            else {
                // 如果不是斜杠命令，隐藏菜单
                setShowSlashMenu(false);
                // 销毁tippy
                if (slashTippyRef.current) {
                    slashTippyRef.current.destroy();
                    slashTippyRef.current = null;
                }
            }
        },
    });
    // 处理 Enter 发送
    const handleSend = (0, react_1.useCallback)(() => {
        if (!editor)
            return;
        const content = editor.getText().trim(); // trim()移除换行符
        if (content) {
            onSend(content, contextItems);
            editor.commands.clearContent();
            setContextItems([]);
            setShowSlashMenu(false); // 关闭slash菜单
        }
    }, [editor, contextItems, onSend]);
    // 监听键盘事件
    (0, react_1.useEffect)(() => {
        if (!editor)
            return;
        const handleKeyDown = (event) => {
            console.log('[TipTapEditor] KeyDown:', {
                key: event.key,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                isComposing: event.isComposing // IME输入法状态
            });
            // 如果Slash菜单打开，处理菜单导航
            if (showSlashMenu && slashMenuRef.current) {
                const handled = slashMenuRef.current.onKeyDown?.({ event });
                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
            // Command+Enter（macOS）或 Ctrl+Enter（Windows/Linux）发送
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                // 🐛 修复问题1：中文输入法选字时不发送
                if (event.isComposing) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                handleSend();
                return;
            }
            // Enter 发送（仅当下拉菜单未打开时）
            if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
                // 🐛 修复问题1：中文输入法选字时不发送
                if (event.isComposing) {
                    return;
                }
                // 如果下拉菜单打开，不发送
                if (tippyInstanceRef.current?.state.isVisible) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                handleSend();
            }
        };
        // 注意：使用capture阶段捕获，优先级高于TipTap内部处理
        editor.view.dom.addEventListener('keydown', handleKeyDown, true);
        return () => {
            editor.view.dom.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [editor, handleSend, showSlashMenu]);
    // 暴露方法给父组件
    react_1.default.useImperativeHandle(ref, () => ({
        send: handleSend,
        hasContent: () => !!editor && editor.getText().trim().length > 0
    }));
    return (react_1.default.createElement("div", { className: "tiptap-editor-wrapper", style: { position: 'relative' } },
        react_1.default.createElement(react_2.EditorContent, { editor: editor, className: "tiptap-editor-content" })));
});
//# sourceMappingURL=TipTapEditor.js.map