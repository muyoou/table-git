"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellObject = void 0;
const types_1 = require("../types");
const hash_1 = require("../utils/hash");
/**
 * 单元格对象 - 最小存储粒度
 */
class CellObject {
    constructor(row, column, value, formula, format) {
        this.type = types_1.ObjectType.CELL;
        this.row = row;
        this.column = column;
        this.value = value;
        this.formula = formula;
        this.format = format;
        this.hash = this.calculateHash();
    }
    calculateHash() {
        return (0, hash_1.calculateHash)({
            type: this.type,
            row: this.row,
            column: this.column,
            value: this.value,
            formula: this.formula,
            format: this.format
        });
    }
    /**
     * 更新单元格值
     */
    updateValue(value, formula, format) {
        return new CellObject(this.row, this.column, value, formula, format);
    }
    /**
     * 检查是否为空单元格
     */
    isEmpty() {
        return this.value === null || this.value === undefined || this.value === '';
    }
    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            type: this.type,
            row: this.row,
            column: this.column,
            value: this.value,
            formula: this.formula,
            format: this.format,
            hash: this.hash
        };
    }
    /**
     * 从JSON创建对象
     */
    static fromJSON(json) {
        return new CellObject(json.row, json.column, json.value, json.formula, json.format);
    }
}
exports.CellObject = CellObject;
//# sourceMappingURL=cell.js.map