/**
 * @SpecTrace cap-ui-chat-slash, v1.0.0
 * 
 * Slash Command Handler
 * 负责识别和处理 Slash Commands（如 /tasks, /help）
 */

export interface SlashCommand {
  name: string;
  description: string;
  handler: (args?: string) => void | Promise<void>;
}

export class SlashCommandHandler {
  private commands: Map<string, SlashCommand> = new Map();

  /**
   * 注册 Slash Command
   */
  register(command: SlashCommand) {
    this.commands.set(command.name, command);
    console.log(`[SlashCommandHandler] Registered command: /${command.name}`);
  }

  /**
   * 检测输入是否为 Slash Command
   * @param input 用户输入
   * @returns 如果是命令，返回 { command, args }，否则返回 null
   */
  parse(input: string): { command: string; args?: string } | null {
    const trimmed = input.trim();
    
    // 检测是否以 / 开头
    if (!trimmed.startsWith('/')) {
      return null;
    }

    // 解析命令和参数
    const parts = trimmed.slice(1).split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1).join(' ');

    if (!this.commands.has(command)) {
      return null;
    }

    return {
      command,
      args: args || undefined
    };
  }

  /**
   * 执行 Slash Command
   */
  async execute(input: string): Promise<boolean> {
    const parsed = this.parse(input);
    
    if (!parsed) {
      return false;
    }

    const command = this.commands.get(parsed.command);
    if (!command) {
      return false;
    }

    console.log(`[SlashCommandHandler] Executing: /${parsed.command}`, parsed.args);
    
    try {
      await command.handler(parsed.args);
      return true;
    } catch (error) {
      console.error(`[SlashCommandHandler] Error executing /${parsed.command}:`, error);
      return false;
    }
  }

  /**
   * 获取所有已注册的命令
   */
  getCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * 检查命令是否存在
   */
  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }
}
