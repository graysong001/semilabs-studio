"use strict";
/**
 * SSE Messenger - HTTP/SSE communication with Backend
 *
 * Implements IMessenger over HTTP + Server-Sent Events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseMessenger = void 0;
const IMessenger_1 = require("./IMessenger");
// EventSource polyfill for Node.js
const { EventSource } = require('eventsource');
/**
 * SseMessenger - Backend communication via HTTP + SSE
 */
class SseMessenger extends IMessenger_1.InProcessMessenger {
    constructor(config) {
        super();
        this.isConnected = false; // 连接状态
        this.pendingRequests = new Map();
        this.baseUrl = config.baseUrl;
        this.authToken = config.authToken;
        this.reconnectInterval = config.reconnectInterval ?? 5000;
        this.autoConnect = config.autoConnect ?? false; // 默认不自动连接
        // 只有当 autoConnect = true 时才自动连接
        if (this.autoConnect) {
            console.log('[SseMessenger] Auto-connecting to backend...');
            this.connectSSE();
        }
        else {
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
    connectSSE() {
        const sseUrl = `${this.baseUrl}/sse/events`;
        console.log(`[SseMessenger] Connecting to ${sseUrl}`);
        this.eventSource = new EventSource(sseUrl);
        this.eventSource.onopen = () => {
            console.log('[SseMessenger] SSE connection established');
            this.isConnected = true;
        };
        this.eventSource.onerror = (error) => {
            console.error('[SseMessenger] SSE connection error:', error);
            this.isConnected = false;
            this.eventSource?.close();
            // 只有在 autoConnect 模式下才自动重连
            if (this.autoConnect) {
                setTimeout(() => {
                    console.log('[SseMessenger] Auto-reconnecting...');
                    this.connectSSE();
                }, this.reconnectInterval);
            }
            else {
                console.log('[SseMessenger] Connection lost. Call connect() to reconnect manually.');
            }
        };
        // Handle specific event types
        this.eventSource.addEventListener('domain-graph/update', (event) => {
            const data = JSON.parse(event.data);
            this.invoke('domain-graph/update', data);
        });
        this.eventSource.addEventListener('chat/event', (event) => {
            const data = JSON.parse(event.data);
            this.invoke('chat/event', data);
        });
        this.eventSource.addEventListener('tool/event', (event) => {
            const data = JSON.parse(event.data);
            this.invoke('tool/event', data);
        });
        this.eventSource.addEventListener('notification/show', (event) => {
            const data = JSON.parse(event.data);
            this.invoke('notification/show', data);
        });
    }
    /**
     * Send HTTP request to Backend
     */
    async httpRequest(method, endpoint, data) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
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
    async request(messageType, data) {
        // Map message type to HTTP endpoint
        const endpointMap = {
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
        const endpoint = endpointMap[messageType];
        if (!endpoint) {
            throw new Error(`Unknown message type: ${String(messageType)}`);
        }
        // Replace path parameters
        let path = endpoint.path;
        if (typeof data === 'object' && data !== null) {
            if ('sessionId' in data) {
                path = path.replace(':sessionId', String(data.sessionId));
            }
            if ('executionId' in data) {
                path = path.replace(':executionId', String(data.executionId));
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
    isConnectedToBackend() {
        return this.isConnected;
    }
}
exports.SseMessenger = SseMessenger;
//# sourceMappingURL=SseMessenger.js.map