import sha1 from 'js-sha1';

/**
 * 计算对象的SHA1哈希值
 * @param obj 要计算哈希的对象
 * @returns SHA1哈希字符串
 */
export function calculateHash(obj: any): string {
  const content = JSON.stringify(obj, Object.keys(obj).sort());
  return sha1(content);
}

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID字符串
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}_${random}`;
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 比较两个对象是否相等
 * @param obj1 对象1
 * @param obj2 对象2
 * @returns 是否相等
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1, Object.keys(obj1).sort()) === 
         JSON.stringify(obj2, Object.keys(obj2).sort());
}

/**
 * 解析单元格位置字符串
 * @param position 位置字符串 "row,col"
 * @returns 行列数字
 */
export function parsePosition(position: string): { row: number; col: number } {
  const [row, col] = position.split(',').map(Number);
  return { row, col };
}

/**
 * 格式化单元格位置
 * @param row 行号
 * @param col 列号
 * @returns 位置字符串
 */
export function formatPosition(row: number, col: number): string {
  return `${row},${col}`;
}
