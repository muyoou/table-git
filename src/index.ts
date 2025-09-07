// 核心类导出
export { CellObject } from './core/cell';
export { TableStructure } from './core/structure';
export { SheetTree } from './core/sheet';
export { CommitObject } from './core/commit';
export { TableGit } from './core/table-git';
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
