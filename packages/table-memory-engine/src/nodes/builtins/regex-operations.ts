import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema, PortDefinition } from '../../runtime/graph-types';

function firstValue<T = unknown>(value: T): T extends unknown[] ? T[number] | undefined : T | undefined;
function firstValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.length ? value[0] : undefined;
	}
	return value;
}

function ensureString(value: unknown, label: string): string {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	throw new Error(`${label} 必须为字符串。`);
}

function optionalString(value: unknown, label: string): string | undefined {
	if (typeof value === 'undefined' || value === null) {
		return undefined;
	}
	return ensureString(value, label);
}

const FLAG_PATTERN = /^[gimsuyd]*$/;

function normalizeFlags(value: unknown, label: string): string | undefined {
	const raw = optionalString(value, label);
	if (typeof raw === 'undefined') {
		return undefined;
	}
	if (!FLAG_PATTERN.test(raw)) {
		throw new Error(`${label} 包含不支持的正则标志。`);
	}
	const unique = Array.from(new Set(raw.split(''))).join('');
	return unique;
}

function buildRegExp(pattern: string, flags?: string): RegExp {
	try {
		return new RegExp(pattern, flags);
	} catch (error) {
		throw new Error(`无法创建正则表达式：${(error as Error).message}`);
	}
}

function withFlag(flags: string | undefined, required: string): string {
	const set = new Set((flags ?? '').split('').filter(Boolean));
	set.add(required);
	return Array.from(set).join('');
}

interface RegexConfig {
	pattern?: unknown;
	flags?: unknown;
}

abstract class BaseRegexNode implements RuntimeNode {
	abstract readonly type: string;
	protected abstract readonly label: string;
	protected abstract readonly summary: string;

	protected get category(): string {
		return 'regex';
	}

	getSchema(): NodeSchema {
		return {
			type: this.type,
			label: this.label,
			summary: this.summary,
			category: this.category,
			inputs: this.buildInputs(),
			outputs: this.buildOutputs()
		};
	}

	validate(config: Record<string, unknown>): void {
		this.validateConfig(config);
	}

	async execute(context: NodeExecutionContext): Promise<NodeResult> {
		const payload = await this.compute(context);
		return {
			outputs: {
				trigger: true,
				...payload
			}
		};
	}

	protected resolvePattern(config: RegexConfig | undefined, inputs: Record<string, unknown>): { pattern: string; flags?: string } {
		const patternInput = firstValue(inputs.pattern);
		const flagsInput = firstValue(inputs.flags);
		const pattern = optionalString(patternInput, '模式输入') ?? optionalString(config?.pattern, '模式配置');
		if (typeof pattern === 'undefined') {
			throw new Error(`${this.label} 节点需要提供正则模式，可通过输入或配置设置。`);
		}
		const flags = normalizeFlags(flagsInput, '标志输入') ?? normalizeFlags(config?.flags, '标志配置');
		return { pattern, flags };
	}

		protected buildOutputs(): PortDefinition[] {
			const extras = this.additionalOutputs() ?? [];
			return [
				{
					name: 'trigger',
					label: '触发信号',
					type: 'FlowEvent',
					description: '正则操作完成后的触发信号。',
					required: true
				},
				...extras
			];
	}

	protected abstract buildInputs(): NodeSchema['inputs'];
		protected abstract additionalOutputs(): PortDefinition[] | undefined;
	protected abstract validateConfig(config: Record<string, unknown>): void;
	protected abstract compute(context: NodeExecutionContext): Promise<Record<string, unknown>>;
}

interface RegexTestConfig extends RegexConfig {}

export class RegexTestNode extends BaseRegexNode {
	readonly type = 'RegexTest';
	protected readonly label = '正则匹配检测';
	protected readonly summary = '检测字符串是否匹配指定的正则表达式模式。';

	protected buildInputs(): NodeSchema['inputs'] {
		return [
			{
				name: 'trigger',
				label: '触发器',
				type: 'FlowEvent',
				description: '收到触发信号后执行匹配检测。',
				required: true
			},
			{
				name: 'source',
				label: '源字符串',
				type: 'string',
				description: '待检测的字符串。',
				required: true
			},
			{
				name: 'pattern',
				label: '正则模式',
				type: 'string',
				description: '正则表达式的模式字符串。',
				required: true
			},
			{
				name: 'flags',
				label: '正则标志',
				type: 'string',
				description: '可选的正则标志，如 g、i、m 等。'
			}
		];
	}

