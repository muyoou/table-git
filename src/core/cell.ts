import { ObjectType, CellValue, CellFormat } from '../types';
import { calculateHash } from '../utils/hash';

/**
 * 单元格对象 - 最小存储粒度
 */
export class CellObject {
  public readonly type = ObjectType.CELL;
  public row: number;
  public column: number;
  public value: CellValue;
  public formula?: string;
  public format?: CellFormat;
  public hash: string;

  constructor(row: number, column: number, value: CellValue, formula?: string, format?: CellFormat) {
    this.row = row;
    this.column = column;
    this.value = value;
    this.formula = formula;
    this.format = format;
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    return calculateHash({
      type: this.type,
      row: this.row,
      column: this.column,
      value: this.value,
      formula: this.formula,
      format: this.format
    });
  }

  /**
   * 更新单元格值
   */
  updateValue(value: CellValue, formula?: string, format?: CellFormat): CellObject {
    return new CellObject(this.row, this.column, value, formula, format);
  }

  /**
   * 检查是否为空单元格
   */
  isEmpty(): boolean {
    return this.value === null || this.value === undefined || this.value === '';
  }

  /**
   * 转换为JSON
   */
  toJSON(): any {
    return {
      type: this.type,
      row: this.row,
      column: this.column,
      value: this.value,
      formula: this.formula,
      format: this.format,
      hash: this.hash
    };
  }

  /**
   * 从JSON创建对象
   */
  static fromJSON(json: any): CellObject {
    return new CellObject(
      json.row,
      json.column,
      json.value,
      json.formula,
      json.format
    );
  }
}
