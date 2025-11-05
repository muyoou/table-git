# @table-git/node-editor

A PixiJS-powered visual node editor for building and executing workflows backed by the `@table-git/memory-engine`. The editor mimics Unreal Engine-style blueprints with draggable nodes, ports for connections, configurable parameters, and the ability to execute flows directly against a `NodeRuntime` instance.

## Features

- Render blueprint-like nodes and connections with PixiJS
- Load node schemas from the memory engine registry automatically
- Drag nodes, create and remove connections, and edit parameters inline
- Manage input/output ports with hover states and connection previews
- Execute the authored graph via `NodeRuntime.run`
- Persist layout metadata with node positions and connection definitions

## Getting Started

1. Install dependencies:

```bash
npm install
npm --workspace packages/table-node-editor run build
```

2. Instantiate the editor in a browser environment:

```ts
import { NodeRuntime, registerBuiltinNodes, TableGitAdapter } from '@table-git/memory-engine';
import { NodeEditor } from '@table-git/node-editor';

async function bootstrap(container: HTMLElement) {
  const runtime = new NodeRuntime({
    adapter: new TableGitAdapter({ tableGit, defaultSheetId: 'memory', autoInit: true })
  });

  registerBuiltinNodes(runtime);

  const editor = await NodeEditor.create({
    container,
    runtime,
    width: 1200,
    height: 800
  });

  editor.addNode('LoadTable', { position: { x: 80, y: 80 }, config: { sheetId: 'memory' } });
  editor.addNode('ParseTags', { position: { x: 400, y: 140 } });
  editor.connect({ fromNodeId: 'load-table-1', toNodeId: 'parse-tags-1' });

  const result = await editor.run({ sheetId: 'memory', conversation: [], services: {} });
  console.log(result.context.variables);
}
```

## Development

- `npm run build` – compile TypeScript to `dist`
- `npm run dev` – watch mode compilation
- `npm test` – execute Jest tests for store logic

## License

MIT © Table Version Control Team
