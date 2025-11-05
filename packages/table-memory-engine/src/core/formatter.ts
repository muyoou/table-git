import type { TagInstruction } from './types';
import type { TableSnapshot } from './table-adapter';

export interface FormatterContext {
  snapshot: TableSnapshot;
  instructions?: TagInstruction[];
  variables?: Record<string, unknown>;
  mode?: 'prompt' | 'json' | 'raw';
}

export type FormatterOutput = string | Record<string, unknown>;

export type FormatterFactory = (context: FormatterContext) => FormatterOutput | Promise<FormatterOutput>;

export interface FormatterEntry {
  name: string;
  title?: string;
  description?: string;
  factory: FormatterFactory;
  accepts?: (context: FormatterContext) => boolean;
}

export class FormatterRegistry {
  private readonly entries = new Map<string, FormatterEntry>();

  register(entry: FormatterEntry): void {
    this.entries.set(entry.name, entry);
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  list(): FormatterEntry[] {
    return [...this.entries.values()];
  }

  async format(name: string, context: FormatterContext): Promise<FormatterOutput> {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new Error(`Formatter '${name}' is not registered.`);
    }
    if (entry.accepts && !entry.accepts(context)) {
      throw new Error(`Formatter '${name}' rejected the provided context.`);
    }
    return entry.factory(context);
  }
}
