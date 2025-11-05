import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';

abstract class BaseConstantNode<T> implements RuntimeNode {
	abstract readonly type: string;
	protected abstract readonly label: string;
	protected abstract readonly summary: string;
	protected abstract readonly dataType: string;

	getSchema(): NodeSchema {
		return {
			type: this.type,
			label: this.label,
			summary: this.summary,
			category: 'constant',
			inputs: [
				{
					name: 'value',
					label: '常量值',
					type: this.dataType,
							description: '作为节点输出的常量值。',
							required: true
				}
			],
			outputs: [
				{
					name: 'value',
					label: '常量值',
					type: this.dataType,
					description: '节点对外提供的常量结果。'
				}
			]
		};
	}

	validate(config: Record<string, unknown>): void {
		if (typeof config.value === 'undefined') {
			return;
		}
		this.coerceValue(config.value, '配置');
	}

	async execute({ inputs, node }: NodeExecutionContext): Promise<NodeResult> {
		const selected = this.resolveValue(inputs.value, node.config?.value);
		if (typeof selected === 'undefined') {
			throw new Error(`${this.label} 节点需要提供常量值，可通过输入端口或配置设置。`);
		}
		const value = this.coerceValue(selected, '输入');
		return { outputs: { value } };
	}

	private resolveValue(primary: unknown, fallback: unknown): unknown {
		if (typeof primary !== 'undefined') {
			return this.first(primary);
		}
		if (typeof fallback !== 'undefined') {
			return fallback;
		}
		return undefined;
	}

	private first(value: unknown): unknown {
		if (Array.isArray(value)) {
			return value.length > 0 ? value[0] : undefined;
		}
		return value;
	}

	protected abstract coerceValue(value: unknown, source: string): T;
}

export class StringConstantNode extends BaseConstantNode<string> {
	readonly type = 'ConstantString';
	protected readonly label = '字符串常量';
	protected readonly summary = '输出预设的字符串常量值。';
	protected readonly dataType = 'string';

	protected coerceValue(value: unknown, source: string): string {
		if (value === null || typeof value === 'undefined') {
			throw new Error(`${this.label} 节点的${source}常量值不能为空。`);
		}
		if (typeof value === 'string') {
			return value;
		}
		if (typeof value === 'number' || typeof value === 'boolean') {
			return String(value);
		}
		throw new Error(`${this.label} 节点的${source}常量值必须可以转换为字符串。`);
	}
}

export class NumberConstantNode extends BaseConstantNode<number> {
	readonly type = 'ConstantNumber';
	protected readonly label = '数字常量';
	protected readonly summary = '输出预设的数值常量。';
	protected readonly dataType = 'number';

	protected coerceValue(value: unknown, source: string): number {
		if (typeof value === 'number') {
			if (Number.isFinite(value)) {
				return value;
			}
			throw new Error(`${this.label} 节点的${source}常量值不是有限数值。`);
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) {
				throw new Error(`${this.label} 节点的${source}常量值不能为空字符串。`);
			}
			const parsed = Number(trimmed);
			if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
				return parsed;
			}
		}
		throw new Error(`${this.label} 节点的${source}常量值必须是数值或可转换为数值的字符串。`);
	}
}

export class BooleanConstantNode extends BaseConstantNode<boolean> {
	readonly type = 'ConstantBoolean';
	protected readonly label = '布尔常量';
	protected readonly summary = '输出预设的布尔常量。';
	protected readonly dataType = 'boolean';

	protected coerceValue(value: unknown, source: string): boolean {
		if (typeof value === 'boolean') {
			return value;
		}
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			if (normalized === 'true') {
				return true;
			}
			if (normalized === 'false') {
				return false;
			}
		}
		if (typeof value === 'number') {
			if (value === 1) {
				return true;
			}
			if (value === 0) {
				return false;
			}
		}
		throw new Error(`${this.label} 节点的${source}常量值必须是布尔值、0/1 或 true/false 字符串。`);
	}
}

export class ArrayConstantNode extends BaseConstantNode<unknown[]> {
	readonly type = 'ConstantArray';
	protected readonly label = '数组常量';
	protected readonly summary = '输出预设的数组常量。';
	protected readonly dataType = 'array';

	protected coerceValue(value: unknown, source: string): unknown[] {
		if (Array.isArray(value)) {
			return value;
		}
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) {
					return parsed;
				}
			} catch (error) {
				throw new Error(`${this.label} 节点的${source}常量值需要是 JSON 数组字符串。`);
			}
			throw new Error(`${this.label} 节点的${source}常量值需要是数组或 JSON 数组字符串。`);
		}
		throw new Error(`${this.label} 节点的${source}常量值需要是数组或 JSON 数组字符串。`);
	}
}

export class ObjectConstantNode extends BaseConstantNode<Record<string, unknown>> {
	readonly type = 'ConstantObject';
	protected readonly label = '对象常量';
	protected readonly summary = '输出预设的对象常量。';
	protected readonly dataType = 'object';

	protected coerceValue(value: unknown, source: string): Record<string, unknown> {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					return parsed as Record<string, unknown>;
				}
			} catch (error) {
				throw new Error(`${this.label} 节点的${source}常量值需要是 JSON 对象字符串。`);
			}
			throw new Error(`${this.label} 节点的${source}常量值需要是对象或 JSON 对象字符串。`);
		}
		throw new Error(`${this.label} 节点的${source}常量值需要是对象或 JSON 对象字符串。`);
	}
}

export type ConstantNode =
	| StringConstantNode
	| NumberConstantNode
	| BooleanConstantNode
	| ArrayConstantNode
	| ObjectConstantNode;
