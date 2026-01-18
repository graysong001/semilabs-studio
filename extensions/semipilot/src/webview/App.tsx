/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Semipilot Chat Panel Main App Component
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TipTapEditor, TipTapEditorRef } from './TipTapEditor';
import { SlashCommandHandler } from './SlashCommandHandler';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface ContextItem {
  id: string;
  label: string;
  type: 'spec' | 'file' | 'folder' | 'code';
  description?: string;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agent, setAgent] = useState('poe');
  const [model, setModel] = useState('qwen');
  const [hasContent, setHasContent] = useState(false); // 追踪输入框是否有内容
  const [isWaiting, setIsWaiting] = useState(false); // 等待AI回复
  const [isStopped, setIsStopped] = useState(false); // 🐛 用户是否点击了停止
  const vscodeRef = React.useRef<VsCodeApi | null>(null);
  const editorRef = React.useRef<TipTapEditorRef>(null); // TipTap Editor 引用
  const slashHandlerRef = useRef<SlashCommandHandler>(new SlashCommandHandler());
  
  // 保存 Context Provider 查询的 Promise resolvers
  const contextQueryResolversRef = React.useRef<Map<string, (results: ContextItem[]) => void>>(new Map());

  useEffect(() => {
    console.log('[App] 🔄 Render state: isWaiting =', isWaiting, ', messages.length =', messages.length);
  }, [isWaiting, messages]);

  useEffect(() => {
    // 从 window.__vscodeApi 获取已保存的 VS Code API 实例
    // ⚠️ 不要调用 acquireVsCodeApi()，它只能调用一次（在 index.tsx 中已调用）
    vscodeRef.current = (window as any).__vscodeApi || null;
    
    if (!vscodeRef.current) {
      console.error('[App] VS Code API not found on window.__vscodeApi');
    }
    
    // 注册 Slash Commands
    slashHandlerRef.current.register({
      name: 'tasks',
      description: '显示未完成任务列表',
      handler: async () => {
        // 发送到 Extension Host
        if (vscodeRef.current) {
          vscodeRef.current.postMessage({
            type: 'slashCommand',
            command: 'tasks'
          });
        }
      }
    });
    
    slashHandlerRef.current.register({
      name: 'help',
      description: '显示帮助信息',
      handler: async () => {
        const commands = slashHandlerRef.current.getCommands();
        const helpMessage = commands.map(cmd => 
          `/${cmd.name} - ${cmd.description}`
        ).join('\n');
        
        // 添加帮助消息到聊天区域
        const helpMsg: Message = {
          id: Date.now().toString(),
          content: `Available commands:\n${helpMessage}`,
          isUser: false,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, helpMsg]);
      }
    });
    
    // 监听来自 Extension Host 的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'assistantMessage':
          // 🐛 修复：如果用户已点击停止，忽略Backend返回的响应
          if (isStopped) {
            console.log('[App] User stopped generation, ignoring response');
            return;
          }
          
          // 处理Agent回复
          setIsWaiting(false); // 收到回复，停止加载动画
          if (message.message) {
            const assistantMsg: Message = {
              id: message.message.id || Date.now().toString(),
              content: message.message.content,
              isUser: false,
              timestamp: message.message.timestamp || Date.now()
            };
            setMessages(prev => [...prev, assistantMsg]);
          }
          break;
        case 'contextProviderResults':
          // 解析 Context Provider 查询结果
          const key = `${message.providerId}:${message.query}`;
          const resolver = contextQueryResolversRef.current.get(key);
          if (resolver) {
            resolver(message.results || []);
            contextQueryResolversRef.current.delete(key);
          }
          break;
        case 'slashCommandResult':
          // 处理 Slash Command 结果
          if (message.result) {
            const resultMsg: Message = {
              id: Date.now().toString(),
              content: message.result,
              isUser: false,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, resultMsg]);
            
            // 如果有任务数据，添加点击事件监听
            if (message.tasks && message.tasks.length > 0) {
              setTimeout(() => {
                document.querySelectorAll('a[data-task-path]').forEach(link => {
                  link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filePath = (e.target as HTMLElement).getAttribute('data-task-path');
                    if (filePath && vscodeRef.current) {
                      vscodeRef.current.postMessage({
                        type: 'openTask',
                        filePath
                      });
                    }
                  });
                });
              }, 100);  // 等待DOM渲染
            }
          }
          break;
      }
    };
    
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [isStopped]); // 🐛 添加isStopped依赖

  const handleSend = useCallback(async (content: string, contextItems: ContextItem[]) => {
    // 检测是否为 Slash Command
    const isCommand = await slashHandlerRef.current.execute(content);
    
    if (isCommand) {
      // 如果是命令，不添加到聊天记录
      setHasContent(false);
      return;
    }
    
    // 🐛 发送新消息时重置isStopped标记
    setIsStopped(false);
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsWaiting(true); // 开始等待AI回复

    // 发送到 Extension Host
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({
        type: 'userMessage',
        message: content,
        contextItems,
        agent,
        model
      });
    }
    
    // 发送后重置内容状态
    setHasContent(false);
  }, [agent, model]);

  const handleContextProvider = useCallback(async (type: string, query: string): Promise<ContextItem[]> => {
    if (!vscodeRef.current) {
      console.error('[App] VS Code API not available');
      return [];
    }
    
    // 创建 Promise 等待结果
    return new Promise((resolve) => {
      const key = `${type}:${query}`;
      contextQueryResolversRef.current.set(key, resolve);
      
      // 发送请求给 Extension Host
      vscodeRef.current!.postMessage({
        type: 'contextProvider',
        providerId: type,
        query
      });
      
      // 超时处理（5秒）
      setTimeout(() => {
        if (contextQueryResolversRef.current.has(key)) {
          console.warn(`[App] Context provider query timeout: ${key}`);
          resolve([]);
          contextQueryResolversRef.current.delete(key);
        }
      }, 5000);
    });
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setIsWaiting(false); // 清除加载状态
    setIsStopped(false); // 🐛 清除停止标记
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({ type: 'newChat' });
    }
  };

  const handleSettings = () => {
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({ type: 'openSettings' });
    }
  };

  const handleMore = () => {
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({ type: 'moreOptions' });
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // 🐛 修复问题2：停止AI生成
  const handleStop = useCallback(() => {
    setIsWaiting(false);
    setIsStopped(true); // 🐛 设置停止标记，拒绝后续响应
    
    // 发送停止请求到 Extension Host
    if (vscodeRef.current) {
      vscodeRef.current.postMessage({
        type: 'stopGeneration'
      });
    }
  }, []);

  return (
    <div className="app-container">
      {/* 顶部标题栏 */}
      <div className="header">
        <div className="header-left">
          {/* 机器人图标 (SVG 黑白) */}
          <svg className="header-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M8.5 1a.5.5 0 0 0-1 0v1h-1a.5.5 0 0 0 0 1h1v.5A2.5 2.5 0 0 0 5 6v1H3.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5H11V6a2.5 2.5 0 0 0-2.5-2.5V3h1a.5.5 0 0 0 0-1h-1V1zM6 6a1.5 1.5 0 0 1 3 0v1H6V6z"/>
            <circle cx="6" cy="9" r=".5"/>
            <circle cx="10" cy="9" r=".5"/>
          </svg>
          <span className="header-title">SEMIPILOT: CHAT</span>
        </div>
        <div className="header-actions">
          {/* New Chat */}
          <button className="header-btn" onClick={handleNewChat} title="New chat">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M7.5 1.5v5.793L9.146 5.646a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 7.293V1.5a.5.5 0 0 1 1 0z"/>
              <path d="M8 0a.5.5 0 0 1 .5.5v5.793l1.646-1.647a.5.5 0 0 1 .708.708l-2.5 2.5a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 1 1 .708-.708L7.5 6.293V.5A.5.5 0 0 1 8 0zm-7 8a.5.5 0 0 1 .5.5V13a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8.5a.5.5 0 0 1 1 0V13a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V8.5A.5.5 0 0 1 1 8z"/>
            </svg>
          </button>
          {/* Settings */}
          <button className="header-btn" onClick={handleSettings} title="Settings">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
          </button>
          {/* More */}
          <button className="header-btn" onClick={handleMore} title="More options">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <circle cx="8" cy="3" r="1.5"/>
              <circle cx="8" cy="8" r="1.5"/>
              <circle cx="8" cy="13" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬✨</div>
            <div className="empty-state-title">Build with Semipilot</div>
            <div className="empty-state-subtitle">Start a conversation with your AI coding assistant</div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className="message">
                <div className="message-content">{msg.content}</div>
                <div className="message-actions">
                  <button className="message-copy-btn" onClick={() => copyMessage(msg.content)} title="Copy message">
                    📋
                  </button>
                </div>
              </div>
            ))}
            {/* 加载动画（GitHub Copilot风格） */}
            {isWaiting && (
              <div className="message loading-message">
                <div className="loading-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部输入区域 - 参考 Continue 样式 */}
      <div className="input-container">
        <div className="input-wrapper">
          {/* 顶部：Add Context 按钮 */}
          <div className="input-header">
            <button className="add-context-btn" title="Add Context">
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
                <path d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022z"/>
              </svg>
              <span>Add Context...</span>
            </button>
          </div>
          
          {/* 中间：TipTap Editor（移除 @ 符号） */}
          <div className="input-main">
            <TipTapEditor
              ref={editorRef}
              onSend={handleSend}
              onContextProvider={handleContextProvider}
              onSlashCommand={() => slashHandlerRef.current.getCommands()}
              onContentChange={(hasContent) => setHasContent(hasContent)}
              placeholder="Ask Semipilot or type / for commands..."
            />
          </div>
          
          {/* 底部工具栏 */}
          <div className="input-toolbar">
            <div className="toolbar-left">
              <select className="toolbar-select" value={agent} onChange={(e) => setAgent(e.target.value)} title="Select agent">
                <option value="poe">Agent</option>
                <option value="archi">Agent: Archi</option>
                <option value="cody">Agent: Cody</option>
              </select>
              <select className="toolbar-select" value={model} onChange={(e) => setModel(e.target.value)} title="Select model">
                <option value="qwen">Raptor mini (Preview)</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            <div className="toolbar-right">
              {/* 工具按钮 */}
              <button className="toolbar-icon-btn" title="Attach file">
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="M11.5 1a3.5 3.5 0 0 0-3.5 3.5V11a2 2 0 1 0 4 0V4.5a.5.5 0 0 1 1 0V11a3 3 0 1 1-6 0V4.5a4.5 4.5 0 1 1 9 0V11a5.5 5.5 0 1 1-11 0V4.5a.5.5 0 0 1 1 0V11a4.5 4.5 0 1 0 9 0V4.5A3.5 3.5 0 0 0 11.5 1z"/>
                </svg>
              </button>
              {/* 🐛 修复问题2：根据状态显示发送或停止按钮 */}
              {isWaiting ? (
                <button 
                  className="toolbar-stop-btn" 
                  onClick={handleStop}
                  title="Stop generation"
                >
                  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <rect x="4" y="4" width="8" height="8" rx="1"/>
                  </svg>
                </button>
              ) : (
                <button 
                  className="toolbar-send-btn" 
                  onClick={() => editorRef.current?.send()}
                  disabled={!hasContent}
                  title={hasContent ? "Send message (Enter)" : "Type a message first"}
                >
                  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M15.854 7.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708L14.293 8 8.146 1.854a.5.5 0 1 1 .708-.708l7 7z"/>
                    <path d="M0 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1H.5A.5.5 0 0 1 0 8z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
