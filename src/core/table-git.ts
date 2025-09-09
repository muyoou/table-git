import { 
  ChangeType, 
  Change, 
  DiffResult, 
  ColumnMetadata, 
  RowMetadata, 
  SortCriteria,
  CellValue,
  CellFormat,
  ObjectType
} from '../types';
import { CellObject } from './cell';
import { SheetTree } from './sheet';
import { CommitObject } from './commit';
import { TableStructure } from './structure';
import { deepClone, generateId } from '../utils/hash';

/**
 * 表格版本控制引擎 - Git 风格的表格版本控制系统
 */
export class TableGit {
  private objects: Map<string, any>;  // 对象存储
  private refs: Map<string, string>;  // 分支引用
  private head: string;  // 当前分支
  private index: Map<string, Change>;  // 暂存区
  private workingTree: Map<string, SheetTree>;  // 工作区

  constructor() {
    this.objects = new Map();
    this.refs = new Map();
    this.head = 'main';
    this.index = new Map();
    this.workingTree = new Map();
  }

  /**
   * 初始化仓库
   */
  init(branchName: string = 'main'): void {
    this.head = branchName;
    this.refs.set(branchName, '');
    
    // 创建初始空提交
    const emptyTree = new SheetTree('default');
    const treeHash = this.storeObject(emptyTree);
    
    const initialCommit = new CommitObject(
      treeHash,
      'Initial commit',
      'System',
      'system@tablegit.com'
    );
    
    const commitHash = this.storeObject(initialCommit);
    this.refs.set(branchName, commitHash);
    
    // 加载工作区
    this.loadWorkingTree();
  }

  // ========== 单元格操作 ==========

