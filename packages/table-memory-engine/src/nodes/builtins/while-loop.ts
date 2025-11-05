import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

export class WhileLoopNode implements RuntimeNode {
  readonly type = 'WhileLoop';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: 'While 循环',
      summary: '按照条件为真的结果循环触发“循环体”，直到条件为假时触发“结束”分支。',
      category: 'control',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '启动循环的触发信号。',
          required: true
        },
        {
          name: 'condition',
          label: '循环条件',
          type: 'boolean',
          description: '布尔值或表达式，true 执行循环体，false 结束循环。',
          required: true
        }
      ],
      outputs: [
        {
          name: 'body',
          label: '循环体',
          type: 'FlowEvent',
          description: '当条件为真时触发，用于执行循环体逻辑。'
        },
        {
          name: 'end',
          label: '结束',
          type: 'FlowEvent',
          description: '当条件为假时触发，循环结束。'
        }
      ]
    };
  }

  validate(_config: Record<string, unknown>): void {
    // no config
  }

  async execute({ node, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const rawCondition = this.first(inputs.condition ?? node.config?.condition);
    const condition = this.evaluateCondition(rawCondition);

    if (condition) {
      return {
        outputs: {
          body: true
        },
        repeat: true
      };
    }

    return {
      outputs: {
        end: true
      },
      repeat: false
    };
  }

  private first(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }

  private evaluateCondition(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0 && !Number.isNaN(value);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return false;
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'boolean') {
          return parsed;
        }
        if (typeof parsed === 'number') {
          return parsed !== 0 && !Number.isNaN(parsed);
        }
      } catch {
        // ignore
      }
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return (${trimmed});`);
        return Boolean(fn());
      } catch (error) {
        throw new Error(`无法解析循环条件：${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (value === null || typeof value === 'undefined') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>).length > 0;
    }
    return Boolean(value);
  }
}
