import { TableGit } from '../core/table-git';
import { CellObject } from '../core/cell';
import { ColumnMetadata, RowMetadata, CellValue, CellFormat } from '../types';
/**
 * 创建表格Git实例的便利函数
 */
export declare function createTableGit(branchName?: string): TableGit;
/**
 * 创建单元格的便利函数
 */
export declare function createCell(row: number, column: number, value: CellValue, formula?: string, format?: CellFormat): CellObject;
/**
 * 创建列元数据的便利函数
 */
export declare function createColumn(name: string, options?: {
    id?: string;
    description?: string;
    dataType?: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
    width?: number;
    hidden?: boolean;
    order?: number;
    constraints?: {
        required?: boolean;
        unique?: boolean;
        pattern?: string;
        min?: number;
        max?: number;
    };
}): ColumnMetadata;
/**
 * 创建行元数据的便利函数
 */
export declare function createRow(options?: {
    id?: string;
    height?: number;
    hidden?: boolean;
    order?: number;
}): RowMetadata;
/**
 * 创建包含示例数据的表格
 */
export declare function createSampleTable(): TableGit;
//# sourceMappingURL=factory.d.ts.map