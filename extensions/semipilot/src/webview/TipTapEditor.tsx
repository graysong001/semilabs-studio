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

export const TipTapEditor = React.forwardRef<TipTapEditorRef, TipTapEditorProps>(({
  onSend,
  onContextProvider,
  onContentChange,
  placeholder = 'Ask Semipilot or type / for commands...'
}, ref) => {
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const tippyInstanceRef = useRef<TippyInstance | null>(null);

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
    },
  });

  // 处理 Enter 发送
  const handleSend = useCallback(() => {
    if (!editor) return;
    
    const content = editor.getText();
    if (content.trim()) {
      onSend(content, contextItems);
      editor.commands.clearContent();
      setContextItems([]);
    }
  }, [editor, contextItems, onSend]);

  // 监听 Enter 键
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
  React.useImperativeHandle(ref, () => ({
    send: handleSend,
    hasContent: () => !!editor && editor.getText().trim().length > 0
  }));

  return (
    <div className="tiptap-editor-wrapper">
      <EditorContent editor={editor} className="tiptap-editor-content" />
    </div>
  );
});
