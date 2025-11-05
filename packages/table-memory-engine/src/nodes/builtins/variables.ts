import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

type VariableValueType = 'string' | 'number' | 'boolean' | 'array' | 'object';

interface VariableNodeConfig {
  variableId?: string;
  variableName: string;
  variableType: VariableValueType;
  defaultValue?: unknown;
  initialValue?: unknown;
}

interface VariableTypeShape {
  readonly portType: string;
  readonly displayName: string;
  coerce(value: unknown, label: string): unknown;
  clone(value: unknown): unknown;
}

const VARIABLE_TYPES: Record<VariableValueType, VariableTypeShape> = {
  string: {
    portType: 'string',
    displayName: '字符串',
    coerce(value, label) {
      if (value === undefined) {
        return '';
      }
      if (value === null) {
        throw new Error(`${label} 不能为 null。`);
      }
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      throw new Error(`${label} 必须为字符串。`);
    },
    clone(value) {
      return typeof value === 'undefined' ? '' : String(value);
    }
  },
  number: {
    portType: 'number',
    displayName: '数字',
    coerce(value, label) {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        throw new Error(`${label} 不能为 null。`);
      }
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          throw new Error(`${label} 必须为有限数值。`);
        }
        return value;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          return undefined;
        }
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed)) {
          throw new Error(`${label} 必须为合法的数值。`);
        }
        return parsed;
      }
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      throw new Error(`${label} 必须为数值。`);
    },
    clone(value) {
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      return undefined;
    }
  },
  boolean: {
    portType: 'boolean',
    displayName: '布尔',
    coerce(value, label) {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        throw new Error(`${label} 不能为 null。`);
      }
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        if (value === 1) {
          return true;
        }
        if (value === 0) {
          return false;
        }
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
          return undefined;
        }
        if (['true', '1', 'yes', 'on'].includes(normalized)) {
          return true;
        }
        if (['false', '0', 'no', 'off'].includes(normalized)) {
          return false;
        }
      }
      throw new Error(`${label} 必须为布尔值。`);
    },
    clone(value) {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) {
          return true;
        }
        if (['false', '0', 'no', 'off'].includes(normalized)) {
          return false;
        }
      }
      return undefined;
    }
  },
  array: {
    portType: 'array',
    displayName: '数组',
    coerce(value, label) {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        throw new Error(`${label} 不能为 null。`);
      }
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          return undefined;
        }
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (error) {
          throw new Error(`${label} 需要是 JSON 数组格式：${(error as Error).message}`);
        }
        throw new Error(`${label} 需要是数组或 JSON 数组字符串。`);
      }
      throw new Error(`${label} 需要是数组。`);
    },
    clone(value) {
      if (!value) {
        return [];
      }
      return Array.isArray(value) ? value.map(item => cloneValue(item)) : [];
    }
  },
  object: {
    portType: 'object',
    displayName: '对象',
    coerce(value, label) {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        throw new Error(`${label} 不能为 null。`);
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          return undefined;
        }
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
          }
        } catch (error) {
          throw new Error(`${label} 需要是 JSON 对象格式：${(error as Error).message}`);
        }
        throw new Error(`${label} 需要是对象或 JSON 对象字符串。`);
      }
      throw new Error(`${label} 需要是对象。`);
    },
    clone(value) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
      }
      const result: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        result[key] = cloneValue(item);
      }
      return result;
    }
  }
};

function ensureVariablesContainer(services: NodeExecutionContext['services'], nodeType: string): Record<string, unknown> {
  const container = services.variables;
  if (!container || typeof container !== 'object') {
    throw new Error(`${nodeType} 节点需要变量服务，请确认运行环境支持变量。`);
  }
  return container as Record<string, unknown>;
}

function firstValue(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.length ? input[0] : undefined;
  }
  return input;
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const duplicated: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      duplicated[key] = cloneValue(item);
    }
    return duplicated as unknown as T;
  }
  return value;
}

abstract class BaseVariableNode implements RuntimeNode {
  abstract readonly type: string;
  protected abstract readonly actionLabel: string;
  protected abstract readonly variableType: VariableValueType;
  abstract readonly summary: string;

  abstract execute(context: NodeExecutionContext): Promise<NodeResult>;

