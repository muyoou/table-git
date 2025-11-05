import type { ConversationTurn, TagInstruction } from '../../core/types';
import type { TableSnapshot } from '../../core/table-adapter';
import type { NodeRuntime } from '../../runtime/node-runtime';
import { LoadTableNode } from './load-table';
import { ParseTagsNode } from './parse-tags';
import { ApplyChangesNode } from './apply-changes';
import { FormatPromptNode } from './format-prompt';
import { DebugLogNode } from './debug-log';
import { EventSourceNode, TableInitEventNode, AiReplyEventNode, UserMessageEventNode } from './event-source';
import { MathAddNode, MathSubtractNode, MathMultiplyNode, MathDivideNode, MathPowerNode } from './math-operations';
import { IfNode } from './if-node';
import { StringConstantNode, NumberConstantNode, BooleanConstantNode, ArrayConstantNode, ObjectConstantNode } from './constants';
import {
  StringConcatNode,
  StringReplaceNode,
  StringSliceNode,
  StringUppercaseNode,
  StringLowercaseNode,
  StringTrimNode
} from './string-operations';
import { RegexTestNode, RegexReplaceNode, RegexMatchNode, RegexSplitNode } from './regex-operations';
import {
  VariableGetArrayNode,
  VariableGetBooleanNode,
  VariableGetNumberNode,
  VariableGetObjectNode,
  VariableGetStringNode,
  VariableInitArrayNode,
  VariableInitBooleanNode,
  VariableInitNumberNode,
  VariableInitObjectNode,
  VariableInitStringNode,
  VariableSetArrayNode,
  VariableSetBooleanNode,
  VariableSetNumberNode,
  VariableSetObjectNode,
  VariableSetStringNode,
  VariableIncrementNode,
  VariableDecrementNode
} from './variables';
import { WhileLoopNode } from './while-loop';
import { FixedLoopNode } from './fixed-loop';
import {
  ComparisonGreaterThanNode,
  ComparisonLessThanNode,
  ComparisonGreaterOrEqualNode,
  ComparisonLessOrEqualNode,
  ComparisonEqualNode,
  ComparisonNotEqualNode
} from './comparison';

export function registerBuiltinNodes(runtime: NodeRuntime): void {
  runtime.register(new EventSourceNode());
  runtime.register(new TableInitEventNode());
  runtime.register(new AiReplyEventNode());
  runtime.register(new UserMessageEventNode());
  runtime.register(new LoadTableNode());
  runtime.register(new ParseTagsNode());
  runtime.register(new ApplyChangesNode());
  runtime.register(new FormatPromptNode());
  runtime.register(new DebugLogNode());
  runtime.register(new StringConstantNode());
  runtime.register(new NumberConstantNode());
  runtime.register(new BooleanConstantNode());
  runtime.register(new ArrayConstantNode());
  runtime.register(new ObjectConstantNode());
  runtime.register(new StringConcatNode());
  runtime.register(new StringReplaceNode());
  runtime.register(new StringSliceNode());
  runtime.register(new StringUppercaseNode());
  runtime.register(new StringLowercaseNode());
  runtime.register(new StringTrimNode());
  runtime.register(new RegexTestNode());
  runtime.register(new RegexReplaceNode());
  runtime.register(new RegexMatchNode());
  runtime.register(new RegexSplitNode());
  runtime.register(new MathAddNode());
  runtime.register(new MathSubtractNode());
  runtime.register(new MathMultiplyNode());
  runtime.register(new MathDivideNode());
  runtime.register(new MathPowerNode());
  runtime.register(new IfNode());
  runtime.register(new WhileLoopNode());
  runtime.register(new FixedLoopNode());
  runtime.register(new ComparisonGreaterThanNode());
  runtime.register(new ComparisonLessThanNode());
  runtime.register(new ComparisonGreaterOrEqualNode());
  runtime.register(new ComparisonLessOrEqualNode());
  runtime.register(new ComparisonEqualNode());
  runtime.register(new ComparisonNotEqualNode());
  runtime.register(new VariableGetStringNode());
  runtime.register(new VariableGetNumberNode());
  runtime.register(new VariableGetBooleanNode());
  runtime.register(new VariableGetArrayNode());
  runtime.register(new VariableGetObjectNode());
  runtime.register(new VariableSetStringNode());
  runtime.register(new VariableSetNumberNode());
  runtime.register(new VariableSetBooleanNode());
  runtime.register(new VariableSetArrayNode());
  runtime.register(new VariableSetObjectNode());
  runtime.register(new VariableInitStringNode());
  runtime.register(new VariableInitNumberNode());
  runtime.register(new VariableInitBooleanNode());
  runtime.register(new VariableInitArrayNode());
  runtime.register(new VariableInitObjectNode());
  runtime.register(new VariableIncrementNode());
  runtime.register(new VariableDecrementNode());

  registerBuiltinFormatters(runtime);
  registerBuiltinParser(runtime);
}

