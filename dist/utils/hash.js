"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHash = calculateHash;
exports.generateId = generateId;
exports.deepClone = deepClone;
exports.deepEqual = deepEqual;
exports.parsePosition = parsePosition;
exports.formatPosition = formatPosition;
const crypto = __importStar(require("crypto"));
/**
 * 计算对象的SHA1哈希值
 * @param obj 要计算哈希的对象
 * @returns SHA1哈希字符串
 */
function calculateHash(obj) {
    const content = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('sha1').update(content).digest('hex');
}
/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID字符串
 */
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}_${random}`;
}
/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * 比较两个对象是否相等
 * @param obj1 对象1
 * @param obj2 对象2
 * @returns 是否相等
 */
function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1, Object.keys(obj1).sort()) ===
        JSON.stringify(obj2, Object.keys(obj2).sort());
}
/**
 * 解析单元格位置字符串
 * @param position 位置字符串 "row,col"
 * @returns 行列数字
 */
function parsePosition(position) {
    const [row, col] = position.split(',').map(Number);
    return { row, col };
}
/**
 * 格式化单元格位置
 * @param row 行号
 * @param col 列号
 * @returns 位置字符串
 */
function formatPosition(row, col) {
    return `${row},${col}`;
}
//# sourceMappingURL=hash.js.map