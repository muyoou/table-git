import { FlowBuilder } from './flow-builder';
import type { EventFlowResolver } from './memory-workflow-engine';
import type { MemoryWorkflowEngine } from './memory-workflow-engine';
import type { MemoryEvent } from './memory-events';
import type { FlowContext } from '../core/types';

function baseContext(event: MemoryEvent): FlowContext {
  return {
    conversation: event.conversation ?? [],
    sheetId: event.sheetId ?? 'default',
    services: event.services ?? {},
    event: {
      id: event.id,
      type: event.type,
      actor: event.actor,
      timestamp: event.timestamp,
      payload: event.payload,
      context: event.context
    }
  };
}

function createInitFlow(): EventFlowResolver {
  const graph = FlowBuilder.create('memory-init', '表格初始化流程')
    .useNode('EventTableInit', {}, { id: 'event-init' })
    .useNode('LoadTable', {}, { id: 'load-table' })
    .useNode('FormatPrompt', { formatter: 'prompt' })
    .build();
  return {
    graph,
    createContext: baseContext
  };
}

function createAiReplyFlow(): EventFlowResolver {
  const graph = FlowBuilder.create('ai-reply', 'AI 回复流程')
    .useNode('EventAiReply', {}, { id: 'event-ai-reply' })
    .useNode('LoadTable', {}, { id: 'load-table' })
    .useNode('ParseTags')
    .useNode('ApplyChanges')
    .useNode('FormatPrompt', { formatter: 'prompt' })
    .build();
  return {
    graph,
    createContext: baseContext
  };
}

function createUserMessageFlow(): EventFlowResolver {
  const graph = FlowBuilder.create('user-message', '用户消息流程')
    .useNode('EventUserMessage', {}, { id: 'event-user-message' })
    .useNode('LoadTable', {}, { id: 'load-table' })
    .useNode('ParseTags')
    .useNode('ApplyChanges', { dryRun: true })
    .useNode('FormatPrompt', { formatter: 'prompt' })
    .build();
  return {
    graph,
    createContext: baseContext
  };
}

export function registerDefaultEventFlows(engine: MemoryWorkflowEngine): void {
  engine.register('table:init', createInitFlow());
  engine.register('ai:reply', createAiReplyFlow());
  engine.register('user:message', createUserMessageFlow());
}
