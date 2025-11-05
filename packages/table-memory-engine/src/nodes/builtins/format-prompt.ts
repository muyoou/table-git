import type { FormatterOutput } from '../../core/formatter';
import type { FlowContext, NodeResult, TagInstruction } from '../../core/types';
import type { TableSnapshot } from '../../core/table-adapter';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

interface FormatPromptConfig {
  formatter?: string;
}

export class FormatPromptNode implements RuntimeNode {
  readonly type = 'FormatPrompt';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '格式化提示词',
      summary: '使用注册的格式化器序列化最新表格快照。',
      category: 'formatters',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后生成提示词内容。',
          required: true
        },
        {
          name: 'snapshot',
          label: '表格快照',
          type: 'TableSnapshot',
          description: '需要序列化的表格快照。',
          required: false
        },
        {
          name: 'instructions',
          label: '解析指令',
          type: 'TagInstruction[]',
          description: '可用于丰富格式化输出的指令列表。',
          required: false
        },
        {
          name: 'formatter',
          label: '格式化器名称',
          type: 'string',
          description: '要使用的格式化器名称；默认为 prompt。',
          required: false
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '格式化完成后传递给下游节点的触发信号。',
          required: true
        },
        {
          name: 'formatted',
          label: '格式化结果',
          type: 'FormatterOutput',
          description: '可供下游节点使用的格式化内容。'
        }
      ]
    };
  }

  validate(config: Record<string, unknown>): void {
    if (config.formatter !== undefined && typeof config.formatter !== 'string') {
      throw new Error('FormatPrompt.formatter must be a string when provided.');
    }
  }

  async execute({ node, flowContext, services, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const config = (node.config ?? {}) as FormatPromptConfig;
    const formatterNameValue = this.firstValue(inputs.formatter ?? config.formatter);
    if (formatterNameValue !== undefined && typeof formatterNameValue !== 'string') {
      throw new Error('FormatPrompt.formatter must be a string when provided.');
    }
    const formatterName = (formatterNameValue as string | undefined) ?? 'prompt';
    const formatter = services.formatters;

    const snapshot = await this.resolveSnapshot(flowContext, services, inputs.snapshot);
    const instructions = this.toInstructionArray(inputs.instructions);

    const formatted = (await formatter.format(formatterName, {
      snapshot,
      instructions,
      variables: {},
      mode: 'prompt'
    })) as FormatterOutput;

    return {
      outputs: {
        trigger: true,
        formatted
      }
    };
  }

  private async resolveSnapshot(
    flowContext: FlowContext,
    services: NodeExecutionContext['services'],
    explicitSnapshot?: unknown
  ): Promise<TableSnapshot> {
    const directSnapshot = this.firstValue(explicitSnapshot);
    if (directSnapshot) {
      return directSnapshot as TableSnapshot;
    }

    if (typeof services.adapter?.snapshot === 'function' && flowContext.sheetId) {
      return services.adapter.snapshot(flowContext.sheetId, { format: 'default', includeMetadata: true });
    }

    throw new Error('FormatPrompt node could not locate a snapshot to format.');
  }

  private firstValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
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
}
