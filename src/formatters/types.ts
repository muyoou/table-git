import { CellFormat, CellValue } from '../types';

// 表格快照中每个单元格的结构（可选包含格式）
export interface TableCellSnapshot {
  row: number;
  col: number;
  value: CellValue;
  format?: CellFormat;
}

// 供格式化器消费的统一表格数据
export interface TableData {
  // 若第0行存在则作为表头；否则为空数组
  header: CellValue[];
  // 纯数据行（不包含表头行）
  rows: CellValue[][];
  // 原始矩阵（包含表头），便于特殊格式需要
  matrix: CellValue[][];
  // 边界信息
  minRow: number; minCol: number; maxRow: number; maxCol: number;
}

export type FormatterFunction<TOptions = any, TResult = string> = (
  data: TableData,
  options?: TOptions
) => TResult;
