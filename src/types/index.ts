/**
 * 基础对象类型枚举
 */
export enum ObjectType {
  CELL = 'cell',
  COLUMN = 'column',
  ROW = 'row',
  SHEET = 'sheet',
  TABLE = 'table',
  COMMIT = 'commit'
}

/**
 * 单元格数据类型
 */
export type CellValue = string | number | boolean | Date | null;

/**
 * 单元格格式信息接口
 */
export interface CellFormat {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  backgroundColor?: string;
  borderStyle?: string;
  alignment?: 'left' | 'center' | 'right';
  numberFormat?: string;
}

/**
 * 列元数据接口
 */
export interface ColumnMetadata {
  id: string;
  description?: string;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
  width?: number;
  hidden?: boolean;
  order: number;  // 列顺序
  constraints?: {
    required?: boolean;
    unique?: boolean;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

/**
 * 行元数据接口
 */
export interface RowMetadata {
  id: string;
  height?: number;
  hidden?: boolean;
  order: number;  // 行顺序（用于排序后的位置）
}

/**
 * 变更类型枚举
 */
export enum ChangeType {
  CELL_ADD = 'cell_add',
  CELL_UPDATE = 'cell_update',
  CELL_DELETE = 'cell_delete',
  COLUMN_ADD = 'column_add',
  COLUMN_UPDATE = 'column_update',
  COLUMN_DELETE = 'column_delete',
  COLUMN_MOVE = 'column_move',
  ROW_ADD = 'row_add',
  ROW_UPDATE = 'row_update',
  ROW_DELETE = 'row_delete',
  ROW_SORT = 'row_sort'
}

/**
 * 变更记录接口
 */
export interface Change {
  type: ChangeType;
  sheetName: string;
  details: any;
  timestamp: number;
}

/**
 * 差异结果接口
 */
export interface DiffResult {
  cellChanges: {
    added: any[];
    modified: { old: any; new: any }[];
    deleted: any[];
  };
  structureChanges: {
    columns: {
      added: ColumnMetadata[];
      modified: { old: ColumnMetadata; new: ColumnMetadata }[];
      deleted: ColumnMetadata[];
      moved: { column: ColumnMetadata; oldIndex: number; newIndex: number }[];
    };
    rows: {
      added: RowMetadata[];
      modified: { old: RowMetadata; new: RowMetadata }[];
      deleted: RowMetadata[];
      sorted: { oldOrder: string[]; newOrder: string[] };
    };
  };
}

/**
 * 冲突类型接口
 */
export interface CellConflict {
  position: string;
  base?: any;
  current?: any;
  target?: any;
}

export interface StructureConflict {
  type: 'column' | 'row';
  id: string;
  base?: ColumnMetadata;
  current?: ColumnMetadata;
  target?: ColumnMetadata;
}

/**
 * 排序条件接口
 */
export interface SortCriteria {
  columnId: string;
  ascending: boolean;
}
