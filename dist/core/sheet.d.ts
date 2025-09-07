import { ObjectType } from '../types';
import { TableStructure } from './structure';
/**
 * 工作表树对象 - 管理单个工作表的数据和结构
 */
export declare class SheetTree {
    readonly type = ObjectType.SHEET;
    name: string;
    cells: Map<string, string>;
    structure: TableStructure;
    hash: string;
    constructor(name: string);
    /**
     * 设置单元格哈希
     */
    setCellHash(row: number, col: number, hash: string): void;
    /**
     * 获取单元格哈希
     */
    getCellHash(row: number, col: number): string | undefined;
    /**
     * 删除单元格
     */
    deleteCell(row: number, col: number): boolean;
    /**
     * 获取所有单元格位置
     */
    getAllCellPositions(): {
        row: number;
        col: number;
    }[];
    /**
     * 获取指定区域的单元格
     */
    getCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number): Map<string, string>;
    /**
     * 清空所有单元格
     */
    clearAllCells(): void;
    /**
     * 获取工作表边界
     */
    getBounds(): {
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
    } | null;
    /**
     * 插入行（在指定行之前插入）
     */
    insertRowBefore(targetRow: number): void;
    /**
     * 插入列（在指定列之前插入）
     */
    insertColumnBefore(targetCol: number): void;
    /**
     * 删除行
     */
    deleteRow(targetRow: number): void;
    /**
     * 删除列
     */
    deleteColumn(targetCol: number): void;
    private updateHash;
    private calculateHash;
    /**
     * 克隆工作表
     */
    clone(): SheetTree;
    /**
     * 转换为JSON
     */
    toJSON(): any;
    /**
     * 从JSON创建对象
     */
    static fromJSON(json: any): SheetTree;
}
//# sourceMappingURL=sheet.d.ts.map