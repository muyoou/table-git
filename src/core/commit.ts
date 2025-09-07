import { ObjectType } from '../types';
import { calculateHash } from '../utils/hash';

/**
 * 提交对象 - 表示一次提交的完整信息
 */
export class CommitObject {
  public readonly type = ObjectType.COMMIT;
  public tree: string;  // 指向根树对象的哈希
  public parent?: string;  // 父提交哈希
  public author: string;
  public email: string;
  public message: string;
  public timestamp: number;
  public hash: string;

  constructor(tree: string, message: string, author: string, email: string, parent?: string) {
    this.tree = tree;
    this.message = message;
    this.author = author;
    this.email = email;
    this.parent = parent;
    this.timestamp = Date.now();
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    return calculateHash({
      type: this.type,
      tree: this.tree,
      parent: this.parent,
      author: this.author,
      email: this.email,
      message: this.message,
      timestamp: this.timestamp
    });
  }

  /**
   * 检查是否为初始提交
   */
  isInitialCommit(): boolean {
    return this.parent === undefined || this.parent === '';
  }

  /**
   * 获取简短哈希
   */
  getShortHash(): string {
    return this.hash.substring(0, 7);
  }

  /**
   * 格式化提交信息
   */
  format(): string {
    const date = new Date(this.timestamp).toLocaleString();
    return `${this.getShortHash()} ${this.message}\nAuthor: ${this.author} <${this.email}>\nDate: ${date}`;
  }

  /**
   * 转换为JSON
   */
  toJSON(): any {
    return {
      type: this.type,
      tree: this.tree,
      parent: this.parent,
      author: this.author,
      email: this.email,
      message: this.message,
      timestamp: this.timestamp,
      hash: this.hash
    };
  }

  /**
   * 从JSON创建对象
   */
  static fromJSON(json: any): CommitObject {
    const commit = new CommitObject(
      json.tree,
      json.message,
      json.author,
      json.email,
      json.parent
    );
    commit.timestamp = json.timestamp;
    commit.hash = json.hash;
    return commit;
  }
}
