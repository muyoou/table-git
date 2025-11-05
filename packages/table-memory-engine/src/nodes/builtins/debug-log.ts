import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

export class DebugLogNode implements RuntimeNode {
  readonly type = 'DebugLog';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '调试输出',
      summary: '接收任意输入并输出到控制台与调试日志，方便排查流程问题。',
      category: 'utility',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后执行调试输出。',
          required: true
        },
        {
          name: 'value',
          label: '调试输出内容',
          type: 'any',
          description: '任意数据类型都会被打印，数组或对象会自动格式化。',
          required: false
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '完成日志输出后继续唤起下游节点。',
          required: true
        }
      ]
    };
  }

  async execute({ node, inputs, services }: NodeExecutionContext): Promise<NodeResult> {
    const rawValue = this.firstValue(inputs.value ?? node.config?.value);
    const preview = this.toPreview(rawValue);
    const message = `[DebugLog:${node.id}] ${preview}`;

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(message, rawValue);
    }

    services.log?.(message, {
      nodeId: node.id,
      nodeType: this.type,
      preview,
      value: rawValue
    });

    return {
      outputs: {
        trigger: true
      },
      events: [
        {
          event: 'debug:log',
          payload: {
            nodeId: node.id,
            nodeType: this.type,
            preview,
            value: rawValue
          }
        }
      ]
    };
  }

  private firstValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }

  private toPreview(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'undefined') {
      return 'undefined';
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      const text = JSON.stringify(value, null, 2);
      return this.truncate(text, 400);
    } catch {
      return this.truncate(String(value), 400);
    }
  }

  private truncate(text: string, max: number): string {
    if (text.length <= max) {
      return text;
    }
    return `${text.slice(0, max - 1)}…`;
  }
}
