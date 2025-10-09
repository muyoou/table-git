// 核心类导出
export { CellObject } from './core/cell';
export { TableStructure } from './core/structure';
export { SheetTree } from './core/sheet';
export { TableTree } from './core/table-tree';
export { CommitObject } from './core/commit';
export { TableGit } from './core/table-git';
export { UndoManager } from './core/undo-manager';
export { DiffMergeEngine } from './core/diff-merge';
export { ConflictResolver } from './core/conflict-resolver';

// 类型导出
export * from './types';

// 工具函数导出
export { 
  calculateHash,
  generateId,
  deepClone,
  deepEqual,
  parsePosition,
  formatPosition
} from './utils/hash';

// 便利函数
export { 
  createTableGit, 
  createCell, 
  createColumn, 
  createRow,
  createSampleTable
} from './utils/factory';

// 格式化器（函数式）导出
export type { TableData, FormatterFunction } from './formatters/types';
export { TableDataAdapter } from './formatters/adapter';
export { FunctionFormatter, FormatterRegistry } from './formatters/function-formatter';
export { csvFormatter, jsonFormatter, htmlFormatter } from './formatters/builtin';
