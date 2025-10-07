import { ObjectType } from '../types';
import { TableStructure } from './structure';
import { calculateHash } from '../utils/hash';
import { formatPosition, parsePosition } from '../utils/hash';

/**
 * 工作表树对象 - 管理单个工作表的数据和结构
 */
export class SheetTree {
  public readonly type = ObjectType.SHEET;
  public name: string;
  public cells: Map<string, string>;  // "row,col" -> cell_hash
  public structure: TableStructure;
  public hash: string;

  constructor(name: string) {
    this.name = name;
    this.cells = new Map();
    this.structure = new TableStructure();
    this.hash = this.calculateHash();
  }

  /**
   * 设置单元格哈希
   */
  setCellHash(row: number, col: number, hash: string): void {
    const key = formatPosition(row, col);
    this.cells.set(key, hash);
    this.updateHash();
  }

  /**
   * 获取单元格哈希
   */
  getCellHash(row: number, col: number): string | undefined {
    const key = formatPosition(row, col);
    return this.cells.get(key);
  }

  /**
   * 删除单元格
   */
  deleteCell(row: number, col: number): boolean {
    const key = formatPosition(row, col);
    const deleted = this.cells.delete(key);
    if (deleted) {
      this.updateHash();
    }
    return deleted;
  }

  /**
   * 获取所有单元格位置
   */
  getAllCellPositions(): { row: number; col: number }[] {
    return Array.from(this.cells.keys()).map(key => parsePosition(key));
  }

  /**
   * 获取指定区域的单元格
   */
  getCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number): Map<string, string> {
    const result = new Map<string, string>();
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const hash = this.getCellHash(row, col);
        if (hash) {
          result.set(formatPosition(row, col), hash);
        }
      }
    }
    
    return result;
  }

  /**
   * 清空所有单元格
   */
  clearAllCells(): void {
    this.cells.clear();
    this.updateHash();
  }

  /**
   * 获取工作表边界
   */
  getBounds(): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
    if (this.cells.size === 0) {
      return null;
    }

    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    for (const key of this.cells.keys()) {
      const { row, col } = parsePosition(key);
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    }

    return { minRow, maxRow, minCol, maxCol };
  }

  /**
   * 插入行（在指定行之前插入）
   */
  insertRowBefore(targetRow: number): void {
    const newCells = new Map<string, string>();
    
    for (const [key, hash] of this.cells) {
      const { row, col } = parsePosition(key);
      const newRow = row >= targetRow ? row + 1 : row;
      newCells.set(formatPosition(newRow, col), hash);
    }
    
    this.cells = newCells;
    this.updateHash();
  }

  /**
   * 插入列（在指定列之前插入）
   */
  insertColumnBefore(targetCol: number): void {
    const newCells = new Map<string, string>();
    
    for (const [key, hash] of this.cells) {
      const { row, col } = parsePosition(key);
      const newCol = col >= targetCol ? col + 1 : col;
      newCells.set(formatPosition(row, newCol), hash);
    }
    
    this.cells = newCells;
    this.updateHash();
  }

  /**
   * 删除行
   */
  deleteRow(targetRow: number): void {
    const newCells = new Map<string, string>();
    
    for (const [key, hash] of this.cells) {
      const { row, col } = parsePosition(key);
      if (row === targetRow) {
        continue; // 跳过要删除的行
      }
      const newRow = row > targetRow ? row - 1 : row;
      newCells.set(formatPosition(newRow, col), hash);
    }
    
    this.cells = newCells;
    this.updateHash();
  }

  /**
   * 删除列
   */
  deleteColumn(targetCol: number): void {
    const newCells = new Map<string, string>();
    
    for (const [key, hash] of this.cells) {
      const { row, col } = parsePosition(key);
      if (col === targetCol) {
        continue; // 跳过要删除的列
      }
      const newCol = col > targetCol ? col - 1 : col;
      newCells.set(formatPosition(row, newCol), hash);
    }
    
    this.cells = newCells;
    this.updateHash();
  }

  private updateHash(): void {
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    return calculateHash({
      type: this.type,
      name: this.name,
      cells: Array.from(this.cells.entries()),
      structure: this.structure.hash
    });
  }

  /**
   * 克隆工作表
   */
  clone(): SheetTree {
    const cloned = new SheetTree(this.name);
    cloned.cells = new Map(this.cells);
    cloned.structure = this.structure.clone();
    cloned.updateHash();
    return cloned;
  }

  /**
   * 重命名工作表
   */
  rename(newName: string): void {
    this.name = newName;
    this.updateHash();
  }

  /**
   * 转换为JSON
   */
  toJSON(): any {
    return {
      type: this.type,
      name: this.name,
      cells: Array.from(this.cells.entries()),
      structure: this.structure.toJSON(),
      hash: this.hash
    };
  }

  /**
   * 从JSON创建对象
   */
  static fromJSON(json: any): SheetTree {
    const sheet = new SheetTree(json.name);
    sheet.cells = new Map(json.cells);
    sheet.structure = TableStructure.fromJSON(json.structure);
    sheet.updateHash();
    return sheet;
  }
}
