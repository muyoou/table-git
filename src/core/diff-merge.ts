import { DiffResult, SheetDiffResult, CellConflict, StructureConflict } from '../types';
import { CellObject } from './cell';
import { SheetTree } from './sheet';
import { TableTree } from './table-tree';
import { CommitObject } from './commit';
import { TableGit } from './table-git';
import { deepEqual, deepClone } from '../utils/hash';

/**
 * 差异计算和合并工具类
 */
export class DiffMergeEngine {
  private tableGit: TableGit;

  constructor(tableGit: TableGit) {
    this.tableGit = tableGit;
  }

  /**
   * 计算两个提交之间的差异
   */
  diff(commitHash1: string, commitHash2: string): DiffResult {
    const commit1 = this.getCommit(commitHash1);
    const commit2 = this.getCommit(commitHash2);

    if (!commit1 || !commit2) {
      throw new Error('Invalid commit hash');
    }

    const table1 = this.getTable(commit1);
    const table2 = this.getTable(commit2);

    return this.diffTables(table1, table2);
  }

  private diffTables(table1: TableTree, table2: TableTree): DiffResult {
    const sheetNames1 = table1.getSheetNames();
    const sheetNames2 = table2.getSheetNames();

    const added = sheetNames2.filter(name => !sheetNames1.includes(name));
    const deleted = sheetNames1.filter(name => !sheetNames2.includes(name));

    const moved: { name: string; oldIndex: number; newIndex: number }[] = [];
    for (let i = 0; i < sheetNames2.length; i++) {
      const name = sheetNames2[i];
      const oldIndex = sheetNames1.indexOf(name);
      if (oldIndex !== -1 && oldIndex !== i) {
        moved.push({ name, oldIndex, newIndex: i });
      }
    }

    const sheets: Record<string, SheetDiffResult> = {};

    // Added sheets
    for (const name of added) {
      const sheet = this.getSheet(table2, name);
      if (sheet) {
        sheets[name] = this.diffSheetTrees(undefined, sheet);
      }
    }

    // Deleted sheets
    for (const name of deleted) {
      const sheet = this.getSheet(table1, name);
      if (sheet) {
        sheets[name] = this.diffSheetTrees(sheet, undefined);
      }
    }

    // Common sheets
    for (const name of sheetNames1) {
      if (!sheetNames2.includes(name)) continue;
      const sheet1 = this.getSheet(table1, name);
      const sheet2 = this.getSheet(table2, name);
      if (!sheet1 && !sheet2) continue;
      const sheetDiff = this.diffSheetTrees(sheet1, sheet2);
      if (this.hasSheetDiff(sheetDiff)) {
        sheets[name] = sheetDiff;
      }
    }

    return {
      sheetChanges: {
        added,
        deleted,
        moved
      },
      sheets
    };
  }

  private diffSheetTrees(sheet1?: SheetTree, sheet2?: SheetTree): SheetDiffResult {
    const diff: SheetDiffResult = {
      cellChanges: {
        added: [],
        modified: [],
        deleted: []
      },
      structureChanges: {
        columns: {
          added: [],
          modified: [],
          deleted: [],
          moved: []
        },
        rows: {
          added: [],
          modified: [],
          deleted: [],
          sorted: { oldOrder: [], newOrder: [] }
        }
      }
    };

    if (!sheet1 && !sheet2) {
      return diff;
    }

    if (!sheet1 && sheet2) {
      diff.cellChanges.added.push(...this.collectCells(sheet2));
      diff.structureChanges.columns.added.push(...this.collectColumns(sheet2));
      diff.structureChanges.rows.added.push(...this.collectRows(sheet2));
      diff.structureChanges.rows.sorted = {
        oldOrder: [],
        newOrder: [...sheet2.structure.getRowIds()]
      };
      return diff;
    }

    if (sheet1 && !sheet2) {
      diff.cellChanges.deleted.push(...this.collectCells(sheet1));
      diff.structureChanges.columns.deleted.push(...this.collectColumns(sheet1));
      diff.structureChanges.rows.deleted.push(...this.collectRows(sheet1));
      diff.structureChanges.rows.sorted = {
        oldOrder: [...sheet1.structure.getRowIds()],
        newOrder: []
      };
      return diff;
    }

    if (!sheet1 || !sheet2) {
      return diff;
    }

    this.diffCells(sheet1, sheet2, diff);
    this.diffStructure(sheet1, sheet2, diff);
    return diff;
  }