  /**
   * 添加或更新单元格
   */
  addCellChange(
    sheetName: string, 
    row: number, 
    column: number, 
    value: CellValue, 
    formula?: string, 
    format?: CellFormat
  ): void {
    const cell = new CellObject(row, column, value, formula, format);
    const changeKey = `${sheetName}:cell:${row},${column}`;
    // 判定新增或更新：
    // 1) 若当前工作区不存在该单元格，则视为新增
    // 2) 若暂存区已有此位置的新增或删除记录，继续视为新增（覆盖内容）
    // 3) 其他情况视为更新
    const baseSheet = this.workingTree.get(sheetName);
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

  /**
   * 删除单元格
   */
  deleteCellChange(sheetName: string, row: number, column: number): void {
    const changeKey = `${sheetName}:cell:${row},${column}`;
    
    this.index.set(changeKey, {
      type: ChangeType.CELL_DELETE,
      sheetName,
      details: { row, column },
      timestamp: Date.now()
    });
  }

  // ========== 列操作 ==========

  /**
   * 添加列
   */
  addColumn(sheetName: string, column: ColumnMetadata): void {
    const changeKey = `${sheetName}:column:add:${column.id}`;
    
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_ADD,
      sheetName,
      details: column,
      timestamp: Date.now()
    });
  }

  /**
   * 更新列信息
   */
  updateColumn(sheetName: string, columnId: string, updates: Partial<ColumnMetadata>): void {
    const changeKey = `${sheetName}:column:update:${columnId}`;
    
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_UPDATE,
      sheetName,
      details: { columnId, updates },
      timestamp: Date.now()
    });
  }

  /**
   * 删除列
   */
  deleteColumn(sheetName: string, columnId: string): void {
    const changeKey = `${sheetName}:column:delete:${columnId}`;
    
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_DELETE,
      sheetName,
      details: { columnId },
      timestamp: Date.now()
    });
  }

  /**
   * 移动列位置
   */
  moveColumn(sheetName: string, columnId: string, newIndex: number): void {
    const changeKey = `${sheetName}:column:move:${columnId}`;
    
    this.index.set(changeKey, {
      type: ChangeType.COLUMN_MOVE,
      sheetName,
      details: { columnId, newIndex },
      timestamp: Date.now()
    });
  }

  // ========== 行操作 ==========

  /**
   * 添加行
   */
  addRow(sheetName: string, row: RowMetadata): void {
    const changeKey = `${sheetName}:row:add:${row.id}`;
    
    this.index.set(changeKey, {
      type: ChangeType.ROW_ADD,
      sheetName,
      details: row,
      timestamp: Date.now()
    });
  }

  /**
   * 删除行
   */
  deleteRow(sheetName: string, rowId: string): void {
    const changeKey = `${sheetName}:row:delete:${rowId}`;
    
    this.index.set(changeKey, {
      type: ChangeType.ROW_DELETE,
      sheetName,
      details: { rowId },
      timestamp: Date.now()
    });
  }

  /**
   * 排序行
   */
  sortRows(sheetName: string, sortCriteria: SortCriteria[]): void {
    const changeKey = `${sheetName}:row:sort:${Date.now()}`;
    
    this.index.set(changeKey, {
      type: ChangeType.ROW_SORT,
      sheetName,
      details: { sortCriteria },
      timestamp: Date.now()
    });
  }

  // ========== 版本控制核心操作 ==========

  /**
   * 提交变更
   */
  commit(message: string, author: string, email: string): string {
    if (this.index.size === 0) {
      throw new Error('Nothing to commit');
    }

    // 构建新的树对象
    const newTree = this.buildTreeFromIndex();
    const treeHash = this.storeObject(newTree);
    
    // 获取当前提交
    const currentCommitHash = this.refs.get(this.head);
    
    // 创建新提交
    const commit = new CommitObject(
      treeHash,
      message,
      author,
      email,
      currentCommitHash
    );
    
    const commitHash = this.storeObject(commit);
    
    // 更新引用
    this.refs.set(this.head, commitHash);
    
    // 清空暂存区
    this.index.clear();
    
    // 重新加载工作区
    this.loadWorkingTree();
    
    return commitHash;
  }

  /**
   * 从暂存区构建树对象
   */
  private buildTreeFromIndex(): SheetTree {
    // 从当前工作区获取基础树，如果不存在则创建新的
    let sheet = this.workingTree.get('default')?.clone() || new SheetTree('default');
    
    // 应用所有暂存的变更
    for (const [key, change] of this.index) {
      this.applyChange(sheet, change);
    }
    
    return sheet;
  }

  /**
   * 应用单个变更
   */
  private applyChange(sheet: SheetTree, change: Change): void {
    switch (change.type) {
      case ChangeType.CELL_UPDATE:
      case ChangeType.CELL_ADD:
        const cell = change.details as CellObject;
        const cellHash = this.storeObject(cell);
        sheet.setCellHash(cell.row, cell.column, cellHash);
        break;
        
      case ChangeType.CELL_DELETE:
        const { row, column } = change.details;
        sheet.deleteCell(row, column);
        break;
        
      case ChangeType.COLUMN_ADD:
        sheet.structure.addColumn(change.details as ColumnMetadata);
        break;
        
      case ChangeType.COLUMN_UPDATE:
        const { columnId, updates } = change.details;
        sheet.structure.updateColumn(columnId, updates);
        break;
        
      case ChangeType.COLUMN_DELETE:
        sheet.structure.removeColumn(change.details.columnId);
        break;
        
      case ChangeType.COLUMN_MOVE:
        sheet.structure.moveColumn(change.details.columnId, change.details.newIndex);
        break;
        
      case ChangeType.ROW_ADD:
        sheet.structure.addRow(change.details as RowMetadata);
        break;
        
      case ChangeType.ROW_DELETE:
        sheet.structure.removeRow(change.details.rowId);
        break;
        
      case ChangeType.ROW_SORT:
        // 这里可以实现具体的排序逻辑
        const { sortCriteria } = change.details;
        this.applySorting(sheet, sortCriteria);
        break;
    }
  }

  /**
   * 应用排序
   */
  private applySorting(sheet: SheetTree, criteria: SortCriteria[]): void {
    // 获取当前行顺序
    const currentOrder = sheet.structure.getRowIds();
    
    // 这里应该根据单元格数据进行排序
    // 为简化，这里只是重新排列行ID
    const sortedOrder = [...currentOrder].sort((a, b) => {
      // 实际排序逻辑应该根据单元格内容进行
      return a.localeCompare(b);
    });
    
    sheet.structure.sortRows(sortedOrder);
  }

  // ========== 对象存储 ==========

  /**
   * 存储对象
   */
  private storeObject(obj: any): string {
    const hash = obj.hash;
    this.objects.set(hash, obj);
    return hash;
  }

  /**
   * 获取对象
   */
  private getObject(hash: string): any {
    return this.objects.get(hash);
  }

  /**
   * 获取指定引用（分支或提交）对应的工作表快照，而不改变当前工作区
   */
  getTreeSnapshot(ref?: { branch?: string; commit?: string }): SheetTree | undefined {
    let commitHash: string | undefined;
    if (ref?.commit) {
      commitHash = ref.commit;
    } else if (ref?.branch) {
      commitHash = this.refs.get(ref.branch);
    } else {
      // 默认为当前 HEAD
      commitHash = this.refs.get(this.head) || (this.isDetachedHead() ? this.head : undefined);
    }

    if (!commitHash) return undefined;

    const commit = this.getObject(commitHash) as CommitObject | undefined;
    if (!commit) return undefined;
    const tree = this.getObject(commit.tree) as SheetTree | undefined;
    return tree ? tree.clone() : undefined;
  }

  /**
   * 从指定的 SheetTree 快照读取单元格对象
   */
  getCellFromTree(tree: SheetTree, row: number, col: number): CellObject | undefined {
    const hash = tree.getCellHash(row, col);
    if (!hash) return undefined;
    return this.getObject(hash) as CellObject;
  }

  // ========== 分支操作 ==========

  /**
   * 创建分支
   */
  createBranch(branchName: string): void {
    const currentCommitHash = this.refs.get(this.head);
    if (currentCommitHash) {
      this.refs.set(branchName, currentCommitHash);
    } else {
      throw new Error('Cannot create branch: no commits found');
    }
  }

  /**
   * 切换分支或提交
   */
  checkout(target: string): void {
    if (this.index.size > 0) {
      throw new Error('Cannot checkout: you have unstaged changes');
    }
    
    // 检查是否是分支名
    if (this.refs.has(target)) {
      this.head = target;
      this.loadWorkingTree();
      return;
    }
    
    // 检查是否是提交哈希
    const commit = this.getObject(target);
    if (commit && commit.type === ObjectType.COMMIT) {
      // 切换到分离HEAD状态
      this.head = target;
      this.loadWorkingTreeFromCommit(target);
      return;
    }
    
    throw new Error(`Branch or commit '${target}' does not exist`);
  }

  /**
   * 从指定提交加载工作区
   */
  private loadWorkingTreeFromCommit(commitHash: string): void {
    const commit = this.getObject(commitHash) as CommitObject;
    if (commit) {
      const tree = this.getObject(commit.tree) as SheetTree;
      if (tree) {
        this.workingTree.set('default', tree.clone());
      }
    }
  }

  /**
   * 获取当前分支
   */
  getCurrentBranch(): string {
    return this.head;
  }

  /**
   * 检查当前是否处于分离HEAD状态
   */
  isDetachedHead(): boolean {
    return !this.refs.has(this.head);
  }

  /**
   * 获取当前HEAD指向的提交哈希
   */
  getCurrentCommitHash(): string | undefined {
    if (this.isDetachedHead()) {
      return this.head; // 分离HEAD状态下，head直接是提交哈希
    }
    return this.refs.get(this.head);
  }

  /**
   * 获取所有分支
   */
  getBranches(): string[] {
    return Array.from(this.refs.keys());
  }

  /**
   * 加载工作区
   */
  private loadWorkingTree(): void {
    const commitHash = this.refs.get(this.head);
    if (commitHash) {
      const commit = this.getObject(commitHash) as CommitObject;
      if (commit) {
        const tree = this.getObject(commit.tree) as SheetTree;
        if (tree) {
          this.workingTree.set('default', tree.clone());
        }
      }
    }
  }

  // ========== 状态查询 ==========

  /**
   * 获取当前状态
   */
  status(): {
    branch: string;
    stagedChanges: number;
    lastCommit?: string;
  } {
    const lastCommitHash = this.refs.get(this.head);
    return {
      branch: this.head,
      stagedChanges: this.index.size,
      lastCommit: lastCommitHash ? this.getObject(lastCommitHash)?.getShortHash() : undefined
    };
  }

  /**
   * 获取暂存区变更
   */
  getStagedChanges(): Change[] {
    return Array.from(this.index.values());
  }

  /**
   * 重置暂存区
   */
  reset(): void {
    this.index.clear();
  }

  /**
   * 获取提交历史
   */
  getCommitHistory(limit: number = 10): CommitObject[] {
    const history: CommitObject[] = [];
    let currentHash = this.refs.get(this.head);
    
    while (currentHash && history.length < limit) {
      const commit = this.getObject(currentHash) as CommitObject;
      if (!commit) break;
      
      history.push(commit);
      currentHash = commit.parent;
    }
    
    return history;
  }

  /**
   * 获取工作区内容
   */
  getWorkingTree(): SheetTree | undefined {
    return this.workingTree.get('default');
  }

  /**
   * 获取预览用的工作区树
   * - includeStaged=true 时，返回在当前工作区基础上应用暂存区变更后的临时树（不提交）
   * - 否则，返回当前工作区的克隆
   */
  getPreviewTree(options?: { includeStaged?: boolean }): SheetTree | undefined {
    if (options?.includeStaged) {
      // 基于当前工作区 + 暂存区构建一棵临时树
      return this.buildTreeFromIndex();
    }
    const sheet = this.getWorkingTree();
    return sheet ? sheet.clone() : undefined;
  }

  /**
   * 获取单元格值
   */
  getCellValue(row: number, col: number): CellValue | undefined {
    const sheet = this.workingTree.get('default');
    if (!sheet) return undefined;
    
    const cellHash = sheet.getCellHash(row, col);
    if (!cellHash) return undefined;
    
    const cell = this.getObject(cellHash) as CellObject;
    return cell?.value;
  }

  /**
   * 获取单元格对象
   */
  getCell(row: number, col: number): CellObject | undefined {
    const sheet = this.workingTree.get('default');
    if (!sheet) return undefined;
    
    const cellHash = sheet.getCellHash(row, col);
    if (!cellHash) return undefined;
    
    return this.getObject(cellHash) as CellObject;
  }


}
