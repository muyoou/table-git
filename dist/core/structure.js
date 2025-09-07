"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableStructure = void 0;
const hash_1 = require("../utils/hash");
/**
 * 表格结构类 - 管理列和行的元数据
 */
class TableStructure {
    constructor() {
        this.columns = new Map();
        this.rows = new Map();
        this.columnOrder = [];
        this.rowOrder = [];
        this.hash = this.calculateHash();
    }
    /**
     * 添加列
     */
    addColumn(column) {
        this.columns.set(column.id, (0, hash_1.deepClone)(column));
        // 按order插入到正确位置
        const insertIndex = this.columnOrder.findIndex(id => {
            const existingColumn = this.columns.get(id);
            return existingColumn && existingColumn.order > column.order;
        });
        if (insertIndex === -1) {
            this.columnOrder.push(column.id);
        }
        else {
            this.columnOrder.splice(insertIndex, 0, column.id);
        }
        this.updateHash();
    }
    /**
     * 删除列
     */
    removeColumn(columnId) {
        if (this.columns.delete(columnId)) {
            this.columnOrder = this.columnOrder.filter(id => id !== columnId);
            this.updateHash();
            return true;
        }
        return false;
    }
    /**
     * 更新列信息
     */
    updateColumn(columnId, updates) {
        const column = this.columns.get(columnId);
        if (column) {
            const updatedColumn = { ...column, ...updates };
            this.columns.set(columnId, updatedColumn);
            this.updateHash();
            return true;
        }
        return false;
    }
    /**
     * 移动列位置
     */
    moveColumn(columnId, newIndex) {
        const currentIndex = this.columnOrder.indexOf(columnId);
        if (currentIndex === -1 || newIndex < 0 || newIndex >= this.columnOrder.length) {
            return false;
        }
        // 移除并插入到新位置
        this.columnOrder.splice(currentIndex, 1);
        this.columnOrder.splice(newIndex, 0, columnId);
        // 更新所有列的order属性
        this.updateColumnOrders();
        this.updateHash();
        return true;
    }
    /**
     * 添加行
     */
    addRow(row) {
        this.rows.set(row.id, (0, hash_1.deepClone)(row));
        // 按order插入到正确位置
        const insertIndex = this.rowOrder.findIndex(id => {
            const existingRow = this.rows.get(id);
            return existingRow && existingRow.order > row.order;
        });
        if (insertIndex === -1) {
            this.rowOrder.push(row.id);
        }
        else {
            this.rowOrder.splice(insertIndex, 0, row.id);
        }
        this.updateHash();
    }
    /**
     * 删除行
     */
    removeRow(rowId) {
        if (this.rows.delete(rowId)) {
            this.rowOrder = this.rowOrder.filter(id => id !== rowId);
            this.updateHash();
            return true;
        }
        return false;
    }
    /**
     * 排序行
     */
    sortRows(newOrder) {
        // 验证新顺序包含所有现有行
        if (newOrder.length === this.rowOrder.length &&
            newOrder.every(id => this.rowOrder.includes(id))) {
            this.rowOrder = [...newOrder];
            this.updateRowOrders();
            this.updateHash();
        }
    }
    /**
     * 获取列信息
     */
    getColumn(columnId) {
        return this.columns.get(columnId);
    }
    /**
     * 获取行信息
     */
    getRow(rowId) {
        return this.rows.get(rowId);
    }
    /**
     * 获取所有列ID（按顺序）
     */
    getColumnIds() {
        return [...this.columnOrder];
    }
    /**
     * 获取所有行ID（按顺序）
     */
    getRowIds() {
        return [...this.rowOrder];
    }
    updateColumnOrders() {
        this.columnOrder.forEach((id, index) => {
            const column = this.columns.get(id);
            if (column) {
                column.order = index;
            }
        });
    }
    updateRowOrders() {
        this.rowOrder.forEach((id, index) => {
            const row = this.rows.get(id);
            if (row) {
                row.order = index;
            }
        });
    }
    updateHash() {
        this.hash = this.calculateHash();
    }
    calculateHash() {
        return (0, hash_1.calculateHash)({
            columns: Array.from(this.columns.entries()),
            rows: Array.from(this.rows.entries()),
            columnOrder: this.columnOrder,
            rowOrder: this.rowOrder
        });
    }
    /**
     * 克隆结构
     */
    clone() {
        const cloned = new TableStructure();
        cloned.columns = new Map(Array.from(this.columns.entries()).map(([k, v]) => [k, (0, hash_1.deepClone)(v)]));
        cloned.rows = new Map(Array.from(this.rows.entries()).map(([k, v]) => [k, (0, hash_1.deepClone)(v)]));
        cloned.columnOrder = [...this.columnOrder];
        cloned.rowOrder = [...this.rowOrder];
        cloned.updateHash();
        return cloned;
    }
    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            columns: Array.from(this.columns.entries()),
            rows: Array.from(this.rows.entries()),
            columnOrder: this.columnOrder,
            rowOrder: this.rowOrder,
            hash: this.hash
        };
    }
    /**
     * 从JSON创建对象
     */
    static fromJSON(json) {
        const structure = new TableStructure();
        structure.columns = new Map(json.columns);
        structure.rows = new Map(json.rows);
        structure.columnOrder = json.columnOrder;
        structure.rowOrder = json.rowOrder;
        structure.updateHash();
        return structure;
    }
}
exports.TableStructure = TableStructure;
//# sourceMappingURL=structure.js.map