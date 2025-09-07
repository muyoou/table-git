import { DiffResult, CellConflict, StructureConflict, ColumnMetadata } from '../types';
import { CellObject } from './cell';
import { SheetTree } from './sheet';
import { CommitObject } from './commit';
import { TableGit } from './table-git';
import { deepEqual } from '../utils/hash';

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
    const commit1 = this.getObject(commitHash1) as CommitObject;
    const commit2 = this.getObject(commitHash2) as CommitObject;
    
    if (!commit1 || !commit2) {
      throw new Error('Invalid commit hash');
    }
    
    const tree1 = this.getObject(commit1.tree) as SheetTree;
    const tree2 = this.getObject(commit2.tree) as SheetTree;
    
    return this.diffTrees(tree1, tree2);
  }

  /**
   * 比较两个树对象
   */
  private diffTrees(tree1: SheetTree, tree2: SheetTree): DiffResult {
    const result: DiffResult = {
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

    // 比较单元格
    this.diffCells(tree1, tree2, result);
    
    // 比较结构
    this.diffStructure(tree1, tree2, result);
    
    return result;
  }

  /**
   * 比较单元格差异
   */
  private diffCells(tree1: SheetTree, tree2: SheetTree, result: DiffResult): void {
    const allCellKeys = new Set([...tree1.cells.keys(), ...tree2.cells.keys()]);
    
    for (const key of allCellKeys) {
      const hash1 = tree1.cells.get(key);
      const hash2 = tree2.cells.get(key);
      
      if (!hash1 && hash2) {
        // 新增的单元格
        const cell = this.getObject(hash2) as CellObject;
        result.cellChanges.added.push(cell);
      } else if (hash1 && !hash2) {
        // 删除的单元格
        const cell = this.getObject(hash1) as CellObject;
        result.cellChanges.deleted.push(cell);
      } else if (hash1 !== hash2) {
        // 修改的单元格
        if (hash1 && hash2) {
          const oldCell = this.getObject(hash1) as CellObject;
          const newCell = this.getObject(hash2) as CellObject;
          result.cellChanges.modified.push({ old: oldCell, new: newCell });
        }
      }
    }
  }

  /**
   * 比较结构差异
   */
  private diffStructure(tree1: SheetTree, tree2: SheetTree, result: DiffResult): void {
    const columns1 = tree1.structure.columns;
    const columns2 = tree2.structure.columns;
    
    // 检查新增和修改的列
    for (const [id, col2] of columns2) {
      const col1 = columns1.get(id);
      if (!col1) {
        result.structureChanges.columns.added.push(col2);
      } else if (!deepEqual(col1, col2)) {
        result.structureChanges.columns.modified.push({ old: col1, new: col2 });
      }
    }
    
    // 检查删除的列
    for (const [id, col1] of columns1) {
      if (!columns2.has(id)) {
        result.structureChanges.columns.deleted.push(col1);
      }
    }
    
    // 检查列顺序变化
    this.diffColumnOrder(tree1, tree2, result);
    
    // 检查行顺序变化
    this.diffRowOrder(tree1, tree2, result);
  }

  /**
   * 比较列顺序差异
   */
  private diffColumnOrder(tree1: SheetTree, tree2: SheetTree, result: DiffResult): void {
    const order1 = tree1.structure.columnOrder;
    const order2 = tree2.structure.columnOrder;
    
    if (!deepEqual(order1, order2)) {
      // 分析具体的移动操作
      for (let i = 0; i < order2.length; i++) {
        const colId = order2[i];
        const oldIndex = order1.indexOf(colId);
        if (oldIndex !== -1 && oldIndex !== i) {
          const column = tree2.structure.columns.get(colId);
          if (column) {
            result.structureChanges.columns.moved.push({
              column,
              oldIndex,
              newIndex: i
            });
          }
        }
      }
    }
  }

  /**
   * 比较行顺序差异
   */
  private diffRowOrder(tree1: SheetTree, tree2: SheetTree, result: DiffResult): void {
    const order1 = tree1.structure.rowOrder;
    const order2 = tree2.structure.rowOrder;
    
    if (!deepEqual(order1, order2)) {
      result.structureChanges.rows.sorted = {
        oldOrder: order1,
        newOrder: order2
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
    
    const baseCommit = this.getObject(baseHash) as CommitObject;
    const currentCommit = this.getObject(currentHash) as CommitObject;
    const targetCommit = this.getObject(targetHash) as CommitObject;
    
    const baseTree = this.getObject(baseCommit.tree) as SheetTree;
    const currentTree = this.getObject(currentCommit.tree) as SheetTree;
    const targetTree = this.getObject(targetCommit.tree) as SheetTree;
    
    // 合并单元格
    this.mergeCells(baseTree, currentTree, targetTree, conflicts);
    
    // 合并结构
    this.mergeStructure(baseTree, currentTree, targetTree, conflicts);
    
    return conflicts;
  }

  /**
   * 合并单元格
   */
  private mergeCells(
    baseTree: SheetTree, 
    currentTree: SheetTree, 
    targetTree: SheetTree, 
    conflicts: any[]
  ): void {
    const allCellKeys = new Set([
      ...baseTree.cells.keys(),
      ...currentTree.cells.keys(),
      ...targetTree.cells.keys()
    ]);
    
    for (const key of allCellKeys) {
      const baseCell = baseTree.cells.get(key);
      const currentCell = currentTree.cells.get(key);
      const targetCell = targetTree.cells.get(key);
      
      if (currentCell !== targetCell) {
        if (baseCell === currentCell) {
          // 只有目标分支修改了，接受目标分支的修改
          continue;
        } else if (baseCell === targetCell) {
          // 只有当前分支修改了，保留当前分支的修改
          continue;
        } else {
          // 双方都修改了，产生冲突
          conflicts.push({
            type: 'cell',
            position: key,
            base: baseCell ? this.getObject(baseCell) : null,
            current: currentCell ? this.getObject(currentCell) : null,
            target: targetCell ? this.getObject(targetCell) : null
          });
        }
      }
    }
  }

  /**
   * 合并结构
   */
  private mergeStructure(
    baseTree: SheetTree, 
    currentTree: SheetTree, 
    targetTree: SheetTree, 
    conflicts: any[]
  ): void {
    // 合并列结构
    this.mergeColumns(baseTree, currentTree, targetTree, conflicts);
    
    // 合并行结构
    this.mergeRows(baseTree, currentTree, targetTree, conflicts);
  }

  /**
   * 合并列结构
   */
  private mergeColumns(
    baseTree: SheetTree, 
    currentTree: SheetTree, 
    targetTree: SheetTree, 
    conflicts: any[]
  ): void {
    const baseColumns = baseTree.structure.columns;
    const currentColumns = currentTree.structure.columns;
    const targetColumns = targetTree.structure.columns;
    
    const allColumnIds = new Set([
      ...baseColumns.keys(),
      ...currentColumns.keys(),
      ...targetColumns.keys()
    ]);
    
    for (const id of allColumnIds) {
      const baseCol = baseColumns.get(id);
      const currentCol = currentColumns.get(id);
      const targetCol = targetColumns.get(id);
      
      if (!deepEqual(currentCol, targetCol)) {
        if (deepEqual(baseCol, currentCol)) {
          // 只有目标分支修改了
          continue;
        } else if (deepEqual(baseCol, targetCol)) {
          // 只有当前分支修改了
          continue;
        } else {
          // 双方都修改了，产生冲突
          conflicts.push({
            type: 'column',
            id,
            base: baseCol,
            current: currentCol,
            target: targetCol
          });
        }
      }
    }
  }

  /**
   * 合并行结构
   */
  private mergeRows(
    baseTree: SheetTree, 
    currentTree: SheetTree, 
    targetTree: SheetTree, 
    conflicts: any[]
  ): void {
    // 类似于列的合并逻辑
    // 这里简化处理
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

  private getObject(hash: string): any {
    return (this.tableGit as any).objects.get(hash);
  }

  private getCurrentCommitHash(): string | undefined {
    return (this.tableGit as any).refs.get((this.tableGit as any).head);
  }

  private getBranchCommitHash(branchName: string): string | undefined {
    return (this.tableGit as any).refs.get(branchName);
  }
}