		protected additionalOutputs(): PortDefinition[] {
		return [
			{
				name: 'matched',
				label: '是否匹配',
				type: 'boolean',
				description: '正则匹配是否成功。'
			}
		];
	}

	protected validateConfig(config: Record<string, unknown>): void {
		const cast = config as RegexTestConfig;
		if (typeof cast.pattern !== 'undefined') {
			ensureString(cast.pattern, '模式配置');
		}
		if (typeof cast.flags !== 'undefined') {
			normalizeFlags(cast.flags, '标志配置');
		}
	}

		protected async compute({ inputs, node }: NodeExecutionContext): Promise<Record<string, unknown>> {
			const config = node.config as RegexTestConfig | undefined;
			const { pattern, flags } = this.resolvePattern(config, inputs);
		const source = ensureString(firstValue(inputs.source), '源字符串');
		const regex = buildRegExp(pattern, flags);
		return { matched: regex.test(source) };
	}
}

interface RegexReplaceConfig extends RegexConfig {
	replacement?: unknown;
}

export class RegexReplaceNode extends BaseRegexNode {
	readonly type = 'RegexReplace';
	protected readonly label = '正则替换';
	protected readonly summary = '使用正则表达式替换字符串中的内容。';

	protected buildInputs(): NodeSchema['inputs'] {
		return [
			{
				name: 'trigger',
				label: '触发器',
				type: 'FlowEvent',
				description: '收到触发信号后执行正则替换。',
				required: true
			},
			{
				name: 'source',
				label: '源字符串',
				type: 'string',
				description: '待替换的字符串。',
				required: true
			},
			{
				name: 'pattern',
				label: '正则模式',
				type: 'string',
				description: '正则表达式的模式字符串。',
				required: true
			},
			{
				name: 'replacement',
				label: '替换内容',
				type: 'string',
				description: '用于替换匹配结果的字符串。',
				required: true
			},
			{
				name: 'flags',
				label: '正则标志',
				type: 'string',
				description: '可选的正则标志，如 g、i、m 等。'
			}
		];
	}

		protected additionalOutputs(): PortDefinition[] {
		return [
			{
				name: 'result',
				label: '替换结果',
				type: 'string',
				description: '执行替换后的字符串。'
			}
		];
	}

	protected validateConfig(config: Record<string, unknown>): void {
		const cast = config as RegexReplaceConfig;
		if (typeof cast.pattern !== 'undefined') {
			ensureString(cast.pattern, '模式配置');
		}
		if (typeof cast.flags !== 'undefined') {
			normalizeFlags(cast.flags, '标志配置');
		}
		if (typeof cast.replacement !== 'undefined') {
			ensureString(cast.replacement, '替换内容配置');
		}
	}

	protected async compute({ inputs, node }: NodeExecutionContext): Promise<Record<string, unknown>> {
		const config = node.config as RegexReplaceConfig | undefined;
		const { pattern, flags } = this.resolvePattern(config, inputs);
		const source = ensureString(firstValue(inputs.source), '源字符串');
		const replacementInput = firstValue(inputs.replacement);
		const replacement = optionalString(replacementInput, '替换内容输入') ?? optionalString(config?.replacement, '替换内容配置');
		if (typeof replacement === 'undefined') {
			throw new Error('正则替换节点需要提供替换内容。');
		}
		const regex = buildRegExp(pattern, flags);
		return { result: source.replace(regex, replacement) };
	}
}

interface RegexMatchConfig extends RegexConfig {}

export class RegexMatchNode extends BaseRegexNode {
	readonly type = 'RegexMatch';
	protected readonly label = '正则匹配';
	protected readonly summary = '执行正则匹配，返回全部匹配结果与捕获组。';

	protected buildInputs(): NodeSchema['inputs'] {
		return [
			{
				name: 'trigger',
				label: '触发器',
				type: 'FlowEvent',
				description: '收到触发信号后执行正则匹配。',
				required: true
			},
			{
				name: 'source',
				label: '源字符串',
				type: 'string',
				description: '待匹配的字符串。',
				required: true
			},
			{
				name: 'pattern',
				label: '正则模式',
				type: 'string',
				description: '正则表达式的模式字符串。',
				required: true
			},
			{
				name: 'flags',
				label: '正则标志',
				type: 'string',
				description: '可选的正则标志，如 g、i、m 等。'
			}
		];
	}

