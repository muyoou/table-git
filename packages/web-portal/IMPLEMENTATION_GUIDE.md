# Web Portal Implementation Guide

This document provides a comprehensive guide for implementing the table-git web portal features.

## Architecture Overview

The web portal is built with the following technology stack:
- **Frontend**: Next.js 14 (App Router), React 18, Ant Design 5, Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + Storage)
- **State Management**: TanStack Query (React Query), Zustand
- **Table Engine**: table-memory-engine (custom package)
- **Node Editor**: table-node-editor (custom package)

## Project Structure

```
packages/
├── table-memory-engine/     # Core repository and workflow engine
│   ├── src/
│   │   ├── core/
│   │   │   ├── repository-metadata.ts    # Table metadata management
│   │   │   └── repository-manager.ts     # Repository CRUD operations
│   │   ├── adapters/
│   │   │   └── table-git-adapter.ts      # TableGit integration
│   │   └── runtime/
│   │       └── memory-workflow-engine.ts # Workflow execution
│   └── dist/
│
├── table-node-editor/       # Visual node editor for workflows
│   ├── src/
│   │   ├── workflow-serializer.ts        # Workflow import/export
│   │   ├── node-editor.ts                # PixiJS-based editor
│   │   └── graph-store.ts                # Graph state management
│   └── dist/
│
└── web-portal/              # Next.js web application
    ├── src/
    │   ├── app/                          # Next.js routes
    │   │   ├── (public)/                 # Public pages
    │   │   │   ├── page.tsx              # Homepage
    │   │   │   ├── product/              # Product pages
    │   │   │   ├── plugin/               # Plugin pages
    │   │   │   ├── sdk/                  # SDK documentation
    │   │   │   ├── docs/                 # Documentation
    │   │   │   └── market/               # Public marketplace
    │   │   └── (console)/                # Protected console area
    │   │       └── console/
    │   │           ├── templates/        # Template management
    │   │           ├── conversations/    # Conversation UI
    │   │           ├── global-flows/     # Global flow management
    │   │           ├── table-editor/     # Table editing
    │   │           └── node-editor/      # Node editing
    │   ├── components/
    │   │   ├── table-editor/             # Reusable table components
    │   │   │   ├── TableEditor.tsx       # Base table editor
    │   │   │   └── TableGitEditor.tsx    # TableGit integration
    │   │   ├── layout/                   # Layout components
    │   │   └── navigation/               # Navigation components
    │   └── shared/
    │       ├── config/
    │       │   └── supabase.ts           # Supabase client
    │       ├── types/
    │       │   └── database.ts           # Database type definitions
    │       ├── services/                 # Data access layer
    │       │   ├── templates.ts
    │       │   ├── conversations.ts
    │       │   ├── flows.ts
    │       │   └── market.ts
    │       └── hooks/                    # React Query hooks
    │           └── useTemplates.ts
    └── supabase/
        └── schema.sql                    # Database schema

```

## Database Schema

The Supabase database consists of the following main tables:

### Templates
A template combines a table repository with node editor flows.
- `id`: UUID (primary key)
- `name`: Template display name
- `description`: Optional description
- `repository_state`: Serialized TableGit state (JSONB)
- `repository_metadata`: Custom metadata (JSONB)
- `flow_ids`: Array of associated flow IDs
- `user_id`: Owner user ID
- `created_at`, `updated_at`: Timestamps

### Conversations
A conversation is an instance of a template with actual usage data.
- `id`: UUID (primary key)
- `name`: Conversation name
- `template_id`: Reference to template
- `current_state`: Current table state (JSONB)
- `user_id`: Owner user ID
- `created_at`, `updated_at`: Timestamps

### Flows
Node editor workflow definitions.
- `id`: UUID (primary key)
- `name`: Flow name
- `description`: Optional description
- `workflow_data`: Serialized workflow (JSONB)
- `template_id`: Optional template reference
- `user_id`: Owner user ID
- `created_at`, `updated_at`: Timestamps

### Global Flows
Flows that run across all conversations.
- `id`: UUID (primary key)
- `name`: Flow name
- `workflow_data`: Serialized workflow (JSONB)
- `enabled`: Whether the flow is active
- `priority`: Execution priority
- Similar fields as Flows

### Market Items
Public repository/flow sharing.
- `id`: UUID (primary key)
- `name`, `description`: Display info
- `item_type`: 'repository' | 'flow' | 'hybrid'
- `access_type`: 'clone_only' | 'merge_only' | 'both'
- `tags`: Array of tags
- `readme`: Markdown documentation
- `license`: Usage license
- `repository_state`, `workflow_data`: Optional item data
- `clone_count`, `merge_count`, `view_count`: Statistics
- `publisher_id`: Publisher user ID

### Conversation Messages
Messages within conversations.
- `id`: UUID (primary key)
- `conversation_id`: Reference to conversation
- `role`: 'user' | 'assistant' | 'system'
- `content`: Message text
- `changes`: Optional JSON of changes made
- `created_at`: Timestamp

## Key Features Implementation

### 1. Template Management

**Create Template:**
```typescript
import { RepositoryManager } from '@table-git/memory-engine';
import { TemplateService } from '@/shared/services';

const repoManager = new RepositoryManager();
const repo = repoManager.createRepository({
  name: 'My Template',
  metadata: {
    tableName: 'Customer Database',
    tableDescription: 'Customer information',
    // ... other metadata
  }
});

const template = await TemplateService.create({
  name: 'My Template',
  repository_state: repoManager.exportRepository(repo.id),
  repository_metadata: repo.metadata,
  flow_ids: []
}, userId);
```

