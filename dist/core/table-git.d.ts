import { Change, ColumnMetadata, RowMetadata, SortCriteria, CellValue, CellFormat } from '../types';
import { CellObject } from './cell';
import { SheetTree } from './sheet';
import { CommitObject } from './commit';
/**
 * 表格版本控制引擎 - Git 风格的表格版本控制系统
 */
export declare class TableGit {
    private objects;
    private refs;
    private head;
    private index;
    private workingTree;
    constructor();
    /**
     * 初始化仓库
     */
    init(branchName?: string): void;
    /**
     * 添加或更新单元格
     */
    addCellChange(sheetName: string, row: number, column: number, value: CellValue, formula?: string, format?: CellFormat): void;
    /**
     * 删除单元格
     */
    deleteCellChange(sheetName: string, row: number, column: number): void;
    /**
     * 添加列
     */
    addColumn(sheetName: string, column: ColumnMetadata): void;
    /**
     * 更新列信息
     */
    updateColumn(sheetName: string, columnId: string, updates: Partial<ColumnMetadata>): void;
    /**
     * 删除列
     */
    deleteColumn(sheetName: string, columnId: string): void;
    /**
     * 移动列位置
     */
    moveColumn(sheetName: string, columnId: string, newIndex: number): void;
    /**
     * 添加行
     */
    addRow(sheetName: string, row: RowMetadata): void;
    /**
     * 删除行
     */
    deleteRow(sheetName: string, rowId: string): void;
    /**
     * 排序行
     */
    sortRows(sheetName: string, sortCriteria: SortCriteria[]): void;
    /**
     * 提交变更
     */
    commit(message: string, author: string, email: string): string;
    /**
     * 从暂存区构建树对象
     */
    private buildTreeFromIndex;
    /**
     * 应用单个变更
     */
    private applyChange;
    /**
     * 应用排序
     */
    private applySorting;
    /**
     * 存储对象
     */
    private storeObject;
    /**
     * 获取对象
     */
    private getObject;
    /**
     * 创建分支
     */
    createBranch(branchName: string): void;
    /**
     * 切换分支或提交
     */
    checkout(target: string): void;
    /**
     * 从指定提交加载工作区
     */
    private loadWorkingTreeFromCommit;
    /**
     * 获取当前分支
     */
    getCurrentBranch(): string;
    /**
     * 检查当前是否处于分离HEAD状态
     */
    isDetachedHead(): boolean;
    /**
     * 获取当前HEAD指向的提交哈希
     */
    getCurrentCommitHash(): string | undefined;
    /**
     * 获取所有分支
     */
    getBranches(): string[];
    /**
     * 加载工作区
     */
    private loadWorkingTree;
    /**
     * 获取当前状态
     */
    status(): {
        branch: string;
        stagedChanges: number;
        lastCommit?: string;
    };
    /**
     * 获取暂存区变更
     */
    getStagedChanges(): Change[];
    /**
     * 重置暂存区
     */
    reset(): void;
    /**
     * 获取提交历史
     */
    getCommitHistory(limit?: number): CommitObject[];
    /**
     * 获取工作区内容
     */
    getWorkingTree(): SheetTree | undefined;
    /**
     * 获取单元格值
     */
    getCellValue(row: number, col: number): CellValue | undefined;
    /**
     * 获取单元格对象
     */
    getCell(row: number, col: number): CellObject | undefined;
}
//# sourceMappingURL=table-git.d.ts.map