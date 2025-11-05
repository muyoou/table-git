import type { NodeResult } from '../../core/types';
import type { NodeExecutionContext, RuntimeNode } from '../base-node';
import type { NodeSchema } from '../../runtime/graph-types';
import type { MemoryEvent } from '../../runtime/memory-events';

function isMemoryEvent(value: unknown): value is MemoryEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.type === 'string';
}

interface EventNodeOptions {
  type: string;
  label: string;
  summary: string;
  eventType?: string;
}

abstract class BaseEventNode implements RuntimeNode {
  readonly type: string;
  private readonly label: string;
  private readonly summary: string;
  private readonly eventType?: string;

  protected constructor(options: EventNodeOptions) {
    this.type = options.type;
    this.label = options.label;
    this.summary = options.summary;
    this.eventType = options.eventType;
  }

  getSchema(): NodeSchema {
    return {
      type: this.type,
      label: this.label,
      summary: this.summary,
      category: 'event',
      uiHints: {
        theme: 'event'
      },
      inputs: [],
      outputs: [
        {
          name: 'trigger',
          label: '触发信号',
          type: 'FlowEvent',
          description: '事件到达时发出的触发信号。',
          required: true
        },
        {
          name: 'event',
          label: '事件数据',
          type: 'MemoryEvent',
          description: '完整的事件对象内容。'
        },
        {
          name: 'payload',
          label: '事件负载',
          type: 'any',
          description: '事件中携带的业务负载数据。'
        }
      ]
    };
  }

  async execute({ node, flowContext, services }: NodeExecutionContext): Promise<NodeResult> {
    const eventInfo = this.extractEvent(flowContext);
    services.log?.('Event received', {
      nodeId: node.id,
      nodeType: this.type,
      eventType: eventInfo?.type,
      payload: eventInfo?.payload
    });

    return {
      outputs: {
        trigger: true,
        event: eventInfo,
        payload: eventInfo?.payload
      }
    };
  }

  private extractEvent(flowContext: NodeExecutionContext['flowContext']): MemoryEvent | undefined {
    const expectedType = this.eventType;
    const eventContainer = flowContext.event;
    if (isMemoryEvent(eventContainer)) {
      if (!expectedType || eventContainer.type === expectedType) {
        return eventContainer;
      }
    }
    if (expectedType) {
      return {
        id: `${this.type.toLowerCase()}-fallback`,
        type: expectedType,
        timestamp: new Date().toISOString()
      };
    }
    return undefined;
  }
}

export class EventSourceNode extends BaseEventNode {
  constructor() {
    super({
      type: 'EventSource',
      label: '事件入口',
      summary: '接受任意调度事件并输出触发信号与事件信息。'
    });
  }
}

export class TableInitEventNode extends BaseEventNode {
  constructor() {
    super({
      type: 'EventTableInit',
      label: '初始化事件',
      summary: '处理 table:init 事件并继续触发下游节点。',
      eventType: 'table:init'
    });
  }
}

export class AiReplyEventNode extends BaseEventNode {
  constructor() {
    super({
      type: 'EventAiReply',
      label: 'AI 回复事件',
      summary: '处理 ai:reply 事件并继续触发下游节点。',
      eventType: 'ai:reply'
    });
  }
}

export class UserMessageEventNode extends BaseEventNode {
  constructor() {
    super({
      type: 'EventUserMessage',
      label: '用户消息事件',
      summary: '处理 user:message 事件并继续触发下游节点。',
      eventType: 'user:message'
    });
  }
}
