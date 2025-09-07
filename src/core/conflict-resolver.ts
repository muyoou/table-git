import { CellConflict, StructureConflict, ColumnMetadata, CellValue, CellFormat } from '../types';
import { CellObject } from './cell';
import { deepClone } from '../utils/hash';

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
export class ConflictResolver {
  private defaultStrategy: ResolutionStrategy = 'manual';

  constructor(defaultStrategy: ResolutionStrategy = 'manual') {
    this.defaultStrategy = defaultStrategy;
  }

  /**
   * 解决单元格冲突
   */
  resolveCellConflict(
    conflict: CellConflict, 
    resolution: ResolutionStrategy | CustomResolution = this.defaultStrategy
  ): CellObject | null {
    
    if (typeof resolution === 'object') {
      // 自定义解决方案
      return this.createCustomCell(conflict, resolution);
    }

    switch (resolution) {
      case 'current':
        return conflict.current || null;
      
      case 'target':
        return conflict.target || null;
      
      case 'merge':
        return this.mergeCell(conflict);
      
      case 'manual':
      default:
        // 返回null表示需要手动解决
        return null;
    }
  }

  /**
   * 解决结构冲突
   */
  resolveStructureConflict(
    conflict: StructureConflict, 
    resolution: ResolutionStrategy = this.defaultStrategy
  ): any {
    
    switch (resolution) {
      case 'current':
        return conflict.current;
      
      case 'target':
        return conflict.target;
      
      case 'merge':
        return this.mergeStructure(conflict);
      
      case 'manual':
      default:
        return null;
    }
  }

  /**
   * 批量解决冲突
   */
  batchResolve(
    conflicts: (CellConflict | StructureConflict)[], 
    strategy: ResolutionStrategy
  ): any[] {
    return conflicts.map(conflict => {
      if ('position' in conflict) {
        return this.resolveCellConflict(conflict as CellConflict, strategy);
      } else {
        return this.resolveStructureConflict(conflict as StructureConflict, strategy);
      }
    });
  }

  /**
   * 智能合并单元格
   */
  private mergeCell(conflict: CellConflict): CellObject | null {
    const { base, current, target } = conflict;
    
    if (!current && !target) {
      return null;
    }
    
    if (!current) return target;
    if (!target) return current;
    
    // 尝试智能合并
    const mergedCell = this.createMergedCell(base, current, target);
    return mergedCell;
  }

  /**
   * 创建合并后的单元格
   */
  private createMergedCell(base?: CellObject, current?: CellObject, target?: CellObject): CellObject {
    if (!current && !target) {
      throw new Error('Cannot merge: both current and target are null');
    }
    
    const reference = current || target!;
    
    // 默认使用当前分支的值，但合并格式信息
    const value = this.mergeValue(base?.value, current?.value, target?.value);
    const formula = this.mergeFormula(base?.formula, current?.formula, target?.formula);
    const format = this.mergeFormat(base?.format, current?.format, target?.format);
    
    return new CellObject(reference.row, reference.column, value, formula, format);
  }

  /**
   * 合并单元格值
   */
  private mergeValue(base?: CellValue, current?: CellValue, target?: CellValue): CellValue {
    // 如果是数字，尝试取平均值
    if (typeof current === 'number' && typeof target === 'number') {
      return (current + target) / 2;
    }
    
    // 如果是字符串，尝试连接
    if (typeof current === 'string' && typeof target === 'string' && current !== target) {
      return `${current} | ${target}`;
    }
    
    // 默认返回当前值
    return current !== undefined ? current : (target !== undefined ? target : null);
  }

  /**
   * 合并公式
   */
  private mergeFormula(base?: string, current?: string, target?: string): string | undefined {
    // 优先使用非空的公式
    return current || target;
  }

  /**
   * 合并格式
   */
  private mergeFormat(base?: CellFormat, current?: CellFormat, target?: CellFormat): CellFormat | undefined {
    if (!current && !target) return undefined;
    if (!current) return deepClone(target);
    if (!target) return deepClone(current);
    
    // 合并格式属性
    return {
      ...target,
      ...current,  // 当前分支的格式优先级更高
      // 但某些属性可以智能合并
      backgroundColor: current.backgroundColor || target.backgroundColor,
      textColor: current.textColor || target.textColor,
    };
  }

