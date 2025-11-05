/**
 * Table Repository Metadata
 * 
 * Defines table properties that can be customized by users
 * and accessed by node editors
 */

export interface TableRepositoryMetadata {
  /** Display name of the table */
  tableName?: string;
  
  /** Description of the table's purpose */
  tableDescription?: string;
  
  /** Instructions for updating records */
  updateInstructions?: string;
  
  /** Instructions for inserting new records */
  insertInstructions?: string;
  
  /** Instructions for deleting records */
  deleteInstructions?: string;
  
  /** Version of the table schema */
  tableVersion?: string;
  
  /** Additional remarks or notes */
  remarks?: string;
  
  /** Custom key-value pairs for user-defined metadata */
  [key: string]: string | undefined;
}

export const STANDARD_METADATA_KEYS = [
  'tableName',
  'tableDescription',
  'updateInstructions',
  'insertInstructions',
  'deleteInstructions',
  'tableVersion',
  'remarks'
] as const;

export type StandardMetadataKey = typeof STANDARD_METADATA_KEYS[number];

/**
 * Metadata management service for table repositories
 */
export class RepositoryMetadataManager {
  private metadata: Map<string, TableRepositoryMetadata>;

  constructor() {
    this.metadata = new Map();
  }

  /**
   * Get metadata for a specific repository
   */
  getMetadata(repoId: string): TableRepositoryMetadata {
    return this.metadata.get(repoId) ?? {};
  }

  /**
   * Set metadata for a repository
   */
  setMetadata(repoId: string, metadata: TableRepositoryMetadata): void {
    this.metadata.set(repoId, { ...metadata });
  }

  /**
   * Update specific metadata fields for a repository
   */
  updateMetadata(repoId: string, updates: Partial<TableRepositoryMetadata>): void {
    const current = this.getMetadata(repoId);
    this.metadata.set(repoId, { ...current, ...updates });
  }

  /**
   * Get a specific metadata field
   */
  getMetadataField(repoId: string, key: string): string | undefined {
    const metadata = this.getMetadata(repoId);
    return metadata[key];
  }

  /**
   * Set a specific metadata field
   */
  setMetadataField(repoId: string, key: string, value: string | undefined): void {
    const metadata = this.getMetadata(repoId);
    metadata[key] = value;
    this.metadata.set(repoId, metadata);
  }

  /**
   * Remove metadata for a repository
   */
  removeMetadata(repoId: string): void {
    this.metadata.delete(repoId);
  }

  /**
   * Check if a repository has metadata
   */
  hasMetadata(repoId: string): boolean {
    return this.metadata.has(repoId);
  }

  /**
   * List all repository IDs with metadata
   */
  listRepositories(): string[] {
    return Array.from(this.metadata.keys());
  }

  /**
   * Export metadata to JSON
   */
  exportToJSON(repoId: string): string {
    const metadata = this.getMetadata(repoId);
    return JSON.stringify(metadata, null, 2);
  }

  /**
   * Import metadata from JSON
   */
  importFromJSON(repoId: string, json: string): void {
    try {
      const metadata = JSON.parse(json) as TableRepositoryMetadata;
      this.setMetadata(repoId, metadata);
    } catch (error) {
      throw new Error(`Failed to import metadata: ${error}`);
    }
  }
}
