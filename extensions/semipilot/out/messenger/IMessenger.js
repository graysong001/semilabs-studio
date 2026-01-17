"use strict";
/**
 * IMessenger - Core messaging protocol for Semipilot Extension
 *
 * Adapted from Continue (Apache 2.0 License)
 * Original: https://github.com/continuedev/continue/blob/main/core/protocol/messenger/index.ts
 *
 * Copyright 2024 Continue Dev, Inc.
 * Copyright 2026 Semilabs (Adaptation)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InProcessMessenger = void 0;
const uuid_1 = require("uuid");
/**
 * In-Process Messenger Implementation
 *
 * Used for direct communication within the same process.
 * For SSE communication, see SseMessenger.ts
 */
class InProcessMessenger {
    constructor() {
        // Listeners for messages Extension can handle
        this.myTypeListeners = new Map();
        // Listeners for messages Backend can handle
        this.externalTypeListeners = new Map();
        this._onErrorHandlers = [];
    }
    onError(handler) {
        this._onErrorHandlers.push(handler);
    }
    invoke(messageType, data, messageId) {
        const listener = this.myTypeListeners.get(messageType);
        if (!listener) {
            return;
        }
        const msg = {
            messageType: messageType,
            data,
            messageId: messageId ?? (0, uuid_1.v4)(),
        };
        try {
            return listener(msg);
        }
        catch (error) {
            console.error(`[IMessenger] Error handling message ${String(messageType)}:`, error);
            this._onErrorHandlers.forEach((handler) => handler(msg, error));
            throw error;
        }
    }
    send(messageType, message, _messageId) {
        const messageId = _messageId ?? (0, uuid_1.v4)();
        const data = {
            messageType: messageType,
            data: message,
            messageId,
        };
        this.externalTypeListeners.get(messageType)?.(data);
        return messageId;
    }
    on(messageType, handler) {
        this.myTypeListeners.set(messageType, handler);
    }
    async request(messageType, data) {
        const messageId = (0, uuid_1.v4)();
        const listener = this.externalTypeListeners.get(messageType);
        if (!listener) {
            throw new Error(`No handler for message type "${String(messageType)}"`);
        }
        try {
            const response = await listener({
                messageType: messageType,
                data,
                messageId,
            });
            return response;
        }
        catch (error) {
            console.error(`[IMessenger] Request error for ${String(messageType)}:`, error);
            this._onErrorHandlers.forEach((handler) => handler({ messageType: messageType, data, messageId }, error));
            throw error;
        }
    }
    /**
     * Internal: Register external listener (used by test/mock)
     */
    externalOn(messageType, handler) {
        this.externalTypeListeners.set(messageType, handler);
    }
    /**
     * Internal: Invoke external handler (used by test/mock)
     */
    externalRequest(messageType, data, _messageId) {
        const messageId = _messageId ?? (0, uuid_1.v4)();
        const listener = this.myTypeListeners.get(messageType);
        if (!listener) {
            throw new Error(`No handler for message type "${String(messageType)}"`);
        }
        try {
            const response = listener({
                messageType: messageType,
                data,
                messageId,
            });
            return Promise.resolve(response);
        }
        catch (error) {
            console.error(`[IMessenger] External request error for ${String(messageType)}:`, error);
            this._onErrorHandlers.forEach((handler) => handler({ messageType: messageType, data, messageId }, error));
            throw error;
        }
    }
}
exports.InProcessMessenger = InProcessMessenger;
//# sourceMappingURL=IMessenger.js.map