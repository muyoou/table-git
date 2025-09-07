import { DiffResult } from '../types';
import { TableGit } from './table-git';
/**
 * 差异计算和合并工具类
 */
export declare class DiffMergeEngine {
    private tableGit;
    constructor(tableGit: TableGit);
    /**
     * 计算两个提交之间的差异
     */
    diff(commitHash1: string, commitHash2: string): DiffResult;
    /**
     * 比较两个树对象
     */
    private diffTrees;
    /**
     * 比较单元格差异
     */
    private diffCells;
    /**
     * 比较结构差异
     */
    private diffStructure;
    /**
     * 比较列顺序差异
     */
    private diffColumnOrder;
    /**
     * 比较行顺序差异
     */
    private diffRowOrder;
    /**
     * 三路合并
     */
    merge(branchName: string): {
        success: boolean;
        conflicts?: any[];
    };
    /**
     * 三路合并实现
     */
    private threeWayMerge;
    /**
     * 合并单元格
     */
    private mergeCells;
    /**
     * 合并结构
     */
    private mergeStructure;
    /**
     * 合并列结构
     */
    private mergeColumns;
    /**
     * 合并行结构
     */
    private mergeRows;
    /**
     * 找到共同祖先
     */
    private findCommonAncestor;
    /**
     * 获取提交历史
     */
    private getCommitHistory;
    private getObject;
    private getCurrentCommitHash;
    private getBranchCommitHash;
}
//# sourceMappingURL=diff-merge.d.ts.map