**Edit Template:**
Use the `TableGitEditor` component to provide an interactive table editing interface.

### 2. Conversation Management

**Create Conversation from Template:**
```typescript
import { ConversationService, TemplateService } from '@/shared/services';

const template = await TemplateService.get(templateId, userId);
const conversation = await ConversationService.create({
  name: 'New Conversation',
  template_id: templateId,
  current_state: template.repository_state
}, userId);
```

**Process AI Message:**
```typescript
import { NodeRuntime, MemoryWorkflowEngine } from '@table-git/memory-engine';

// Load conversation state
const conversation = await ConversationService.get(conversationId, userId);

// Parse state and run workflow
const tableGit = new TableGit();
tableGit.importState(JSON.parse(conversation.current_state));

const runtime = new NodeRuntime({
  adapter: new TableGitAdapter({ tableGit })
});

const engine = new MemoryWorkflowEngine(runtime);
// Register flows and process message
// Update conversation with new state
```

### 3. Node Editor Integration

The node editor is implemented using PixiJS and provides a visual interface for creating workflows.

**Usage:**
```typescript
import { NodeEditor, WorkflowSerializer } from '@table-git/node-editor';

const editor = new NodeEditor(container, {
  width: 800,
  height: 600
});

// Load existing workflow
const workflow = WorkflowSerializer.importFromJSON(workflowJson);
editor.loadGraph(workflow.graph);

// Save workflow
const updatedWorkflow = {
  ...workflow,
  graph: editor.exportGraph()
};
const json = WorkflowSerializer.exportToJSON(updatedWorkflow);
```

### 4. Market Integration

**Clone Repository:**
```typescript
import { MarketService } from '@/shared/services';
import { RepositoryManager } from '@table-git/memory-engine';

const data = await MarketService.clone(marketItemId);
const repoManager = new RepositoryManager();

if (data.repository_state) {
  const repo = repoManager.importRepository(data.repository_state);
  // Use the cloned repository
}
```

**Publish to Market:**
```typescript
const repo = repoManager.getRepository(repoId);
const marketItem = await MarketService.create({
  name: 'My Shared Template',
  description: 'A great template',
  item_type: 'repository',
  access_type: 'both',
  tags: ['template', 'customer'],
  readme: '# My Template\n\nDescription...',
  license: 'MIT',
  repository_state: repoManager.exportRepository(repoId),
  repository_metadata: repo.metadata
}, userId);
```

## Component Usage Examples

### TableEditor Component

```tsx
import { TableEditor } from '@/components/table-editor';

function MyComponent() {
  const [data, setData] = useState([
    ['John', '30', 'Engineer'],
    ['Jane', '25', 'Designer']
  ]);
  const [columns] = useState(['Name', 'Age', 'Role']);

  const handleSave = async (message: string, author: string) => {
    // Save to database or commit to TableGit
    console.log('Committing:', message, 'by', author);
  };

  return (
    <TableEditor
      data={data}
      columns={columns}
      onChange={(newData, newCols) => setData(newData)}
      onSave={handleSave}
    />
  );
}
```

### TableGitEditor Component

```tsx
import { TableGitEditor } from '@/components/table-editor';
import { RepositoryManager } from '@table-git/memory-engine';

function RepoEditor({ repoId }: { repoId: string }) {
  const repoManager = useMemo(() => new RepositoryManager(), []);

  return (
    <TableGitEditor
      repositoryId={repoId}
      repositoryManager={repoManager}
      onRepositoryChange={(repo) => {
        console.log('Repository updated:', repo);
      }}
    />
  );
}
```

## Next Steps for Full Implementation

1. **Complete Template Pages:**
   - Implement create/edit template forms
   - Add flow association UI
   - Integrate TableGitEditor for repository editing

2. **Implement Conversation Pages:**
   - Build chat interface with message history
   - Add AI message processing
   - Show real-time table updates
   - Integrate workflow execution

3. **Complete Market Pages:**
   - Build search and filtering UI
   - Implement clone/merge functionality
   - Add publish workflow
   - Create detail pages with README rendering

4. **Add Global Flow Management:**
   - Build flow list with enable/disable toggles
   - Add priority ordering
   - Integrate with conversation processing

5. **Testing & Polish:**
   - Add comprehensive tests
   - Improve error handling
   - Add loading states
   - Implement authentication with Supabase
   - Add user settings and preferences

## Development Workflow

1. **Setup Supabase:**
   - Create a Supabase project
   - Run the schema.sql file
   - Configure environment variables

2. **Install Dependencies:**
   ```bash
   cd packages/web-portal
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Build Packages:**
   ```bash
   cd packages/table-memory-engine && npm run build
   cd packages/table-node-editor && npm run build
   ```

## Security Considerations

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Market items are publicly readable but only owners can modify
- Conversation messages are only accessible to conversation owners
- Use Supabase Auth for user authentication

## Performance Tips

- Use React Query for efficient data caching
- Implement pagination for large lists
- Lazy load node editor component
- Optimize table rendering for large datasets
- Use Supabase realtime for collaborative editing (future)

## Troubleshooting

**Supabase Connection Issues:**
- Check environment variables are set correctly
- Verify Supabase project is active
- Check RLS policies are configured

**Build Errors:**
- Ensure all packages are built in order (table-git → table-memory-engine → table-node-editor)
- Clear node_modules and reinstall if needed
- Check TypeScript version compatibility

**Table Editor Issues:**
- Verify repository manager is initialized
- Check that TableGit state is valid
- Ensure sheet IDs are correct
