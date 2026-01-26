"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * ReasoningDeck 组件测试
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const ReasoningDeck_1 = require("./ReasoningDeck");
require("@testing-library/jest-dom");
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
        (0, react_2.render)(react_1.default.createElement(ReasoningDeck_1.ReasoningDeck, { content: mockContent }));
        expect(react_2.screen.getByText(/THINKING PROJECTION/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/SPEC: cap-auth-login/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/DOMAIN: auth/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/DEFINING/i)).toBeInTheDocument();
    });
    test('should return null if no THINKING block found', () => {
        const { container } = (0, react_2.render)(react_1.default.createElement(ReasoningDeck_1.ReasoningDeck, { content: "Just a regular message" }));
        expect(container.firstChild).toBeNull();
    });
    test('should truncate long thinking bodies', () => {
        const longThinking = '### THINKING\n' + 'A'.repeat(300);
        (0, react_2.render)(react_1.default.createElement(ReasoningDeck_1.ReasoningDeck, { content: longThinking }));
        const body = react_2.screen.getByText(/AAA.../i);
        expect(body).toBeInTheDocument();
    });
});
//# sourceMappingURL=ReasoningDeck.test.js.map