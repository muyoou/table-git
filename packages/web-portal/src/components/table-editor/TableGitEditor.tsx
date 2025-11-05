"use client";

/**
 * TableGitEditor Component
 * 
 * Integrates TableEditor with TableGit through the repository manager
 */

import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { TableEditor } from './TableEditor';
import { RepositoryManager, type Repository } from '@table-git/memory-engine';

export interface TableGitEditorProps {
  /** Repository ID to edit */
  repositoryId: string;
  /** Repository manager instance */
  repositoryManager: RepositoryManager;
  /** Sheet ID to display (defaults to first sheet) */
  sheetId?: string;
  /** Whether the table is in read-only mode */
  readOnly?: boolean;
  /** Callback when repository changes */
  onRepositoryChange?: (repo: Repository) => void;
}

export const TableGitEditor: React.FC<TableGitEditorProps> = ({
  repositoryId,
  repositoryManager,
  sheetId,
  readOnly = false,
  onRepositoryChange
}) => {
  const [data, setData] = useState<unknown[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSheetId, setCurrentSheetId] = useState<string | undefined>(sheetId);

  const loadTableData = useCallback(async () => {
    setLoading(true);
    try {
      const repo = repositoryManager.getRepository(repositoryId);
      if (!repo) {
        message.error('Repository not found');
        return;
      }

      // Determine which sheet to load
      const sheets = repo.tableGit.listSheets({ includeStaged: true });
      const targetSheet = currentSheetId ?? sheets[0];
      
      if (!targetSheet) {
        // Empty repository
        setData([]);
        setColumns([]);
        setLoading(false);
        return;
      }

      setCurrentSheetId(targetSheet);

      // Load snapshot from adapter
      const snapshot = await repo.adapter.snapshot(targetSheet);
      
      setData(snapshot.rows);
      setColumns(snapshot.columns ?? []);
    } catch (error) {
      message.error('Failed to load table data');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [repositoryId, repositoryManager, currentSheetId]);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  const handleDataChange = useCallback(async (newData: unknown[][], newColumns: string[]) => {
    // This is called when user edits cells but before commit
    // We can apply changes to the working tree here
    const repo = repositoryManager.getRepository(repositoryId);
    if (!repo || !currentSheetId) return;

    try {
      // Clear existing changes
      repo.tableGit.reset();

      // Apply all cell changes
      newData.forEach((row, rowIdx) => {
        row.forEach((value, colIdx) => {
          repo.tableGit.addCellChange(currentSheetId, rowIdx, colIdx, value);
        });
      });

      // Note: Not committing yet, just staging
    } catch (error) {
      console.error('Failed to apply changes:', error);
    }
  }, [repositoryId, repositoryManager, currentSheetId]);

  const handleSave = useCallback(async (commitMessage: string, author: string) => {
    const repo = repositoryManager.getRepository(repositoryId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    try {
      // Commit the staged changes
      repositoryManager.commitChanges(repositoryId, commitMessage, {
        name: author,
        role: 'user'
      });

      // Reload data to reflect the commit
      await loadTableData();

      // Notify parent of repository change
      if (onRepositoryChange) {
        const updatedRepo = repositoryManager.getRepository(repositoryId);
        if (updatedRepo) {
          onRepositoryChange(updatedRepo);
        }
      }
    } catch (error) {
      throw error;
    }
  }, [repositoryId, repositoryManager, loadTableData, onRepositoryChange]);

  return (
    <TableEditor
      data={data}
      columns={columns}
      onChange={handleDataChange}
      onSave={handleSave}
      readOnly={readOnly}
      loading={loading}
    />
  );
};

export default TableGitEditor;