  private diffCells(sheet1: SheetTree, sheet2: SheetTree, diff: SheetDiffResult): void {
    const keys = new Set([...sheet1.cells.keys(), ...sheet2.cells.keys()]);

    for (const key of keys) {
      const hash1 = sheet1.cells.get(key);
      const hash2 = sheet2.cells.get(key);

      if (!hash1 && hash2) {
        const cell = this.getObject(hash2) as CellObject;
        if (cell) {
          diff.cellChanges.added.push(cell);
        }
      } else if (hash1 && !hash2) {
        const cell = this.getObject(hash1) as CellObject;
        if (cell) {
          diff.cellChanges.deleted.push(cell);
        }
      } else if (hash1 && hash2 && hash1 !== hash2) {
        const oldCell = this.getObject(hash1) as CellObject;
        const newCell = this.getObject(hash2) as CellObject;
        if (oldCell && newCell) {
          diff.cellChanges.modified.push({ old: oldCell, new: newCell });
        }
      }
    }
  }

  private diffStructure(sheet1: SheetTree, sheet2: SheetTree, diff: SheetDiffResult): void {
    const columns1 = sheet1.structure.columns;
    const columns2 = sheet2.structure.columns;

    for (const [id, col2] of columns2) {
      const col1 = columns1.get(id);
      if (!col1) {
        diff.structureChanges.columns.added.push(deepClone(col2));
      } else if (!deepEqual(col1, col2)) {
        diff.structureChanges.columns.modified.push({ old: deepClone(col1), new: deepClone(col2) });
      }
    }

    for (const [id, col1] of columns1) {
      if (!columns2.has(id)) {
        diff.structureChanges.columns.deleted.push(deepClone(col1));
      }
    }

    this.diffColumnOrder(sheet1, sheet2, diff);
    this.diffRowOrder(sheet1, sheet2, diff);

    const rows1 = sheet1.structure.rows;
    const rows2 = sheet2.structure.rows;

    for (const [id, row2] of rows2) {
      const row1 = rows1.get(id);
      if (!row1) {
        diff.structureChanges.rows.added.push(deepClone(row2));
      } else if (!deepEqual(row1, row2)) {
        diff.structureChanges.rows.modified.push({ old: deepClone(row1), new: deepClone(row2) });
      }
    }

    for (const [id, row1] of rows1) {
      if (!rows2.has(id)) {
        diff.structureChanges.rows.deleted.push(deepClone(row1));
      }
    }
  }

  private diffColumnOrder(sheet1: SheetTree, sheet2: SheetTree, diff: SheetDiffResult): void {
    const order1 = sheet1.structure.columnOrder;
    const order2 = sheet2.structure.columnOrder;

    if (!deepEqual(order1, order2)) {
      for (let i = 0; i < order2.length; i++) {
        const colId = order2[i];
        const oldIndex = order1.indexOf(colId);
        if (oldIndex !== -1 && oldIndex !== i) {
          const column = sheet2.structure.columns.get(colId);
          if (column) {
            diff.structureChanges.columns.moved.push({
              column: deepClone(column),
              oldIndex,
              newIndex: i
            });
          }
        }
      }
    }
  }

  private diffRowOrder(sheet1: SheetTree, sheet2: SheetTree, diff: SheetDiffResult): void {
    const order1 = sheet1.structure.rowOrder;
    const order2 = sheet2.structure.rowOrder;

    if (!deepEqual(order1, order2)) {
      diff.structureChanges.rows.sorted = {
        oldOrder: [...order1],
        newOrder: [...order2]
      };
    }
  }

  /**
   * 三路合并
   */
  merge(branchName: string): { success: boolean; conflicts?: any[] } {
    const currentCommitHash = this.getCurrentCommitHash();
    const targetCommitHash = this.getBranchCommitHash(branchName);
    
    if (!currentCommitHash || !targetCommitHash) {
      return { success: false };
    }
    
    // 找到共同祖先
    const baseCommitHash = this.findCommonAncestor(currentCommitHash, targetCommitHash);
    
    if (!baseCommitHash) {
      return { success: false };
    }
    
    // 三路合并
    const conflicts = this.threeWayMerge(baseCommitHash, currentCommitHash, targetCommitHash);
    
    if (conflicts.length === 0) {
      // 自动合并成功，应该创建合并提交
      return { success: true };
    } else {
      // 存在冲突
      return { success: false, conflicts };
    }
  }

