import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

interface ComparisonConfig {
  a?: unknown;
  b?: unknown;
}

abstract class BaseComparisonNode<TOperand> implements RuntimeNode {
  abstract readonly type: string;
  protected abstract readonly label: string;
  protected abstract readonly summary: string;
  protected abstract readonly operandType: string;

  protected get category(): string {
    return 'conditions';
  }

  protected abstract convertOperand(raw: unknown, source: 'A' | 'B'): TOperand;
  protected abstract isValidConfigValue(value: unknown): boolean;
  protected abstract compare(a: TOperand, b: TOperand): boolean;

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: this.label,
      summary: this.summary,
      category: this.category,
      inputs: [
        {
          name: 'trigger',
          label: '触发器',
          type: 'FlowEvent',
          description: '收到触发信号后执行条件判断。',
          required: true
        },
        {
          name: 'a',
          label: '输入 A',
          type: this.operandType,
          description: '条件判断的左值。'
        },
        {
          name: 'b',
          label: '输入 B',
          type: this.operandType,
          description: '条件判断的右值。'
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '条件判断完成后触发下游节点。',
          required: true
        },
        {
          name: 'result',
          label: '比较结果',
          type: 'boolean',
          description: '比较结果的布尔值。'
        }
      ]
    } satisfies NodeSchema;
  }

  validate(config: Record<string, unknown>): void {
    const cast = config as ComparisonConfig;
    if (!this.isValidConfigValue(cast.a)) {
      throw new Error(`${this.label} 节点的配置输入 A 无法解析为有效的比较值。`);
    }
    if (!this.isValidConfigValue(cast.b)) {
      throw new Error(`${this.label} 节点的配置输入 B 无法解析为有效的比较值。`);
    }
  }

  async execute({ node, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const config = (node.config ?? {}) as ComparisonConfig;
    const aOperand = this.convertOperand(this.pickValue(inputs.a, config.a), 'A');
    const bOperand = this.convertOperand(this.pickValue(inputs.b, config.b), 'B');
    const result = this.compare(aOperand, bOperand);

    return {
      outputs: {
        trigger: true,
        result
      }
    } satisfies NodeResult;
  }

  private pickValue(primary: unknown, fallback: unknown): unknown {
    const candidate = typeof primary !== 'undefined' ? primary : fallback;
    const normalized = this.firstValue(candidate);
    if (typeof normalized !== 'undefined') {
      return normalized;
    }
    if (typeof fallback !== 'undefined') {
      return fallback;
    }
    return undefined;
  }

  private firstValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }
}

abstract class BaseNumericComparisonNode extends BaseComparisonNode<number> {
  protected readonly operandType = 'number';

  protected convertOperand(raw: unknown, source: 'A' | 'B'): number {
    if (typeof raw === 'undefined') {
      throw new Error(`${this.label} 节点需要提供数值输入 ${source}。`);
    }
    if (typeof raw === 'number') {
      return raw;
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        throw new Error(`${this.label} 节点需要提供数值输入 ${source}。`);
      }
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    throw new Error(`${this.label} 节点需要提供数值输入 ${source}。`);
  }

  protected isValidConfigValue(value: unknown): boolean {
    if (typeof value === 'undefined') {
      return true;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }
    if (typeof value === 'string') {
      return !Number.isNaN(Number(value.trim()));
    }
    return false;
  }
}

class ComparisonGreaterThanNode extends BaseNumericComparisonNode {
  readonly type = 'ComparisonGreaterThan';
  protected readonly label = '大于 (>)';
  protected readonly summary = '判断输入 A 是否大于输入 B。';

  protected compare(a: number, b: number): boolean {
    return a > b;
  }
}

class ComparisonLessThanNode extends BaseNumericComparisonNode {
  readonly type = 'ComparisonLessThan';
  protected readonly label = '小于 (<)';
  protected readonly summary = '判断输入 A 是否小于输入 B。';

  protected compare(a: number, b: number): boolean {
    return a < b;
  }
}

class ComparisonGreaterOrEqualNode extends BaseNumericComparisonNode {
  readonly type = 'ComparisonGreaterOrEqual';
  protected readonly label = '大于等于 (>=)';
  protected readonly summary = '判断输入 A 是否大于或等于输入 B。';

  protected compare(a: number, b: number): boolean {
    return a >= b;
  }
}

class ComparisonLessOrEqualNode extends BaseNumericComparisonNode {
  readonly type = 'ComparisonLessOrEqual';
  protected readonly label = '小于等于 (<=)';
  protected readonly summary = '判断输入 A 是否小于或等于输入 B。';

  protected compare(a: number, b: number): boolean {
    return a <= b;
  }
}

class ComparisonEqualNode extends BaseComparisonNode<unknown> {
  readonly type = 'ComparisonEqual';
  protected readonly label: string = '等于 (=)';
  protected readonly summary: string = '判断输入 A 是否与输入 B 相等。';
  protected readonly operandType: string = 'any';

  protected convertOperand(raw: unknown): unknown {
    if (typeof raw === 'undefined') {
      throw new Error(`${this.label} 节点需要提供输入值。`);
    }
    return normalizeFlexibleValue(raw);
  }

  protected isValidConfigValue(_value: unknown): boolean {
    return true;
  }

  protected compare(a: unknown, b: unknown): boolean {
    return areValuesEqual(a, b);
  }
}

class ComparisonNotEqualNode extends BaseComparisonNode<unknown> {
  readonly type = 'ComparisonNotEqual';
  protected readonly label: string = '不等于 (!=)';
  protected readonly summary: string = '判断输入 A 是否与输入 B 不相等。';
  protected readonly operandType: string = 'any';

  protected convertOperand(raw: unknown): unknown {
    if (typeof raw === 'undefined') {
      throw new Error(`${this.label} 节点需要提供输入值。`);
    }
    return normalizeFlexibleValue(raw);
  }

  protected isValidConfigValue(_value: unknown): boolean {
    return true;
  }

  protected compare(a: unknown, b: unknown): boolean {
    return !areValuesEqual(a, b);
  }
}

function normalizeFlexibleValue(value: unknown): unknown {
  const first = Array.isArray(value) ? (value.length ? value[0] : undefined) : value;
  if (typeof first === 'string') {
    const trimmed = first.trim();
    if (!trimmed) {
      return '';
    }
    if (/^[+-]?(?:\d+\.?\d*|\d*\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return first;
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Object.is(a, b);
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

export function registerComparisonNodes(runtime: RuntimeNodeRegistrar): void {
  runtime.register(new ComparisonGreaterThanNode());
  runtime.register(new ComparisonLessThanNode());
  runtime.register(new ComparisonGreaterOrEqualNode());
  runtime.register(new ComparisonLessOrEqualNode());
  runtime.register(new ComparisonEqualNode());
  runtime.register(new ComparisonNotEqualNode());
}

export interface RuntimeNodeRegistrar {
  register(node: RuntimeNode): void;
}

export {
  ComparisonGreaterThanNode,
  ComparisonLessThanNode,
  ComparisonGreaterOrEqualNode,
  ComparisonLessOrEqualNode,
  ComparisonEqualNode,
  ComparisonNotEqualNode
};
