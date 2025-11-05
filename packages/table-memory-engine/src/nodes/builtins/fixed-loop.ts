import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

interface FixedLoopState {
  current: number;
  total: number;
}

export class FixedLoopNode implements RuntimeNode {
  readonly type = 'FixedLoop';

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: '固定次数循环',
      summary: '按照指定次数重复执行循环体，每次输出当前迭代次数，执行完毕后触发结束分支。',
      category: 'control',
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '启动固定循环的触发信号。',
          required: true
        },
        {
          name: 'count',
          label: '循环次数',
          type: 'number',
          description: '需要执行的循环次数，可以为数值或可转换为数值的表达式。',
          required: true
        }
      ],
      outputs: [
        {
          name: 'body',
          label: '循环体',
          type: 'FlowEvent',
          description: '每次迭代时触发，用于执行循环体逻辑。'
        },
        {
          name: 'iteration',
          label: '当前次数',
          type: 'number',
          description: '当前迭代的序号（从 1 开始）。'
        },
        {
          name: 'end',
          label: '结束',
          type: 'FlowEvent',
          description: '当循环执行完指定次数后触发。'
        }
      ]
    };
  }

  validate(_config: Record<string, unknown>): void {
    // 无静态配置
  }

  async execute({ node, inputs, state }: NodeExecutionContext): Promise<NodeResult> {
    const stateKey = this.getStateKey(node.id);
    let loopState = state.get(stateKey) as FixedLoopState | undefined;

    if (!loopState) {
      const rawCount = this.first(inputs.count ?? node.config?.count);
      const total = this.resolveCount(rawCount);
      if (total <= 0) {
        return {
          outputs: {
            end: true,
            iteration: 0
          }
        };
      }
      loopState = { current: 0, total };
      state.set(stateKey, loopState);
    }

    loopState.current += 1;
    const hasMore = loopState.current < loopState.total;
    const outputs: Record<string, unknown> = {
      body: true,
      iteration: loopState.current
    };

    if (hasMore) {
      state.set(stateKey, loopState);
      return {
        outputs,
        repeat: true
      };
    }

    state.delete(stateKey);
    outputs.end = true;
    return {
      outputs,
      repeat: false
    };
  }

  private first(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }

  private resolveCount(value: unknown): number {
    if (typeof value === 'number') {
      return this.normalizeCount(value);
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 0;
      }
      const parsedDirect = Number(trimmed);
      if (!Number.isNaN(parsedDirect)) {
        return this.normalizeCount(parsedDirect);
      }
      try {
        const parsedJson = JSON.parse(trimmed);
        if (typeof parsedJson === 'number') {
          return this.normalizeCount(parsedJson);
        }
        if (typeof parsedJson === 'boolean') {
          return parsedJson ? 1 : 0;
        }
      } catch {
        // ignore json parse errors
      }
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return (${trimmed});`);
        const result = fn();
        if (typeof result === 'number') {
          return this.normalizeCount(result);
        }
        if (typeof result === 'boolean') {
          return result ? 1 : 0;
        }
      } catch (error) {
        throw new Error(`无法解析循环次数：${error instanceof Error ? error.message : String(error)}`);
      }
      throw new Error('循环次数必须为数值或可转换为数值的表达式。');
    }
    if (value === null || typeof value === 'undefined') {
      return 0;
    }
    if (Array.isArray(value)) {
      return this.normalizeCount(value.length);
    }
    if (typeof value === 'object') {
      return this.normalizeCount(Object.keys(value as Record<string, unknown>).length);
    }
    throw new Error('循环次数必须为数值或可转换为数值的表达式。');
  }

  private normalizeCount(value: number): number {
    if (!Number.isFinite(value)) {
      throw new Error('循环次数必须为有限数值。');
    }
    const rounded = Math.floor(value);
    return rounded < 0 ? 0 : rounded;
  }

  private getStateKey(nodeId: string): string {
    return `${nodeId}::fixedLoop`;
  }
}