  /**
   * 三路合并实现
   */
  private threeWayMerge(baseHash: string, currentHash: string, targetHash: string): any[] {
    const conflicts: any[] = [];

    const baseCommit = this.getCommit(baseHash);
    const currentCommit = this.getCommit(currentHash);
    const targetCommit = this.getCommit(targetHash);

    if (!baseCommit || !currentCommit || !targetCommit) {
      return conflicts;
    }

    const baseTable = this.getTable(baseCommit);
    const currentTable = this.getTable(currentCommit);
    const targetTable = this.getTable(targetCommit);

    const sheetNames = new Set<string>([
      ...baseTable.getSheetNames(),
      ...currentTable.getSheetNames(),
      ...targetTable.getSheetNames()
    ]);

    for (const name of sheetNames) {
      const sheetConflicts = this.mergeSheet(
        name,
        this.getSheet(baseTable, name),
        this.getSheet(currentTable, name),
        this.getSheet(targetTable, name)
      );
      conflicts.push(...sheetConflicts);
    }

    return conflicts;
  }

  private mergeSheet(
    sheetName: string,
    baseSheet?: SheetTree,
    currentSheet?: SheetTree,
    targetSheet?: SheetTree
  ): any[] {
    const conflicts: any[] = [];

    if (!baseSheet) {
      if (!currentSheet || !targetSheet) {
        return conflicts;
      }
      if (this.sheetEquals(currentSheet, targetSheet)) {
        return conflicts;
      }
      conflicts.push({
        type: 'sheet',
        sheetName,
        reason: 'Both branches added the same sheet with different contents.'
      });
      return conflicts;
    }

    if (!currentSheet && !targetSheet) {
      return conflicts; // both removed
    }

    if (!currentSheet && targetSheet) {
      if (!this.sheetEquals(baseSheet, targetSheet)) {
        conflicts.push({
          type: 'sheet',
          sheetName,
          reason: 'Sheet deleted in current branch but modified in target branch.'
        });
      }
      return conflicts;
    }

    if (currentSheet && !targetSheet) {
      if (!this.sheetEquals(baseSheet, currentSheet)) {
        conflicts.push({
          type: 'sheet',
          sheetName,
          reason: 'Sheet deleted in target branch but modified in current branch.'
        });
      }
      return conflicts;
    }

    if (!currentSheet || !targetSheet) {
      return conflicts;
    }

    this.mergeCells(baseSheet, currentSheet, targetSheet, conflicts, sheetName);
    this.mergeStructure(baseSheet, currentSheet, targetSheet, conflicts, sheetName);

    return conflicts;
  }

  private mergeCells(
    baseSheet: SheetTree,
    currentSheet: SheetTree,
    targetSheet: SheetTree,
    conflicts: any[],
    sheetName: string
  ): void {
    const allCellKeys = new Set([
      ...baseSheet.cells.keys(),
      ...currentSheet.cells.keys(),
      ...targetSheet.cells.keys()
    ]);

    for (const key of allCellKeys) {
      const baseCell = baseSheet.cells.get(key);
      const currentCell = currentSheet.cells.get(key);
      const targetCell = targetSheet.cells.get(key);

      if (currentCell !== targetCell) {
        if (baseCell === currentCell) {
          continue;
        } else if (baseCell === targetCell) {
          continue;
        } else {
          conflicts.push({
            type: 'cell',
            sheetName,
            position: key,
            base: baseCell ? this.getObject(baseCell) : null,
            current: currentCell ? this.getObject(currentCell) : null,
            target: targetCell ? this.getObject(targetCell) : null
          } as CellConflict & { type: 'cell'; sheetName: string });
        }
      }
    }
  }

  private mergeStructure(
    baseSheet: SheetTree,
    currentSheet: SheetTree,
    targetSheet: SheetTree,
    conflicts: any[],
    sheetName: string
  ): void {
    this.mergeColumns(baseSheet, currentSheet, targetSheet, conflicts, sheetName);
    this.mergeRows(baseSheet, currentSheet, targetSheet, conflicts, sheetName);
  }

  private mergeColumns(
    baseSheet: SheetTree,
    currentSheet: SheetTree,
    targetSheet: SheetTree,
    conflicts: any[],
    sheetName: string
  ): void {
    const baseColumns = baseSheet.structure.columns;
    const currentColumns = currentSheet.structure.columns;
    const targetColumns = targetSheet.structure.columns;

    const allIds = new Set([
      ...baseColumns.keys(),
      ...currentColumns.keys(),
      ...targetColumns.keys()
    ]);

    for (const id of allIds) {
      const baseCol = baseColumns.get(id);
      const currentCol = currentColumns.get(id);
      const targetCol = targetColumns.get(id);

      if (!deepEqual(currentCol, targetCol)) {
        if (deepEqual(baseCol, currentCol) || deepEqual(baseCol, targetCol)) {
          continue;
        }
        conflicts.push({
          type: 'column',
          sheetName,
          id,
          base: baseCol,
          current: currentCol,
          target: targetCol
        } as StructureConflict & { sheetName: string });
      }
    }
  }

