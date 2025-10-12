import {
  ChangeType,
  ColumnMetadata,
  RowMetadata,
  SortCriteria,
  CellValue,
  CellFormat,
  ObjectType,
  SheetAddDetails,
  SheetRenameDetails,
  SheetMoveDetails,
  SheetDuplicateDetails
} from '../types';
interface TableGitResolvedExportOptions {
  preset: 'minimal' | 'full';
  includeWorkingState: boolean;
  includeSnapshots: boolean;
  includeStagedChanges: boolean;
  roots: TableGitExportRoots;
  stripDefaults: boolean;
  stripTagDetails: boolean;
  limitObjects: boolean;
}

interface ReachableCollectionInput {
  roots: TableGitExportRoots;
  includeWorkingState: boolean;
  includeSnapshots: boolean;
  includeStagedChanges: boolean;
  includeAnnotatedTags: boolean;
}

import type {
  Change,
  TagInfo,
  SerializedTableGitState,
  TableGitExportOptions,
  TableGitImportOptions,
  SerializedStagedChange,
  SerializedChange,
  SerializedTagEntry,
  SerializedObjectEntry,
  TableGitExportRoots
} from '../types';
import { CellObject } from './cell';
import { SheetTree } from './sheet';
import { CommitObject } from './commit';
import { TableTree } from './table-tree';
import { deepClone, generateId } from '../utils/hash';
import { TagObject } from './tag';

/**
 * 表格版本控制引擎 - Git 风格的表格版本控制系统
 */
export class TableGit {
  private objects: Map<string, any>; // 对象存储
  private refs: Map<string, string>; // 分支引用
  private tags: Map<string, { commit: string; type: 'lightweight' | 'annotated'; tagHash?: string }>;
  private head: string; // 当前分支或提交哈希
  private index: Map<string, Change>; // 暂存区
  private workingTable: TableTree | null; // 当前工作表集合
  private workingSheets: Map<string, SheetTree>; // 工作区中的工作表快照
  private tableSnapshots: Map<string, TableTree>; // 提交对应的表快照

  private static readonly SERIALIZATION_VERSION = 1;
  private static readonly SERIALIZED_DETAIL_TYPE_KEY = '__tableGitType';

  constructor() {
    this.objects = new Map();
    this.refs = new Map();
    this.tags = new Map();
    this.head = 'main';
    this.index = new Map();
    this.workingTable = null;
    this.workingSheets = new Map();
    this.tableSnapshots = new Map();
  }

  /**
   * 初始化仓库
   */
  init(branchName: string = 'main', options?: { defaultSheetName?: string; createDefaultSheet?: boolean }): void {
    this.head = branchName;
    this.refs.set(branchName, '');
  this.tags.clear();

    const table = new TableTree();
    if (options?.createDefaultSheet ?? true) {
      const sheetName = options?.defaultSheetName ?? 'default';
      const sheet = new SheetTree(sheetName);
      const sheetHash = this.storeObject(sheet);
      table.upsertSheet(sheetName, sheetHash, { order: 0 });
    }

    const tableHash = this.storeObject(table);

    const initialCommit = new CommitObject(
      tableHash,
      'Initial commit',
      'System',
      'system@tablegit.com'
    );

    const commitHash = this.storeObject(initialCommit);
    this.refs.set(branchName, commitHash);
    this.tableSnapshots.set(commitHash, table.clone());

    this.loadWorkingState(table);
  }

  // ========== 工作表级操作 ==========

  createSheet(sheetName: string, details?: SheetAddDetails): void {
    const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable ?? new TableTree();
    if (table.hasSheet(sheetName)) {
      throw new Error(`Sheet '${sheetName}' already exists`);
    }

    const changeKey = `sheet:add:${sheetName}`;
    this.index.set(changeKey, {
      type: ChangeType.SHEET_ADD,
      sheetName,
      details: details ?? {},
      timestamp: Date.now()
    });
  }

  deleteSheet(sheetName: string): void {
    const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
    if (!table || !table.hasSheet(sheetName)) {
      throw new Error(`Sheet '${sheetName}' does not exist`);
    }

    const changeKey = `sheet:delete:${sheetName}`;
    this.index.set(changeKey, {
      type: ChangeType.SHEET_DELETE,
      sheetName,
      details: {},
      timestamp: Date.now()
    });
  }

  renameSheet(oldName: string, newName: string): void {
    if (oldName === newName) {
      return;
    }

    const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
    if (!table || !table.hasSheet(oldName)) {
      throw new Error(`Sheet '${oldName}' does not exist`);
    }

    if (table.hasSheet(newName)) {
      throw new Error(`Sheet '${newName}' already exists`);
    }

    if (this.hasBlockingStagedChanges(oldName)) {
      throw new Error(`Sheet '${oldName}' has staged changes. Commit or reset them before renaming.`);
    }

    const changeKey = `sheet:rename:${oldName}`;
    this.index.set(changeKey, {
      type: ChangeType.SHEET_RENAME,
      sheetName: oldName,
      details: { newName } as SheetRenameDetails,
      timestamp: Date.now()
    });
  }

  moveSheet(sheetName: string, newIndex: number): void {
    const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
    if (!table) {
      throw new Error('No sheets available');
    }

    const sheetNames = table.getSheetNames();
    const currentIndex = sheetNames.indexOf(sheetName);
    if (currentIndex === -1) {
      throw new Error(`Sheet '${sheetName}' does not exist`);
    }

    if (newIndex < 0 || newIndex >= sheetNames.length) {
      throw new Error(`Invalid sheet index ${newIndex}`);
    }

    if (currentIndex === newIndex) {
      return;
    }

    const changeKey = `sheet:move:${sheetName}`;
    this.index.set(changeKey, {
      type: ChangeType.SHEET_MOVE,
      sheetName,
      details: { newIndex } as SheetMoveDetails,
      timestamp: Date.now()
    });
  }

  duplicateSheet(sourceSheet: string, newName: string, options?: { order?: number; meta?: Record<string, unknown> }): void {
    if (sourceSheet === newName) {
      throw new Error('Source sheet and new sheet names must differ');
    }

    const table = this.getPreviewTable({ includeStaged: true }) ?? this.workingTable;
    if (!table || !table.hasSheet(sourceSheet)) {
      throw new Error(`Sheet '${sourceSheet}' does not exist`);
    }

    if (table.hasSheet(newName)) {
      throw new Error(`Sheet '${newName}' already exists`);
    }

    const changeKey = `sheet:duplicate:${newName}`;
    this.index.set(changeKey, {
      type: ChangeType.SHEET_DUPLICATE,
      sheetName: newName,
      details: {
        sourceSheet,
        newName,
        order: options?.order,
        meta: options?.meta
      } as SheetDuplicateDetails & SheetAddDetails,
      timestamp: Date.now()
    });
  }

