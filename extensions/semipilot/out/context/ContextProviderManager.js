"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Context Provider Manager
 *
 * 管理所有 Context Providers 的注册、查询和生命周期
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextProviderManager = void 0;
const FileContextProvider_1 = require("./FileContextProvider");
const SpecContextProvider_1 = require("./SpecContextProvider");
class ContextProviderManager {
    constructor(workspaceRoot) {
        this.providers = new Map();
        // Register built-in providers
        this.registerProvider(new FileContextProvider_1.FileContextProvider(workspaceRoot));
        this.registerProvider(new SpecContextProvider_1.SpecContextProvider(workspaceRoot));
        console.log('[ContextProviderManager] Initialized with providers:', Array.from(this.providers.keys()));
    }
    registerProvider(provider) {
        this.providers.set(provider.id, provider);
    }
    getProvider(id) {
        return this.providers.get(id);
    }
    getAllProviders() {
        return Array.from(this.providers.values()).map(p => p.getDescription());
    }
    async search(providerId, query) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            console.warn(`[ContextProviderManager] Provider not found: ${providerId}`);
            return [];
        }
        return provider.search(query);
    }
    async getContent(providerId, itemId) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            console.warn(`[ContextProviderManager] Provider not found: ${providerId}`);
            return null;
        }
        return provider.getContent(itemId);
    }
    dispose() {
        // Cleanup providers if they have dispose methods
        for (const provider of this.providers.values()) {
            if ('dispose' in provider && typeof provider.dispose === 'function') {
                provider.dispose();
            }
        }
        this.providers.clear();
    }
}
exports.ContextProviderManager = ContextProviderManager;
//# sourceMappingURL=ContextProviderManager.js.map