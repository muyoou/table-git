import { TableGit } from '../core/table-git';
import { TableData } from './types';

type OrderedEntry<T extends { order: number }> = {
  id: string;
  meta: T;
  order: number;
};

// 将仓库当前工作区的数据转换成统一的 TableData
export class TableDataAdapter {
  constructor(private readonly repo: TableGit, private readonly sheetName: string = 'default') {}

  /**
   * 构建统一数据
   * @param source 可选：从其他分支或指定提交预览（不需要 checkout）
   */
  build(source?: { branch?: string; commit?: string }): TableData {
    const sheet = source
      ? this.repo.getSheetSnapshot(this.sheetName, source)
      : this.repo.getPreviewSheet(this.sheetName, { includeStaged: true });
    if (!sheet) {
      return this.empty();
    }

    const structure = sheet.structure;

    const columnEntries = this.getOrderedEntries(structure.getColumnIds(), (id) => structure.getColumn(id));
    const rowEntries = this.getOrderedEntries(structure.getRowIds(), (id) => structure.getRow(id));

    // 当结构缺失时回退到旧的边界算法
    const useStructureColumns = columnEntries.length > 0;
    const useStructureRows = rowEntries.length > 0;

    let minRow = Number.POSITIVE_INFINITY;
    let maxRow = Number.NEGATIVE_INFINITY;
    let minCol = Number.POSITIVE_INFINITY;
    let maxCol = Number.NEGATIVE_INFINITY;

    const orderedCols = useStructureColumns
      ? columnEntries
      : this.buildFallbackEntries(sheet, 'col');
    const orderedRows = useStructureRows
      ? rowEntries
      : this.buildFallbackEntries(sheet, 'row');

    if (!orderedCols.length || !orderedRows.length) {
      // 没有结构也没有有效边界，返回空
      return this.empty();
    }

    const matrix: any[][] = [];
    orderedRows.forEach((rowEntry, rowIndex) => {
      const row: any[] = [];
      const rowPos = rowEntry.order;
      minRow = Math.min(minRow, rowPos);
      maxRow = Math.max(maxRow, rowPos);

      orderedCols.forEach((colEntry) => {
        const colPos = colEntry.order;
        minCol = Math.min(minCol, colPos);
        maxCol = Math.max(maxCol, colPos);

        const hash = sheet.getCellHash(rowPos, colPos);
        if (!hash) {
          row.push(undefined);
          return;
        }

        const cell = this.repo.getCellFromTree(sheet, rowPos, colPos);
        row.push(cell ? cell.value : undefined);
      });

      matrix[rowIndex] = row;
    });

    if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) {
      return this.empty();
    }

    const header = (minRow === 0 && matrix.length > 0) ? (matrix[0] as any[]) : [];
    const rows = (minRow === 0) ? matrix.slice(1) : matrix;

    return { header, rows, matrix, minRow, minCol, maxRow, maxCol };
  }

  private empty(): TableData {
    return { header: [], rows: [], matrix: [], minRow: 0, minCol: 0, maxRow: -1, maxCol: -1 };
  }

  private getOrderedEntries<T extends { order: number } | undefined>(
    ids: string[],
    resolver: (id: string) => T
  ): OrderedEntry<Exclude<T, undefined>>[] {
    return ids
      .map((id, index) => {
        const meta = resolver(id);
        if (!meta || typeof (meta as any).order !== 'number') {
          return null;
        }
        return { id, meta: meta as Exclude<T, undefined>, order: (meta as any).order ?? index };
      })
      .filter((entry): entry is OrderedEntry<Exclude<T, undefined>> => entry !== null)
      .sort((a, b) => a.order - b.order);
  }

  private buildFallbackEntries(sheet: any, axis: 'row' | 'col'): OrderedEntry<{ order: number }>[] {
    const bounds = sheet.getBounds();
    if (!bounds) return [];

    const { minRow, minCol, maxRow, maxCol } = bounds;
    if (axis === 'row') {
      const entries: OrderedEntry<{ order: number }>[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        entries.push({ id: `__row_${r}`, meta: { order: r }, order: r });
      }
      return entries;
    }

    const entries: OrderedEntry<{ order: number }>[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      entries.push({ id: `__col_${c}`, meta: { order: c }, order: c });
    }
    return entries;
  }
}
