"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTableGit = createTableGit;
exports.createCell = createCell;
exports.createColumn = createColumn;
exports.createRow = createRow;
exports.createSampleTable = createSampleTable;
const table_git_1 = require("../core/table-git");
const cell_1 = require("../core/cell");
const hash_1 = require("./hash");
/**
 * 创建表格Git实例的便利函数
 */
function createTableGit(branchName = 'main') {
    const tableGit = new table_git_1.TableGit();
    tableGit.init(branchName);
    return tableGit;
}
/**
 * 创建单元格的便利函数
 */
function createCell(row, column, value, formula, format) {
    return new cell_1.CellObject(row, column, value, formula, format);
}
/**
 * 创建列元数据的便利函数
 */
function createColumn(name, options = {}) {
    return {
        id: options.id || (0, hash_1.generateId)('col_'),
        name,
        description: options.description,
        dataType: options.dataType || 'mixed',
        width: options.width || 100,
        hidden: options.hidden || false,
        order: options.order || 0,
        constraints: options.constraints
    };
}
/**
 * 创建行元数据的便利函数
 */
function createRow(options = {}) {
    return {
        id: options.id || (0, hash_1.generateId)('row_'),
        height: options.height || 25,
        hidden: options.hidden || false,
        order: options.order || 0
    };
}
/**
 * 创建包含示例数据的表格
 */
function createSampleTable() {
    const repo = createTableGit();
    // 添加列定义
    const columns = [
        createColumn('产品名称', {
            dataType: 'string',
            width: 150,
            order: 0,
            constraints: { required: true }
        }),
        createColumn('价格', {
            dataType: 'number',
            width: 100,
            order: 1,
            constraints: { required: true, min: 0 }
        }),
        createColumn('库存', {
            dataType: 'number',
            width: 100,
            order: 2
        }),
        createColumn('描述', {
            dataType: 'string',
            width: 200,
            order: 3
        })
    ];
    // 添加列到表格
    columns.forEach(col => repo.addColumn('default', col));
    // 添加示例数据
    repo.addCellChange('default', 1, 1, 'iPhone 15', undefined, { fontWeight: 'bold' });
    repo.addCellChange('default', 1, 2, 5999);
    repo.addCellChange('default', 1, 3, 100);
    repo.addCellChange('default', 1, 4, '最新款iPhone');
    repo.addCellChange('default', 2, 1, 'MacBook Pro', undefined, { fontWeight: 'bold' });
    repo.addCellChange('default', 2, 2, 12999);
    repo.addCellChange('default', 2, 3, 50);
    repo.addCellChange('default', 2, 4, '专业级笔记本电脑');
    repo.addCellChange('default', 3, 1, 'iPad Air', undefined, { fontWeight: 'bold' });
    repo.addCellChange('default', 3, 2, 4599);
    repo.addCellChange('default', 3, 3, 75);
    repo.addCellChange('default', 3, 4, '轻薄平板电脑');
    // 提交初始数据
    repo.commit('初始化产品表', 'System', 'system@example.com');
    return repo;
}
//# sourceMappingURL=factory.js.map