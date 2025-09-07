import { ColumnMetadata, RowMetadata } from '../types';
/**
 * 表格结构类 - 管理列和行的元数据
 */
export declare class TableStructure {
    columns: Map<string, ColumnMetadata>;
    rows: Map<string, RowMetadata>;
    columnOrder: string[];
    rowOrder: string[];
    hash: string;
    constructor();
    /**
     * 添加列
     */
    addColumn(column: ColumnMetadata): void;
    /**
     * 删除列
     */
    removeColumn(columnId: string): boolean;
    /**
     * 更新列信息
     */
    updateColumn(columnId: string, updates: Partial<ColumnMetadata>): boolean;
    /**
     * 移动列位置
     */
    moveColumn(columnId: string, newIndex: number): boolean;
    /**
     * 添加行
     */
    addRow(row: RowMetadata): void;
    /**
     * 删除行
     */
    removeRow(rowId: string): boolean;
    /**
     * 排序行
     */
    sortRows(newOrder: string[]): void;
    /**
     * 获取列信息
     */
    getColumn(columnId: string): ColumnMetadata | undefined;
    /**
     * 获取行信息
     */
    getRow(rowId: string): RowMetadata | undefined;
    /**
     * 获取所有列ID（按顺序）
     */
    getColumnIds(): string[];
    /**
     * 获取所有行ID（按顺序）
     */
    getRowIds(): string[];
    private updateColumnOrders;
    private updateRowOrders;
    private updateHash;
    private calculateHash;
    /**
     * 克隆结构
     */
    clone(): TableStructure;
    /**
     * 转换为JSON
     */
    toJSON(): any;
    /**
     * 从JSON创建对象
     */
    static fromJSON(json: any): TableStructure;
}
//# sourceMappingURL=structure.d.ts.map