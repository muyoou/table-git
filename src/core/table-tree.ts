import { ObjectType } from '../types';
import { calculateHash, deepClone } from '../utils/hash';

interface SheetEntry {
  name: string;
  hash: string;
  order: number;
  meta?: Record<string, unknown>;
}

/**
 * 表级树对象：管理仓库中所有工作表及其快照哈希
 */
export class TableTree {
  public readonly type = ObjectType.TABLE;
  private sheetMap: Map<string, SheetEntry>;
  private sheetOrder: string[];
  public hash: string;

  constructor(entries?: SheetEntry[]) {
    this.sheetMap = new Map();
    this.sheetOrder = [];

    if (entries) {
      entries.forEach(entry => {
        this.sheetMap.set(entry.name, deepClone(entry));
        this.sheetOrder.push(entry.name);
      });
    }

    this.hash = this.calculateHash();
  }

  /**
   * 新增或更新工作表
   */
  upsertSheet(name: string, hash: string, options?: { order?: number; meta?: Record<string, unknown> }): void {
    const existing = this.sheetMap.get(name);
    const order = options?.order ?? existing?.order ?? this.sheetOrder.length;

    const entry: SheetEntry = {
      name,
      hash,
      order,
      meta: options?.meta ? deepClone(options.meta) : existing?.meta ? deepClone(existing.meta) : undefined
    };

    this.sheetMap.set(name, entry);

    if (!existing) {
      this.sheetOrder.push(name);
    }

    this.normalizeOrder();
    this.updateHash();
  }

  /**
   * 获取工作表哈希
   */
  getSheetHash(name: string): string | undefined {
    return this.sheetMap.get(name)?.hash;
  }

  /**
   * 判断工作表是否存在
   */
  hasSheet(name: string): boolean {
    return this.sheetMap.has(name);
  }

  /**
   * 删除工作表
   */
  removeSheet(name: string): boolean {
    const removed = this.sheetMap.delete(name);
    if (removed) {
      this.sheetOrder = this.sheetOrder.filter(sheet => sheet !== name);
      this.normalizeOrder();
      this.updateHash();
    }
    return removed;
  }

  /**
   * 重命名工作表
   */
  renameSheet(oldName: string, newName: string): boolean {
    if (!this.sheetMap.has(oldName) || this.sheetMap.has(newName)) {
      return false;
    }

    const entry = this.sheetMap.get(oldName);
    if (!entry) {
      return false;
    }

    const newEntry: SheetEntry = {
      ...deepClone(entry),
      name: newName
    };

    this.sheetMap.delete(oldName);
    this.sheetMap.set(newName, newEntry);

    this.sheetOrder = this.sheetOrder.map(sheet => (sheet === oldName ? newName : sheet));
    this.updateHash();
    return true;
  }

  /**
   * 调整工作表顺序
   */
  moveSheet(name: string, newIndex: number): boolean {
    const currentIndex = this.sheetOrder.indexOf(name);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= this.sheetOrder.length) {
      return false;
    }

    this.sheetOrder.splice(currentIndex, 1);
    this.sheetOrder.splice(newIndex, 0, name);
    this.normalizeOrder();
    this.updateHash();
    return true;
  }

  /**
   * 获取所有工作表名称（按顺序）
   */
  getSheetNames(): string[] {
    return [...this.sheetOrder];
  }

  /**
   * 获取完整条目（用于内部操作）
   */
  getSheetEntries(): Map<string, SheetEntry> {
    return new Map(this.sheetMap);
  }

  /**
   * 克隆表树
   */
  clone(): TableTree {
    return new TableTree(this.sheetOrder.map(name => deepClone(this.sheetMap.get(name) as SheetEntry)));
  }

  /**
   * 序列化
   */
  toJSON(): any {
    const entries = this.sheetOrder.map(name => deepClone(this.sheetMap.get(name) as SheetEntry));
    return {
      type: this.type,
      sheets: entries,
      hash: this.hash
    };
  }

  /**
   * 反序列化
   */
  static fromJSON(json: any): TableTree {
    return new TableTree(json.sheets);
  }

  private normalizeOrder(): void {
    this.sheetOrder = this.sheetOrder.filter(name => this.sheetMap.has(name));
    this.sheetOrder.forEach((name, index) => {
      const entry = this.sheetMap.get(name);
      if (entry) {
        entry.order = index;
      }
    });
  }

  private updateHash(): void {
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    const sortedEntries = this.sheetOrder.map(name => this.sheetMap.get(name)).filter(Boolean) as SheetEntry[];
    return calculateHash({
      type: this.type,
      sheets: sortedEntries.map(entry => ({
        name: entry.name,
        hash: entry.hash,
        order: entry.order,
        meta: entry.meta
      }))
    });
  }
}
