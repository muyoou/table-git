import type { ConversationTurn, TagInstruction } from './types';

export interface TagParserContext {
  conversation: ConversationTurn[];
  variables?: Record<string, unknown>;
}

export interface TagParserPlugin {
  name: string;
  match(turn: ConversationTurn): boolean;
  parse(turn: ConversationTurn, context: TagParserContext): TagInstruction[] | Promise<TagInstruction[]>;
}

export interface TagParser {
  parse(context: TagParserContext): Promise<TagInstruction[]>;
  register(plugin: TagParserPlugin): void;
  clear(): void;
}

export class ComposedTagParser implements TagParser {
  private readonly plugins: TagParserPlugin[] = [];

  register(plugin: TagParserPlugin): void {
    this.plugins.push(plugin);
  }

  clear(): void {
    this.plugins.length = 0;
  }

  async parse(context: TagParserContext): Promise<TagInstruction[]> {
    const results: TagInstruction[] = [];
    for (const turn of context.conversation) {
      for (const plugin of this.plugins) {
        if (!plugin.match(turn)) {
          continue;
        }
        const parsed = await plugin.parse(turn, context);
        if (Array.isArray(parsed)) {
          results.push(...parsed);
        }
      }
    }
    return results;
  }
}
