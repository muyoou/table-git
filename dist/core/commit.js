"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitObject = void 0;
const types_1 = require("../types");
const hash_1 = require("../utils/hash");
/**
 * 提交对象 - 表示一次提交的完整信息
 */
class CommitObject {
    constructor(tree, message, author, email, parent) {
        this.type = types_1.ObjectType.COMMIT;
        this.tree = tree;
        this.message = message;
        this.author = author;
        this.email = email;
        this.parent = parent;
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
    }
    calculateHash() {
        return (0, hash_1.calculateHash)({
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
    isInitialCommit() {
        return this.parent === undefined || this.parent === '';
    }
    /**
     * 获取简短哈希
     */
    getShortHash() {
        return this.hash.substring(0, 7);
    }
    /**
     * 格式化提交信息
     */
    format() {
        const date = new Date(this.timestamp).toLocaleString();
        return `${this.getShortHash()} ${this.message}\nAuthor: ${this.author} <${this.email}>\nDate: ${date}`;
    }
    /**
     * 转换为JSON
     */
    toJSON() {
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
    static fromJSON(json) {
        const commit = new CommitObject(json.tree, json.message, json.author, json.email, json.parent);
        commit.timestamp = json.timestamp;
        commit.hash = json.hash;
        return commit;
    }
}
exports.CommitObject = CommitObject;
//# sourceMappingURL=commit.js.map