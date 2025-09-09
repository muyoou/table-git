import { TableGit } from '../core/table-git';
import { SheetTree } from '../core/sheet';
import { TableData } from './types';
import { parsePosition } from '../utils/hash';

// 将仓库当前工作区的数据转换成统一的 TableData
export class TableDataAdapter {
  constructor(private readonly repo: TableGit, private readonly sheetName: string = 'default') {}

  build(): TableData {
    const sheet: SheetTree | undefined = this.repo.getWorkingTree();
    if (!sheet) {
      return { header: [], rows: [], matrix: [], minRow: 0, minCol: 0, maxRow: -1, maxCol: -1 };
    }

    // 计算边界
    const bounds = sheet.getBounds();
    if (!bounds) {
      return { header: [], rows: [], matrix: [], minRow: 0, minCol: 0, maxRow: -1, maxCol: -1 };
    }

    const { minRow, minCol, maxRow, maxCol } = bounds;

    // 构造矩阵
    const matrix: any[][] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row: any[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const hash = sheet.getCellHash(r, c);
        if (!hash) {
          row.push(undefined);
        } else {
          // 使用 repo.getCell 取得值
          const cell = this.repo.getCell(r, c);
          row.push(cell ? cell.value : undefined);
        }
      }
      matrix.push(row);
    }

    const header = (minRow === 0 && matrix.length > 0) ? (matrix[0] as any[]) : [];
    const rows = (minRow === 0) ? matrix.slice(1) : matrix;

    return { header, rows, matrix, minRow, minCol, maxRow, maxCol };
  }
}
