import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

function ensureString(value: unknown, label: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  throw new Error(`${label} 必须为字符串。`);
}

function ensureOptionalString(value: unknown, label: string): string | undefined {
  if (typeof value === 'undefined' || value === null) {
    return undefined;
  }
  return ensureString(value, label);
}

function ensureFiniteNumber(value: unknown, label: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error(`${label} 必须为有限数值。`);
}

function ensureBoolean(value: unknown, label: string, fallback: boolean): boolean {
  if (typeof value === 'undefined' || value === null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 0) {
      return false;
    }
    if (value === 1) {
      return true;
    }
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
    if (normalized === '1') {
      return true;
    }
    if (normalized === '0') {
      return false;
    }
  }
  throw new Error(`${label} 必须为布尔值。`);
}

function firstValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.length ? value[0] : undefined;
  }
  return value;
}

function collectStrings(value: unknown, label: string): string[] {
  if (typeof value === 'undefined' || value === null) {
    return [];
  }
  const queue: unknown[] = Array.isArray(value) ? [...value] : [value];
  const result: string[] = [];
  while (queue.length) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    result.push(ensureString(current, label));
  }
  return result;
}

abstract class BaseStringNode implements RuntimeNode {
  abstract readonly type: string;
  protected abstract readonly label: string;
  protected abstract readonly summary: string;

  protected get category(): string {
    return 'string';
  }

  protected buildCommonOutputs(): NodeSchema['outputs'] {
    return [
      {
        name: 'trigger',
        label: '触发信号',
        type: 'FlowEvent',
        description: '操作完成后发出的触发信号。',
        required: true
      },
      {
        name: 'result',
        label: '结果',
        type: 'string',
        description: '字符串处理后的输出。'
      }
    ];
  }

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: this.label,
      summary: this.summary,
      category: this.category,
      inputs: this.buildInputs(),
      outputs: this.buildCommonOutputs()
    };
  }

  validate(config: Record<string, unknown>): void {
    this.validateConfig(config);
  }

  async execute(context: NodeExecutionContext): Promise<NodeResult> {
    const result = await this.compute(context);
    return {
      outputs: {
        trigger: true,
        result
      }
    };
  }

  protected firstString(value: unknown, label: string): string {
    const selected = ensureOptionalString(firstValue(value), label);
    if (typeof selected === 'undefined') {
      throw new Error(`${label} 不能为空。`);
    }
    return selected;
  }

  protected optionalString(value: unknown, label: string): string | undefined {
    return ensureOptionalString(firstValue(value), label);
  }

  protected optionalNumber(value: unknown, label: string): number | undefined {
    const selected = firstValue(value);
    if (typeof selected === 'undefined' || selected === null) {
      return undefined;
    }
    return ensureFiniteNumber(selected, label);
  }

  protected optionalBoolean(value: unknown, label: string, fallback: boolean): boolean {
    const selected = firstValue(value);
    return ensureBoolean(selected, label, fallback);
  }

  protected strings(value: unknown, label: string): string[] {
    return collectStrings(value, label);
  }

  protected raw(value: unknown): unknown {
    return firstValue(value);
  }

  protected abstract buildInputs(): NodeSchema['inputs'];
  protected abstract validateConfig(config: Record<string, unknown>): void;
  protected abstract compute(context: NodeExecutionContext): Promise<string>;
}

interface ConcatConfig {
  separator?: unknown;
  values?: unknown;
}

export class StringConcatNode extends BaseStringNode {
  readonly type = 'StringConcat';
  protected readonly label = '字符串拼接';
  protected readonly summary = '拼接多个字符串，支持可选分隔符。';

  protected buildInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后执行拼接。',
        required: true
      },
      {
        name: 'values',
        label: '字符串列表',
        type: 'string',
        description: '要拼接的字符串，可连接多个输出或配置数组。',
        required: true
      },
      {
        name: 'separator',
        label: '分隔符',
        type: 'string',
        description: '可选分隔符，默认为空字符串。'
      }
    ];
  }

  protected validateConfig(config: Record<string, unknown>): void {
    const cast = config as ConcatConfig;
    if (typeof cast.separator !== 'undefined') {
      ensureString(cast.separator, '分隔符配置');
    }
    if (typeof cast.values !== 'undefined') {
      collectStrings(cast.values, '字符串列表配置');
    }
  }

  protected async compute({ inputs, node }: NodeExecutionContext): Promise<string> {
    const allStrings = this.strings(inputs.values, '字符串列表');
    const configured = node.config ? this.strings((node.config as ConcatConfig).values, '字符串列表配置') : [];
    const values = allStrings.length ? allStrings : configured;
    if (!values.length) {
      throw new Error('字符串拼接节点需要至少一个字符串输入。');
    }
    const separator = this.optionalString(inputs.separator, '分隔符输入') ?? ensureOptionalString((node.config as ConcatConfig | undefined)?.separator, '分隔符配置') ?? '';
    return values.join(separator);
  }
}

interface ReplaceConfig {
  replaceAll?: unknown;
}

export class StringReplaceNode extends BaseStringNode {
  readonly type = 'StringReplace';
  protected readonly label = '字符串替换';
  protected readonly summary = '将源字符串中的目标子串替换为指定内容。';