  /**
   * 创建自定义单元格
   */
  private createCustomCell(conflict: CellConflict, resolution: CustomResolution): CellObject | null {
    const reference = conflict.current || conflict.target;
    if (!reference) return null;
    
    return new CellObject(
      reference.row,
      reference.column,
      resolution.value !== undefined ? resolution.value : reference.value,
      resolution.formula !== undefined ? resolution.formula : reference.formula,
      resolution.format !== undefined ? resolution.format : reference.format
    );
  }

  /**
   * 智能合并结构
   */
  private mergeStructure(conflict: StructureConflict): any {
    if (conflict.type === 'column') {
      return this.mergeColumnMetadata(
        conflict.base as ColumnMetadata,
        conflict.current as ColumnMetadata,
        conflict.target as ColumnMetadata
      );
    }
    
    // 对于行，暂时返回当前分支的内容
    return conflict.current;
  }

  /**
   * 合并列元数据
   */
  private mergeColumnMetadata(
    base?: ColumnMetadata, 
    current?: ColumnMetadata, 
    target?: ColumnMetadata
  ): ColumnMetadata {
    
    if (!current && !target) {
      return base!;
    }
    
    if (!current) return deepClone(target!);
    if (!target) return deepClone(current);
    
    // 智能合并列元数据
    const merged: ColumnMetadata = {
      id: current.id,
      name: this.mergeStringField(base?.name, current.name, target.name),
      description: this.mergeStringField(base?.description, current.description, target.description),
      dataType: current.dataType !== base?.dataType ? current.dataType : target.dataType,
      width: current.width !== base?.width ? current.width : target.width,
      hidden: current.hidden !== base?.hidden ? current.hidden : target.hidden,
      order: current.order,
      constraints: this.mergeConstraints(base?.constraints, current.constraints, target.constraints)
    };
    
    return merged;
  }

  /**
   * 合并字符串字段
   */
  private mergeStringField(base?: string, current?: string, target?: string): string {
    if (current === base) {
      return target || current || '';
    }
    if (target === base) {
      return current || target || '';
    }
    
    // 两边都修改了，优先使用当前分支
    return current || target || '';
  }

  /**
   * 合并约束条件
   */
  private mergeConstraints(base?: any, current?: any, target?: any): any {
    return {
      ...base,
      ...target,
      ...current  // 当前分支的约束优先级最高
    };
  }

  /**
   * 生成冲突报告
   */
  generateConflictReport(conflicts: (CellConflict | StructureConflict)[]): string {
    const cellConflicts = conflicts.filter(c => 'position' in c) as CellConflict[];
    const structureConflicts = conflicts.filter(c => 'type' in c) as StructureConflict[];
    
    let report = `冲突报告 (${conflicts.length} 个冲突)\n\n`;
    
    if (cellConflicts.length > 0) {
      report += `单元格冲突 (${cellConflicts.length} 个):\n`;
      cellConflicts.forEach((conflict, index) => {
        report += `${index + 1}. 位置 ${conflict.position}\n`;
        report += `   当前值: ${this.formatCellValue(conflict.current)}\n`;
        report += `   目标值: ${this.formatCellValue(conflict.target)}\n\n`;
      });
    }
    
    if (structureConflicts.length > 0) {
      report += `结构冲突 (${structureConflicts.length} 个):\n`;
      structureConflicts.forEach((conflict, index) => {
        report += `${index + 1}. ${conflict.type} "${conflict.id}"\n`;
        report += `   当前: ${JSON.stringify(conflict.current, null, 2)}\n`;
        report += `   目标: ${JSON.stringify(conflict.target, null, 2)}\n\n`;
      });
    }
    
    return report;
  }

  /**
   * 格式化单元格值显示
   */
  private formatCellValue(cell?: CellObject): string {
    if (!cell) return '(空)';
    
    let display = `值: ${cell.value}`;
    if (cell.formula) {
      display += `, 公式: ${cell.formula}`;
    }
    return display;
  }

  /**
   * 检查冲突是否可以自动解决
   */
  canAutoResolve(conflict: CellConflict | StructureConflict): boolean {
    if ('position' in conflict) {
      // 单元格冲突
      const cellConflict = conflict as CellConflict;
      
      // 如果其中一个是空值，可以自动解决
      if (!cellConflict.current || !cellConflict.target) {
        return true;
      }
      
      // 如果值相同，可以自动解决
      if (cellConflict.current.value === cellConflict.target.value) {
        return true;
      }
      
      return false;
    } else {
      // 结构冲突通常需要手动解决
      return false;
    }
  }
}
