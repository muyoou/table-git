import { TableGit } from '../core/table-git';
import { SheetTree } from '../core/sheet';
import { TableData } from './types';
import { parsePosition } from '../utils/hash';

// 将仓库当前工作区的数据转换成统一的 TableData
export class TableDataAdapter {
  constructor(private readonly repo: TableGit, private readonly sheetName: string = 'default') {}

  /**
   * 构建统一数据
   * @param source 可选：从其他分支或指定提交预览（不需要 checkout）
   */
  build(source?: { branch?: string; commit?: string }): TableData {
    const sheet: SheetTree | undefined = source
      ? this.repo.getTreeSnapshot(source)
      : this.repo.getPreviewTree({ includeStaged: true });
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
          // 直接通过对象存储还原值：由于 TableGit.getCell 读取的是当前工作区，
          // 当我们做历史/分支预览时应从快照 tree 中反查 cell 对象。
          const cell = this.repo.getCellFromTree(sheet, r, c);
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
