"use strict";
/**
 * @SpecTrace cap-ui-semipilot
 *
 * Spec Context Provider (核心 - 优先级最高)
 *
 * 提供 @spec 提及，用于引用 Spec 文档到聊天上下文
 *
 * 特性：
 * 1. 扫描工作区中的 cap-*.md, spec-*.md, intent_*.md 文件
 * 2. 解析 Frontmatter (domain, id, version, status)
 * 3. 支持模糊搜索 (ID, Title, Domain)
 * 4. 内存索引（启动时构建，FileWatcher 增量更新）
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecContextProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// 文件大小限制：5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
class SpecContextProvider {
    constructor(workspaceRoot) {
        this.id = 'spec';
        this.title = 'spec';
        this.displayTitle = 'Spec Documents';
        this.description = 'Reference specification documents (cap-*.md, spec-*.md, intent_*.md)';
        this.specIndex = new Map();
        this.isIndexed = false;
        void workspaceRoot; // Reserved for future use
        this.initializeIndex();
    }
    async search(query) {
        // Ensure index is built
        if (!this.isIndexed) {
            await this.buildIndex();
        }
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const [filePath, metadata] of this.specIndex.entries()) {
            // Fuzzy match: ID, Title, Domain
            const matches = metadata.id.toLowerCase().includes(lowerQuery) ||
                (metadata.title?.toLowerCase().includes(lowerQuery) ?? false) ||
                (metadata.domain?.toLowerCase().includes(lowerQuery) ?? false);
            if (matches) {
                results.push({
                    id: filePath,
                    title: path.basename(filePath), // 文件名(包含后缀)
                    description: vscode.workspace.asRelativePath(filePath), // 相对路径
                    type: 'spec',
                    icon: this.getSpecIcon(metadata.status),
                    metadata: {
                        specId: metadata.id,
                        domain: metadata.domain,
                        version: metadata.version,
                        status: metadata.status
                    }
                });
            }
        }
        // Sort by relevance (exact match first, then partial match)
        return results.sort((a, b) => {
            const aExact = (a.metadata?.specId).toLowerCase() === lowerQuery;
            const bExact = (b.metadata?.specId).toLowerCase() === lowerQuery;
            if (aExact && !bExact)
                return -1;
            if (!aExact && bExact)
                return 1;
            return a.title.localeCompare(b.title);
        }).slice(0, 20); // Limit to 20 results
    }
    async getContent(id) {
        try {
            const uri = vscode.Uri.file(id);
            // 检查文件大小
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > MAX_FILE_SIZE) {
                console.warn(`[SpecContextProvider] File too large (${stat.size} bytes), skipping: ${id}`);
                vscode.window.showWarningMessage(`Spec file is too large (${Math.round(stat.size / 1024 / 1024)}MB), maximum is 5MB: ${path.basename(id)}`);
                return null;
            }
            const content = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(content).toString('utf8');
            const metadata = this.specIndex.get(id);
            return {
                id,
                title: path.basename(id), // 文件名(包含后缀)
                description: vscode.workspace.asRelativePath(id), // 相对路径
                content: text,
                type: 'spec',
                icon: this.getSpecIcon(metadata?.status),
                metadata: {
                    specId: metadata?.id,
                    domain: metadata?.domain,
                    version: metadata?.version,
                    status: metadata?.status,
                    lineCount: text.split('\n').length,
                    fileSize: stat.size
                }
            };
        }
        catch (error) {
            console.error(`[SpecContextProvider] Failed to read spec file: ${id}`, error);
            return null;
        }
    }
    getDescription() {
        return {
            id: this.id,
            title: this.title,
            displayTitle: this.displayTitle,
            description: this.description,
            renderInlineAs: 'spec'
        };
    }
    /**
     * 初始化索引（启动时）
     */
    async initializeIndex() {
        await this.buildIndex();
        this.setupFileWatcher();
    }
    /**
     * 构建 Spec 文档索引
     *
     * 扫描模式:
     * - star-star/cap-star.md
     * - star-star/spec-star.md
     * - star-star/intent_star.md
     *
     * 排除:
     * - star-star/node_modules/star-star
     * - star-star/target/star-star
     * - star-star/out/star-star
     */
    async buildIndex() {
        console.log('[SpecContextProvider] Building index...');
        this.specIndex.clear();
        const patterns = [
            '**/cap-*.md',
            '**/spec-*.md',
            '**/intent_*.md'
        ];
        const excludePattern = '{**/node_modules/**,**/target/**,**/out/**,**/.git/**}';
        for (const pattern of patterns) {
            const files = await vscode.workspace.findFiles(pattern, excludePattern);
            for (const uri of files) {
                try {
                    const metadata = await this.parseSpecMetadata(uri);
                    if (metadata) {
                        this.specIndex.set(uri.fsPath, metadata);
                    }
                }
                catch (error) {
                    console.warn(`Failed to parse spec metadata for ${uri.fsPath}:`, error);
                }
            }
        }
        this.isIndexed = true;
        console.log(`[SpecContextProvider] Index built: ${this.specIndex.size} specs found`);
    }
    /**
     * 解析 Spec Frontmatter
     *
     * 支持标准YAML格式的Frontmatter，包含：
     * - 简单key: value
     * - 带引号的值
     * - 多行值（缩进）
     *
     * 示例:
     * ---
     * id: cap-persona-poe
     * domain: domain-agent
     * version: 2.1
     * status: APPROVED
     * title: "Poe - 需求分析 Agent"
     * description: |
     *   多行描述
     *   第二行
     * ---
     */
    async parseSpecMetadata(uri) {
        try {
            // 检查文件大小
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > MAX_FILE_SIZE) {
                console.warn(`[SpecContextProvider] File too large for parsing (${stat.size} bytes): ${uri.fsPath}`);
                return null;
            }
            const content = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(content).toString('utf8');
            // Extract frontmatter (between --- and ---)
            const frontmatterMatch = text.match(/^---\s*\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) {
                // No frontmatter, use filename as ID
                const filename = path.basename(uri.fsPath, '.md');
                return {
                    id: filename,
                    title: filename
                };
            }
            const frontmatter = frontmatterMatch[1];
            const metadata = {
                id: path.basename(uri.fsPath, '.md') // Default to filename
            };
            // 改进的YAML解析逻辑
            const lines = frontmatter.split('\n');
            let currentKey = null;
            let currentValue = '';
            let isMultiline = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // 空行，跳过
                if (!line.trim()) {
                    continue;
                }
                // 检查是否是新的key-value对
                const keyValueMatch = line.match(/^(\w+):\s*(.*)$/);
                if (keyValueMatch && !isMultiline) {
                    // 保存之前的key-value
                    if (currentKey) {
                        this.setMetadataValue(metadata, currentKey, currentValue.trim());
                    }
                    currentKey = keyValueMatch[1];
                    let value = keyValueMatch[2].trim();
                    // 检查是否是多行值（以 | 或 > 开头）
                    if (value === '|' || value === '>') {
                        isMultiline = true;
                        currentValue = '';
                    }
                    else {
                        // 移除引号
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }
                        currentValue = value;
                        isMultiline = false;
                    }
                }
                else if (isMultiline && line.startsWith('  ')) {
                    // 多行值的续行（有缩进）
                    currentValue += (currentValue ? '\n' : '') + line.trim();
                }
                else if (isMultiline) {
                    // 多行值结束
                    if (currentKey) {
                        this.setMetadataValue(metadata, currentKey, currentValue.trim());
                    }
                    currentKey = null;
                    currentValue = '';
                    isMultiline = false;
                }
            }
            // 保存最后一个key-value
            if (currentKey) {
                this.setMetadataValue(metadata, currentKey, currentValue.trim());
            }
            return metadata;
        }
        catch (error) {
            console.error(`[SpecContextProvider] Error parsing spec metadata for ${uri.fsPath}:`, error);
            // 返回基本元数据而非null
            return {
                id: path.basename(uri.fsPath, '.md'),
                title: path.basename(uri.fsPath, '.md')
            };
        }
    }
    /**
     * 设置元数据字段的值
     */
    setMetadataValue(metadata, key, value) {
        switch (key) {
            case 'id':
                metadata.id = value;
                break;
            case 'domain':
                metadata.domain = value;
                break;
            case 'version':
                metadata.version = value;
                break;
            case 'status':
                metadata.status = value;
                break;
            case 'title':
                metadata.title = value;
                break;
            case 'description':
                metadata.description = value;
                break;
        }
    }
    /**
     * 设置 FileWatcher（增量更新索引）
     */
    setupFileWatcher() {
        const patterns = [
            '**/cap-*.md',
            '**/spec-*.md',
            '**/intent_*.md'
        ];
        for (const pattern of patterns) {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            watcher.onDidCreate(async (uri) => {
                console.log('[SpecContextProvider] Spec created:', uri.fsPath);
                const metadata = await this.parseSpecMetadata(uri);
                if (metadata) {
                    this.specIndex.set(uri.fsPath, metadata);
                }
            });
            watcher.onDidChange(async (uri) => {
                console.log('[SpecContextProvider] Spec changed:', uri.fsPath);
                const metadata = await this.parseSpecMetadata(uri);
                if (metadata) {
                    this.specIndex.set(uri.fsPath, metadata);
                }
            });
            watcher.onDidDelete((uri) => {
                console.log('[SpecContextProvider] Spec deleted:', uri.fsPath);
                this.specIndex.delete(uri.fsPath);
            });
        }
    }
    /* Reserved for future use
    private _formatDescription(metadata?: SpecMetadata): string {
      if (!metadata) return '';
      const parts: string[] = [];
      if (metadata.domain) parts.push(`Domain: ${metadata.domain}`);
      if (metadata.version) parts.push(`v${metadata.version}`);
      if (metadata.status) parts.push(metadata.status);
      return parts.join(' • ');
    }
    */
    getSpecIcon(status) {
        switch (status) {
            case 'APPROVED':
                return 'check';
            case 'DRAFT':
                return 'edit';
            case 'DEPRECATED':
                return 'archive';
            default:
                return 'file';
        }
    }
    /**
     * 清理资源
     */
    dispose() {
        this.fileWatcher?.dispose();
    }
}
exports.SpecContextProvider = SpecContextProvider;
//# sourceMappingURL=SpecContextProvider.js.map