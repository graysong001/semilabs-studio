"use strict";
/**
 * SSE Messenger - HTTP/SSE communication with Backend
 *
 * Implements IMessenger over HTTP + Server-Sent Events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseMessenger = void 0;
const IMessenger_1 = require("./IMessenger");
// EventSource polyfill for Node.js (using require for compatibility)
const EventSourceImpl = require('eventsource');
/**
 * SseMessenger - Backend communication via HTTP + SSE
 */
class SseMessenger extends IMessenger_1.InProcessMessenger {
    constructor(config) {
        super();
        this.isConnected = false; // 连接状态
        this.isWorkflowConnected = false; // Workflow SSE 连接状态
        this.reconnectAttempts = 0; // 当前重连尝试次数
        this.workflowReconnectAttempts = 0; // Workflow SSE 重连尝试次数
        // 移除末尾斜杠，确保 URL 格式一致
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.authToken = config.authToken;
        this.reconnectInterval = config.reconnectInterval ?? 5000;
        this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
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
        if (this.eventSource) {
            console.log('[SseMessenger] Already connected or connecting');
            return;
        }
        this.connectSSE();
    }
    /**
     * 手动连接到 Workflow SSE 端点（公开 API）
     */
    connectWorkflow() {
        if (this.workflowEventSource) {
            console.log('[SseMessenger] Workflow SSE already connected or connecting');
            return;
        }
        this.connectWorkflowSSE();
    }
    /**
     * Connect to SSE endpoint for real-time updates
     */
    connectSSE() {
        // 防止重复连接，先关闭旧连接
        if (this.eventSource) {
            console.warn('[SseMessenger] Closing existing SSE connection before creating new one');
            this.cleanupEventSource(this.eventSource);
            this.eventSource = undefined;
        }
        const sseUrl = `${this.baseUrl}/sse/events`;
        console.log(`[SseMessenger] Connecting to ${sseUrl} (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        const eventSource = new EventSourceImpl(sseUrl);
        this.eventSource = eventSource;
        eventSource.onopen = () => {
            // 防止 close 后回调仍触发
            if (this.eventSource !== eventSource) {
                console.warn('[SseMessenger] onopen triggered for stale connection, ignoring');
                return;
            }
            console.log('[SseMessenger] SSE connection established');
            this.isConnected = true;
            this.reconnectAttempts = 0; // 重置重连计数
        };
        eventSource.onerror = (error) => {
            console.error('[SseMessenger] SSE connection error:', error);
            // 只处理当前连接的错误
            if (this.eventSource !== eventSource) {
                return;
            }
            this.isConnected = false;
            // 只在非 CLOSED 状态时才关闭
            if (eventSource.readyState !== 2) {
                eventSource.close();
            }
            this.eventSource = undefined;
            // 只有在 autoConnect 模式下才自动重连
            if (this.autoConnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                // 指数退避：2^n * reconnectInterval，最大30秒
                const delay = Math.min(Math.pow(2, this.reconnectAttempts - 1) * this.reconnectInterval, 30000);
                console.log(`[SseMessenger] Auto-reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                setTimeout(() => {
                    this.connectSSE();
                }, delay);
            }
            else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[SseMessenger] Max reconnection attempts reached. Connection failed permanently.');
                this.reconnectAttempts = 0;
            }
            else {
                console.log('[SseMessenger] Connection lost. Call connect() to reconnect manually.');
            }
        };
        // 设置事件监听器
        this.setupSSEEventListeners(eventSource);
    }
    /**
     * 清理 EventSource 资源
     */
    cleanupEventSource(eventSource) {
        if (!eventSource)
            return;
        try {
            eventSource.onopen = null;
            eventSource.onerror = null;
            eventSource.onmessage = null;
            // 移除所有自定义事件监听器
            if (eventSource.close && typeof eventSource.close === 'function') {
                eventSource.close();
            }
        }
        catch (error) {
            console.error('[SseMessenger] Error cleaning up EventSource:', error);
        }
    }
    /**
     * 设置 SSE 事件监听器
     */
    setupSSEEventListeners(eventSource) {
        // Handle specific event types
        eventSource.addEventListener('domain-graph/update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.invoke('domain-graph/update', data);
            }
            catch (error) {
                console.error('[SseMessenger] Failed to parse domain-graph/update event:', error, 'Raw data:', event.data);
            }
        });
        eventSource.addEventListener('chat/event', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.invoke('chat/event', data);
            }
            catch (error) {
                console.error('[SseMessenger] Failed to parse chat/event:', error, 'Raw data:', event.data);
            }
        });
        eventSource.addEventListener('tool/event', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.invoke('tool/event', data);
            }
            catch (error) {
                console.error('[SseMessenger] Failed to parse tool/event:', error, 'Raw data:', event.data);
            }
        });
        eventSource.addEventListener('notification/show', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.invoke('notification/show', data);
            }
            catch (error) {
                console.error('[SseMessenger] Failed to parse notification/show:', error, 'Raw data:', event.data);
            }
        });
    }
    /**
     * Connect to Workflow SSE endpoint (/api/v1/workflow/events)
     * Slice 4: 独立 SSE 通道，不合并进 /sse/events
     */
    connectWorkflowSSE() {
        // 防止重复连接，先关闭旧连接
        if (this.workflowEventSource) {
            console.warn('[SseMessenger] Closing existing Workflow SSE connection before creating new one');
            this.cleanupEventSource(this.workflowEventSource);
            this.workflowEventSource = undefined;
        }
        const workflowSseUrl = `${this.baseUrl}/workflow/events`;
        console.log(`[SseMessenger] Connecting to Workflow SSE: ${workflowSseUrl} (attempt ${this.workflowReconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        const eventSource = new EventSourceImpl(workflowSseUrl);
        this.workflowEventSource = eventSource;
        eventSource.onopen = () => {
            // 防止 close 后回调仍触发
            if (this.workflowEventSource !== eventSource) {
                console.warn('[SseMessenger] Workflow onopen triggered for stale connection, ignoring');
                return;
            }
            console.log('[SseMessenger] Workflow SSE connection established');
            this.isWorkflowConnected = true;
            this.workflowReconnectAttempts = 0; // 重置重连计数
        };
        eventSource.onerror = (error) => {
            console.error('[SseMessenger] Workflow SSE connection error:', error);
            // 只处理当前连接的错误
            if (this.workflowEventSource !== eventSource) {
                return;
            }
            this.isWorkflowConnected = false;
            // 只在非 CLOSED 状态时才关闭
            if (eventSource.readyState !== 2) {
                eventSource.close();
            }
            this.workflowEventSource = undefined;
            // 只有在 autoConnect 模式下才自动重连
            if (this.autoConnect && this.workflowReconnectAttempts < this.maxReconnectAttempts) {
                this.workflowReconnectAttempts++;
                // 指数退避：2^n * reconnectInterval，最大30秒
                const delay = Math.min(Math.pow(2, this.workflowReconnectAttempts - 1) * this.reconnectInterval, 30000);
                console.log(`[SseMessenger] Auto-reconnecting Workflow SSE in ${delay}ms (attempt ${this.workflowReconnectAttempts}/${this.maxReconnectAttempts})...`);
                setTimeout(() => {
                    this.connectWorkflowSSE();
                }, delay);
            }
            else if (this.workflowReconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[SseMessenger] Max Workflow reconnection attempts reached. Connection failed permanently.');
                this.workflowReconnectAttempts = 0;
            }
            else {
                console.log('[SseMessenger] Workflow SSE connection lost. Call connectWorkflow() to reconnect manually.');
            }
        };
        // 设置 Workflow 事件监听器
        this.setupWorkflowEventListeners(eventSource);
    }
    /**
     * 设置 Workflow SSE 事件监听器
     */
    setupWorkflowEventListeners(eventSource) {
        // 监听 workflow/event 事件
        eventSource.addEventListener('workflow/event', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.invoke('workflow/event', data);
            }
            catch (error) {
                console.error('[SseMessenger] Failed to parse workflow/event:', error, 'Raw data:', event.data);
            }
        });
        // 兼容后端可能使用 WorkflowEventType 作为 event name
        const eventTypes = [
            'DRAFT_UPDATED',
            'PROPOSAL_READY',
            'REVIEW_SUBMITTED',
            'VETO_APPLIED',
            'FIX_SUBMITTED',
            'WORKFLOW_APPROVED',
            'PHASE_STARTED',
            'PHASE_COMPLETED',
            'STAGING_UPDATED',
            'STAGING_MERGE_READY',
            'STAGING_MERGED'
        ];
        eventTypes.forEach(eventType => {
            eventSource.addEventListener(eventType, (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.invoke('workflow/event', data);
                }
                catch (error) {
                    console.error(`[SseMessenger] Failed to parse ${eventType} event:`, error, 'Raw data:', event.data);
                }
            });
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
        // GET/HEAD请求不能包含body
        const requestOptions = {
            method,
            headers,
        };
        if (method !== 'GET' && method !== 'HEAD' && data) {
            try {
                requestOptions.body = JSON.stringify(data);
            }
            catch (error) {
                throw new Error(`Failed to serialize request body: ${error.message}`);
            }
        }
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP ${response.status}: ${error.message || response.statusText}`);
        }
        // Backend返回格式: {success: boolean, data: T, error: {...}}
        // 提取data字段
        const result = await response.json().catch((error) => {
            throw new Error(`Failed to parse response as JSON: ${error.message}`);
        });
        if (result.success && 'data' in result) {
            return result.data;
        }
        else if (result.error) {
            throw new Error(`Backend error: ${result.error.message || result.error.code}`);
        }
        else {
            return result; // Fallback: 直接返回
        }
    }
    /**
     * Override request method to use HTTP
     */
    async request(messageType, data) {
        // Map message type to HTTP endpoint
        const endpointMap = {
            'domain-graph/get-snapshot': { method: 'GET', path: '/domain-graph/snapshot' },
            'chat/create-session': { method: 'POST', path: '/chat/sessions' },
            'chat/send-message': { method: 'POST', path: '/chat/sessions/:sessionId/messages' }, // Slice 1: 非SSE版本
            'chat/get-sessions': { method: 'GET', path: '/chat/sessions' },
            'chat/get-history': { method: 'GET', path: '/chat/sessions/:sessionId/messages' },
            // Draft API (Slice 4)
            'draft/upsert': { method: 'POST', path: '/api/v1/draft/upsert' },
            'draft/clear': { method: 'POST', path: '/api/v1/draft/clear' },
            'draft/commit': { method: 'POST', path: '/api/v1/draft/commit' },
            'draft/preview': { method: 'GET', path: '/api/v1/draft/preview' },
            // Workflow API (Slice 4)
            'workflow/submit': { method: 'POST', path: '/api/v1/workflow/submit' },
            'workflow/veto': { method: 'POST', path: '/api/v1/workflow/veto' },
            'workflow/resolve': { method: 'POST', path: '/api/v1/workflow/resolve' },
            // Tool & Approval
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
        let requestBody = data;
        if (typeof data === 'object' && data !== null) {
            if ('sessionId' in data) {
                path = path.replace(':sessionId', String(data.sessionId));
                // Slice 1适配: chat/send-message的request字段需要展开
                // Extension: {sessionId, request: {content: ...}}
                // Backend: {content: ...}
                if (messageType === 'chat/send-message' && 'request' in data) {
                    requestBody = data.request;
                }
            }
            if ('executionId' in data) {
                path = path.replace(':executionId', String(data.executionId));
            }
            // Slice 4: 处理 GET 请求的查询参数
            if (endpoint.method === 'GET' && 'targetFile' in data) {
                const params = new URLSearchParams({ targetFile: String(data.targetFile) });
                path = `${path}?${params.toString()}`;
                requestBody = undefined; // GET 请求不发送 body
            }
        }
        return this.httpRequest(endpoint.method, path, requestBody);
    }
    /**
     * Disconnect SSE
     */
    disconnect() {
        // 主 SSE 连接清理
        if (this.eventSource) {
            this.cleanupEventSource(this.eventSource);
            this.eventSource = undefined;
        }
        this.isConnected = false;
        this.reconnectAttempts = 0;
        // Workflow SSE 连接清理
        if (this.workflowEventSource) {
            this.cleanupEventSource(this.workflowEventSource);
            this.workflowEventSource = undefined;
        }
        this.isWorkflowConnected = false;
        this.workflowReconnectAttempts = 0;
        console.log('[SseMessenger] Disconnected and cleaned up all resources');
    }
    /**
     * 检查是否已连接
     */
    isConnectedToBackend() {
        return this.isConnected;
    }
    /**
     * 检查 Workflow SSE 是否已连接
     */
    isWorkflowConnectedToBackend() {
        return this.isWorkflowConnected;
    }
}
exports.SseMessenger = SseMessenger;
//# sourceMappingURL=SseMessenger.js.map