  listSheets(options?: { includeStaged?: boolean }): string[] {
    if (options?.includeStaged) {
      const table = this.getPreviewTable({ includeStaged: true });
      return table ? table.getSheetNames() : [];
    }

    return this.workingTable ? this.workingTable.getSheetNames() : [];
  }

  hasSheet(sheetName: string, options?: { includeStaged?: boolean }): boolean {
    if (options?.includeStaged) {
      const table = this.getPreviewTable({ includeStaged: true });
      return table ? table.hasSheet(sheetName) : false;
    }
    return this.workingTable ? this.workingTable.hasSheet(sheetName) : false;
  }

  // ========== 单元格操作 ==========

  addCellChange(
    sheetName: string,
    row: number,
    column: number,
    value: CellValue,
    formula?: string,
    format?: CellFormat
  ): void {
    this.ensureSheetExists(sheetName);

    const cell = new CellObject(row, column, value, formula, format);
    const changeKey = `${sheetName}:cell:${row},${column}`;

    const baseSheet = this.workingSheets.get(sheetName);
    const baseHas = !!baseSheet?.getCellHash(row, column);
    const staged = this.index.get(changeKey);
    const type = (!baseHas || staged?.type === ChangeType.CELL_ADD || staged?.type === ChangeType.CELL_DELETE)
      ? ChangeType.CELL_ADD
      : ChangeType.CELL_UPDATE;

    this.index.set(changeKey, {
      type,
      sheetName,
      details: cell,
      timestamp: Date.now()
    });
  }

  deleteCellChange(sheetName: string, row: number, column: number): void {
    this.ensureSheetExists(sheetName);

    const changeKey = `${sheetName}:cell:${row},${column}`;
    this.index.set(changeKey, {
      type: ChangeType.CELL_DELETE,
      sheetName,
      details: { row, column },
      timestamp: Date.now()
    });
  }

  // ========== 列操作 ==========

