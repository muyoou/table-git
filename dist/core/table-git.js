"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableGit = void 0;
const types_1 = require("../types");
const cell_1 = require("./cell");
const sheet_1 = require("./sheet");
const commit_1 = require("./commit");
/**
 * 表格版本控制引擎 - Git 风格的表格版本控制系统
 */
class TableGit {
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
    init(branchName = 'main') {
        this.head = branchName;
        this.refs.set(branchName, '');
        // 创建初始空提交
        const emptyTree = new sheet_1.SheetTree('default');
        const treeHash = this.storeObject(emptyTree);
        const initialCommit = new commit_1.CommitObject(treeHash, 'Initial commit', 'System', 'system@tablegit.com');
        const commitHash = this.storeObject(initialCommit);
        this.refs.set(branchName, commitHash);
        // 加载工作区
        this.loadWorkingTree();
    }
    // ========== 单元格操作 ==========
    /**
     * 添加或更新单元格
     */
    addCellChange(sheetName, row, column, value, formula, format) {
        const cell = new cell_1.CellObject(row, column, value, formula, format);
        const changeKey = `${sheetName}:cell:${row},${column}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.CELL_UPDATE,
            sheetName,
            details: cell,
            timestamp: Date.now()
        });
    }
    /**
     * 删除单元格
     */
    deleteCellChange(sheetName, row, column) {
        const changeKey = `${sheetName}:cell:${row},${column}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.CELL_DELETE,
            sheetName,
            details: { row, column },
            timestamp: Date.now()
        });
    }
    // ========== 列操作 ==========
    /**
     * 添加列
     */
    addColumn(sheetName, column) {
        const changeKey = `${sheetName}:column:add:${column.id}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_ADD,
            sheetName,
            details: column,
            timestamp: Date.now()
        });
    }
    /**
     * 更新列信息
     */
    updateColumn(sheetName, columnId, updates) {
        const changeKey = `${sheetName}:column:update:${columnId}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_UPDATE,
            sheetName,
            details: { columnId, updates },
            timestamp: Date.now()
        });
    }
    /**
     * 删除列
     */
    deleteColumn(sheetName, columnId) {
        const changeKey = `${sheetName}:column:delete:${columnId}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_DELETE,
            sheetName,
            details: { columnId },
            timestamp: Date.now()
        });
    }
    /**
     * 移动列位置
     */
    moveColumn(sheetName, columnId, newIndex) {
        const changeKey = `${sheetName}:column:move:${columnId}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.COLUMN_MOVE,
            sheetName,
            details: { columnId, newIndex },
            timestamp: Date.now()
        });
    }
    // ========== 行操作 ==========
    /**
     * 添加行
     */
    addRow(sheetName, row) {
        const changeKey = `${sheetName}:row:add:${row.id}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.ROW_ADD,
            sheetName,
            details: row,
            timestamp: Date.now()
        });
    }
    /**
     * 删除行
     */
    deleteRow(sheetName, rowId) {
        const changeKey = `${sheetName}:row:delete:${rowId}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.ROW_DELETE,
            sheetName,
            details: { rowId },
            timestamp: Date.now()
        });
    }
    /**
     * 排序行
     */
    sortRows(sheetName, sortCriteria) {
        const changeKey = `${sheetName}:row:sort:${Date.now()}`;
        this.index.set(changeKey, {
            type: types_1.ChangeType.ROW_SORT,
            sheetName,
            details: { sortCriteria },
            timestamp: Date.now()
        });
    }
    // ========== 版本控制核心操作 ==========
    /**
     * 提交变更
     */
    commit(message, author, email) {
        if (this.index.size === 0) {
            throw new Error('Nothing to commit');
        }
        // 构建新的树对象
        const newTree = this.buildTreeFromIndex();
        const treeHash = this.storeObject(newTree);
        // 获取当前提交
        const currentCommitHash = this.refs.get(this.head);
        // 创建新提交
        const commit = new commit_1.CommitObject(treeHash, message, author, email, currentCommitHash);
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
    buildTreeFromIndex() {
        // 从当前工作区获取基础树，如果不存在则创建新的
        let sheet = this.workingTree.get('default')?.clone() || new sheet_1.SheetTree('default');
        // 应用所有暂存的变更
        for (const [key, change] of this.index) {
            this.applyChange(sheet, change);
        }
        return sheet;
    }
    /**
     * 应用单个变更
     */
    applyChange(sheet, change) {
        switch (change.type) {
            case types_1.ChangeType.CELL_UPDATE:
            case types_1.ChangeType.CELL_ADD:
                const cell = change.details;
                const cellHash = this.storeObject(cell);
                sheet.setCellHash(cell.row, cell.column, cellHash);
                break;
            case types_1.ChangeType.CELL_DELETE:
                const { row, column } = change.details;
                sheet.deleteCell(row, column);
                break;
            case types_1.ChangeType.COLUMN_ADD:
                sheet.structure.addColumn(change.details);
                break;
            case types_1.ChangeType.COLUMN_UPDATE:
                const { columnId, updates } = change.details;
                sheet.structure.updateColumn(columnId, updates);
                break;
            case types_1.ChangeType.COLUMN_DELETE:
                sheet.structure.removeColumn(change.details.columnId);
                break;
            case types_1.ChangeType.COLUMN_MOVE:
                sheet.structure.moveColumn(change.details.columnId, change.details.newIndex);
                break;
            case types_1.ChangeType.ROW_ADD:
                sheet.structure.addRow(change.details);
                break;
            case types_1.ChangeType.ROW_DELETE:
                sheet.structure.removeRow(change.details.rowId);
                break;
            case types_1.ChangeType.ROW_SORT:
                // 这里可以实现具体的排序逻辑
                const { sortCriteria } = change.details;
                this.applySorting(sheet, sortCriteria);
                break;
        }
    }
    /**
     * 应用排序
     */
    applySorting(sheet, criteria) {
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
    storeObject(obj) {
        const hash = obj.hash;
        this.objects.set(hash, obj);
        return hash;
    }
    /**
     * 获取对象
     */
    getObject(hash) {
        return this.objects.get(hash);
    }
    // ========== 分支操作 ==========
    /**
     * 创建分支
     */
    createBranch(branchName) {
        const currentCommitHash = this.refs.get(this.head);
        if (currentCommitHash) {
            this.refs.set(branchName, currentCommitHash);
        }
        else {
            throw new Error('Cannot create branch: no commits found');
        }
    }
    /**
     * 切换分支或提交
     */
    checkout(target) {
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
        if (commit && commit.type === types_1.ObjectType.COMMIT) {
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
    loadWorkingTreeFromCommit(commitHash) {
        const commit = this.getObject(commitHash);
        if (commit) {
            const tree = this.getObject(commit.tree);
            if (tree) {
                this.workingTree.set('default', tree.clone());
            }
        }
    }
    /**
     * 获取当前分支
     */
    getCurrentBranch() {
        return this.head;
    }
    /**
     * 检查当前是否处于分离HEAD状态
     */
    isDetachedHead() {
        return !this.refs.has(this.head);
    }
    /**
     * 获取当前HEAD指向的提交哈希
     */
    getCurrentCommitHash() {
        if (this.isDetachedHead()) {
            return this.head; // 分离HEAD状态下，head直接是提交哈希
        }
        return this.refs.get(this.head);
    }
    /**
     * 获取所有分支
     */
    getBranches() {
        return Array.from(this.refs.keys());
    }
    /**
     * 加载工作区
     */
    loadWorkingTree() {
        const commitHash = this.refs.get(this.head);
        if (commitHash) {
            const commit = this.getObject(commitHash);
            if (commit) {
                const tree = this.getObject(commit.tree);
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
    status() {
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
    getStagedChanges() {
        return Array.from(this.index.values());
    }
    /**
     * 重置暂存区
     */
    reset() {
        this.index.clear();
    }
    /**
     * 获取提交历史
     */
    getCommitHistory(limit = 10) {
        const history = [];
        let currentHash = this.refs.get(this.head);
        while (currentHash && history.length < limit) {
            const commit = this.getObject(currentHash);
            if (!commit)
                break;
            history.push(commit);
            currentHash = commit.parent;
        }
        return history;
    }
    /**
     * 获取工作区内容
     */
    getWorkingTree() {
        return this.workingTree.get('default');
    }
    /**
     * 获取单元格值
     */
    getCellValue(row, col) {
        const sheet = this.workingTree.get('default');
        if (!sheet)
            return undefined;
        const cellHash = sheet.getCellHash(row, col);
        if (!cellHash)
            return undefined;
        const cell = this.getObject(cellHash);
        return cell?.value;
    }
    /**
     * 获取单元格对象
     */
    getCell(row, col) {
        const sheet = this.workingTree.get('default');
        if (!sheet)
            return undefined;
        const cellHash = sheet.getCellHash(row, col);
        if (!cellHash)
            return undefined;
        return this.getObject(cellHash);
    }
}
exports.TableGit = TableGit;
//# sourceMappingURL=table-git.js.map