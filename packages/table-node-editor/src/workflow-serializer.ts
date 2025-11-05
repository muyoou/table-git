/**
 * Workflow Serializer
 * 
 * Handles serialization and deserialization of node editor workflows
 */

import type { GraphDefinitionWithMetadata } from './types';

export interface SerializedWorkflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  graph: GraphDefinitionWithMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExportOptions {
  pretty?: boolean;
  includeMetadata?: boolean;
}

export interface WorkflowImportOptions {
  validateVersion?: boolean;
  mergeMetadata?: boolean;
}

/**
 * Workflow Serializer for node editor workflows
 */
export class WorkflowSerializer {
  private static readonly VERSION = '1.0.0';

  /**
   * Export a workflow to JSON string
   */
  static exportToJSON(
    workflow: SerializedWorkflow,
    options: WorkflowExportOptions = {}
  ): string {
    const { pretty = true, includeMetadata = true } = options;
    
    const exportData = {
      ...workflow,
      version: WorkflowSerializer.VERSION,
      graph: includeMetadata 
        ? workflow.graph 
        : { ...workflow.graph, metadata: undefined }
    };

    return JSON.stringify(exportData, null, pretty ? 2 : undefined);
  }

  /**
   * Import a workflow from JSON string
   */
  static importFromJSON(
    json: string,
    options: WorkflowImportOptions = {}
  ): SerializedWorkflow {
    const { validateVersion = true } = options;

    try {
      const data = JSON.parse(json) as SerializedWorkflow;

      if (validateVersion && data.version !== WorkflowSerializer.VERSION) {
        console.warn(
          `Workflow version ${data.version} differs from current version ${WorkflowSerializer.VERSION}`
        );
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to import workflow: ${error}`);
    }
  }

  /**
   * Export a workflow to a file-friendly format
   */
  static exportToFile(workflow: SerializedWorkflow): Blob {
    const json = WorkflowSerializer.exportToJSON(workflow);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Import a workflow from a file
   */
  static async importFromFile(file: File): Promise<SerializedWorkflow> {
    const text = await file.text();
    return WorkflowSerializer.importFromJSON(text);
  }

  /**
   * Validate a workflow structure
   */
  static validate(workflow: SerializedWorkflow): boolean {
    if (!workflow.id || !workflow.name || !workflow.graph) {
      return false;
    }

    if (!workflow.graph.nodes || !Array.isArray(workflow.graph.nodes)) {
      return false;
    }

    return true;
  }

  /**
   * Create a new empty workflow
   */
  static createEmpty(name: string, description?: string): SerializedWorkflow {
    const now = new Date().toISOString();
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    return {
      id: workflowId,
      name,
      description,
      version: WorkflowSerializer.VERSION,
      graph: {
        id: `graph_${workflowId}`,
        nodes: [],
        metadata: {
          layout: {},
          edges: [],
          variables: []
        }
      },
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Clone a workflow with a new ID
   */
  static clone(workflow: SerializedWorkflow, newName?: string): SerializedWorkflow {
    const now = new Date().toISOString();
    
    return {
      ...workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name: newName ?? `${workflow.name} (Copy)`,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Merge two workflows (append nodes from source to target)
   */
  static merge(
    target: SerializedWorkflow,
    source: SerializedWorkflow
  ): SerializedWorkflow {
    const mergedNodes = [...target.graph.nodes, ...source.graph.nodes];
    
    const mergedMetadata = {
      ...target.graph.metadata,
      layout: {
        ...target.graph.metadata?.layout,
        ...source.graph.metadata?.layout
      },
      edges: [
        ...(target.graph.metadata?.edges ?? []),
        ...(source.graph.metadata?.edges ?? [])
      ],
      variables: [
        ...(target.graph.metadata?.variables ?? []),
        ...(source.graph.metadata?.variables ?? [])
      ]
    };

    return {
      ...target,
      graph: {
        id: target.graph.id,
        nodes: mergedNodes,
        metadata: mergedMetadata
      },
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * Workflow Manager for managing multiple workflows
 */
export class WorkflowManager {
  private workflows: Map<string, SerializedWorkflow>;

  constructor() {
    this.workflows = new Map();
  }

  /**
   * Add a workflow
   */
  add(workflow: SerializedWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Get a workflow by ID
   */
  get(id: string): SerializedWorkflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * List all workflows
   */
  list(): SerializedWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Delete a workflow
   */
  delete(id: string): boolean {
    return this.workflows.delete(id);
  }

  /**
   * Update a workflow
   */
  update(id: string, updates: Partial<SerializedWorkflow>): void {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(id, updated);
  }

  /**
   * Export all workflows to JSON
   */
  exportAll(): string {
    const data = Array.from(this.workflows.values());
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import workflows from JSON
   */
  importAll(json: string): void {
    try {
      const data = JSON.parse(json) as SerializedWorkflow[];
      
      for (const workflow of data) {
        if (WorkflowSerializer.validate(workflow)) {
          this.workflows.set(workflow.id, workflow);
        }
      }
    } catch (error) {
      throw new Error(`Failed to import workflows: ${error}`);
    }
  }

  /**
   * Clear all workflows
   */
  clear(): void {
    this.workflows.clear();
  }
}
