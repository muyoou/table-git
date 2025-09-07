import { CellConflict, StructureConflict, CellValue, CellFormat } from '../types';
import { CellObject } from './cell';
/**
 * 冲突解决策略
 */
export type ResolutionStrategy = 'current' | 'target' | 'manual' | 'merge';
/**
 * 自定义解决方案
 */
export interface CustomResolution {
    value?: CellValue;
    formula?: string;
    format?: CellFormat;
}
/**
 * 冲突解决器 - 处理合并冲突
 */
export declare class ConflictResolver {
    private defaultStrategy;
    constructor(defaultStrategy?: ResolutionStrategy);
    /**
     * 解决单元格冲突
     */
    resolveCellConflict(conflict: CellConflict, resolution?: ResolutionStrategy | CustomResolution): CellObject | null;
    /**
     * 解决结构冲突
     */
    resolveStructureConflict(conflict: StructureConflict, resolution?: ResolutionStrategy): any;
    /**
     * 批量解决冲突
     */
    batchResolve(conflicts: (CellConflict | StructureConflict)[], strategy: ResolutionStrategy): any[];
    /**
     * 智能合并单元格
     */
    private mergeCell;
    /**
     * 创建合并后的单元格
     */
    private createMergedCell;
    /**
     * 合并单元格值
     */
    private mergeValue;
    /**
     * 合并公式
     */
    private mergeFormula;
    /**
     * 合并格式
     */
    private mergeFormat;
    /**
     * 创建自定义单元格
     */
    private createCustomCell;
    /**
     * 智能合并结构
     */
    private mergeStructure;
    /**
     * 合并列元数据
     */
    private mergeColumnMetadata;
    /**
     * 合并字符串字段
     */
    private mergeStringField;
    /**
     * 合并约束条件
     */
    private mergeConstraints;
    /**
     * 生成冲突报告
     */
    generateConflictReport(conflicts: (CellConflict | StructureConflict)[]): string;
    /**
     * 格式化单元格值显示
     */
    private formatCellValue;
    /**
     * 检查冲突是否可以自动解决
     */
    canAutoResolve(conflict: CellConflict | StructureConflict): boolean;
}
//# sourceMappingURL=conflict-resolver.d.ts.map