"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffMergeEngine = void 0;
const hash_1 = require("../utils/hash");
/**
 * 差异计算和合并工具类
 */
class DiffMergeEngine {
    constructor(tableGit) {
        this.tableGit = tableGit;
    }
    /**
     * 计算两个提交之间的差异
     */
    diff(commitHash1, commitHash2) {
        const commit1 = this.getObject(commitHash1);
        const commit2 = this.getObject(commitHash2);
        if (!commit1 || !commit2) {
            throw new Error('Invalid commit hash');
        }
        const tree1 = this.getObject(commit1.tree);
        const tree2 = this.getObject(commit2.tree);
        return this.diffTrees(tree1, tree2);
    }
    /**
     * 比较两个树对象
     */
    diffTrees(tree1, tree2) {
        const result = {
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
    diffCells(tree1, tree2, result) {
        const allCellKeys = new Set([...tree1.cells.keys(), ...tree2.cells.keys()]);
        for (const key of allCellKeys) {
            const hash1 = tree1.cells.get(key);
            const hash2 = tree2.cells.get(key);
            if (!hash1 && hash2) {
                // 新增的单元格
                const cell = this.getObject(hash2);
                result.cellChanges.added.push(cell);
            }
            else if (hash1 && !hash2) {
                // 删除的单元格
                const cell = this.getObject(hash1);
                result.cellChanges.deleted.push(cell);
            }
            else if (hash1 !== hash2) {
                // 修改的单元格
                if (hash1 && hash2) {
                    const oldCell = this.getObject(hash1);
                    const newCell = this.getObject(hash2);
                    result.cellChanges.modified.push({ old: oldCell, new: newCell });
                }
            }
        }
    }
    /**
     * 比较结构差异
     */
    diffStructure(tree1, tree2, result) {
        const columns1 = tree1.structure.columns;
        const columns2 = tree2.structure.columns;
        // 检查新增和修改的列
        for (const [id, col2] of columns2) {
            const col1 = columns1.get(id);
            if (!col1) {
                result.structureChanges.columns.added.push(col2);
            }
            else if (!(0, hash_1.deepEqual)(col1, col2)) {
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
    diffColumnOrder(tree1, tree2, result) {
        const order1 = tree1.structure.columnOrder;
        const order2 = tree2.structure.columnOrder;
        if (!(0, hash_1.deepEqual)(order1, order2)) {
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
    diffRowOrder(tree1, tree2, result) {
        const order1 = tree1.structure.rowOrder;
        const order2 = tree2.structure.rowOrder;
        if (!(0, hash_1.deepEqual)(order1, order2)) {
            result.structureChanges.rows.sorted = {
                oldOrder: order1,
                newOrder: order2
            };
        }
    }
    /**
     * 三路合并
     */
    merge(branchName) {
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
        }
        else {
            // 存在冲突
            return { success: false, conflicts };
        }
    }
    /**
     * 三路合并实现
     */
    threeWayMerge(baseHash, currentHash, targetHash) {
        const conflicts = [];
        const baseCommit = this.getObject(baseHash);
        const currentCommit = this.getObject(currentHash);
        const targetCommit = this.getObject(targetHash);
        const baseTree = this.getObject(baseCommit.tree);
        const currentTree = this.getObject(currentCommit.tree);
        const targetTree = this.getObject(targetCommit.tree);
        // 合并单元格
        this.mergeCells(baseTree, currentTree, targetTree, conflicts);
        // 合并结构
        this.mergeStructure(baseTree, currentTree, targetTree, conflicts);
        return conflicts;
    }
    /**
     * 合并单元格
     */
    mergeCells(baseTree, currentTree, targetTree, conflicts) {
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
                }
                else if (baseCell === targetCell) {
                    // 只有当前分支修改了，保留当前分支的修改
                    continue;
                }
                else {
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
    mergeStructure(baseTree, currentTree, targetTree, conflicts) {
        // 合并列结构
        this.mergeColumns(baseTree, currentTree, targetTree, conflicts);
        // 合并行结构
        this.mergeRows(baseTree, currentTree, targetTree, conflicts);
    }
    /**
     * 合并列结构
     */
    mergeColumns(baseTree, currentTree, targetTree, conflicts) {
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
            if (!(0, hash_1.deepEqual)(currentCol, targetCol)) {
                if ((0, hash_1.deepEqual)(baseCol, currentCol)) {
                    // 只有目标分支修改了
                    continue;
                }
                else if ((0, hash_1.deepEqual)(baseCol, targetCol)) {
                    // 只有当前分支修改了
                    continue;
                }
                else {
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
    mergeRows(baseTree, currentTree, targetTree, conflicts) {
        // 类似于列的合并逻辑
        // 这里简化处理
    }
    /**
     * 找到共同祖先
     */
    findCommonAncestor(hash1, hash2) {
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
    getCommitHistory(commitHash) {
        const history = [];
        let current = commitHash;
        while (current) {
            history.push(current);
            const commit = this.getObject(current);
            if (!commit)
                break;
            current = commit.parent || '';
        }
        return history;
    }
    // 辅助方法
    getObject(hash) {
        return this.tableGit.objects.get(hash);
    }
    getCurrentCommitHash() {
        return this.tableGit.refs.get(this.tableGit.head);
    }
    getBranchCommitHash(branchName) {
        return this.tableGit.refs.get(branchName);
    }
}
exports.DiffMergeEngine = DiffMergeEngine;
//# sourceMappingURL=diff-merge.js.map