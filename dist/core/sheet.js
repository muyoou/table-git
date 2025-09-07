"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetTree = void 0;
const types_1 = require("../types");
const structure_1 = require("./structure");
const hash_1 = require("../utils/hash");
const hash_2 = require("../utils/hash");
/**
 * 工作表树对象 - 管理单个工作表的数据和结构
 */
class SheetTree {
    constructor(name) {
        this.type = types_1.ObjectType.SHEET;
        this.name = name;
        this.cells = new Map();
        this.structure = new structure_1.TableStructure();
        this.hash = this.calculateHash();
    }
    /**
     * 设置单元格哈希
     */
    setCellHash(row, col, hash) {
        const key = (0, hash_2.formatPosition)(row, col);
        this.cells.set(key, hash);
        this.updateHash();
    }
    /**
     * 获取单元格哈希
     */
    getCellHash(row, col) {
        const key = (0, hash_2.formatPosition)(row, col);
        return this.cells.get(key);
    }
    /**
     * 删除单元格
     */
    deleteCell(row, col) {
        const key = (0, hash_2.formatPosition)(row, col);
        const deleted = this.cells.delete(key);
        if (deleted) {
            this.updateHash();
        }
        return deleted;
    }
    /**
     * 获取所有单元格位置
     */
    getAllCellPositions() {
        return Array.from(this.cells.keys()).map(key => (0, hash_2.parsePosition)(key));
    }
    /**
     * 获取指定区域的单元格
     */
    getCellsInRange(startRow, startCol, endRow, endCol) {
        const result = new Map();
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const hash = this.getCellHash(row, col);
                if (hash) {
                    result.set((0, hash_2.formatPosition)(row, col), hash);
                }
            }
        }
        return result;
    }
    /**
     * 清空所有单元格
     */
    clearAllCells() {
        this.cells.clear();
        this.updateHash();
    }
    /**
     * 获取工作表边界
     */
    getBounds() {
        if (this.cells.size === 0) {
            return null;
        }
        let minRow = Infinity, maxRow = -Infinity;
        let minCol = Infinity, maxCol = -Infinity;
        for (const key of this.cells.keys()) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
        }
        return { minRow, maxRow, minCol, maxCol };
    }
    /**
     * 插入行（在指定行之前插入）
     */
    insertRowBefore(targetRow) {
        const newCells = new Map();
        for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            const newRow = row >= targetRow ? row + 1 : row;
            newCells.set((0, hash_2.formatPosition)(newRow, col), hash);
        }
        this.cells = newCells;
        this.updateHash();
    }
    /**
     * 插入列（在指定列之前插入）
     */
    insertColumnBefore(targetCol) {
        const newCells = new Map();
        for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            const newCol = col >= targetCol ? col + 1 : col;
            newCells.set((0, hash_2.formatPosition)(row, newCol), hash);
        }
        this.cells = newCells;
        this.updateHash();
    }
    /**
     * 删除行
     */
    deleteRow(targetRow) {
        const newCells = new Map();
        for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            if (row === targetRow) {
                continue; // 跳过要删除的行
            }
            const newRow = row > targetRow ? row - 1 : row;
            newCells.set((0, hash_2.formatPosition)(newRow, col), hash);
        }
        this.cells = newCells;
        this.updateHash();
    }
    /**
     * 删除列
     */
    deleteColumn(targetCol) {
        const newCells = new Map();
        for (const [key, hash] of this.cells) {
            const { row, col } = (0, hash_2.parsePosition)(key);
            if (col === targetCol) {
                continue; // 跳过要删除的列
            }
            const newCol = col > targetCol ? col - 1 : col;
            newCells.set((0, hash_2.formatPosition)(row, newCol), hash);
        }
        this.cells = newCells;
        this.updateHash();
    }
    updateHash() {
        this.hash = this.calculateHash();
    }
    calculateHash() {
        return (0, hash_1.calculateHash)({
            type: this.type,
            name: this.name,
            cells: Array.from(this.cells.entries()),
            structure: this.structure.hash
        });
    }
    /**
     * 克隆工作表
     */
    clone() {
        const cloned = new SheetTree(this.name);
        cloned.cells = new Map(this.cells);
        cloned.structure = this.structure.clone();
        cloned.updateHash();
        return cloned;
    }
    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            type: this.type,
            name: this.name,
            cells: Array.from(this.cells.entries()),
            structure: this.structure.toJSON(),
            hash: this.hash
        };
    }
    /**
     * 从JSON创建对象
     */
    static fromJSON(json) {
        const sheet = new SheetTree(json.name);
        sheet.cells = new Map(json.cells);
        sheet.structure = structure_1.TableStructure.fromJSON(json.structure);
        sheet.updateHash();
        return sheet;
    }
}
exports.SheetTree = SheetTree;
//# sourceMappingURL=sheet.js.map