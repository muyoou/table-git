import { ObjectType } from '../types';
/**
 * 提交对象 - 表示一次提交的完整信息
 */
export declare class CommitObject {
    readonly type = ObjectType.COMMIT;
    tree: string;
    parent?: string;
    author: string;
    email: string;
    message: string;
    timestamp: number;
    hash: string;
    constructor(tree: string, message: string, author: string, email: string, parent?: string);
    private calculateHash;
    /**
     * 检查是否为初始提交
     */
    isInitialCommit(): boolean;
    /**
     * 获取简短哈希
     */
    getShortHash(): string;
    /**
     * 格式化提交信息
     */
    format(): string;
    /**
     * 转换为JSON
     */
    toJSON(): any;
    /**
     * 从JSON创建对象
     */
    static fromJSON(json: any): CommitObject;
}
//# sourceMappingURL=commit.d.ts.map