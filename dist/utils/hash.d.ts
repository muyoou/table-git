/**
 * 计算对象的SHA1哈希值
 * @param obj 要计算哈希的对象
 * @returns SHA1哈希字符串
 */
export declare function calculateHash(obj: any): string;
/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID字符串
 */
export declare function generateId(prefix?: string): string;
/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 比较两个对象是否相等
 * @param obj1 对象1
 * @param obj2 对象2
 * @returns 是否相等
 */
export declare function deepEqual(obj1: any, obj2: any): boolean;
/**
 * 解析单元格位置字符串
 * @param position 位置字符串 "row,col"
 * @returns 行列数字
 */
export declare function parsePosition(position: string): {
    row: number;
    col: number;
};
/**
 * 格式化单元格位置
 * @param row 行号
 * @param col 列号
 * @returns 位置字符串
 */
export declare function formatPosition(row: number, col: number): string;
//# sourceMappingURL=hash.d.ts.map