import { FormatterFunction, TableData } from './types';

export interface FunctionFormatterOptions<TOptions = any> {
  name: string;
  format: FormatterFunction<TOptions, string>;
  defaults?: TOptions;
}

// 简单的函数式格式化器包装器
export class FunctionFormatter<TOptions = any> {
  readonly name: string;
  private readonly fn: FormatterFunction<TOptions, string>;
  private readonly defaults?: TOptions;

  constructor(options: FunctionFormatterOptions<TOptions>) {
    this.name = options.name;
    this.fn = options.format;
    this.defaults = options.defaults;
  }

  run(data: TableData, options?: Partial<TOptions>): string {
    const finalOptions = { ...(this.defaults as any), ...(options as any) } as TOptions;
    return this.fn(data, finalOptions);
  }
}

// 一个简单的注册中心，支持用户注册自定义函数式格式
export class FormatterRegistry {
  private registry = new Map<string, FunctionFormatter<any>>();

  register(formatter: FunctionFormatter<any>) {
    this.registry.set(formatter.name, formatter);
  }

  unregister(name: string) {
    this.registry.delete(name);
  }

  list(): string[] {
    return [...this.registry.keys()];
  }

  format(name: string, data: TableData, options?: any): string {
    const f = this.registry.get(name);
    if (!f) throw new Error(`Formatter '${name}' is not registered`);
    return f.run(data, options);
  }
}
