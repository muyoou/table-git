import { ObjectType, CellValue, CellFormat } from '../types';
/**
 * 单元格对象 - 最小存储粒度
 */
export declare class CellObject {
    readonly type = ObjectType.CELL;
    row: number;
    column: number;
    value: CellValue;
    formula?: string;
    format?: CellFormat;
    hash: string;
    constructor(row: number, column: number, value: CellValue, formula?: string, format?: CellFormat);
    private calculateHash;
    /**
     * 更新单元格值
     */
    updateValue(value: CellValue, formula?: string, format?: CellFormat): CellObject;
    /**
     * 检查是否为空单元格
     */
    isEmpty(): boolean;
    /**
     * 转换为JSON
     */
    toJSON(): any;
    /**
     * 从JSON创建对象
     */
    static fromJSON(json: any): CellObject;
}
//# sourceMappingURL=cell.d.ts.map