function registerBuiltinFormatters(runtime: NodeRuntime): void {
  const formatters = runtime.getFormatters();
  if (!formatters.has('prompt')) {
    formatters.register({
      name: 'prompt',
      title: 'Prompt Block',
      description: 'Creates a text block containing table metadata and rows.',
      factory: ({ snapshot }) => renderPrompt(snapshot)
    });
  }
  if (!formatters.has('json')) {
    formatters.register({
      name: 'json',
      title: 'JSON Payload',
      description: 'Returns a JSON structure representing the table snapshot.',
      factory: ({ snapshot }) => ({
        sheetId: snapshot.sheetId,
        revision: snapshot.revision,
        metadata: snapshot.metadata ?? {},
        rows: snapshot.rows
      })
    });
  }
}

function registerBuiltinParser(runtime: NodeRuntime): void {
  const parser = runtime.getParser();
  parser.register({
    name: 'tag-bracket-parser',
    match: turn => /\[\[table:/i.test(turn.content),
    parse: (turn: ConversationTurn) => parseBracketTags(turn.content)
  });
}

function parseBracketTags(content: string): TagInstruction[] {
  const pattern = /\[\[table:(?<action>[a-z\-]+)(?<args>[^\]]*)\]\]/gi;
  const instructions: TagInstruction[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const action = match.groups?.action ?? '';
    const args = parseArgs(match.groups?.args ?? '');
    instructions.push({
      tag: match[0],
      action,
      target: {
        sheetId: args.sheet ?? args.sheetId
      },
      payload: args,
      raw: match[0]
    });
  }
  return instructions;
}

function parseArgs(input: string): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  const tokens = input.split(/\s+/).map(token => token.trim()).filter(Boolean);
  for (const token of tokens) {
    const [key, value] = token.split('=');
    if (!key) {
      continue;
    }
    const normalizedKey = key.trim();
    args[normalizedKey] = parseValue(value?.trim());
  }
  return args;
}

function parseValue(raw?: string): unknown {
  if (!raw) {
    return true;
  }
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  if (/^\d+\.\d+$/.test(raw)) {
    return Number(raw);
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return raw.replace(/^"|"$/g, '');
}

function renderPrompt(snapshot: TableSnapshot): string {
  const header = snapshot.columns ?? snapshot.rows[0]?.map((_, index) => `C${index}`) ?? [];
  const rows = snapshot.rows.map((row, idx) => {
    const cells = row.map((cell, cellIndex) => `${header[cellIndex] ?? cellIndex}: ${String(cell)}`);
    return `Row ${idx}: ${cells.join(', ')}`;
  });

  const metadata = snapshot.metadata ? JSON.stringify(snapshot.metadata) : '{}';

  return [
    `Sheet: ${snapshot.sheetId}`,
    `Revision: ${snapshot.revision ?? 'unknown'}`,
    `Metadata: ${metadata}`,
    'Rows:',
    ...rows
  ].join('\n');
}
