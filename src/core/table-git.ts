import { 
  ChangeType, 
  Change, 
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
import { CellObject } from './cell';
import { SheetTree } from './sheet';
import { CommitObject } from './commit';
import { TableTree } from './table-tree';

/**
 * 表格版本控制引擎 - Git 风格的表格版本控制系统
 */
export class TableGit {
  private objects: Map<string, any>; // 对象存储
  private refs: Map<string, string>; // 分支引用
  private head: string; // 当前分支或提交哈希
  private index: Map<string, Change>; // 暂存区
  private workingTable: TableTree | null; // 当前工作表集合
  private workingSheets: Map<string, SheetTree>; // 工作区中的工作表快照
  private tableSnapshots: Map<string, TableTree>; // 提交对应的表快照

  constructor() {
    this.objects = new Map();
    this.refs = new Map();
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
    const changeKey = `${sheetName}:column:add:${column.id}`;
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_ADD,
      sheetName,
      details: column,
      timestamp: Date.now()
    });
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
    const changeKey = `${sheetName}:column:move:${columnId}`;
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_MOVE,
      sheetName,
      details: { columnId, newIndex },
      timestamp: Date.now()
    });
  }

  // ========== 行操作 ==========

  addRow(sheetName: string, row: RowMetadata): void {
    this.ensureSheetExists(sheetName);
    const changeKey = `${sheetName}:row:add:${row.id}`;
    this.index.set(changeKey, {
      type: ChangeType.ROW_ADD,
      sheetName,
      details: row,
      timestamp: Date.now()
    });
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
        sheet.structure.removeColumn(change.details.columnId);
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
        sheet.structure.removeRow(change.details.rowId);
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

    return entry.payload;
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
}
