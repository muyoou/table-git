import type { TagInstruction } from '../../core/types';
import type { TableChangeCommand } from '../../core/table-adapter';
import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

interface ApplyChangesConfig {
  sheetId?: string;
  dryRun?: boolean;
}

export class ApplyChangesNode implements RuntimeNode {
  readonly type = 'ApplyChanges';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '应用变更',
      summary: '将解析指令转换为表格修改命令并写入目标工作表。',
      category: 'table',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后执行待处理的表格变更。',
          required: true
        },
        {
          name: 'instructions',
          label: '解析指令',
          type: 'TagInstruction[]',
          description: '待转换为表格操作的指令集合。'
        },
        {
          name: 'snapshot',
          label: '表格快照',
          type: 'TableSnapshot',
          description: '提供变更所需上下文的最新表格快照。',
          required: false
        },
        {
          name: 'sheetId',
          label: '工作表 ID',
          type: 'string',
          description: '覆盖默认 sheetId；留空时使用流程上下文中的值。',
          required: false
        },
        {
          name: 'dryRun',
          label: '仅预览',
          type: 'boolean',
          description: '为 true 时只生成命令并返回预览，不写入表格。',
          required: false
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '应用或预览变更后传递给下游节点的触发信号。',
          required: true
        },
        {
          name: 'snapshot',
          label: '最新快照',
          type: 'TableSnapshot',
          description: '适配器在执行变更后返回的表格快照。'
        },
        {
          name: 'commands',
          label: '变更命令',
          type: 'TableChangeCommand[]',
          description: '由解析指令生成的表格修改命令列表。'
        },
        {
          name: 'preview',
          label: '预览命令',
          type: 'TableChangeCommand[]',
          description: '仅预览时输出的变更命令列表。',
          required: false
        }
      ]
    };
  }

  validate(config: Record<string, unknown>): void {
    if (config.sheetId !== undefined && typeof config.sheetId !== 'string') {
      throw new Error('ApplyChanges.sheetId must be a string when provided.');
    }
    if (config.dryRun !== undefined && typeof config.dryRun !== 'boolean') {
      throw new Error('ApplyChanges.dryRun must be a boolean when provided.');
    }
  }

  async execute({ node, flowContext, services, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const adapter = services.adapter;
    const config = (node.config ?? {}) as ApplyChangesConfig;
    const sheetIdValue = this.firstValue(inputs.sheetId ?? config.sheetId);
    if (sheetIdValue !== undefined && typeof sheetIdValue !== 'string') {
      throw new Error('ApplyChanges.sheetId must be a string when provided.');
    }

    const sheetId = (sheetIdValue as string | undefined) ?? flowContext.sheetId;
    if (!sheetId) {
      throw new Error('ApplyChanges node could not resolve a sheet id.');
    }

  const instructions = this.toInstructionArray(inputs.instructions);
    if (!instructions.length) {
      return {
        warnings: ['No instructions available; skipping apply.'],
        outputs: {
          trigger: true
        }
      };
    }

    const commands = this.toChangeCommands(instructions, sheetId);
    if (!commands.length) {
      return {
        warnings: ['Parsed instructions did not produce any change commands.'],
        outputs: {
          trigger: true
        }
      };
    }

    const dryRunValue = this.firstValue(inputs.dryRun ?? config.dryRun);
    const dryRun = this.toBoolean(dryRunValue) ?? false;

    if (dryRun) {
      return {
        outputs: {
          trigger: true,
          preview: commands
        }
      };
    }

    const snapshot = await adapter.applyChanges(sheetId, commands, {
      dryRun: false,
      extras: { nodeId: node.id }
    });

    return {
      outputs: {
        trigger: true,
        snapshot,
        commands
      }
    };
  }

  private toChangeCommands(instructions: TagInstruction[], defaultSheetId: string): TableChangeCommand[] {
    const commands: TableChangeCommand[] = [];
    for (const instruction of instructions) {
      const command = this.convertInstruction(instruction, defaultSheetId);
      if (command) {
        commands.push(command);
      }
    }
    return commands;
  }

  private convertInstruction(instruction: TagInstruction, defaultSheetId: string): TableChangeCommand | undefined {
    const payload = instruction.payload ?? {};
    const sheetId = this.resolveTargetSheet(instruction, defaultSheetId);
    if (!sheetId) {
      return undefined;
    }
    switch (instruction.action) {
      case 'setCell':
      case 'set-cell': {
        const { row, column, value, meta } = payload as Record<string, unknown>;
        if (typeof row === 'number' && typeof column === 'number') {
          return {
            type: 'set',
            sheetId,
            payload: {
              row,
              column,
              value,
              meta: meta as Record<string, unknown>
            }
          };
        }
        return undefined;
      }
      case 'deleteCell':
      case 'delete-cell': {
        const { row, column } = payload as Record<string, unknown>;
        if (typeof row === 'number' && typeof column === 'number') {
          return {
            type: 'delete',
            sheetId,
            payload: {
              row,
              column,
              value: null
            }
          };
        }
        return undefined;
      }
      case 'insertRow':
      case 'insert-row': {
        const { index, values, meta } = payload as Record<string, unknown>;
        if (typeof index === 'number') {
          return {
            type: 'insertRow',
            sheetId,
            payload: {
              index,
              values: Array.isArray(values) ? values : undefined,
              meta: meta as Record<string, unknown> | undefined
            }
          };
        }
        return undefined;
      }
      case 'removeRow':
      case 'remove-row': {
        const { index } = payload as Record<string, unknown>;
        if (typeof index === 'number') {
          return {
            type: 'removeRow',
            sheetId,
            payload: {
              index
            }
          };
        }
        return undefined;
      }
      case 'insertColumn':
      case 'insert-column': {
        const { index, values, meta } = payload as Record<string, unknown>;
        if (typeof index === 'number') {
          return {
            type: 'insertColumn',
            sheetId,
            payload: {
              index,
              values: Array.isArray(values) ? values : undefined,
              meta: meta as Record<string, unknown> | undefined
            }
          };
        }
        return undefined;
      }
      case 'removeColumn':
      case 'remove-column': {
        const { index } = payload as Record<string, unknown>;
        if (typeof index === 'number') {
          return {
            type: 'removeColumn',
            sheetId,
            payload: {
              index
            }
          };
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }

  private toInstructionArray(value: unknown): TagInstruction[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value as TagInstruction[];
    }
    return [value as TagInstruction];
  }

  private resolveTargetSheet(instruction: TagInstruction, fallback: string): string | undefined {
    const target = instruction.target ?? {};
    const candidate = (target.sheetId ?? target.sheet ?? target.id ?? target.name) as string | undefined;
    return candidate && typeof candidate === 'string' ? candidate : fallback;
  }

  private firstValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }

  private toBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        return true;
      }
      if (value.toLowerCase() === 'false') {
        return false;
      }
    }
    return undefined;
  }
}