  protected buildInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后执行替换。',
        required: true
      },
      {
        name: 'source',
        label: '原始字符串',
        type: 'string',
        description: '待处理的源字符串。',
        required: true
      },
      {
        name: 'search',
        label: '匹配内容',
        type: 'string',
        description: '需要替换的子串。',
        required: true
      },
      {
        name: 'replacement',
        label: '替换内容',
        type: 'string',
        description: '用于替换的新子串。',
        required: true
      },
      {
        name: 'replaceAll',
        label: '替换全部',
        type: 'boolean',
        description: '为 true 时替换所有匹配项，否则只替换第一个匹配。'
      }
    ];
  }

  protected validateConfig(config: Record<string, unknown>): void {
    const cast = config as ReplaceConfig;
    if (typeof cast.replaceAll !== 'undefined') {
      ensureBoolean(cast.replaceAll, '替换全部配置', false);
    }
  }

  protected async compute({ inputs, node }: NodeExecutionContext): Promise<string> {
    const source = this.firstString(inputs.source, '原始字符串');
    const search = this.firstString(inputs.search, '匹配内容');
    const replacement = this.firstString(inputs.replacement, '替换内容');
    const configured = node.config as ReplaceConfig | undefined;
    const replaceAllInput = this.raw(inputs.replaceAll);
    let replaceAll: boolean;
    if (typeof replaceAllInput !== 'undefined' && replaceAllInput !== null) {
      replaceAll = ensureBoolean(replaceAllInput, '替换全部输入', false);
    } else if (typeof configured?.replaceAll !== 'undefined') {
      replaceAll = ensureBoolean(configured.replaceAll, '替换全部配置', false);
    } else {
      replaceAll = false;
    }

    if (!search.length) {
      return source;
    }
    if (replaceAll) {
      return source.split(search).join(replacement);
    }
    return source.replace(search, replacement);
  }
}

export class StringSliceNode extends BaseStringNode {
  readonly type = 'StringSlice';
  protected readonly label = '字符串截取';
  protected readonly summary = '按照起止索引截取字符串片段。';

  protected buildInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后执行截取。',
        required: true
      },
      {
        name: 'source',
        label: '原始字符串',
        type: 'string',
        description: '待截取的字符串。',
        required: true
      },
      {
        name: 'start',
        label: '起始位置',
        type: 'number',
        description: '截取起点索引，默认 0。'
      },
      {
        name: 'end',
        label: '结束位置',
        type: 'number',
        description: '截取终点索引（不包含该索引），留空表示截取到结尾。'
      }
    ];
  }

  protected validateConfig(_config: Record<string, unknown>): void {}

  protected async compute({ inputs }: NodeExecutionContext): Promise<string> {
    const source = this.firstString(inputs.source, '原始字符串');
    const start = this.optionalNumber(inputs.start, '起始位置') ?? 0;
    const end = this.optionalNumber(inputs.end, '结束位置');
    if (start < 0) {
      throw new Error('字符串截取节点的起始位置不能为负数。');
    }
    if (typeof end !== 'undefined' && end < start) {
      throw new Error('字符串截取节点的结束位置必须大于或等于起始位置。');
    }
    return typeof end === 'undefined' ? source.slice(start) : source.slice(start, end);
  }
}

export class StringUppercaseNode extends BaseStringNode {
  readonly type = 'StringUppercase';
  protected readonly label = '转大写';
  protected readonly summary = '将字符串转换为大写形式。';

  protected buildInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后转换。',
        required: true
      },
      {
        name: 'source',
        label: '原始字符串',
        type: 'string',
        description: '待转换的字符串。',
        required: true
      }
    ];
  }

  protected validateConfig(_config: Record<string, unknown>): void {}

  protected async compute({ inputs }: NodeExecutionContext): Promise<string> {
    const source = this.firstString(inputs.source, '原始字符串');
    return source.toUpperCase();
  }
}

export class StringLowercaseNode extends BaseStringNode {
  readonly type = 'StringLowercase';
  protected readonly label = '转小写';
  protected readonly summary = '将字符串转换为小写形式。';

  protected buildInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后转换。',
        required: true
      },
      {
        name: 'source',
        label: '原始字符串',
        type: 'string',
        description: '待转换的字符串。',
        required: true
      }
    ];
  }

  protected validateConfig(_config: Record<string, unknown>): void {}

  protected async compute({ inputs }: NodeExecutionContext): Promise<string> {
    const source = this.firstString(inputs.source, '原始字符串');
    return source.toLowerCase();
  }
}

export class StringTrimNode extends BaseStringNode {
  readonly type = 'StringTrim';
  protected readonly label = '去除空白';
  protected readonly summary = '去除字符串两端的空白字符。';

  protected buildInputs(): NodeSchema['inputs'] {
    return [
      {
        name: 'trigger',
        label: '触发器',
        type: 'FlowEvent',
        description: '收到触发信号后执行去空白。',
        required: true
      },
      {
        name: 'source',
        label: '原始字符串',
        type: 'string',
        description: '待处理的字符串。',
        required: true
      }
    ];
  }

  protected validateConfig(_config: Record<string, unknown>): void {}

  protected async compute({ inputs }: NodeExecutionContext): Promise<string> {
    const source = this.firstString(inputs.source, '原始字符串');
    return source.trim();
  }
}

export type StringNode =
  | StringConcatNode
  | StringReplaceNode
  | StringSliceNode
  | StringUppercaseNode
  | StringLowercaseNode
  | StringTrimNode;
