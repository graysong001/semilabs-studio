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

import { v4 as uuidv4 } from "uuid";

/**
 * Protocol Definition
 * 
 * Each message type maps to [RequestData, ResponseData]
 * Example: { "chat/send": [ChatRequest, ChatResponse] }
 */
export type IProtocol = Record<string, [any, any]>;

/**
 * Message structure
 */
export interface Message<T = any> {
  messageType: string;
  messageId: string;
  data: T;
}

/**
 * Typed message from a protocol
 */
export interface FromMessage<
  FromProtocol extends IProtocol,
  T extends keyof FromProtocol,
> {
  messageType: T;
  messageId: string;
  data: FromProtocol[T][1];
}

/**
 * IMessenger Interface
 * 
 * Bidirectional communication between Extension and Backend
 * - ToProtocol: Messages Extension can receive (from Backend)
 * - FromProtocol: Messages Extension can send (to Backend)
 */
export interface IMessenger<
  ToProtocol extends IProtocol,
  FromProtocol extends IProtocol,
> {
  /**
   * Register error handler
   */
  onError(handler: (message: Message, error: Error) => void): void;

  /**
   * Send message to Backend (fire-and-forget)
   */
  send<T extends keyof FromProtocol>(
    messageType: T,
    data: FromProtocol[T][0],
    messageId?: string,
  ): string;

  /**
   * Register message handler for incoming messages
   */
  on<T extends keyof ToProtocol>(
    messageType: T,
    handler: (
      message: Message<ToProtocol[T][0]>,
    ) => Promise<ToProtocol[T][1]> | ToProtocol[T][1],
  ): void;

  /**
   * Send request and wait for response
   */
  request<T extends keyof FromProtocol>(
    messageType: T,
    data: FromProtocol[T][0],
  ): Promise<FromProtocol[T][1]>;

  /**
   * Invoke local handler (for testing/internal use)
   */
  invoke<T extends keyof ToProtocol>(
    messageType: T,
    data: ToProtocol[T][0],
    messageId?: string,
  ): ToProtocol[T][1];
}

/**
 * In-Process Messenger Implementation
 * 
 * Used for direct communication within the same process.
 * For SSE communication, see SseMessenger.ts
 */
export class InProcessMessenger<
  ToProtocol extends IProtocol,
  FromProtocol extends IProtocol,
> implements IMessenger<ToProtocol, FromProtocol>
{
  // Listeners for messages Extension can handle
  protected myTypeListeners = new Map<
    keyof ToProtocol,
    (message: Message) => any
  >();

  // Listeners for messages Backend can handle
  protected externalTypeListeners = new Map<
    keyof FromProtocol,
    (message: Message) => any
  >();

  protected _onErrorHandlers: ((message: Message, error: Error) => void)[] = [];

  onError(handler: (message: Message, error: Error) => void) {
    this._onErrorHandlers.push(handler);
  }

  invoke<T extends keyof ToProtocol>(
    messageType: T,
    data: ToProtocol[T][0],
    messageId?: string,
  ): ToProtocol[T][1] {
    const listener = this.myTypeListeners.get(messageType);
    if (!listener) {
      return;
    }

    const msg: Message = {
      messageType: messageType as string,
      data,
      messageId: messageId ?? uuidv4(),
    };

    try {
      return listener(msg);
    } catch (error) {
      console.error(`[IMessenger] Error handling message ${messageType}:`, error);
      this._onErrorHandlers.forEach((handler) => handler(msg, error as Error));
      throw error;
    }
  }

  send<T extends keyof FromProtocol>(
    messageType: T,
    message: any,
    _messageId?: string,
  ): string {
    const messageId = _messageId ?? uuidv4();
    const data: Message = {
      messageType: messageType as string,
      data: message,
      messageId,
    };
    this.externalTypeListeners.get(messageType)?.(data);
    return messageId;
  }

  on<T extends keyof ToProtocol>(
    messageType: T,
    handler: (message: Message<ToProtocol[T][0]>) => ToProtocol[T][1],
  ): void {
    this.myTypeListeners.set(messageType, handler);
  }

  async request<T extends keyof FromProtocol>(
    messageType: T,
    data: FromProtocol[T][0],
  ): Promise<FromProtocol[T][1]> {
    const messageId = uuidv4();
    const listener = this.externalTypeListeners.get(messageType);
    if (!listener) {
      throw new Error(`No handler for message type "${String(messageType)}"`);
    }

    try {
      const response = await listener({
        messageType: messageType as string,
        data,
        messageId,
      });
      return response;
    } catch (error) {
      console.error(`[IMessenger] Request error for ${String(messageType)}:`, error);
      this._onErrorHandlers.forEach((handler) =>
        handler({ messageType: messageType as string, data, messageId }, error as Error)
      );
      throw error;
    }
  }

  /**
   * Internal: Register external listener (used by test/mock)
   */
  externalOn<T extends keyof FromProtocol>(
    messageType: T,
    handler: (message: Message) => any,
  ) {
    this.externalTypeListeners.set(messageType, handler);
  }

  /**
   * Internal: Invoke external handler (used by test/mock)
   */
  externalRequest<T extends keyof ToProtocol>(
    messageType: T,
    data: ToProtocol[T][0],
    _messageId?: string,
  ): Promise<ToProtocol[T][1]> {
    const messageId = _messageId ?? uuidv4();
    const listener = this.myTypeListeners.get(messageType);
    if (!listener) {
      throw new Error(`No handler for message type "${String(messageType)}"`);
    }

    try {
      const response = listener({
        messageType: messageType as string,
        data,
        messageId,
      });
      return Promise.resolve(response);
    } catch (error) {
      console.error(`[IMessenger] External request error for ${String(messageType)}:`, error);
      this._onErrorHandlers.forEach((handler) =>
        handler({ messageType: messageType as string, data, messageId }, error as Error)
      );
      throw error;
    }
  }
}
