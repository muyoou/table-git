import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

export class LoadTableNode implements RuntimeNode {
  readonly type = 'LoadTable';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '加载表格',
      summary: '通过适配器加载指定工作表的最新快照。',
      category: 'table',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后开始执行加载流程。',
          required: true
        },
        {
          name: 'sheetId',
          label: '工作表 ID',
          type: 'string',
          description: '可选的工作表标识；为空时回退到流程上下文。',
          required: false
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '加载完成后传递给下游节点的触发信号。',
          required: true
        },
        {
          name: 'snapshot',
          label: '表格快照',
          type: 'TableSnapshot',
          description: '目标工作表的最新快照数据。'
        }
      ]
    };
  }

  validate(config: Record<string, unknown>): void {
    if (config.sheetId !== undefined && typeof config.sheetId !== 'string') {
      throw new Error('LoadTable.sheetId must be a string when provided.');
    }
  }

  async execute({ node, flowContext, services, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const adapter = services.adapter;
    if (!adapter) {
      throw new Error('LoadTable node requires a table adapter.');
    }

    const sheetIdInput = inputs.sheetId ?? node.config?.sheetId;
    if (sheetIdInput !== undefined && typeof sheetIdInput !== 'string') {
      throw new Error('LoadTable.sheetId input must be a string when provided.');
    }

    const sheetId = (sheetIdInput as string | undefined) ?? flowContext.sheetId;
    if (!sheetId) {
      throw new Error('LoadTable node could not resolve a sheet id.');
    }

    const snapshot = await adapter.load(sheetId);
    flowContext.sheetId = sheetId;

    return {
      outputs: {
        trigger: true,
        snapshot
      }
    };
  }
}