  private mergeRows(
    baseSheet: SheetTree,
    currentSheet: SheetTree,
    targetSheet: SheetTree,
    conflicts: any[],
    sheetName: string
  ): void {
    const baseRows = baseSheet.structure.rows;
    const currentRows = currentSheet.structure.rows;
    const targetRows = targetSheet.structure.rows;

    const allIds = new Set([
      ...baseRows.keys(),
      ...currentRows.keys(),
      ...targetRows.keys()
    ]);

    for (const id of allIds) {
      const baseRow = baseRows.get(id);
      const currentRow = currentRows.get(id);
      const targetRow = targetRows.get(id);

      if (!deepEqual(currentRow, targetRow)) {
        if (deepEqual(baseRow, currentRow) || deepEqual(baseRow, targetRow)) {
          continue;
        }
        conflicts.push({
          type: 'row',
          sheetName,
          id,
          base: baseRow,
          current: currentRow,
          target: targetRow
        } as StructureConflict & { sheetName: string });
      }
    }
  }

  /**
   * 找到共同祖先
   */
  private findCommonAncestor(hash1: string, hash2: string): string | null {
    const history1 = this.getCommitHistory(hash1);
    const history2 = this.getCommitHistory(hash2);
    
    for (const commit of history1) {
      if (history2.includes(commit)) {
        return commit;
      }
    }
    
    return null;
  }

  /**
   * 获取提交历史
   */
  private getCommitHistory(commitHash: string): string[] {
    const history: string[] = [];
    let current = commitHash;
    
    while (current) {
      history.push(current);
      const commit = this.getObject(current) as CommitObject;
      if (!commit) break;
      current = commit.parent || '';
    }
    
    return history;
  }

  // 辅助方法

  private getCommit(hash: string): CommitObject | undefined {
    return this.getObject(hash) as CommitObject | undefined;
  }

  private getTable(commit: CommitObject): TableTree {
    const table = this.getObject(commit.tree) as TableTree | undefined;
    if (!table) {
      throw new Error('Table tree not found for commit');
    }
    return table;
  }

  private getSheet(table: TableTree, sheetName: string): SheetTree | undefined {
    const hash = table.getSheetHash(sheetName);
    if (!hash) {
      return undefined;
    }
    const sheet = this.getObject(hash) as SheetTree | undefined;
    return sheet ? sheet.clone() : undefined;
  }

  private collectCells(sheet: SheetTree): CellObject[] {
    const cells: CellObject[] = [];
    for (const hash of sheet.cells.values()) {
      const cell = this.getObject(hash) as CellObject | undefined;
      if (cell) {
        cells.push(cell);
      }
    }
    return cells;
  }

  private collectColumns(sheet: SheetTree): any[] {
    return Array.from(sheet.structure.columns.values()).map(col => deepClone(col));
  }

  private collectRows(sheet: SheetTree): any[] {
    return Array.from(sheet.structure.rows.values()).map(row => deepClone(row));
  }

  private hasSheetDiff(diff: SheetDiffResult): boolean {
    const { cellChanges, structureChanges } = diff;
    return (
      cellChanges.added.length > 0 ||
      cellChanges.modified.length > 0 ||
      cellChanges.deleted.length > 0 ||
      structureChanges.columns.added.length > 0 ||
      structureChanges.columns.modified.length > 0 ||
      structureChanges.columns.deleted.length > 0 ||
      structureChanges.columns.moved.length > 0 ||
      structureChanges.rows.added.length > 0 ||
      structureChanges.rows.modified.length > 0 ||
      structureChanges.rows.deleted.length > 0 ||
      structureChanges.rows.sorted.oldOrder.length > 0 ||
      structureChanges.rows.sorted.newOrder.length > 0
    );
  }

  private sheetEquals(sheetA?: SheetTree, sheetB?: SheetTree): boolean {
    if (!sheetA && !sheetB) return true;
    if (!sheetA || !sheetB) return false;
    return sheetA.hash === sheetB.hash;
  }

  private getObject(hash: string): any {
    const repo = this.tableGit as any;
    if (typeof repo.getObject === 'function') {
      return repo.getObject(hash);
    }
    return repo.objects?.get(hash);
  }

  private getCurrentCommitHash(): string | undefined {
    return (this.tableGit as any).refs.get((this.tableGit as any).head);
  }

  private getBranchCommitHash(branchName: string): string | undefined {
    return (this.tableGit as any).refs.get(branchName);
  }
}
