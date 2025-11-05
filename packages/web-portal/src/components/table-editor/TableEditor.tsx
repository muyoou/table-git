"use client";

/**
 * TableEditor Component
 * 
 * A reusable table editor component that integrates with TableGit
 * through the table-memory-engine
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Space, Input, InputNumber, Modal, message, Popconfirm } from 'antd';
import { PlusOutlined, SaveOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

export interface TableEditorProps {
  /** Table data in 2D array format */
  data: unknown[][];
  /** Column headers */
  columns: string[];
  /** Metadata for the table */
  metadata?: Record<string, unknown>;
  /** Callback when data changes */
  onChange?: (data: unknown[][], columns: string[]) => void;
  /** Callback to save changes (commit) */
  onSave?: (message: string, author: string) => Promise<void>;
  /** Whether the table is in read-only mode */
  readOnly?: boolean;
  /** Whether to show save button */
  showSaveButton?: boolean;
  /** Loading state */
  loading?: boolean;
}

interface EditableCellProps {
  value: unknown;
  onSave: (value: unknown) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        value={String(editValue ?? '')}
        onChange={(e) => setEditValue(e.target.value)}
        onPressEnter={handleSave}
        onBlur={handleSave}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer', minHeight: '22px', padding: '4px' }}
    >
      {String(value ?? '')}
    </div>
  );
};

const TableEditorComponent: React.FC<TableEditorProps> = ({
  data: initialData,
  columns: initialColumns,
  metadata,
  onChange,
  onSave,
  readOnly = false,
  showSaveButton = true,
  loading = false
}) => {
  const [data, setData] = useState<unknown[][]>(initialData);
  const [columns, setColumns] = useState<string[]>(initialColumns);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [authorName, setAuthorName] = useState('User');

  useEffect(() => {
    setData(initialData);
    setColumns(initialColumns);
  }, [initialData, initialColumns]);

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: unknown) => {
    const newData = data.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
        : row
    );
    setData(newData);
    setHasChanges(true);
    onChange?.(newData, columns);
  }, [data, columns, onChange]);

  const handleAddRow = useCallback(() => {
    const newRow = new Array(columns.length).fill('');
    const newData = [...data, newRow];
    setData(newData);
    setHasChanges(true);
    onChange?.(newData, columns);
  }, [data, columns, onChange]);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    const newData = data.filter((_, idx) => idx !== rowIndex);
    setData(newData);
    setHasChanges(true);
    onChange?.(newData, columns);
  }, [data, columns, onChange]);

  const handleAddColumn = useCallback(() => {
    const newColumnName = `Column ${columns.length + 1}`;
    const newColumns = [...columns, newColumnName];
    const newData = data.map(row => [...row, '']);
    setColumns(newColumns);
    setData(newData);
    setHasChanges(true);
    onChange?.(newData, newColumns);
  }, [data, columns, onChange]);

  const handleDeleteColumn = useCallback((colIndex: number) => {
    const newColumns = columns.filter((_, idx) => idx !== colIndex);
    const newData = data.map(row => row.filter((_, idx) => idx !== colIndex));
    setColumns(newColumns);
    setData(newData);
    setHasChanges(true);
    onChange?.(newData, newColumns);
  }, [data, columns, onChange]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    try {
      await onSave(commitMessage || 'Update table', authorName);
      setHasChanges(false);
      setSaveModalVisible(false);
      setCommitMessage('');
      message.success('Changes saved successfully');
    } catch (error) {
      message.error('Failed to save changes');
      console.error('Save error:', error);
    }
  }, [onSave, commitMessage, authorName]);

  const tableColumns: ColumnsType<unknown[]> = useMemo(() => {
    const cols: ColumnsType<unknown[]> = columns.map((col, colIndex) => ({
      title: (
        <Space>
          <span>{col}</span>
          {!readOnly && (
            <Popconfirm
              title="Delete this column?"
              onConfirm={() => handleDeleteColumn(colIndex)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          )}
        </Space>
      ),
      dataIndex: colIndex,
      key: `col-${colIndex}`,
      render: (value: unknown, _: unknown[], rowIndex: number) => {
        if (readOnly) {
          return String(value ?? '');
        }
        return (
          <EditableCell
            value={value}
            onSave={(newValue) => handleCellChange(rowIndex, colIndex, newValue)}
          />
        );
      }
    }));

    if (!readOnly) {
      cols.push({
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_: unknown, __: unknown[], rowIndex: number) => (
          <Popconfirm
            title="Delete this row?"
            onConfirm={() => handleDeleteRow(rowIndex)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        )
      });
    }

    return cols;
  }, [columns, readOnly, handleCellChange, handleDeleteRow, handleDeleteColumn]);

  const dataSource = useMemo(() => {
    return data.map((row, index) => ({
      key: `row-${index}`,
      ...row
    }));
  }, [data]);

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          {!readOnly && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRow}
              >
                Add Row
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddColumn}
              >
                Add Column
              </Button>
            </>
          )}
          {showSaveButton && !readOnly && hasChanges && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => setSaveModalVisible(true)}
            >
              Save Changes
            </Button>
          )}
        </Space>

        <Table
          columns={tableColumns}
          dataSource={dataSource}
          pagination={false}
          bordered
          loading={loading}
          size="small"
        />
      </Space>

      <Modal
        title="Commit Changes"
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
        okText="Save"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>Author Name:</label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label>Commit Message:</label>
            <Input.TextArea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes"
              rows={4}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export const TableEditor = TableEditorComponent;
