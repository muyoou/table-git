import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

interface OperandConfig {
  a?: number;
  b?: number;
}

abstract class BaseBinaryMathNode implements RuntimeNode {
  abstract readonly type: string;
  protected abstract readonly label: string;
  protected abstract readonly summary: string;

  protected get category(): string {
    return 'math';
  }

  protected abstract compute(a: number, b: number): number;

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
          description: '收到触发信号后执行数学计算。',
          required: true
        },
        {
          name: 'a',
          label: '输入 A',
          type: 'number',
          description: '第一个操作数。'
        },
        {
          name: 'b',
          label: '输入 B',
          type: 'number',
          description: '第二个操作数。'
        }
      ],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '计算完成后继续触发下游节点。',
          required: true
        },
        {
          name: 'result',
          label: '计算结果',
          type: 'number',
          description: '数学运算的结果值。'
        }
      ]
    };
  }

  validate(config: Record<string, unknown>): void {
    const cast = config as OperandConfig;
    if (!this.isValidOperand(cast.a)) {
      throw new Error(`${this.label} 节点的配置输入 A 必须为数值。`);
    }
    if (!this.isValidOperand(cast.b)) {
      throw new Error(`${this.label} 节点的配置输入 B 必须为数值。`);
    }
  }

  async execute({ node, inputs }: NodeExecutionContext): Promise<NodeResult> {
    const operands = node.config as OperandConfig | undefined;
    const aRaw = this.firstValue(inputs.a ?? operands?.a);
    const bRaw = this.firstValue(inputs.b ?? operands?.b);
    const a = this.toNumber(aRaw, 'A');
    const b = this.toNumber(bRaw, 'B');
    this.ensureValidOperands(a, b);

    const result = this.compute(a, b);
    this.ensureFiniteResult(result);

    return {
      outputs: {
        trigger: true,
        result
      }
    };
  }

  protected ensureValidOperands(_a: number, _b: number): void {
    // subclasses may override for additional validation
  }

  protected ensureFiniteResult(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error(`${this.label} 节点计算结果不是有限数值。`);
    }
  }

  private isValidOperand(value: number | undefined): boolean {
    return typeof value === 'undefined' || typeof value === 'number';
  }

  private firstValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.length ? value[0] : undefined;
    }
    return value;
  }

  private toNumber(value: unknown, label: 'A' | 'B'): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim().length) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    throw new Error(`${this.label} 节点需要提供数值输入 ${label}。`);
  }
}

export class MathAddNode extends BaseBinaryMathNode {
  readonly type = 'MathAdd';
  protected readonly label = '加法';
  protected readonly summary = '计算两个数的加法。';

  protected compute(a: number, b: number): number {
    return a + b;
  }
}

export class MathSubtractNode extends BaseBinaryMathNode {
  readonly type = 'MathSubtract';
  protected readonly label = '减法';
  protected readonly summary = '计算两个数的减法。';

  protected compute(a: number, b: number): number {
    return a - b;
  }
}

export class MathMultiplyNode extends BaseBinaryMathNode {
  readonly type = 'MathMultiply';
  protected readonly label = '乘法';
  protected readonly summary = '计算两个数的乘积。';

  protected compute(a: number, b: number): number {
    return a * b;
  }
}

export class MathDivideNode extends BaseBinaryMathNode {
  readonly type = 'MathDivide';
  protected readonly label = '除法';
  protected readonly summary = '计算两个数的商。';

  protected compute(a: number, b: number): number {
    return a / b;
  }

  protected ensureValidOperands(_a: number, b: number): void {
    if (b === 0) {
      throw new Error('除法节点的输入 B 不能为 0。');
    }
  }
}

export class MathPowerNode extends BaseBinaryMathNode {
  readonly type = 'MathPower';
  protected readonly label = '幂运算';
  protected readonly summary = '计算输入 A 的输入 B 次方。';

  protected compute(a: number, b: number): number {
    return Math.pow(a, b);
  }
}
