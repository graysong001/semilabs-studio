/**
 * @SpecTrace cap-ui-semipilot
 * 
 * Context Provider Interface
 * 
 * Context Providers supply contextual information to the chat (files, folders, code, specs)
 */

export interface ContextItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: 'file' | 'folder' | 'code' | 'spec';
  icon?: string;
  metadata?: Record<string, any>;
}

export interface ContextProviderDescription {
  id: string;
  title: string;
  displayTitle: string;
  description: string;
  renderInlineAs?: string;
}

export interface IContextProvider {
  readonly id: string;
  readonly title: string;
  readonly displayTitle: string;
  readonly description: string;

  /**
   * Search for context items based on query
   * @param query - Search query string
   * @returns Promise resolving to array of context items
   */
  search(query: string): Promise<ContextItem[]>;

  /**
   * Get full content for a specific context item
   * @param id - Context item ID
   * @returns Promise resolving to context item with full content
   */
  getContent(id: string): Promise<ContextItem | null>;

  /**
   * Get description for the context provider
   * @returns ContextProviderDescription
   */
  getDescription(): ContextProviderDescription;
}
