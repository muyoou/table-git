/**
 * Repository Manager
 * 
 * Manages table repositories with CRUD operations
 */

import { TableGit } from 'table-git';
import { TableGitAdapter } from '../adapters/table-git-adapter';
import { RepositoryMetadataManager, TableRepositoryMetadata } from './repository-metadata';

export interface Repository {
  id: string;
  name: string;
  tableGit: TableGit;
  adapter: TableGitAdapter;
  metadata: TableRepositoryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepositoryOptions {
  name: string;
  defaultSheetName?: string;
  metadata?: TableRepositoryMetadata;
  initBranch?: string;
}

export interface CloneRepositoryOptions {
  sourceRepoId: string;
  newName: string;
  newId?: string;
}

export interface AuthorInfo {
  name: string;
  email?: string;
  role?: 'user' | 'ai' | 'system';
}

/**
 * Repository Manager for handling table repository lifecycle
 */
export class RepositoryManager {
  private repositories: Map<string, Repository>;
  private metadataManager: RepositoryMetadataManager;

  constructor() {
    this.repositories = new Map();
    this.metadataManager = new RepositoryMetadataManager();
  }

  /**
   * Create a new repository
   */
  createRepository(options: CreateRepositoryOptions): Repository {
    const id = this.generateId();
    const tableGit = new TableGit();
    const branchName = options.initBranch ?? 'main';
    const sheetName = options.defaultSheetName ?? 'default';

    tableGit.init(branchName, {
      defaultSheetName: sheetName,
      createDefaultSheet: true
    });

    const adapter = new TableGitAdapter({
      tableGit,
      defaultSheetId: sheetName,
      autoInit: false
    });

    const now = new Date().toISOString();
    const metadata = options.metadata ?? { tableName: options.name };
    
    const repo: Repository = {
      id,
      name: options.name,
      tableGit,
      adapter,
      metadata,
      createdAt: now,
      updatedAt: now
    };

    this.repositories.set(id, repo);
    this.metadataManager.setMetadata(id, metadata);

    return repo;
  }

  /**
   * Get a repository by ID
   */
  getRepository(repoId: string): Repository | undefined {
    return this.repositories.get(repoId);
  }

  /**
   * List all repositories
   */
  listRepositories(): Repository[] {
    return Array.from(this.repositories.values());
  }

  /**
   * Delete a repository
   */
  deleteRepository(repoId: string): boolean {
    const deleted = this.repositories.delete(repoId);
    if (deleted) {
      this.metadataManager.removeMetadata(repoId);
    }
    return deleted;
  }

  /**
   * Clone a repository
   */
  cloneRepository(options: CloneRepositoryOptions): Repository {
    const sourceRepo = this.getRepository(options.sourceRepoId);
    if (!sourceRepo) {
      throw new Error(`Source repository ${options.sourceRepoId} not found`);
    }

    const newId = options.newId ?? this.generateId();
    
    // Export the source repository state
    const sourceState = sourceRepo.tableGit.exportState();
    
    // Create new TableGit instance and import the state
    const newTableGit = new TableGit();
    newTableGit.importState(sourceState);

    // Create adapter for the new repository
    const sheets = newTableGit.listSheets({ includeStaged: true });
    const defaultSheetName = sheets[0] ?? 'default';
    
    const adapter = new TableGitAdapter({
      tableGit: newTableGit,
      defaultSheetId: defaultSheetName,
      autoInit: false
    });

    const now = new Date().toISOString();
    const metadata = { ...sourceRepo.metadata, tableName: options.newName };

    const newRepo: Repository = {
      id: newId,
      name: options.newName,
      tableGit: newTableGit,
      adapter,
      metadata,
      createdAt: now,
      updatedAt: now
    };

    this.repositories.set(newId, newRepo);
    this.metadataManager.setMetadata(newId, metadata);

    return newRepo;
  }

  /**
   * Update repository metadata
   */
  updateRepositoryMetadata(repoId: string, metadata: Partial<TableRepositoryMetadata>): void {
    const repo = this.getRepository(repoId);
    if (!repo) {
      throw new Error(`Repository ${repoId} not found`);
    }

    this.metadataManager.updateMetadata(repoId, metadata);
    repo.metadata = this.metadataManager.getMetadata(repoId);
    repo.updatedAt = new Date().toISOString();
  }

  /**
   * Get repository metadata
   */
  getRepositoryMetadata(repoId: string): TableRepositoryMetadata {
    return this.metadataManager.getMetadata(repoId);
  }

  /**
   * Commit changes to a repository with author info
   */
  commitChanges(
    repoId: string,
    message: string,
    author: AuthorInfo
  ): void {
    const repo = this.getRepository(repoId);
    if (!repo) {
      throw new Error(`Repository ${repoId} not found`);
    }

    const authorName = author.role ? `${author.name} (${author.role})` : author.name;
    const authorEmail = author.email ?? 'unknown@tablegit.local';

    repo.tableGit.commit(message, authorName, authorEmail);
    repo.updatedAt = new Date().toISOString();
  }

  /**
   * Merge branches within a repository
   * Note: This is a placeholder implementation. Full merge functionality 
   * would require the TableGit merge API to be implemented.
   */
  mergeBranches(
    repoId: string,
    sourceBranch: string,
    targetBranch: string,
    author: AuthorInfo,
    strategy: 'ours' | 'theirs' | 'manual' = 'manual'
  ): boolean {
    const repo = this.getRepository(repoId);
    if (!repo) {
      throw new Error(`Repository ${repoId} not found`);
    }

    // Switch to target branch
    const currentBranch = repo.tableGit.getCurrentBranch();
    if (currentBranch !== targetBranch) {
      repo.tableGit.checkout(targetBranch);
    }

    // TODO: Implement merge when TableGit provides merge API
    // For now, this is a placeholder that marks the operation as pending
    console.warn('Merge functionality is not yet implemented in TableGit');
    return false;
  }

  /**
   * Export repository to JSON
   */
  exportRepository(repoId: string): string {
    const repo = this.getRepository(repoId);
    if (!repo) {
      throw new Error(`Repository ${repoId} not found`);
    }

    const state = repo.tableGit.exportStateAsJSON();
    const metadata = this.metadataManager.getMetadata(repoId);

    return JSON.stringify({
      id: repo.id,
      name: repo.name,
      metadata,
      state,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt
    }, null, 2);
  }

  /**
   * Import repository from JSON
   */
  importRepository(json: string, newName?: string): Repository {
    try {
      const data = JSON.parse(json);
      const newId = this.generateId();
      
      const tableGit = new TableGit();
      tableGit.importState(data.state);

      const sheets = tableGit.listSheets({ includeStaged: true });
      const defaultSheetName = sheets[0] ?? 'default';

      const adapter = new TableGitAdapter({
        tableGit,
        defaultSheetId: defaultSheetName,
        autoInit: false
      });

      const now = new Date().toISOString();
      const metadata = data.metadata ?? {};
      if (newName) {
        metadata.tableName = newName;
      }

      const repo: Repository = {
        id: newId,
        name: newName ?? data.name ?? 'Imported Repository',
        tableGit,
        adapter,
        metadata,
        createdAt: data.createdAt ?? now,
        updatedAt: now
      };

      this.repositories.set(newId, repo);
      this.metadataManager.setMetadata(newId, metadata);

      return repo;
    } catch (error) {
      throw new Error(`Failed to import repository: ${error}`);
    }
  }

  /**
   * Generate a unique repository ID
   */
  private generateId(): string {
    return `repo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
