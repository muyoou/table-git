import { Change } from '../types';

export interface UndoEntry {
  forward: Change;
  inverse: Change | Change[];
}

/**
 * 极简撤销栈：后续会与 TableGit 集成，当前仅提供记录与弹出能力。
 */
export class UndoManager {
  private stack: UndoEntry[] = [];

  record(entry: UndoEntry): void {
    this.stack.push(entry);
  }

  canUndo(): boolean {
    return this.stack.length > 0;
  }

  peek(): UndoEntry | undefined {
    return this.stack[this.stack.length - 1];
  }

  pop(): UndoEntry | undefined {
    return this.stack.pop();
  }

  clear(): void {
    this.stack = [];
  }
}
