/**
 * Draft & Workflow API Manual Test
 * 
 * 手动测试 Draft 和 Workflow HTTP API 调用
 * 需要后端服务运行在 localhost:8080
 */

import { SseMessenger } from '../messenger/SseMessenger';
import type { DraftResponse, WorkflowResponse } from '../messenger/SemilabsProtocol';

describe('Draft & Workflow API Manual Tests', function() {
  this.timeout(10000);
  
  let messenger: SseMessenger;
  
  before(function() {
    messenger = new SseMessenger({
      baseUrl: 'http://localhost:8080',
      autoConnect: false
    });
  });
  
  after(function() {
    messenger.disconnect();
  });
  
  describe('Draft API', function() {
    it('should upsert draft item', async function() {
      const response: DraftResponse = await messenger.request('draft/upsert', {
        sessionId: 'test-session-1',
        content: 'Add SMS login feature',
        type: 'OBJECTIVE'
      });
      
      console.log('[Test] Upsert draft response:', response);
      
      if (response.success && response.data) {
        console.log('  - Event type:', response.data.type);
        console.log('  - Target:', response.data.target);
        console.log('  - Workflow state:', response.data.workflowState);
      }
    });
    
    it('should clear draft', async function() {
      const response: DraftResponse = await messenger.request('draft/clear', {
        sessionId: 'test-session-1'
      });
      
      console.log('[Test] Clear draft response:', response);
      
      if (response.success && response.data) {
        console.log('  - Event type:', response.data.type);
      }
    });
  });
  
  describe('Workflow API', function() {
    it('should submit workflow for review', async function() {
      const response: WorkflowResponse = await messenger.request('workflow/submit', {
        filePath: 'capabilities/domain-user/cap-login.md'
      });
      
      console.log('[Test] Submit workflow response:', response);
      
      if (response.success && response.data) {
        console.log('  - Event type:', response.data.type);
        console.log('  - Workflow state:', response.data.workflowState);
      }
    });
    
    it('should apply veto', async function() {
      const response: WorkflowResponse = await messenger.request('workflow/veto', {
        filePath: 'capabilities/domain-user/cap-login.md',
        reason: 'Missing security consideration',
        suggestion: 'Add OAuth2 flow'
      });
      
      console.log('[Test] Veto workflow response:', response);
      
      if (response.success && response.data) {
        console.log('  - Event type:', response.data.type);
        console.log('  - Workflow state:', response.data.workflowState);
        console.log('  - Reason:', response.data.payload?.reason);
      }
    });
    
    it('should resolve workflow with user approval', async function() {
      const response: WorkflowResponse = await messenger.request('workflow/resolve', {
        filePath: 'capabilities/domain-user/cap-login.md',
        userApproved: true
      });
      
      console.log('[Test] Resolve workflow response:', response);
      
      if (response.success && response.data) {
        console.log('  - Event type:', response.data.type);
        console.log('  - Workflow state:', response.data.workflowState);
      }
    });
  });
});