  addColumn(sheetName: string, column: ColumnMetadata): void {
    this.ensureSheetExists(sheetName);
    const normalized = this.normalizeColumnMetadata(sheetName, column);
    const changeKey = `${sheetName}:column:add:${normalized.id}`;
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_ADD,
      sheetName,
      details: normalized,
      timestamp: Date.now()
    });
  }

  getNextColumnOrder(sheetName: string, options?: { includeStaged?: boolean }): number {
    this.ensureSheetExists(sheetName);
    const includeStaged = options?.includeStaged ?? true;
    const sheet = this.getPreviewSheet(sheetName, { includeStaged });
    if (!sheet) {
      return 0;
    }

    let maxOrder = Number.NEGATIVE_INFINITY;
    const columnIds = sheet.structure.getColumnIds();
    for (const id of columnIds) {
      const meta = sheet.structure.getColumn(id);
      if (meta && typeof meta.order === 'number') {
        maxOrder = Math.max(maxOrder, meta.order);
      }
    }

    if (maxOrder > Number.NEGATIVE_INFINITY) {
      return maxOrder + 1;
    }

    const bounds = sheet.getBounds();
    if (bounds) {
      return bounds.maxCol + 1;
    }

    return 0;
  }

  updateColumn(sheetName: string, columnId: string, updates: Partial<ColumnMetadata>): void {
    this.ensureSheetExists(sheetName);
    const changeKey = `${sheetName}:column:update:${columnId}`;
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_UPDATE,
      sheetName,
      details: { columnId, updates },
      timestamp: Date.now()
    });
  }

  deleteColumn(sheetName: string, columnId: string): void {
    this.ensureSheetExists(sheetName);
    const changeKey = `${sheetName}:column:delete:${columnId}`;
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_DELETE,
      sheetName,
      details: { columnId },
      timestamp: Date.now()
    });
  }

  moveColumn(sheetName: string, columnId: string, newIndex: number): void {
    this.ensureSheetExists(sheetName);
    if (!Number.isInteger(newIndex) || newIndex < 0) {
      throw new Error('Column index must be a non-negative integer');
    }

    const changeKey = `${sheetName}:column:move:${columnId}`;
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_MOVE,
      sheetName,
      details: { columnId, newIndex },
      timestamp: Date.now()
    });
  }

  deleteColumnByIndex(sheetName: string, columnIndex: number, options?: { includeStaged?: boolean }): void {
    this.ensureSheetExists(sheetName);
    if (!Number.isInteger(columnIndex) || columnIndex < 0) {
      throw new Error('Column index must be a non-negative integer');
    }

    const includeStaged = options?.includeStaged ?? true;
    let sheet = this.getPreviewSheet(sheetName, { includeStaged });
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' does not exist`);
    }

    const columnIds = sheet.structure.getColumnIds();
    if (columnIds.length > 0) {
      if (columnIndex >= columnIds.length) {
        throw new Error(`Column index ${columnIndex} is out of bounds`);
      }
      const columnId = columnIds[columnIndex];
      this.deleteColumn(sheetName, columnId);
      return;
    }

    const bounds = sheet.getBounds();
    if (!bounds) {
      throw new Error(`Sheet '${sheetName}' has no data to infer columns from`);
    }

    const totalColumns = bounds.maxCol - bounds.minCol + 1;
    if (columnIndex >= totalColumns) {
      throw new Error(`Column index ${columnIndex} is out of bounds`);
    }

    const columnOrder = bounds.minCol + columnIndex;
    const changeKeyBase = `${sheetName}:column:delete-order:${columnOrder}`;
    let changeKey = changeKeyBase;
    let counter = 1;
    while (this.index.has(changeKey)) {
      changeKey = `${changeKeyBase}:${counter++}`;
    }

    this.index.set(changeKey, {
      type: ChangeType.COLUMN_DELETE,
      sheetName,
      details: { columnOrder },
      timestamp: Date.now()
    });
  }

  // ========== 行操作 ==========

  addRow(sheetName: string, row: RowMetadata): void {
    this.ensureSheetExists(sheetName);
    const normalized = this.normalizeRowMetadata(sheetName, row);
    const changeKey = `${sheetName}:row:add:${normalized.id}`;
    this.index.set(changeKey, {
      type: ChangeType.ROW_ADD,
      sheetName,
      details: normalized,
      timestamp: Date.now()
    });
  }

  getNextRowOrder(sheetName: string, options?: { includeStaged?: boolean }): number {
    this.ensureSheetExists(sheetName);
    const includeStaged = options?.includeStaged ?? true;
    const sheet = this.getPreviewSheet(sheetName, { includeStaged });
    if (!sheet) {
      return 0;
    }

    let maxOrder = Number.NEGATIVE_INFINITY;
    const rowIds = sheet.structure.getRowIds();
    for (const id of rowIds) {
      const meta = sheet.structure.getRow(id);
      if (meta && typeof meta.order === 'number') {
        maxOrder = Math.max(maxOrder, meta.order);
      }
    }

    if (maxOrder > Number.NEGATIVE_INFINITY) {
      return maxOrder + 1;
    }

    const bounds = sheet.getBounds();
    if (bounds) {
      return bounds.maxRow + 1;
    }

    return 0;
  }

  deleteRow(sheetName: string, rowId: string): void {
    this.ensureSheetExists(sheetName);
    const changeKey = `${sheetName}:row:delete:${rowId}`;
    this.index.set(changeKey, {
      type: ChangeType.ROW_DELETE,
      sheetName,
      details: { rowId },
      timestamp: Date.now()
    });
  }

  deleteRowByIndex(sheetName: string, rowIndex: number, options?: { includeStaged?: boolean }): void {
    this.ensureSheetExists(sheetName);
    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
      throw new Error('Row index must be a non-negative integer');
    }

    const includeStaged = options?.includeStaged ?? true;
    let sheet = this.getPreviewSheet(sheetName, { includeStaged });
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' does not exist`);
    }

    const rowIds = sheet.structure.getRowIds();
    if (rowIds.length > 0) {
      if (rowIndex >= rowIds.length) {
        throw new Error(`Row index ${rowIndex} is out of bounds`);
      }
      const rowId = rowIds[rowIndex];
      this.deleteRow(sheetName, rowId);
      return;
    }

    const bounds = sheet.getBounds();
    if (!bounds) {
      throw new Error(`Sheet '${sheetName}' has no data to infer rows from`);
    }

    const totalRows = bounds.maxRow - bounds.minRow + 1;
    if (rowIndex >= totalRows) {
      throw new Error(`Row index ${rowIndex} is out of bounds`);
    }

    const rowOrder = bounds.minRow + rowIndex;
    const changeKeyBase = `${sheetName}:row:delete-order:${rowOrder}`;
    let changeKey = changeKeyBase;
    let counter = 1;
    while (this.index.has(changeKey)) {
      changeKey = `${changeKeyBase}:${counter++}`;
    }

    this.index.set(changeKey, {
      type: ChangeType.ROW_DELETE,
      sheetName,
      details: { rowOrder },
      timestamp: Date.now()
    });
  }

  sortRows(sheetName: string, sortCriteria: SortCriteria[]): void {
    this.ensureSheetExists(sheetName);
    const changeKey = `${sheetName}:row:sort:${Date.now()}`;
    this.index.set(changeKey, {
      type: ChangeType.ROW_SORT,
      sheetName,
      details: { sortCriteria },
      timestamp: Date.now()
    });
  }

  // ========== 版本控制核心操作 ==========

  commit(message: string, author: string, email: string): string {
    if (this.index.size === 0) {
      throw new Error('Nothing to commit');
    }

    const { table, tableHash, sheets } = this.buildTableFromIndex();
    const currentCommitHash = this.refs.get(this.head);

    const commit = new CommitObject(
      tableHash,
      message,
      author,
      email,
      currentCommitHash
    );

    const commitHash = this.storeObject(commit);
    this.refs.set(this.head, commitHash);
    this.tableSnapshots.set(commitHash, table.clone());
    this.index.clear();
    this.loadWorkingState(table, sheets);

    return commitHash;
  }

  private buildTableFromIndex(): { table: TableTree; tableHash: string; sheets: Map<string, SheetTree> } {
    const table = this.workingTable ? this.workingTable.clone() : new TableTree();
    const sheets = new Map<string, SheetTree>();

    if (this.workingTable) {
      for (const name of this.workingTable.getSheetNames()) {
        const workingSheet = this.workingSheets.get(name);
        if (workingSheet) {
          sheets.set(name, workingSheet.clone());
          continue;
        }

        const sheetHash = this.workingTable.getSheetHash(name);
        if (!sheetHash) continue;
        const storedSheet = this.getObject(sheetHash) as SheetTree;
        if (storedSheet) {
          sheets.set(name, storedSheet.clone());
        }
      }
    }

    for (const change of this.index.values()) {
      this.applyChange(table, sheets, change);
    }

    for (const [name, sheet] of sheets) {
      const sheetHash = this.storeObject(sheet);
      table.upsertSheet(name, sheetHash);
    }

    const tableHash = this.storeObject(table);
    return { table, tableHash, sheets };
  }

  private applyChange(table: TableTree, sheets: Map<string, SheetTree>, change: Change): void {
    switch (change.type) {
      case ChangeType.SHEET_ADD: {
        const details = change.details as SheetAddDetails | undefined;
        const newSheet = new SheetTree(change.sheetName);
        sheets.set(change.sheetName, newSheet);
        table.upsertSheet(change.sheetName, newSheet.hash, { order: details?.order, meta: details?.meta });
        break;
      }
      case ChangeType.SHEET_DELETE: {
        sheets.delete(change.sheetName);
        table.removeSheet(change.sheetName);
        break;
      }
      case ChangeType.SHEET_RENAME: {
        const details = change.details as SheetRenameDetails;
        if (!details?.newName) {
          break;
        }

        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        sheet.rename(details.newName);
        sheets.delete(change.sheetName);
        sheets.set(details.newName, sheet);
        table.renameSheet(change.sheetName, details.newName);
        break;
      }
      case ChangeType.SHEET_MOVE: {
        const details = change.details as SheetMoveDetails;
        if (typeof details?.newIndex === 'number') {
          table.moveSheet(change.sheetName, details.newIndex);
        }
        break;
      }
      case ChangeType.SHEET_DUPLICATE: {
        const details = change.details as SheetDuplicateDetails & SheetAddDetails;
        if (!details?.sourceSheet || !details?.newName) {
          break;
        }

        const sourceSheet = this.getMutableSheet(table, sheets, details.sourceSheet).clone();
        sourceSheet.rename(details.newName);
        sheets.set(details.newName, sourceSheet);
        table.upsertSheet(details.newName, sourceSheet.hash, { order: details.order, meta: details.meta });
        break;
      }
      case ChangeType.CELL_ADD:
      case ChangeType.CELL_UPDATE: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        const cell = change.details as CellObject;
        const cellHash = this.storeObject(cell);
        sheet.setCellHash(cell.row, cell.column, cellHash);
        break;
      }
      case ChangeType.CELL_DELETE: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        const { row, column } = change.details;
        sheet.deleteCell(row, column);
        break;
      }
      case ChangeType.COLUMN_ADD: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        sheet.structure.addColumn(change.details as ColumnMetadata);
        break;
      }
      case ChangeType.COLUMN_UPDATE: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        const { columnId, updates } = change.details;
        sheet.structure.updateColumn(columnId, updates);
        break;
      }
      case ChangeType.COLUMN_DELETE: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        const details = change.details ?? {};
        let targetColumnId: string | undefined = details.columnId;
        let targetOrder: number | undefined;

        if (typeof details.columnOrder === 'number') {
          targetOrder = details.columnOrder;
        } else if (typeof details.columnIndex === 'number') {
          targetOrder = details.columnIndex;
        }

        if (targetColumnId) {
          const column = sheet.structure.getColumn(targetColumnId);
          if (column && typeof column.order === 'number') {
            targetOrder = column.order;
          }
        } else if (typeof targetOrder === 'number') {
          targetColumnId = this.findColumnIdByOrder(sheet, targetOrder);
        }

        if (typeof targetOrder === 'number') {
          const cells = sheet.getAllCellPositions();
          for (const { row, col } of cells) {
            if (col === targetOrder) {
              sheet.deleteCell(row, col);
            }
          }
        }

        if (targetColumnId) {
          sheet.structure.removeColumn(targetColumnId);
        } else if (typeof targetOrder === 'number') {
          const fallbackId = this.findColumnIdByOrder(sheet, targetOrder);
          if (fallbackId) {
            sheet.structure.removeColumn(fallbackId);
          }
        }
        break;
      }
      case ChangeType.COLUMN_MOVE: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        sheet.structure.moveColumn(change.details.columnId, change.details.newIndex);
        break;
      }
      case ChangeType.ROW_ADD: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        sheet.structure.addRow(change.details as RowMetadata);
        break;
      }
      case ChangeType.ROW_DELETE: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        const details = change.details ?? {};
        let targetRowId: string | undefined = details.rowId;
        let targetOrder: number | undefined;

        if (typeof details.rowOrder === 'number') {
          targetOrder = details.rowOrder;
        } else if (typeof details.rowIndex === 'number') {
          targetOrder = details.rowIndex;
        }

        if (targetRowId) {
          const row = sheet.structure.getRow(targetRowId);
          if (row && typeof row.order === 'number') {
            targetOrder = row.order;
          }
        } else if (typeof targetOrder === 'number') {
          targetRowId = this.findRowIdByOrder(sheet, targetOrder);
        }

        if (typeof targetOrder === 'number') {
          const cells = sheet.getAllCellPositions();
          for (const { row: r, col } of cells) {
            if (r === targetOrder) {
              sheet.deleteCell(r, col);
            }
          }
        }

        if (targetRowId) {
          sheet.structure.removeRow(targetRowId);
        } else if (typeof targetOrder === 'number') {
          const fallbackId = this.findRowIdByOrder(sheet, targetOrder);
          if (fallbackId) {
            sheet.structure.removeRow(fallbackId);
          }
        }
        break;
      }
      case ChangeType.ROW_SORT: {
        const sheet = this.getMutableSheet(table, sheets, change.sheetName);
        const { sortCriteria } = change.details;
        this.applySorting(sheet, sortCriteria);
        break;
      }
      default:
        break;
    }
  }

  private getMutableSheet(table: TableTree, sheets: Map<string, SheetTree>, sheetName: string): SheetTree {
    let sheet = sheets.get(sheetName);
    if (sheet) {
      return sheet;
    }

    if (!table.hasSheet(sheetName)) {
      throw new Error(`Sheet '${sheetName}' does not exist`);
    }

    const sheetHash = table.getSheetHash(sheetName);
    if (!sheetHash) {
      throw new Error(`Snapshot for sheet '${sheetName}' is missing`);
    }

    const storedSheet = this.getObject(sheetHash) as SheetTree;
    if (!storedSheet) {
      throw new Error(`Stored sheet '${sheetName}' cannot be found`);
    }

    sheet = storedSheet.clone();
    sheets.set(sheetName, sheet);
    return sheet;
  }

  private applySorting(sheet: SheetTree, criteria: SortCriteria[]): void {
    const currentOrder = sheet.structure.getRowIds();
    const sortedOrder = [...currentOrder].sort((a, b) => a.localeCompare(b));
    sheet.structure.sortRows(sortedOrder);
  }

  private normalizeColumnMetadata(sheetName: string, column: ColumnMetadata): ColumnMetadata {
    const normalized = deepClone(column) as ColumnMetadata;
    if (!normalized.id) {
      normalized.id = generateId('col_');
    }
    if (typeof normalized.order !== 'number' || !Number.isFinite(normalized.order)) {
      normalized.order = this.getNextColumnOrder(sheetName);
    }
    if (typeof normalized.width !== 'number' || normalized.width <= 0) {
      normalized.width = 120;
    }
    if (!normalized.dataType) {
      normalized.dataType = 'mixed';
    }
    return normalized;
  }

  private normalizeRowMetadata(sheetName: string, row: RowMetadata): RowMetadata {
    const normalized = deepClone(row) as RowMetadata;
    if (!normalized.id) {
      normalized.id = generateId('row_');
    }
    if (typeof normalized.order !== 'number' || !Number.isFinite(normalized.order)) {
      normalized.order = this.getNextRowOrder(sheetName);
    }
    if (typeof normalized.height !== 'number' || normalized.height <= 0) {
      normalized.height = 25;
    }
    return normalized;
  }

  private findColumnIdByOrder(sheet: SheetTree, order: number): string | undefined {
    for (const id of sheet.structure.getColumnIds()) {
      const meta = sheet.structure.getColumn(id);
      if (meta && typeof meta.order === 'number' && meta.order === order) {
        return id;
      }
    }
    return undefined;
  }

  private findRowIdByOrder(sheet: SheetTree, order: number): string | undefined {
    for (const id of sheet.structure.getRowIds()) {
      const meta = sheet.structure.getRow(id);
      if (meta && typeof meta.order === 'number' && meta.order === order) {
        return id;
      }
    }
    return undefined;
  }

  // ========== 对象存储 ==========

  private storeObject(obj: any): string {
    const hash = obj.hash;

      if (obj instanceof SheetTree) {
        this.objects.set(hash, { type: ObjectType.SHEET, payload: obj.toJSON() });
        return hash;
      }

    if (obj instanceof TableTree) {
      this.objects.set(hash, { type: ObjectType.TABLE, payload: obj.toJSON() });
      return hash;
    }

    if (obj instanceof CellObject) {
      const clonedCell = new CellObject(obj.row, obj.column, obj.value, obj.formula, obj.format);
      this.objects.set(hash, { type: ObjectType.CELL, payload: obj.toJSON() });
      return hash;
    }

    if (obj instanceof CommitObject) {
      this.objects.set(hash, { type: ObjectType.COMMIT, payload: obj.toJSON() });
      return hash;
    }

    if (obj instanceof TagObject) {
      this.objects.set(hash, { type: ObjectType.TAG, payload: obj.toJSON() });
      return hash;
    }

    this.objects.set(hash, { type: obj.type ?? 'raw', payload: obj });
    return hash;
  }

  private getObject(hash: string): any {
    const entry = this.objects.get(hash);
    if (!entry) {
      return undefined;
    }

    if (entry instanceof SheetTree || entry instanceof TableTree || entry instanceof CellObject || entry instanceof CommitObject) {
      return entry;
    }

    if (entry.type === ObjectType.SHEET) {
      return SheetTree.fromJSON(entry.payload);
    }

    if (entry.type === ObjectType.TABLE) {
      return TableTree.fromJSON(entry.payload);
    }

    if (entry.type === ObjectType.CELL) {
      return CellObject.fromJSON(entry.payload);
    }

    if (entry.type === ObjectType.COMMIT) {
      return CommitObject.fromJSON(entry.payload);
    }

    if (entry.type === ObjectType.TAG) {
      return TagObject.fromJSON(entry.payload);
    }

    return entry.payload;
  }

  // ========== 标签操作 ==========

  createTag(
    tagName: string,
    options?: {
      commit?: string;
      message?: string;
      author?: string;
      email?: string;
      force?: boolean;
    }
  ): string {
    this.validateTagName(tagName);

    if (!options?.force && this.tags.has(tagName)) {
      throw new Error(`Tag '${tagName}' already exists`);
    }

    const targetCommit = this.resolveCommitHash(options?.commit);
    if (!targetCommit) {
      throw new Error('Cannot create tag: no commit specified and repository has no commits');
    }

    const commitObject = this.getObject(targetCommit);
    if (!(commitObject instanceof CommitObject)) {
      throw new Error(`Cannot create tag: commit '${targetCommit}' does not exist`);
    }

    if (options?.message || options?.author || options?.email) {
      const tagAuthor = options.author ?? 'Unknown';
      const tagEmail = options.email ?? 'unknown@example.com';
      const tag = new TagObject(tagName, commitObject.hash, {
        message: options.message,
        author: tagAuthor,
        email: tagEmail
      });
      const tagHash = this.storeObject(tag);
      this.tags.set(tagName, { commit: commitObject.hash, type: 'annotated', tagHash });
      return commitObject.hash;
    }

    this.tags.set(tagName, { commit: commitObject.hash, type: 'lightweight' });
    return commitObject.hash;
  }

  deleteTag(tagName: string): void {
    if (!this.tags.delete(tagName)) {
      throw new Error(`Tag '${tagName}' does not exist`);
    }
  }

  getTag(tagName: string): TagInfo | undefined {
    const tagEntry = this.tags.get(tagName);
    if (!tagEntry) {
      return undefined;
    }

    const base: TagInfo = {
      name: tagName,
      target: tagEntry.commit,
      type: tagEntry.type
    };

    if (tagEntry.type === 'annotated' && tagEntry.tagHash) {
      const tagObject = this.getObject(tagEntry.tagHash) as TagObject | undefined;
      if (tagObject) {
        base.tagHash = tagObject.hash;
        base.message = tagObject.message;
        base.author = tagObject.author;
        base.email = tagObject.email;
        base.timestamp = tagObject.timestamp;
      }
    }

    return base;
  }

  listTags(options?: { withDetails?: boolean }): (string | TagInfo)[] {
    const names = Array.from(this.tags.keys()).sort();
    if (!options?.withDetails) {
      return names;
    }

    const details: TagInfo[] = [];
    for (const name of names) {
      const info = this.getTag(name);
      if (info) {
        details.push(info);
      }
    }
    return details;
  }

  private validateTagName(tagName: string): void {
    if (!tagName || typeof tagName !== 'string') {
      throw new Error('Tag name must be a non-empty string');
    }

    const invalidPattern = /[~^:\\?*\s]/;
    if (invalidPattern.test(tagName)) {
      throw new Error(`Tag name '${tagName}' contains invalid characters`);
    }
  }

  private resolveCommitHash(reference?: string): string | undefined {
    if (!reference) {
      return this.getCurrentCommitHash();
    }

    if (this.refs.has(reference)) {
      return this.refs.get(reference);
    }

    const tagRef = this.tags.get(reference);
    if (tagRef) {
      return tagRef.commit;
    }

    const possibleCommit = this.getObject(reference);
    if (possibleCommit instanceof CommitObject) {
      return possibleCommit.hash;
    }

    return undefined;
  }

  // ========== 快照 ==========

  getTreeSnapshot(ref?: { branch?: string; commit?: string }): TableTree | undefined {
    let commitHash: string | undefined;
    if (ref?.commit) {
      commitHash = ref.commit;
    } else if (ref?.branch) {
      commitHash = this.refs.get(ref.branch);
    } else {
      commitHash = this.refs.get(this.head) || (this.isDetachedHead() ? this.head : undefined);
    }

    if (!commitHash) return undefined;

    const snapshot = commitHash ? this.tableSnapshots.get(commitHash) : undefined;
    if (snapshot) {
      return snapshot.clone();
    }

    const commitObj = this.getObject(commitHash) as CommitObject | undefined;
    if (!commitObj) return undefined;
    const table = this.getObject(commitObj.tree) as TableTree | undefined;
    return table ? table.clone() : undefined;
  }

  getSheetSnapshot(sheetName: string, ref?: { branch?: string; commit?: string }): SheetTree | undefined {
    const table = this.getTreeSnapshot(ref);
    if (!table) return undefined;

    const sheetHash = table.getSheetHash(sheetName);
    if (!sheetHash) return undefined;

    const sheet = this.getObject(sheetHash) as SheetTree | undefined;
    return sheet ? sheet.clone() : undefined;
  }

  getCellFromTree(tree: SheetTree | TableTree, row: number, col: number, sheetName: string = 'default'): CellObject | undefined {
    if (tree instanceof TableTree) {
      const sheetHash = tree.getSheetHash(sheetName);
      if (!sheetHash) return undefined;
      const sheet = this.getObject(sheetHash) as SheetTree | undefined;
      if (!sheet) return undefined;
      const cellHash = sheet.getCellHash(row, col);
      if (!cellHash) return undefined;
      return this.getObject(cellHash) as CellObject;
    }

    const hash = (tree as SheetTree).getCellHash(row, col);
    if (!hash) return undefined;
    return this.getObject(hash) as CellObject;
  }

  // ========== 分支操作 ==========

  createBranch(branchName: string): void {
    const currentCommitHash = this.refs.get(this.head);
    if (!currentCommitHash) {
      throw new Error('Cannot create branch: no commits found');
    }
    this.refs.set(branchName, currentCommitHash);
  }

  checkout(target: string): void {
    if (this.index.size > 0) {
      throw new Error('Cannot checkout: you have unstaged changes');
    }

    if (this.refs.has(target)) {
      this.head = target;
      this.loadWorkingTree();
      return;
    }

    const commit = this.getObject(target);
    if (commit && commit.type === ObjectType.COMMIT) {
      this.head = target;
      this.loadWorkingTreeFromCommit(target);
      return;
    }

    throw new Error(`Branch or commit '${target}' does not exist`);
  }

  private loadWorkingTreeFromCommit(commitHash: string): void {
    const snapshot = this.tableSnapshots.get(commitHash);
    if (snapshot) {
      this.loadWorkingState(snapshot.clone());
      return;
    }

    const commitObj = this.getObject(commitHash) as CommitObject | undefined;
    if (!commitObj) {
      this.workingTable = null;
      this.workingSheets = new Map();
      return;
    }

    const table = this.getObject(commitObj.tree) as TableTree | undefined;
    if (!table) {
      this.workingTable = null;
      this.workingSheets = new Map();
      return;
    }

    this.loadWorkingState(table);
  }

  getCurrentBranch(): string {
    return this.head;
  }

  isDetachedHead(): boolean {
    return !this.refs.has(this.head);
  }

  getCurrentCommitHash(): string | undefined {
    if (this.isDetachedHead()) {
      return this.head;
    }
    return this.refs.get(this.head);
  }

  getBranches(): string[] {
    return Array.from(this.refs.keys());
  }

  private loadWorkingTree(): void {
    const commitHash = this.refs.get(this.head);
    if (!commitHash) {
      this.workingTable = null;
      this.workingSheets = new Map();
      return;
    }
    this.loadWorkingTreeFromCommit(commitHash);
  }

  // ========== 状态查询 ==========

  status(): { branch: string; stagedChanges: number; lastCommit?: string } {
    const lastCommitHash = this.refs.get(this.head);
    return {
      branch: this.head,
      stagedChanges: this.index.size,
      lastCommit: lastCommitHash ? (this.getObject(lastCommitHash) as CommitObject | undefined)?.getShortHash() : undefined
    };
  }

  getStagedChanges(): Change[] {
    return Array.from(this.index.values());
  }

  reset(): void {
    this.index.clear();
  }

  getCommitHistory(limit: number = 10): CommitObject[] {
    const history: CommitObject[] = [];
    let currentHash = this.refs.get(this.head);

    while (currentHash && history.length < limit) {
      const commit = this.getObject(currentHash) as CommitObject;
      if (!commit) {
        break;
      }

      history.push(commit);
      currentHash = commit.parent;
    }

    return history;
  }

  getWorkingTable(): TableTree | undefined {
    return this.workingTable ? this.workingTable.clone() : undefined;
  }

  getWorkingSheet(sheetName: string): SheetTree | undefined {
    const sheet = this.workingSheets.get(sheetName);
    return sheet ? sheet.clone() : undefined;
  }

  getWorkingTree(): SheetTree | undefined {
    return this.getWorkingSheet('default');
  }

  getPreviewTable(options?: { includeStaged?: boolean }): TableTree | undefined {
    if (options?.includeStaged) {
      const { table } = this.buildTableFromIndex();
      return table.clone();
    }
    return this.getWorkingTable();
  }

  getPreviewSheet(sheetName: string, options?: { includeStaged?: boolean }): SheetTree | undefined {
    if (options?.includeStaged) {
      const { sheets } = this.buildTableFromIndex();
      const sheet = sheets.get(sheetName);
      return sheet ? sheet.clone() : undefined;
    }
    return this.getWorkingSheet(sheetName);
  }

  getPreviewTree(options?: { includeStaged?: boolean }): SheetTree | undefined {
    return this.getPreviewSheet('default', options);
  }

  getCellValue(row: number, col: number, sheetName: string = 'default'): CellValue | undefined {
    const sheet = this.workingSheets.get(sheetName);
    if (!sheet) return undefined;
    const cellHash = sheet.getCellHash(row, col);
    if (!cellHash) return undefined;
    const cell = this.getObject(cellHash) as CellObject;
    return cell?.value;
  }

  getCell(row: number, col: number, sheetName: string = 'default'): CellObject | undefined {
    const sheet = this.workingSheets.get(sheetName);
    if (!sheet) return undefined;
    const cellHash = sheet.getCellHash(row, col);
    if (!cellHash) return undefined;
    return this.getObject(cellHash) as CellObject;
  }

  // ========== 序列化与恢复 ==========

  exportState(options?: TableGitExportOptions): SerializedTableGitState {
    const config = this.resolveExportOptions(options);

    const refsRecord = Object.fromEntries(this.refs);
    const tagsRecord: Record<string, SerializedTagEntry> = {};
    for (const [name, tagEntry] of this.tags.entries()) {
      tagsRecord[name] = this.serializeTagEntry(tagEntry, !config.stripTagDetails);
    }

    const reachableHashes: Set<string> = config.limitObjects
      ? this.collectReachableObjectHashes({
          roots: config.roots,
          includeWorkingState: config.includeWorkingState,
          includeSnapshots: config.includeSnapshots,
          includeStagedChanges: config.includeStagedChanges,
          includeAnnotatedTags: true
        })
      : new Set<string>(Array.from(this.objects.keys()));

    const objects: SerializedObjectEntry[] = [];
    const sortedHashes = Array.from(reachableHashes.values()).sort();
    for (const hash of sortedHashes) {
      const entry = this.objects.get(hash);
      if (!entry) continue;
      const normalized = this.cloneStoredObject(entry, { stripDefaults: config.stripDefaults });
      objects.push({
        hash,
        type: normalized.type,
        payload: normalized.payload
      });
    }

    const state: SerializedTableGitState = {
      version: TableGit.SERIALIZATION_VERSION,
      head: this.head,
      refs: refsRecord,
      tags: tagsRecord,
      objects
    };

    if (config.includeStagedChanges && this.index.size > 0) {
      state.stagedChanges = Array.from(this.index.entries()).map(([key, change]) => {
        return {
          key,
          change: this.serializeChange(change)
        };
      });
    }

    if (config.includeSnapshots && this.tableSnapshots.size > 0) {
      state.snapshots = Array.from(this.tableSnapshots.entries()).map(([commit, table]) => {
        return {
          commit,
          table: table.toJSON()
        };
      });
    }

    if (config.includeWorkingState) {
      const workingState: NonNullable<SerializedTableGitState['workingState']> = {};
      if (this.workingTable) {
        workingState.table = this.workingTable.toJSON();
      }
      if (this.workingSheets.size > 0) {
        const sheetRecord: Record<string, any> = {};
        for (const [name, sheet] of this.workingSheets.entries()) {
          sheetRecord[name] = sheet.toJSON();
        }
        workingState.sheets = sheetRecord;
      }
      if (Object.keys(workingState).length > 0) {
        state.workingState = workingState;
      }
    }

    return state;
  }

  exportStateAsJSON(options?: TableGitExportOptions): string {
    const state = this.exportState(options);
    const indent = options?.pretty ? 2 : undefined;
    return JSON.stringify(state, undefined, indent);
  }

  importState(state: SerializedTableGitState, options?: TableGitImportOptions): void {
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid state data: expected an object');
    }

    const restoreWorkingState = options?.restoreWorkingState ?? true;
    const restoreSnapshots = options?.restoreSnapshots ?? true;
    const restoreStagedChanges = options?.restoreStagedChanges ?? true;

    const version = state.version ?? 1;
    if (version > TableGit.SERIALIZATION_VERSION) {
      throw new Error(
        `State version ${version} is newer than supported version ${TableGit.SERIALIZATION_VERSION}`
      );
    }

    this.head = state.head ?? 'main';

    this.refs = new Map(Object.entries(state.refs ?? {}));

    this.tags = new Map();
    const serializedTags = state.tags ?? {};
    for (const [name, entry] of Object.entries(serializedTags)) {
      if (!entry?.commit || !entry.type) {
        continue;
      }
      this.tags.set(name, {
        commit: entry.commit,
        type: entry.type,
        tagHash: entry.tagHash
      });
    }

    this.objects = new Map();
    for (const entry of state.objects ?? []) {
      if (!entry?.hash) {
        continue;
      }
      this.objects.set(entry.hash, {
        type: entry.type,
        payload: deepClone(entry.payload)
      });
    }

    this.index = new Map();
    if (restoreStagedChanges && state.stagedChanges) {
      for (const staged of state.stagedChanges) {
        if (!staged?.key || !staged.change) {
          continue;
        }
        this.index.set(staged.key, this.hydrateChange(staged.change));
      }
    }

    this.tableSnapshots = new Map();
    if (restoreSnapshots && state.snapshots) {
      for (const snapshot of state.snapshots) {
        if (!snapshot?.commit || !snapshot.table) {
          continue;
        }
        this.tableSnapshots.set(snapshot.commit, TableTree.fromJSON(snapshot.table));
      }
    }

    const hasWorkingState = restoreWorkingState && state.workingState?.table;
    if (hasWorkingState) {
      const table = TableTree.fromJSON(state.workingState?.table);
      const overrides = new Map<string, SheetTree>();
      const serializedSheets = state.workingState?.sheets ?? {};
      for (const [name, sheetJson] of Object.entries(serializedSheets)) {
        overrides.set(name, SheetTree.fromJSON(sheetJson));
      }
      this.loadWorkingState(table, overrides.size > 0 ? overrides : undefined);
    } else {
      this.workingTable = null;
      this.workingSheets = new Map();
      this.loadWorkingTree();
    }
  }

  // ========== 内部工具 ==========

  private loadWorkingState(table: TableTree, sheetOverrides?: Map<string, SheetTree>): void {
    this.workingTable = table.clone();
    this.workingSheets = new Map();

    for (const name of this.workingTable.getSheetNames()) {
      if (sheetOverrides?.has(name)) {
        this.workingSheets.set(name, (sheetOverrides.get(name) as SheetTree).clone());
        continue;
      }

      const sheetHash = this.workingTable.getSheetHash(name);
      if (!sheetHash) {
        continue;
      }

      const sheet = this.getObject(sheetHash) as SheetTree;
      if (sheet) {
        this.workingSheets.set(name, sheet.clone());
      }
    }
  }

  private ensureSheetExists(sheetName: string): void {
    if (this.hasSheet(sheetName, { includeStaged: true })) {
      return;
    }
    throw new Error(`Sheet '${sheetName}' does not exist. Create it before modifying content.`);
  }

  private hasBlockingStagedChanges(sheetName: string): boolean {
    for (const change of this.index.values()) {
      if (change.sheetName !== sheetName) continue;
      if (change.type === ChangeType.SHEET_MOVE || change.type === ChangeType.SHEET_RENAME) {
        continue;
      }
      return true;
    }
    return false;
  }

  private resolveExportOptions(options?: TableGitExportOptions): TableGitResolvedExportOptions {
    const preset = options?.preset ?? 'minimal';

    const normalizeSet = (values?: string[]): string[] | undefined => {
      if (!values) return undefined;
      const unique = new Set<string>();
      for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
          unique.add(value.trim());
        }
      }
      return unique.size > 0 ? Array.from(unique) : undefined;
    };

    const roots: TableGitExportRoots = {
      includeHead: options?.roots?.includeHead ?? true,
      includeAllBranches: options?.roots?.includeAllBranches ?? false,
      includeAllTags: options?.roots?.includeAllTags ?? false,
      branches: normalizeSet(options?.roots?.branches),
      tags: normalizeSet(options?.roots?.tags),
      commits: normalizeSet(options?.roots?.commits)
    };

    const includeWorkingState = options?.includeWorkingState ?? (preset === 'full');
    const includeSnapshots = options?.includeSnapshots ?? false;
    const includeStagedChanges = options?.includeStagedChanges ?? (preset === 'full');
    const stripDefaults = options?.stripDefaults ?? (preset === 'minimal');
    const stripTagDetails = options?.stripTagDetails ?? (preset === 'minimal');
    const limitObjects = preset === 'minimal' || !!options?.roots;

    return {
      preset,
      includeWorkingState,
      includeSnapshots,
      includeStagedChanges,
      roots,
      stripDefaults,
      stripTagDetails,
      limitObjects
    };
  }

  private resolveExportRoots(roots: TableGitExportRoots): Set<string> {
    const commits = new Set<string>();

    const includeHead = roots.includeHead ?? true;
    if (includeHead) {
      const headCommit = this.getCurrentCommitHash();
      if (headCommit) {
        commits.add(headCommit);
      }
    }

    if (roots.includeAllBranches) {
      for (const hash of this.refs.values()) {
        if (hash) {
          commits.add(hash);
        }
      }
    }

    if (roots.branches) {
      for (const branch of roots.branches) {
        const hash = this.refs.get(branch);
        if (hash) {
          commits.add(hash);
        }
      }
    }

    if (roots.includeAllTags) {
      for (const entry of this.tags.values()) {
        if (entry.commit) {
          commits.add(entry.commit);
        }
      }
    }

    if (roots.tags) {
      for (const tagName of roots.tags) {
        const tag = this.tags.get(tagName);
        if (tag?.commit) {
          commits.add(tag.commit);
        }
      }
    }

    if (roots.commits) {
      for (const commit of roots.commits) {
        if (commit) {
          commits.add(commit);
        }
      }
    }

    return commits;
  }

  private collectReachableObjectHashes(input: ReachableCollectionInput): Set<string> {
    const reachable = new Set<string>();
    const visitedCommits = new Set<string>();
    const processedTables = new Set<string>();
    const processedSheets = new Set<string>();

    const roots = this.resolveExportRoots(input.roots);
    for (const commitHash of roots) {
      this.collectCommitObjects(commitHash, visitedCommits, reachable, processedTables, processedSheets);
    }

    if (input.includeAnnotatedTags) {
      for (const tagEntry of this.tags.values()) {
        if (tagEntry.tagHash) {
          reachable.add(tagEntry.tagHash);
        }
      }
    }

    if (input.includeSnapshots) {
      for (const table of this.tableSnapshots.values()) {
        this.collectTableObjects(table.hash, reachable, processedTables, processedSheets);
      }
    }

    if (input.includeWorkingState) {
      this.collectWorkingStateObjects(reachable, processedTables, processedSheets);
    }

    if (input.includeStagedChanges) {
      for (const change of this.index.values()) {
        this.collectChangeObjectReferences(change, reachable);
      }
    }

    return reachable;
  }

  private collectCommitObjects(
    commitHash: string | undefined,
    visitedCommits: Set<string>,
    reachable: Set<string>,
    processedTables: Set<string>,
    processedSheets: Set<string>
  ): void {
    if (!commitHash || visitedCommits.has(commitHash)) {
      return;
    }

    visitedCommits.add(commitHash);
    reachable.add(commitHash);

    const commitObj = this.getObject(commitHash) as CommitObject | undefined;
    if (!commitObj) {
      return;
    }

    if (commitObj.tree) {
      this.collectTableObjects(commitObj.tree, reachable, processedTables, processedSheets);
    }

    if (commitObj.parent) {
      this.collectCommitObjects(commitObj.parent, visitedCommits, reachable, processedTables, processedSheets);
    }
  }

  private collectTableObjects(
    tableHash: string | undefined,
    reachable: Set<string>,
    processedTables: Set<string>,
    processedSheets: Set<string>
  ): void {
    if (!tableHash) {
      return;
    }

    if (processedTables.has(tableHash)) {
      reachable.add(tableHash);
      return;
    }

    processedTables.add(tableHash);
    reachable.add(tableHash);

    const table = this.getObject(tableHash) as TableTree | undefined;
    if (!table) {
      return;
    }

    for (const sheetName of table.getSheetNames()) {
      const sheetHash = table.getSheetHash(sheetName);
      if (sheetHash) {
        this.collectSheetObjects(sheetHash, reachable, processedSheets);
      }
    }
  }

  private collectSheetObjects(
    sheetHash: string | undefined,
    reachable: Set<string>,
    processedSheets: Set<string>
  ): void {
    if (!sheetHash) {
      return;
    }

    if (processedSheets.has(sheetHash)) {
      reachable.add(sheetHash);
      return;
    }

    processedSheets.add(sheetHash);
    reachable.add(sheetHash);

    const sheet = this.getObject(sheetHash) as SheetTree | undefined;
    if (!sheet) {
      return;
    }

    for (const { row, col } of sheet.getAllCellPositions()) {
      const cellHash = sheet.getCellHash(row, col);
      if (cellHash) {
        reachable.add(cellHash);
      }
    }
  }

  private collectWorkingStateObjects(
    reachable: Set<string>,
    processedTables: Set<string>,
    processedSheets: Set<string>
  ): void {
    if (this.workingTable) {
      this.collectTableObjects(this.workingTable.hash, reachable, processedTables, processedSheets);
    }

    for (const sheet of this.workingSheets.values()) {
      this.collectSheetObjects(sheet.hash, reachable, processedSheets);
    }
  }

  private collectChangeObjectReferences(change: Change, reachable: Set<string>): void {
    if (!change) {
      return;
    }

    if (change.details instanceof CellObject) {
      const cell = change.details as CellObject;
      if (!this.objects.has(cell.hash)) {
        this.storeObject(cell);
      }
      reachable.add(cell.hash);
    }
  }

  private cloneStoredObject(entry: any, options?: { stripDefaults?: boolean }): { type: string; payload: any } {
    const baseType = entry && typeof entry === 'object' && 'type' in entry ? (entry as any).type : 'raw';
    const hasPayload = entry && typeof entry === 'object' && 'payload' in entry;

    let payload: any;
    if (hasPayload) {
      payload = deepClone((entry as any).payload);
    } else if (entry && typeof entry === 'object' && typeof (entry as any).toJSON === 'function') {
      payload = deepClone((entry as any).toJSON());
    } else {
      payload = deepClone(entry);
    }

    if (options?.stripDefaults) {
      this.stripPayloadDefaults(baseType, payload);
    }

    return {
      type: baseType,
      payload
    };
  }

  private stripPayloadDefaults(type: string, payload: any): void {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    this.stripUndefinedFields(payload);

    if (type === ObjectType.CELL) {
      if ('formula' in payload && payload.formula === undefined) {
        delete payload.formula;
      }
      if (payload.format && typeof payload.format === 'object') {
        this.stripUndefinedFields(payload.format);
        if (Object.keys(payload.format).length === 0) {
          delete payload.format;
        }
      }
    }
  }

  private stripUndefinedFields(value: any): void {
    if (!value || typeof value !== 'object') {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.stripUndefinedFields(item);
      }
      return;
    }

    for (const key of Object.keys(value)) {
      const current = value[key];
      if (current === undefined) {
        delete value[key];
        continue;
      }
      this.stripUndefinedFields(current);
      if (current && typeof current === 'object' && !Array.isArray(current) && Object.keys(current).length === 0) {
        delete value[key];
      }
    }
  }

  private serializeTagEntry(
    entry: { commit: string; type: 'lightweight' | 'annotated'; tagHash?: string },
    includeDetails: boolean
  ): SerializedTagEntry {
    const base: SerializedTagEntry = {
      commit: entry.commit,
      type: entry.type,
      tagHash: entry.tagHash
    };

    if (includeDetails && entry.type === 'annotated' && entry.tagHash) {
      const tagObject = this.getObject(entry.tagHash) as TagObject | undefined;
      if (tagObject instanceof TagObject) {
        base.message = tagObject.message;
        base.author = tagObject.author;
        base.email = tagObject.email;
        base.timestamp = tagObject.timestamp;
      }
    }

    return deepClone(base);
  }

  private serializeChange(change: Change): SerializedChange {
    return {
      type: change.type,
      sheetName: change.sheetName,
      details: this.serializeChangeDetails(change.details),
      timestamp: change.timestamp
    };
  }

  private hydrateChange(serialized: SerializedChange): Change {
    return {
      type: serialized.type,
      sheetName: serialized.sheetName,
      details: this.hydrateChangeDetails(serialized.details),
      timestamp: serialized.timestamp
    };
  }

  private serializeChangeDetails(details: any): any {
    if (details instanceof CellObject) {
      return {
        [TableGit.SERIALIZED_DETAIL_TYPE_KEY]: ObjectType.CELL,
        payload: details.toJSON()
      };
    }

    return deepClone(details);
  }

  private hydrateChangeDetails(details: any): any {
    if (details && typeof details === 'object') {
      const typeMarker = (details as Record<string, any>)[TableGit.SERIALIZED_DETAIL_TYPE_KEY];
      if (typeMarker === ObjectType.CELL && 'payload' in (details as Record<string, any>)) {
        return CellObject.fromJSON((details as Record<string, any>).payload);
      }
      return deepClone(details);
    }

    return details;
  }
}
