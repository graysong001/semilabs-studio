/**
 * SSE Messenger - HTTP/SSE communication with Backend
 * 
 * Implements IMessenger over HTTP + Server-Sent Events
 */

import { IMessenger, Message, InProcessMessenger } from './IMessenger';
import type { FromExtensionProtocol, ToExtensionProtocol } from './SemilabsProtocol';

// EventSource polyfill for Node.js
const { EventSource } = require('eventsource');

export interface SseMessengerConfig {
  baseUrl: string;
  authToken?: string;
  reconnectInterval?: number;
  autoConnect?: boolean; // 是否自动连接，默认 false
}

/**
 * SseMessenger - Backend communication via HTTP + SSE
 */
export class SseMessenger extends InProcessMessenger<ToExtensionProtocol, FromExtensionProtocol> {
  private baseUrl: string;
  private authToken?: string;
  private reconnectInterval: number;
  private autoConnect: boolean;
  private eventSource?: any;
  private isConnected = false; // 连接状态
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();

  constructor(config: SseMessengerConfig) {
    super();
    this.baseUrl = config.baseUrl;
    this.authToken = config.authToken;
    this.reconnectInterval = config.reconnectInterval ?? 5000;
    this.autoConnect = config.autoConnect ?? false; // 默认不自动连接
    
    // 只有当 autoConnect = true 时才自动连接
    if (this.autoConnect) {
      console.log('[SseMessenger] Auto-connecting to backend...');
      this.connectSSE();
    } else {
      console.log('[SseMessenger] Initialized in manual mode. Call connect() to establish connection.');
    }
  }

  /**
   * 手动连接到 SSE 端点（公开 API）
   */
  connect() {
    if (this.isConnected) {
      console.log('[SseMessenger] Already connected');
      return;
    }
    this.connectSSE();
  }

  /**
   * Connect to SSE endpoint for real-time updates
   */
  private connectSSE() {
    const sseUrl = `${this.baseUrl}/sse/events`;
    console.log(`[SseMessenger] Connecting to ${sseUrl}`);
    
    this.eventSource = new EventSource(sseUrl);
    
    this.eventSource.onopen = () => {
      console.log('[SseMessenger] SSE connection established');
      this.isConnected = true;
    };
    
    this.eventSource.onerror = (error: any) => {
      console.error('[SseMessenger] SSE connection error:', error);
      this.isConnected = false;
      this.eventSource?.close();
      
      // 只有在 autoConnect 模式下才自动重连
      if (this.autoConnect) {
        setTimeout(() => {
          console.log('[SseMessenger] Auto-reconnecting...');
          this.connectSSE();
        }, this.reconnectInterval);
      } else {
        console.log('[SseMessenger] Connection lost. Call connect() to reconnect manually.');
      }
    };
    
    // Handle specific event types
    this.eventSource.addEventListener('domain-graph/update', (event: any) => {
      const data = JSON.parse(event.data);
      this.invoke('domain-graph/update', data);
    });
    
    this.eventSource.addEventListener('chat/event', (event: any) => {
      const data = JSON.parse(event.data);
      this.invoke('chat/event', data);
    });
    
    this.eventSource.addEventListener('tool/event', (event: any) => {
      const data = JSON.parse(event.data);
      this.invoke('tool/event', data);
    });
    
    this.eventSource.addEventListener('notification/show', (event: any) => {
      const data = JSON.parse(event.data);
      this.invoke('notification/show', data);
    });
  }

  /**
   * Send HTTP request to Backend
   */
  private async httpRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${error.message || response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Override request method to use HTTP
   */
  async request<T extends keyof FromExtensionProtocol>(
    messageType: T,
    data: FromExtensionProtocol[T][0],
  ): Promise<FromExtensionProtocol[T][1]> {
    // Map message type to HTTP endpoint
    const endpointMap: Record<string, { method: string; path: string }> = {
      'domain-graph/get-snapshot': { method: 'GET', path: '/domain-graph/snapshot' },
      'chat/create-session': { method: 'POST', path: '/chat/sessions' },
      'chat/send-message': { method: 'POST', path: '/chat/sessions/:sessionId/messages/stream' },
      'chat/get-sessions': { method: 'GET', path: '/chat/sessions' },
      'chat/get-history': { method: 'GET', path: '/chat/sessions/:sessionId/messages' },
      'tool/execute': { method: 'POST', path: '/tools/execute' },
      'tool/get-status': { method: 'GET', path: '/tools/executions/:executionId' },
      'approval/approve': { method: 'POST', path: '/approvals/:executionId/approve' },
      'approval/reject': { method: 'POST', path: '/approvals/:executionId/reject' },
      'analytics/user-preferences': { method: 'GET', path: '/analytics/user-preferences' },
    };
    
    const endpoint = endpointMap[messageType as string];
    if (!endpoint) {
      throw new Error(`Unknown message type: ${String(messageType)}`);
    }
    
    // Replace path parameters
    let path = endpoint.path;
    if (typeof data === 'object' && data !== null) {
      if ('sessionId' in data) {
        path = path.replace(':sessionId', String((data as any).sessionId));
      }
      if ('executionId' in data) {
        path = path.replace(':executionId', String((data as any).executionId));
      }
    }
    
    return this.httpRequest(endpoint.method, path, data);
  }

  /**
   * Disconnect SSE
   */
  disconnect() {
    this.eventSource?.close();
    this.isConnected = false;
    console.log('[SseMessenger] Disconnected');
  }

  /**
   * 检查是否已连接
   */
  isConnectedToBackend(): boolean {
    return this.isConnected;
  }
}