  protected get shape(): VariableTypeShape {
    return VARIABLE_TYPES[this.variableType];
  }

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: `${this.actionLabel}（${this.shape.displayName}）`,
      summary: this.summary,
      category: 'variables',
      uiHints: {
        showInMenu: false
      },
      inputs: this.defineInputs(),
      outputs: this.defineOutputs()
    };
  }

  validate(config: Record<string, unknown>): void {
    const cast = config as unknown as VariableNodeConfig | undefined;
    if (!cast || !cast.variableName || typeof cast.variableName !== 'string') {
      throw new Error(`${this.actionLabel} 节点需要配置变量名称。`);
    }
    if (cast.variableType !== this.variableType) {
      throw new Error(`${this.actionLabel} 节点变量类型与当前节点类型不匹配。`);
    }
  }

  protected defineInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后执行变量操作。',
        required: true
      }
    ];
  }

  protected defineOutputs(): NodeSchema['outputs'] {
    return [
      {
        name: 'trigger',
        label: '触发信号',
        type: 'FlowEvent',
        description: '变量操作完成后的触发信号。',
        required: true
      }
    ];
  }

  protected getVariableConfig(node: NodeExecutionContext['node']): VariableNodeConfig {
    const config = node.config as unknown as VariableNodeConfig | undefined;
    if (!config) {
      throw new Error(`${this.actionLabel} 节点缺少变量配置。`);
    }
    return config;
  }
}

abstract class BaseVariableValueNode extends BaseVariableNode {
  protected defineOutputs(): NodeSchema['outputs'] {
    const outputs = super.defineOutputs() ?? [];
    outputs.push({
      name: 'value',
      label: '变量值',
      type: this.shape.portType,
      description: '当前变量的值。'
    });
    return outputs;
  }
}

abstract class BaseVariableSetterNode extends BaseVariableNode {
  protected defineInputs(): NodeSchema['inputs'] {
    const inputs = super.defineInputs() ?? [];
    inputs.push({
      name: 'value',
      label: '变量值',
      type: this.shape.portType,
      description: '要写入变量的新值。',
      required: true
    });
    return inputs;
  }

  protected defineOutputs(): NodeSchema['outputs'] {
    const outputs = super.defineOutputs() ?? [];
    outputs.push({
      name: 'value',
      label: '变量值',
      type: this.shape.portType,
      description: '写入后的变量值。'
    });
    outputs.push({
      name: 'previous',
      label: '原始值',
      type: this.shape.portType,
      description: '写入前的变量值。'
    });
    return outputs;
  }
}

abstract class VariableGetBase extends BaseVariableValueNode {
  protected readonly actionLabel = '读取变量';
  readonly summary = '读取指定变量的当前值并继续执行流程。';

  async execute({ node, services }: NodeExecutionContext): Promise<NodeResult> {
    const config = this.getVariableConfig(node);
    const container = ensureVariablesContainer(services, this.actionLabel);
    const value = container[config.variableName];

    return {
      outputs: {
        trigger: true,
        value: value === undefined ? config.defaultValue : value
      }
    };
  }
}

abstract class VariableSetBase extends BaseVariableSetterNode {
  protected readonly actionLabel = '写入变量';
  readonly summary = '将传入值写入到指定变量并输出新旧数值。';

  async execute({ node, inputs, services }: NodeExecutionContext): Promise<NodeResult> {
    const config = this.getVariableConfig(node);
    const container = ensureVariablesContainer(services, this.actionLabel);
    const typeShape = this.shape;
    const incoming = firstValue(inputs.value);
    const nextValue = typeShape.coerce(incoming, '变量输入值');
    const previous = container[config.variableName];
    container[config.variableName] = cloneValue(nextValue);

    return {
      outputs: {
        trigger: true,
        value: container[config.variableName],
        previous: previous === undefined ? config.defaultValue : previous
      }
    };
  }
}

abstract class VariableInitBase extends BaseVariableValueNode {
  protected readonly actionLabel = '初始化变量';
  readonly summary = '将变量重置为预定义的初始值，并输出重置后的结果。';

  async execute({ node, services }: NodeExecutionContext): Promise<NodeResult> {
    const config = this.getVariableConfig(node);
    const container = ensureVariablesContainer(services, this.actionLabel);
    const typeShape = this.shape;
    const base = config.initialValue ?? config.defaultValue;
    const coerced = typeShape.coerce(base, '变量初始值');
    container[config.variableName] = cloneValue(coerced);

    return {
      outputs: {
        trigger: true,
        value: container[config.variableName]
      }
    };
  }
}

abstract class VariableAdjustBase extends BaseVariableNode {
  protected abstract readonly direction: 1 | -1;
  protected readonly variableType: VariableValueType = 'number';
  protected abstract readonly actionLabel: string;
  abstract readonly summary: string;

