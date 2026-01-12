"use strict";
/**
 * @SpecTrace cap-ui-chat-slash, v1.0.0
 *
 * Unit Tests for SlashCommandHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SlashCommandHandler_1 = require("./SlashCommandHandler");
describe('SlashCommandHandler', () => {
    let handler;
    beforeEach(() => {
        handler = new SlashCommandHandler_1.SlashCommandHandler();
    });
    describe('register', () => {
        it('should register a new command', () => {
            const mockHandler = jest.fn();
            handler.register({
                name: 'test',
                description: 'Test command',
                handler: mockHandler
            });
            expect(handler.hasCommand('test')).toBe(true);
        });
    });
    describe('parse', () => {
        beforeEach(() => {
            handler.register({
                name: 'tasks',
                description: 'Show tasks',
                handler: jest.fn()
            });
        });
        it('should parse valid slash command', () => {
            const result = handler.parse('/tasks');
            expect(result).toEqual({
                command: 'tasks',
                args: undefined
            });
        });
        it('should parse command with arguments', () => {
            const result = handler.parse('/tasks domain-ui');
            expect(result).toEqual({
                command: 'tasks',
                args: 'domain-ui'
            });
        });
        it('should return null for non-command input', () => {
            const result = handler.parse('Hello world');
            expect(result).toBeNull();
        });
        it('should return null for unknown command', () => {
            const result = handler.parse('/unknown');
            expect(result).toBeNull();
        });
        it('should handle leading/trailing whitespace', () => {
            const result = handler.parse('  /tasks  ');
            expect(result).toEqual({
                command: 'tasks',
                args: undefined
            });
        });
    });
    describe('execute', () => {
        it('should execute registered command', async () => {
            const mockHandler = jest.fn().mockResolvedValue(undefined);
            handler.register({
                name: 'tasks',
                description: 'Show tasks',
                handler: mockHandler
            });
            const result = await handler.execute('/tasks');
            expect(result).toBe(true);
            expect(mockHandler).toHaveBeenCalledWith(undefined);
        });
        it('should pass arguments to handler', async () => {
            const mockHandler = jest.fn().mockResolvedValue(undefined);
            handler.register({
                name: 'tasks',
                description: 'Show tasks',
                handler: mockHandler
            });
            await handler.execute('/tasks domain-ui');
            expect(mockHandler).toHaveBeenCalledWith('domain-ui');
        });
        it('should return false for unknown command', async () => {
            const result = await handler.execute('/unknown');
            expect(result).toBe(false);
        });
        it('should return false for non-command input', async () => {
            const result = await handler.execute('Hello world');
            expect(result).toBe(false);
        });
        it('should handle handler errors gracefully', async () => {
            const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'));
            handler.register({
                name: 'error',
                description: 'Error command',
                handler: mockHandler
            });
            const result = await handler.execute('/error');
            expect(result).toBe(false);
        });
    });
    describe('getCommands', () => {
        it('should return all registered commands', () => {
            handler.register({
                name: 'tasks',
                description: 'Show tasks',
                handler: jest.fn()
            });
            handler.register({
                name: 'help',
                description: 'Show help',
                handler: jest.fn()
            });
            const commands = handler.getCommands();
            expect(commands).toHaveLength(2);
            expect(commands.map(c => c.name)).toContain('tasks');
            expect(commands.map(c => c.name)).toContain('help');
        });
        it('should return empty array when no commands registered', () => {
            const commands = handler.getCommands();
            expect(commands).toEqual([]);
        });
    });
    describe('hasCommand', () => {
        it('should return true for registered command', () => {
            handler.register({
                name: 'tasks',
                description: 'Show tasks',
                handler: jest.fn()
            });
            expect(handler.hasCommand('tasks')).toBe(true);
        });
        it('should return false for unregistered command', () => {
            expect(handler.hasCommand('unknown')).toBe(false);
        });
    });
});
//# sourceMappingURL=SlashCommandHandler.test.js.map