/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Context Provider Manager
 * 
 * 管理所有 Context Providers 的注册、查询和生命周期
 */

import * as vscode from 'vscode';
import { IContextProvider, ContextItem, ContextProviderDescription } from './IContextProvider';
import { FileContextProvider } from './FileContextProvider';
import { SpecContextProvider } from './SpecContextProvider';

export class ContextProviderManager {
  private providers: Map<string, IContextProvider> = new Map();

  constructor(workspaceRoot: string) {
    // Register built-in providers
    this.registerProvider(new FileContextProvider(workspaceRoot));
    this.registerProvider(new SpecContextProvider(workspaceRoot));
    
    console.log('[ContextProviderManager] Initialized with providers:', 
      Array.from(this.providers.keys()));
  }

  registerProvider(provider: IContextProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): IContextProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): ContextProviderDescription[] {
    return Array.from(this.providers.values()).map(p => p.getDescription());
  }

  async search(providerId: string, query: string): Promise<ContextItem[]> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`[ContextProviderManager] Provider not found: ${providerId}`);
      return [];
    }

    return provider.search(query);
  }

  async getContent(providerId: string, itemId: string): Promise<ContextItem | null> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`[ContextProviderManager] Provider not found: ${providerId}`);
      return null;
    }

    return provider.getContent(itemId);
  }

  dispose(): void {
    // Cleanup providers if they have dispose methods
    for (const provider of this.providers.values()) {
      if ('dispose' in provider && typeof (provider as any).dispose === 'function') {
        (provider as any).dispose();
      }
    }
    this.providers.clear();
  }
}
