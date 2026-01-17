/**
 * Semilabs Protocol Definitions
 * 
 * Defines message types between Semipilot Extension and Backend
 * Based on cap-api-backend-ide-native.md
 */

import type { IProtocol } from './IMessenger';

/**
 * Domain Graph Types
 */
export interface DomainNode {
  id: string;
  name: string;
  subdomains: string[];
  capabilities: CapabilityRef[];
  affectedFiles: string[];
}

export interface CapabilityRef {
  id: string;
  version: string;
  path: string;
  status: 'APPROVED' | 'DRAFT' | 'DEPRECATED';
}

export interface DomainGraphSnapshot {
  domains: DomainNode[];
  totalDomains: number;
  lastScanAt: string;
}

export interface DomainGraphUpdate {
  op: 'ADD' | 'UPDATE' | 'REMOVE';
  domain?: DomainNode;
  domainId?: string;
  capability?: CapabilityRef;
}

/**
 * Chat Types
 */
export interface ChatSession {
  sessionId: string; // Backend实际返回 sessionId
  id?: string;
  title?: string;
  specId?: string;
  specVersion?: string;
  currentLevel?: 'L1' | 'L2' | 'L3';
  createdAt: string;
  updatedAt?: string;
}

export interface ChatRequest {
  content: string; // Slice 1: 仅content字段
  persona?: 'poe' | 'archi' | 'cody' | 'tess'; // Slice 4
  contextItems?: ContextItem[]; // Slice 2
}

export interface ContextItem {
  type: 'file' | 'folder' | 'code' | 'spec';
  id: string;
  content: string;
}

export interface ChatMessage {
  messageId: string; // Backend实际返回 messageId
  id?: string;
  role: 'user' | 'assistant' | 'system';
  persona?: 'poe' | 'archi' | 'cody' | 'tess';
  content: string;
  thinking?: string;
  contextItems?: ContextItem[];
  createdAt: string;
}

export interface ChatEvent {
  type: 'thinking' | 'response' | 'done';
  stage?: 'RECALL' | 'ANALYSIS' | 'PLANNING' | 'EXECUTION';
  content?: string;
  messageId?: string;
  sessionId?: string;
}

/**
 * Tool Execution Types
 */
export interface ToolExecutionRequest {
  toolName: string;
  parameters: Record<string, any>;
  sessionId: string;
}

export interface ToolExecutionStatus {
  executionId: string;
  toolName: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'REQUIRES_APPROVAL';
  startedAt: string;
  completedAt?: string;
  output?: Record<string, any>;
  progress?: number;
}

export interface ToolExecutionEvent {
  type: 'status' | 'output';
  status?: string;
  progress?: number;
  content?: string;
}

/**
 * Approval Types
 */
export interface ApprovalRequest {
  rationale: string;
}

export interface ApprovalResponse {
  approvedAt: string;
  approvedBy: string;
  executionStatus: string;
}

/**
 * Extension -> Backend Protocol (FromExtensionProtocol)
 */
export interface FromExtensionProtocol extends IProtocol {
  // Domain Graph
  'domain-graph/get-snapshot': [void, DomainGraphSnapshot];
  
  // Chat
  'chat/create-session': [Partial<ChatSession>, ChatSession];
  'chat/send-message': [{ sessionId: string; request: ChatRequest }, ChatMessage]; // Slice 1: 同步返回
  'chat/get-sessions': [{ limit?: number; offset?: number }, { sessions: ChatSession[]; total: number }];
  'chat/get-history': [{ sessionId: string; limit?: number; offset?: number }, { messages: ChatMessage[]; total: number }];
  
  // Tool Execution
  'tool/execute': [ToolExecutionRequest, { executionId: string; status: string; requiresApproval: boolean }];
  'tool/get-status': [{ executionId: string }, ToolExecutionStatus];
  
  // Approval
  'approval/approve': [{ executionId: string; rationale: string }, ApprovalResponse];
  'approval/reject': [{ executionId: string; rationale: string }, void];
  
  // Analytics
  'analytics/user-preferences': [{ timeRange?: '7d' | '30d' | '90d' }, Record<string, any>];
}

/**
 * Backend -> Extension Protocol (ToExtensionProtocol)
 */
export interface ToExtensionProtocol extends IProtocol {
  // SSE Events
  'domain-graph/update': [DomainGraphUpdate, void];
  'chat/event': [ChatEvent, void];
  'tool/event': [{ executionId: string; event: ToolExecutionEvent }, void];
  
  // Notifications
  'notification/show': [{ type: 'info' | 'warning' | 'error'; message: string }, void];
}
