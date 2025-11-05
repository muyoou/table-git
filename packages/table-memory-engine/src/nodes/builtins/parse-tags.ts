import type { TagInstruction } from '../../core/types';
import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

export class ParseTagsNode implements RuntimeNode {
  readonly type = 'ParseTags';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '解析标签',
      summary: '分析对话内容并提取表格编辑指令。',
      category: 'ai',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后开始解析标签。',
          required: true
        },
        {
          name: 'conversation',
          label: '对话记录',
          type: 'ConversationTurn[]',
          description: '需要分析的对话历史，用于识别表格操作指令。',
          required: false
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '解析完成后传递给下游节点的触发信号。',
          required: true
        },
        {
          name: 'instructions',
          label: '解析指令',
          type: 'TagInstruction[]',
          description: '根据标记内容生成的结构化指令集合。'
        }
      ]
    };
  }

  async execute({ flowContext, services }: NodeExecutionContext): Promise<NodeResult> {
    const parser = services.parser;
    const conversation = flowContext.conversation ?? [];
    const instructions = await parser.parse({
      conversation,
      variables: {}
    });

    return {
      outputs: {
        trigger: true,
        instructions
      }
    };
  }
}
