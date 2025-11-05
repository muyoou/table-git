# Table Memory Engine

Table Memory Engine 是基于 `table-git` 的表格记忆工作流引擎，用于在 AI 应用中以低代码节点方式编排“对话记录 → 标签解析 → 表格同步 → Prompt 输出”的完整闭环。项目提供可移植的解析器、格式化器与事件系统，帮助团队快速构建可复用的长期记忆能力。

## 核心特性

- **表格记忆工作流**：通过节点图描述复杂的表格读写、合并、格式化与事件触发逻辑。
- **标签驱动的解析器**：支持组合式标签解析插件，将对话中的结构化指令转化为表格操作。
- **格式化输出**：内置 Prompt 与 JSON 格式化器，便于将最新表格快照注入后续对话上下文。
- **TableGit 适配层**：借助 `table-git` 提供的版本化表格能力，实现变更追踪、冲突检测与快照导出。
- **可扩展的节点市场基础**：标准化节点声明、配置 Schema 与执行上下文，便于未来接入低代码可视化编辑器。

## 安装与准备

在根目录确保已安装依赖并构建 `table-git`：

```bash
cd d:/core
npm install
npm run build
```

随后进入子包目录安装依赖并构建：

```bash
cd packages/table-memory-engine
npm install
npm run build
```

## 快速上手

```ts
import { FlowBuilder, NodeRuntime, TableGitAdapter } from '@table-git/memory-engine';
import { TableGit } from 'table-git';

// 1. 定义工作流
const flow = FlowBuilder.create('memory-sync')
	.useNode('LoadTable', { sheetId: 'main' })
	.useNode('ParseTags')
	.useNode('ApplyChanges')
	.useNode('FormatPrompt', { formatter: 'prompt' })
	.build();

// 2. 准备 TableGit 实例
const tableGit = new TableGit();
tableGit.init('main', { defaultSheetName: 'main' });

// 3. 初始化运行时并注册内置节点
const runtime = new NodeRuntime({
	adapter: new TableGitAdapter({ tableGit, defaultSheetId: 'main', autoInit: false })
});
runtime.registerDefaults();

// 4. 执行工作流
const result = await runtime.run(flow, {
	conversation: [
		{
			id: 'msg-1',
			role: 'assistant',
			content: '[[table:setCell sheet=main row=0 column=0 value="Hello"]]'
		}
	],
	sheetId: 'main',
	services: {}
});

console.log(result.context.variables?.formatted);
```

更多示例可参阅 `examples/basic-flow.ts`。

## 事件驱动模式

许多场景希望将“AI 回复”、“用户输入”、“系统初始化”等行为统一为事件。可借助 `MemoryWorkflowEngine` 将不同事件映射到预设的节点流：

```ts
import {
	MemoryWorkflowEngine,
	registerDefaultEventFlows
} from '@table-git/memory-engine';

const engine = new MemoryWorkflowEngine(runtime);
registerDefaultEventFlows(engine);

await engine.dispatch({
	id: 'evt-ai-1',
	type: 'ai:reply',
	sheetId: 'main',
	conversation: [
		{ id: 'msg', role: 'assistant', content: '[[table:setCell row=0 column=0 value="Hi"]]' }
	]
});
```

默认注册的事件类型：

- `table:init`：加载表格并输出快照
- `ai:reply`：解析标签、应用变更并输出格式化结果
- `user:message`：解析用户消息，默认以 dry-run 预览效果

你也可以通过 `engine.register(type, resolver)` 自定义事件 → 节点流映射，实现更复杂的业务流程。

## 运行测试

```bash
cd packages/table-memory-engine
npx jest
```

## 目录结构

```
packages/table-memory-engine
├─ src/
│  ├─ adapters/          # 与 table-git 等存储后端的适配层
│  ├─ core/              # 类型定义、解析器、格式化器、事件总线
│  ├─ nodes/             # 基础节点实现与注册器
│  └─ runtime/           # FlowBuilder 与 NodeRuntime
├─ docs/                 # 中文文档与教程
├─ examples/             # 使用示例
├─ tests/                # 单元与集成测试
└─ README.md
```

## 进一步阅读

- `docs/overview.md`：架构与概念
- `docs/getting-started.md`：从零构建一个记忆工作流
- `docs/api-reference.md`：API 详解
- `docs/node-library.md`：内置节点目录

## 路线图

- 丰富标签解析插件与格式化模版
- 提供更多节点（查询、冲突合并、事件桥接等）
- 输出持久化策略与外部服务适配器
- 与低代码可视化编辑器集成，打造节点市场生态
