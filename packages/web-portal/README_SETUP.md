# Web Portal Setup Guide

This guide will help you set up and run the table-git web portal.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (https://supabase.com)
- Basic knowledge of Next.js and React

## Project Setup

### 1. Install Dependencies

First, install dependencies for all packages:

```bash
# Install root dependencies
cd /path/to/table-git
npm install

# Build the core table-git package
npm run build

# Build table-memory-engine
cd packages/table-memory-engine
npm install
npm run build

# Build table-node-editor
cd ../table-node-editor
npm install
npm run build

# Install web-portal dependencies
cd ../web-portal
npm install
```

### 2. Set Up Supabase

1. **Create a new project** in Supabase dashboard

2. **Run the database schema:**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `packages/web-portal/supabase/schema.sql`
   - Run the SQL script to create all tables, indexes, and policies

3. **Enable authentication:**
   - Go to Authentication → Settings
   - Configure your preferred auth providers (Email, Google, etc.)

4. **Get your project credentials:**
   - Go to Project Settings → API
   - Copy the Project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env.local` file in `packages/web-portal`:

```bash
cd packages/web-portal
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server

```bash
cd packages/web-portal
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

```
packages/web-portal/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public)/          # Public pages (home, docs, market)
│   │   └── (console)/         # Protected console pages
│   ├── components/            # Reusable components
│   │   ├── table-editor/     # Table editing components
│   │   ├── layout/           # Layout components
│   │   └── navigation/       # Navigation components
│   └── shared/               # Shared utilities and services
│       ├── config/           # Configuration (Supabase, etc.)
│       ├── types/            # TypeScript types
│       ├── services/         # Data access layer
│       └── hooks/            # React hooks
├── supabase/                 # Database schema
└── public/                   # Static assets
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## Key Features

### 1. Templates
- Create templates combining table repositories and workflows
- Edit table structure and data
- Associate node editor flows
- Clone and share templates

### 2. Conversations
- Create conversations from templates
- Chat interface for AI-driven table updates
- Real-time table state visualization
- Message history

### 3. Flows
- Visual node editor for workflows
- Template-specific flows
- Global flows that run across all conversations
- Flow import/export

### 4. Market
- Browse public templates and flows
- Clone repositories
- Merge updates from shared items
- Publish your own templates

### 5. Table Editor
- Interactive table editing
- Add/remove rows and columns
- Cell-level editing
- Commit changes with messages
- User/AI author tracking

## Usage Examples

### Creating a Template

```typescript
import { RepositoryManager } from '@table-git/memory-engine';
import { TemplateService } from '@/shared/services';

// Create a new repository
const repoManager = new RepositoryManager();
const repo = repoManager.createRepository({
  name: 'Customer Database',
  metadata: {
    tableName: 'Customers',
    tableDescription: 'Customer information and history'
  }
});

// Save to database
const template = await TemplateService.create({
  name: 'Customer Database Template',
  description: 'Template for managing customer data',
  repository_state: repoManager.exportRepository(repo.id),
  repository_metadata: repo.metadata,
  flow_ids: []
}, userId);
```

### Using the Table Editor

```tsx
import { TableGitEditor } from '@/components/table-editor';

function MyPage() {
  const repoManager = new RepositoryManager();
  
  return (
    <TableGitEditor
      repositoryId="repo_123"
      repositoryManager={repoManager}
      onRepositoryChange={(repo) => {
        console.log('Repository updated:', repo);
      }}
    />
  );
}
```

### Working with Flows

```typescript
import { WorkflowSerializer } from '@table-git/node-editor';

// Create a new workflow
const workflow = WorkflowSerializer.createEmpty('My Workflow', 'Description');

// Export to JSON
const json = WorkflowSerializer.exportToJSON(workflow);

// Import from JSON
const imported = WorkflowSerializer.importFromJSON(json);
```

## Authentication

The app uses Supabase Auth. To implement authentication:

1. **Add auth provider:**
```tsx
// src/app/providers.tsx
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  
  // Check auth state and provide user context
  return <>{children}</>;
}
```

2. **Protect routes:**
```tsx
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && req.nextUrl.pathname.startsWith('/console')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}
```

## Database Management

### Backup Data

```bash
# Using Supabase CLI
supabase db dump > backup.sql
```

### Reset Database

```bash
# Drop all tables (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Re-run the schema.sql
```

### Migrations

When you make schema changes:

1. Update `supabase/schema.sql`
2. Create a migration file
3. Apply migration to your Supabase project

## Troubleshooting

### Build Errors

**Error: Cannot find module '@table-git/memory-engine'**
- Solution: Build the dependency packages first:
  ```bash
  cd packages/table-memory-engine && npm run build
  cd packages/table-node-editor && npm run build
  ```

**TypeScript errors in node_modules**
- Solution: Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Supabase Connection Issues

**Error: Invalid API key**
- Check that your `.env.local` has the correct values
- Verify the Supabase project is active

**RLS Policy Errors**
- Ensure you've run the complete schema.sql
- Check that your user is authenticated
- Verify policies are enabled on all tables

### Runtime Errors

**Error: Supabase client not initialized**
- Check environment variables are set
- Ensure Supabase client is created in config

**Table data not loading**
- Check that the repository exists
- Verify sheet IDs are correct
- Check browser console for errors

## Performance Optimization

1. **Use React Query for caching:**
   ```tsx
   const { data } = useTemplates(userId);
   ```

2. **Lazy load heavy components:**
   ```tsx
   const NodeEditor = dynamic(() => import('@/components/node-editor'));
   ```

3. **Optimize table rendering:**
   - Implement pagination for large datasets
   - Use virtual scrolling for many rows
   - Debounce cell updates

4. **Enable Supabase connection pooling:**
   - Configure in Supabase dashboard
   - Use connection pooler URL for production

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted with Docker

## Contributing

When contributing:

1. Create a feature branch
2. Make your changes
3. Run linting and type checking
4. Test thoroughly
5. Create a pull request

## Support

For issues and questions:
- Check the IMPLEMENTATION_GUIDE.md
- Review the TypeScript types and JSDoc comments
- Open an issue on GitHub

## License

MIT License - see LICENSE file for details