		protected additionalOutputs(): PortDefinition[] {
		return [
			{
				name: 'matches',
				label: '全部匹配',
				type: 'array',
				description: '匹配到的完整结果列表。'
			},
			{
				name: 'firstMatch',
				label: '首个匹配',
				type: 'string',
				description: '第一个匹配到的完整结果。'
			},
			{
				name: 'captures',
				label: '捕获组',
				type: 'array',
				description: '第一个匹配的捕获组数组。'
			},
			{
				name: 'namedGroups',
				label: '命名捕获组',
				type: 'object',
				description: '第一个匹配的命名捕获组字典。'
			}
		];
	}

	protected validateConfig(config: Record<string, unknown>): void {
		const cast = config as RegexMatchConfig;
		if (typeof cast.pattern !== 'undefined') {
			ensureString(cast.pattern, '模式配置');
		}
		if (typeof cast.flags !== 'undefined') {
			normalizeFlags(cast.flags, '标志配置');
		}
	}

		protected async compute({ inputs, node }: NodeExecutionContext): Promise<Record<string, unknown>> {
		const config = node.config as RegexMatchConfig | undefined;
		const { pattern, flags } = this.resolvePattern(config, inputs);
		const source = ensureString(firstValue(inputs.source), '源字符串');
		const regex = buildRegExp(pattern, flags);

			const baseFlags = flags ?? '';
			const globalRegex = buildRegExp(pattern, withFlag(baseFlags, 'g'));

		const matches: string[] = [];
		const captures: string[] = [];
		let namedGroups: Record<string, string> | undefined;

		for (const match of source.matchAll(globalRegex)) {
			matches.push(match[0] ?? '');
			if (!captures.length && match.length > 1) {
				captures.push(...match.slice(1).map(value => (typeof value === 'string' ? value : '')));
			}
			if (!namedGroups && match.groups) {
				namedGroups = Object.fromEntries(
					Object.entries(match.groups).map(([key, value]) => [key, typeof value === 'string' ? value : ''])
				);
			}
		}

		let firstMatch: string | undefined;
		let captureArray = captures;
		if (!matches.length) {
			const singleMatch = regex.exec(source);
			if (singleMatch) {
				firstMatch = singleMatch[0] ?? '';
				if (!captureArray.length && singleMatch.length > 1) {
					captureArray = singleMatch.slice(1).map(value => (typeof value === 'string' ? value : ''));
				}
				if (!namedGroups && singleMatch.groups) {
					namedGroups = Object.fromEntries(
						Object.entries(singleMatch.groups).map(([key, value]) => [key, typeof value === 'string' ? value : ''])
					);
				}
			}
		} else {
			firstMatch = matches[0];
		}

		return {
			matches,
			firstMatch,
			captures: captureArray,
			namedGroups
		};
	}
}

interface RegexSplitConfig extends RegexConfig {}

export class RegexSplitNode extends BaseRegexNode {
	readonly type = 'RegexSplit';
	protected readonly label = '正则分割';
	protected readonly summary = '按正则表达式拆分字符串。';

	protected buildInputs(): NodeSchema['inputs'] {
		return [
			{
				name: 'trigger',
				label: '触发器',
				type: 'FlowEvent',
				description: '收到触发信号后执行分割。',
				required: true
			},
			{
				name: 'source',
				label: '源字符串',
				type: 'string',
				description: '待分割的字符串。',
				required: true
			},
			{
				name: 'pattern',
				label: '正则模式',
				type: 'string',
				description: '正则表达式的模式字符串。',
				required: true
			},
			{
				name: 'flags',
				label: '正则标志',
				type: 'string',
				description: '可选的正则标志，如 g、i、m 等。'
			}
		];
	}

		protected additionalOutputs(): PortDefinition[] {
		return [
			{
				name: 'parts',
				label: '分割结果',
				type: 'array',
				description: '拆分后的字符串数组。'
			}
		];
	}

	protected validateConfig(config: Record<string, unknown>): void {
		const cast = config as RegexSplitConfig;
		if (typeof cast.pattern !== 'undefined') {
			ensureString(cast.pattern, '模式配置');
		}
		if (typeof cast.flags !== 'undefined') {
			normalizeFlags(cast.flags, '标志配置');
		}
	}

	protected async compute({ inputs, node }: NodeExecutionContext): Promise<Record<string, unknown>> {
		const config = node.config as RegexSplitConfig | undefined;
		const { pattern, flags } = this.resolvePattern(config, inputs);
		const source = ensureString(firstValue(inputs.source), '源字符串');
		const regex = buildRegExp(pattern, flags);
		return { parts: source.split(regex) };
	}
}

export type RegexNode = RegexTestNode | RegexReplaceNode | RegexMatchNode | RegexSplitNode;