  protected defineInputs(): NodeSchema['inputs'] {
    const inputs = super.defineInputs() ?? [];
    inputs.push({
      name: 'amount',
      label: '调整值',
      type: 'number',
      description: '增减变量时使用的数值，默认为 1。',
      required: false
    });
    return inputs;
  }

  async execute({ node, inputs, services }: NodeExecutionContext): Promise<NodeResult> {
    const config = this.getVariableConfig(node);
    const container = ensureVariablesContainer(services, this.actionLabel);
    const amountRaw = firstValue(inputs.amount ?? (node.config as Record<string, unknown> | undefined)?.amount);
    const amountValue = this.coerceAmount(amountRaw);
    const currentRaw = container[config.variableName];

    const currentValue = this.resolveCurrentValue(currentRaw, config);
    const nextValue = currentValue + this.direction * amountValue;

    container[config.variableName] = cloneValue(nextValue);

    return {
      outputs: {
        trigger: true
      }
    };
  }

  private coerceAmount(raw: unknown): number {
    const coerced = typeof raw === 'undefined' ? undefined : this.shape.coerce(raw, '变量增减幅度');
    if (typeof coerced === 'number') {
      if (!Number.isFinite(coerced)) {
        throw new Error('变量增减幅度必须为有限数值。');
      }
      return coerced;
    }
    return 1;
  }

  private resolveCurrentValue(current: unknown, config: VariableNodeConfig): number {
    const prioritized = typeof current === 'undefined' ? config.defaultValue : current;
    const coerced = typeof prioritized === 'undefined' ? undefined : this.shape.coerce(prioritized, '变量当前值');
    if (typeof coerced === 'number') {
      return coerced;
    }
    return 0;
  }
}

export class VariableGetStringNode extends VariableGetBase {
  readonly type = 'VariableGetString';
  protected readonly variableType: VariableValueType = 'string';
}

export class VariableGetNumberNode extends VariableGetBase {
  readonly type = 'VariableGetNumber';
  protected readonly variableType: VariableValueType = 'number';
}

export class VariableGetBooleanNode extends VariableGetBase {
  readonly type = 'VariableGetBoolean';
  protected readonly variableType: VariableValueType = 'boolean';
}

export class VariableGetArrayNode extends VariableGetBase {
  readonly type = 'VariableGetArray';
  protected readonly variableType: VariableValueType = 'array';
}

export class VariableGetObjectNode extends VariableGetBase {
  readonly type = 'VariableGetObject';
  protected readonly variableType: VariableValueType = 'object';
}

export class VariableSetStringNode extends VariableSetBase {
  readonly type = 'VariableSetString';
  protected readonly variableType: VariableValueType = 'string';
}

export class VariableSetNumberNode extends VariableSetBase {
  readonly type = 'VariableSetNumber';
  protected readonly variableType: VariableValueType = 'number';
}

export class VariableSetBooleanNode extends VariableSetBase {
  readonly type = 'VariableSetBoolean';
  protected readonly variableType: VariableValueType = 'boolean';
}

export class VariableSetArrayNode extends VariableSetBase {
  readonly type = 'VariableSetArray';
  protected readonly variableType: VariableValueType = 'array';
}

export class VariableSetObjectNode extends VariableSetBase {
  readonly type = 'VariableSetObject';
  protected readonly variableType: VariableValueType = 'object';
}

export class VariableInitStringNode extends VariableInitBase {
  readonly type = 'VariableInitString';
  protected readonly variableType: VariableValueType = 'string';
}

export class VariableInitNumberNode extends VariableInitBase {
  readonly type = 'VariableInitNumber';
  protected readonly variableType: VariableValueType = 'number';
}

export class VariableInitBooleanNode extends VariableInitBase {
  readonly type = 'VariableInitBoolean';
  protected readonly variableType: VariableValueType = 'boolean';
}

export class VariableInitArrayNode extends VariableInitBase {
  readonly type = 'VariableInitArray';
  protected readonly variableType: VariableValueType = 'array';
}

export class VariableInitObjectNode extends VariableInitBase {
  readonly type = 'VariableInitObject';
  protected readonly variableType: VariableValueType = 'object';
}

export class VariableIncrementNode extends VariableAdjustBase {
  readonly type = 'VariableIncrement';
  protected readonly actionLabel = '变量自增';
  protected readonly direction: 1 | -1 = 1;
  readonly summary = '为指定的数值变量增加特定的数值（默认为 1）。';
}

export class VariableDecrementNode extends VariableAdjustBase {
  readonly type = 'VariableDecrement';
  protected readonly actionLabel = '变量自减';
  protected readonly direction: 1 | -1 = -1;
  readonly summary = '为指定的数值变量减少特定的数值（默认为 1）。';
}
