import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

export class IfNode implements RuntimeNode {
  readonly type = 'If';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '条件判断',
      summary: '根据布尔值或表达式选择性触发“是/否”两个输出分支。',
  category: 'conditions',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后评估条件并触发相应分支。',
          required: true
        },
        {
          name: 'condition',
          label: '条件',
          type: 'boolean',
          description: '布尔值或可被解析/求值为布尔值的表达式/字符串。'
        }
      ],
      outputs: [
        {
          name: 'yes',
          label: '是',
          type: 'FlowEvent',
          description: '当条件为真时触发。',
          required: true
        },
        {
          name: 'no',
          label: '否',
          type: 'FlowEvent',
          description: '当条件为假时触发。',
          required: true
        }
      ]
    };
  }

  validate(_config: Record<string, unknown>): void {
    // No static config to validate for this node.
  }

  async execute({ node, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const condRaw = this.firstValue(inputs.condition ?? node.config?.condition);
    const cond = this.evaluateCondition(condRaw);

    if (cond) {
      return { outputs: { yes: true } };
    }
    return { outputs: { no: true } };
  }

  private firstValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }

  private evaluateCondition(value: unknown): boolean {
    // direct boolean
    if (typeof value === 'boolean') {
      return value;
    }

    // number -> truthy if non-zero
    if (typeof value === 'number') {
      return value !== 0 && !Number.isNaN(value);
    }

    // try to parse JSON booleans and numbers in strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return false;
      }
      // JSON true/false/null/number
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'boolean') {
          return parsed;
        }
        if (typeof parsed === 'number') {
          return parsed !== 0 && !Number.isNaN(parsed);
        }
      } catch {
        // not JSON
      }

      // Fallback: evaluate as JS expression in a safe-ish manner
      // Note: this executes locally and may be unsafe for untrusted input.
      try {
        // wrap in parentheses so expressions like `1>0` work
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return (${trimmed});`);
        const res = fn();
        return Boolean(res);
      } catch (err) {
        throw new Error(`无法解析条件表达式：${String(err instanceof Error ? err.message : err)}`);
      }
    }

    return false;
  }
}
