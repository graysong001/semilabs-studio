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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';

interface ContextItem {
  id: string;
  label: string;
  type: 'spec' | 'file' | 'folder' | 'code';
  description?: string;
}

interface TipTapEditorProps {
  onSend: (content: string, contextItems: ContextItem[]) => void;
  onContextProvider: (type: string, query: string) => Promise<ContextItem[]>;
  onSlashCommand?: () => { name: string; description: string }[]; // 新增：获取Slash命令列表
  onContentChange?: (hasContent: boolean) => void; // 新增：内容变化回调
  placeholder?: string;
}

export interface TipTapEditorRef {
  send: () => void;
  hasContent: () => boolean;
}

// Mention 下拉菜单组件
const MentionList = React.forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
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

  useEffect(() => setSelectedIndex(0), [props.items]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
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

  return (
    <div className="mention-dropdown">
      {props.items.length ? (
        props.items.map((item: ContextItem, index: number) => (
          <button
            className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
            key={item.id}
            onClick={() => selectItem(index)}
          >
            <div className="mention-item-content">
              <span className="mention-item-icon">
                {item.type === 'spec' ? '📄' : 
                 item.type === 'file' ? '📁' : 
                 item.type === 'folder' ? '📂' : '💬'}
              </span>
              <div className="mention-item-text">
                <div className="mention-item-label">{item.label}</div>
                {item.description && (
                  <div className="mention-item-desc">{item.description}</div>
                )}
              </div>
            </div>
          </button>
        ))
      ) : (
        <div className="mention-empty">No results</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

// Slash命令下拉菜单组件
const SlashCommandList = React.forwardRef<any, {
  commands: { name: string; description: string }[];
  onSelect: (commandName: string) => void;
}>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
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

  useEffect(() => setSelectedIndex(0), [props.commands]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
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

  return (
    <div style={{
      backgroundColor: 'var(--vscode-editorWidget-background)',
      border: '1px solid var(--vscode-editorWidget-border)',
      borderRadius: '4px',
      padding: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: '250px',
      maxWidth: '400px',
      maxHeight: '200px',
      overflowY: 'auto'
    }}>
      {props.commands.map((cmd, index) => (
        <div
          key={cmd.name}
          style={{
            padding: '6px 10px',
            cursor: 'pointer',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backgroundColor: index === selectedIndex ? 'var(--vscode-list-hoverBackground)' : 'transparent'
          }}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => selectItem(index)}
        >
          <span style={{ 
            color: 'var(--vscode-symbolIcon-methodForeground)',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>/{cmd.name}</span>
          <span style={{ 
            color: 'var(--vscode-descriptionForeground)', 
            fontSize: '11px',
            marginLeft: '2px'
          }}>{cmd.description}</span>
        </div>
      ))}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';

export const TipTapEditor = React.forwardRef<TipTapEditorRef, TipTapEditorProps>(({
  onSend,
  onContextProvider,
  onSlashCommand,
  onContentChange,
  placeholder = 'Ask Semipilot or type / for commands...'
}, ref) => {
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const tippyInstanceRef = useRef<TippyInstance | null>(null);
  const slashMenuRef = useRef<any>(null); // Slash菜单的ref
  const slashTippyRef = useRef<TippyInstance | null>(null); // 修改为单个Instance

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
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
            let component: ReactRenderer;
            let popup: TippyInstance[];

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
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

              onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }

                return (component.ref as any)?.onKeyDown?.(props) || false;
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
      const mentions: ContextItem[] = [];
      
      const extractMentions = (node: any) => {
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
      
      // 检测是否输入了 /
      const text = editor.getText();
      console.log('[TipTapEditor] onUpdate, text:', JSON.stringify(text), 'onSlashCommand:', !!onSlashCommand);
      
      // 检查是否输入了斜杠命令
      const trimmedText = text.trim();
      if (trimmedText.startsWith('/') && onSlashCommand) {
        const commandPrefix = trimmedText.slice(1); // 移除开头的 /
        
        // 如果只输入了 / 或者输入了命令前缀，显示菜单
        if (commandPrefix.length === 0 || commandPrefix.length > 0) {
          console.log('[TipTapEditor] Showing slash menu for prefix:', commandPrefix);
          setShowSlashMenu(true);
          
          // 过滤命令列表
          const allCommands = onSlashCommand();
          const filteredCommands = commandPrefix.length === 0 
            ? allCommands 
            : allCommands.filter(cmd => cmd.name.toLowerCase().startsWith(commandPrefix.toLowerCase()));
          
          console.log('[TipTapEditor] Filtered commands:', filteredCommands.length, 'of', allCommands.length);
          
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
            const handleSelect = (commandName: string) => {
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
              const element = React.createElement(SlashCommandList, {
                commands: filteredCommands,
                onSelect: handleSelect,
                ref: slashMenuRef
              });
              
              // 使用临时root渲染（避免React 18警告）
              const root = document.createElement('div');
              ReactDOM.render(element, root);
              menuContainer.appendChild(root.firstChild!);
            };
            
            renderMenu();
            
            // 创建tippy实例
            const getCursorCoords = (): DOMRect => {
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
              } as DOMRect;
            };
            
            slashTippyRef.current = tippy(document.body, {
              getReferenceClientRect: getCursorCoords,
              appendTo: () => document.body,
              content: menuContainer,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              maxWidth: 'none'
            });
          } else if (slashTippyRef.current) {
            // 更新已存在的菜单
            const menuContainer = document.createElement('div');
            
            const handleSelect = (commandName: string) => {
              editor.commands.clearContent();
              editor.commands.insertContent(`/${commandName}`);
              setShowSlashMenu(false);
              if (slashTippyRef.current) {
                slashTippyRef.current.destroy();
                slashTippyRef.current = null;
              }
            };
            
            const renderMenu = () => {
              const element = React.createElement(SlashCommandList, {
                commands: filteredCommands,
                onSelect: handleSelect,
                ref: slashMenuRef
              });
              const root = document.createElement('div');
              ReactDOM.render(element, root);
              menuContainer.appendChild(root.firstChild!);
            };
            
            renderMenu();
            slashTippyRef.current.setContent(menuContainer);
          }
        }
      } else {
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
  const handleSend = useCallback(() => {
    if (!editor) return;
    
    const content = editor.getText().trim(); // trim()移除换行符
    if (content) {
      onSend(content, contextItems);
      editor.commands.clearContent();
      setContextItems([]);
      setShowSlashMenu(false); // 关闭slash菜单
    }
  }, [editor, contextItems, onSend]);

  // 监听键盘事件
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('[TipTapEditor] KeyDown:', {
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        isComposing: (event as any).isComposing // IME输入法状态
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
        if ((event as any).isComposing) {
          console.log('[TipTapEditor] IME composing, ignoring Mod+Enter');
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        console.log('[TipTapEditor] Mod+Enter pressed, sending...');
        handleSend();
        return;
      }
      
      // Enter 发送（仅当下拉菜单未打开时）
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        // 🐛 修复问题1：中文输入法选字时不发送
        if ((event as any).isComposing) {
          console.log('[TipTapEditor] IME composing, ignoring Enter');
          return;
        }
        
        // 如果下拉菜单打开，不发送
        if (tippyInstanceRef.current?.state.isVisible) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        console.log('[TipTapEditor] Enter pressed, sending...');
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
  React.useImperativeHandle(ref, () => ({
    send: handleSend,
    hasContent: () => !!editor && editor.getText().trim().length > 0
  }));

  return (
    <div className="tiptap-editor-wrapper" style={{ position: 'relative' }}>
      <EditorContent editor={editor} className="tiptap-editor-content" />
    </div>
  );
});
