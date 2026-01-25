/**
 * @SpecTrace cap-ui-semipilot
 * 
 * ReasoningDeck 组件测试
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReasoningDeck } from './ReasoningDeck';
import '@testing-library/jest-dom';

describe('ReasoningDeck', () => {
  const mockContent = `
### THINKING
*   Step 1: Analyzing context.
*   Spec Id: cap-auth-login
*   Domain: auth
*   Stage: DEFINING

This is the actual message content.
`;

  test('should parse Spec Id and Domain from THINKING block', () => {
    render(<ReasoningDeck content={mockContent} />);
    
    expect(screen.getByText(/THINKING PROJECTION/i)).toBeInTheDocument();
    expect(screen.getByText(/SPEC: cap-auth-login/i)).toBeInTheDocument();
    expect(screen.getByText(/DOMAIN: auth/i)).toBeInTheDocument();
    expect(screen.getByText(/DEFINING/i)).toBeInTheDocument();
  });

  test('should return null if no THINKING block found', () => {
    const { container } = render(<ReasoningDeck content="Just a regular message" />);
    expect(container.firstChild).toBeNull();
  });

  test('should truncate long thinking bodies', () => {
    const longThinking = '### THINKING\n' + 'A'.repeat(300);
    render(<ReasoningDeck content={longThinking} />);
    
    const body = screen.getByText(/AAA.../i);
    expect(body).toBeInTheDocument();
  });
});
