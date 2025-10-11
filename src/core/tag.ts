import { ObjectType } from '../types';
import { calculateHash } from '../utils/hash';

/**
 * 标签对象 - 表示一个 Git 风格的标签
 */
export class TagObject {
  public readonly type = ObjectType.TAG;
  public readonly name: string;
  public readonly target: string;
  public readonly message?: string;
  public readonly author?: string;
  public readonly email?: string;
  public readonly timestamp: number;
  public hash: string;

  constructor(name: string, target: string, options?: { message?: string; author?: string; email?: string; timestamp?: number }) {
    this.name = name;
    this.target = target;
    this.message = options?.message;
    this.author = options?.author;
    this.email = options?.email;
    this.timestamp = options?.timestamp ?? Date.now();
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    return calculateHash({
      type: this.type,
      name: this.name,
      target: this.target,
      message: this.message,
      author: this.author,
      email: this.email,
      timestamp: this.timestamp
    });
  }

  getShortHash(): string {
    return this.hash.substring(0, 7);
  }

  format(): string {
    const date = new Date(this.timestamp).toLocaleString();
    const header = `${this.name} -> ${this.target.substring(0, 7)}`;
    if (!this.message) {
      return `${header}\nDate: ${date}`;
    }

    const authorLine = this.author ? `Author: ${this.author}${this.email ? ` <${this.email}>` : ''}` : undefined;
    return [header, authorLine, `Date: ${date}`, '', this.message].filter(Boolean).join('\n');
  }

  toJSON(): any {
    return {
      type: this.type,
      name: this.name,
      target: this.target,
      message: this.message,
      author: this.author,
      email: this.email,
      timestamp: this.timestamp,
      hash: this.hash
    };
  }

  static fromJSON(json: any): TagObject {
    const tag = new TagObject(json.name, json.target, {
      message: json.message,
      author: json.author,
      email: json.email,
      timestamp: json.timestamp
    });
    tag.hash = json.hash;
    return tag;
  }
}
