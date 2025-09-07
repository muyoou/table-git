import { TableGit } from '../src/core/table-git';
import { createTableGit, createColumn, createCell } from '../src/index';

describe('TableGit 基础功能测试', () => {
  let repo: TableGit;

  beforeEach(() => {
    repo = createTableGit();
  });

  test('应该能够初始化仓库', () => {
    expect(repo.getCurrentBranch()).toBe('main');
    expect(repo.getBranches()).toContain('main');
  });

  test('应该能够添加和提交单元格变更', () => {
    // 添加单元格
    repo.addCellChange('Sheet1', 1, 1, 'Hello');
    repo.addCellChange('Sheet1', 1, 2, 'World');
    
    // 检查暂存区
    expect(repo.getStagedChanges()).toHaveLength(2);
    
    // 提交
    const commitHash = repo.commit('添加测试数据', 'Test User', 'test@example.com');
    expect(commitHash).toBeDefined();
    expect(repo.getStagedChanges()).toHaveLength(0);
  });

  test('应该能够添加和管理列结构', () => {
    const column = createColumn('测试列', {
      dataType: 'string',
      width: 150,
      constraints: { required: true }
    });
    
    repo.addColumn('Sheet1', column);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.columns.has(column.id)).toBe(true);
  });

  test('应该能够创建和切换分支', () => {
    // 先添加一些数据
    repo.addCellChange('Sheet1', 1, 1, 'Original');
    repo.commit('初始提交', 'Test User', 'test@example.com');
    
    // 创建分支
    repo.createBranch('feature');
    repo.checkout('feature');
    
    expect(repo.getCurrentBranch()).toBe('feature');
    expect(repo.getBranches()).toContain('feature');
  });

  test('应该能够获取单元格值', () => {
    repo.addCellChange('Sheet1', 1, 1, 'Test Value');
    repo.commit('添加测试值', 'Test User', 'test@example.com');
    
    const value = repo.getCellValue(1, 1);
    expect(value).toBe('Test Value');
  });

  test('应该能够删除单元格', () => {
    // 先添加单元格
    repo.addCellChange('Sheet1', 1, 1, 'To Delete');
    repo.commit('添加要删除的单元格', 'Test User', 'test@example.com');
    
    // 删除单元格
    repo.deleteCellChange('Sheet1', 1, 1);
    repo.commit('删除单元格', 'Test User', 'test@example.com');
    
    const value = repo.getCellValue(1, 1);
    expect(value).toBeUndefined();
  });

  test('应该能够获取提交历史', () => {
    repo.addCellChange('Sheet1', 1, 1, 'First');
    repo.commit('第一次提交', 'Test User', 'test@example.com');
    
    repo.addCellChange('Sheet1', 1, 2, 'Second');
    repo.commit('第二次提交', 'Test User', 'test@example.com');
    
    const history = repo.getCommitHistory();
    expect(history).toHaveLength(3); // 包括初始提交
    expect(history[0].message).toBe('第二次提交');
    expect(history[1].message).toBe('第一次提交');
  });

  test('应该能够重置暂存区', () => {
    repo.addCellChange('Sheet1', 1, 1, 'Staged');
    expect(repo.getStagedChanges()).toHaveLength(1);
    
    repo.reset();
    expect(repo.getStagedChanges()).toHaveLength(0);
  });

  test('应该能够checkout到指定的提交历史', () => {
    // 创建第一个提交
    repo.addCellChange('Sheet1', 1, 1, 'Version 1');
    const commit1 = repo.commit('第一版本', 'Test User', 'test@example.com');
    
    // 创建第二个提交
    repo.addCellChange('Sheet1', 1, 1, 'Version 2');
    repo.addCellChange('Sheet1', 1, 2, 'New Data');
    const commit2 = repo.commit('第二版本', 'Test User', 'test@example.com');
    
    // 创建第三个提交
    repo.addCellChange('Sheet1', 2, 1, 'More Data');
    const commit3 = repo.commit('第三版本', 'Test User', 'test@example.com');
    
    // 验证当前状态
    expect(repo.getCellValue(1, 1)).toBe('Version 2');
    expect(repo.getCellValue(1, 2)).toBe('New Data');
    expect(repo.getCellValue(2, 1)).toBe('More Data');
    
    // Checkout到第一个提交
    repo.checkout(commit1);
    expect(repo.isDetachedHead()).toBe(true);
    expect(repo.getCurrentCommitHash()).toBe(commit1);
    expect(repo.getCellValue(1, 1)).toBe('Version 1');
    expect(repo.getCellValue(1, 2)).toBeUndefined(); // 这个值在第一个提交中不存在
    expect(repo.getCellValue(2, 1)).toBeUndefined(); // 这个值在第一个提交中不存在
    
    // Checkout到第二个提交
    repo.checkout(commit2);
    expect(repo.isDetachedHead()).toBe(true);
    expect(repo.getCurrentCommitHash()).toBe(commit2);
    expect(repo.getCellValue(1, 1)).toBe('Version 2');
    expect(repo.getCellValue(1, 2)).toBe('New Data');
    expect(repo.getCellValue(2, 1)).toBeUndefined(); // 这个值在第二个提交中不存在
    
    // 切换回主分支
    repo.checkout('main');
    expect(repo.isDetachedHead()).toBe(false);
    expect(repo.getCurrentBranch()).toBe('main');
    expect(repo.getCellValue(1, 1)).toBe('Version 2');
    expect(repo.getCellValue(1, 2)).toBe('New Data');
    expect(repo.getCellValue(2, 1)).toBe('More Data');
  });

  test('checkout到不存在的提交应该抛出错误', () => {
    expect(() => {
      repo.checkout('nonexistent-commit-hash');
    }).toThrow("Branch or commit 'nonexistent-commit-hash' does not exist");
  });

  test('有未提交变更时不能checkout', () => {
    repo.addCellChange('Sheet1', 1, 1, 'Uncommitted');
    
    expect(() => {
      repo.checkout('main');
    }).toThrow('Cannot checkout: you have unstaged changes');
  });
});

describe('表格结构操作测试', () => {
  let repo: TableGit;

  beforeEach(() => {
    repo = createTableGit();
  });

  test('应该能够移动列位置', () => {
    const col1 = createColumn('列1', { order: 0 });
    const col2 = createColumn('列2', { order: 1 });
    const col3 = createColumn('列3', { order: 2 });
    
    repo.addColumn('Sheet1', col1);
    repo.addColumn('Sheet1', col2);
    repo.addColumn('Sheet1', col3);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
    // 移动第一列到最后
    repo.moveColumn('Sheet1', col1.id, 2);
    repo.commit('移动列', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    const columnOrder = workingTree?.structure.getColumnIds();
    expect(columnOrder?.[2]).toBe(col1.id);
  });

  test('应该能够更新列信息', () => {
    const column = createColumn('原始名称');
    
    repo.addColumn('Sheet1', column);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
    repo.updateColumn('Sheet1', column.id, { name: '更新后的名称' });
    repo.commit('更新列名', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    const updatedColumn = workingTree?.structure.getColumn(column.id);
    expect(updatedColumn?.name).toBe('更新后的名称');
  });

  test('应该能够删除列', () => {
    const column = createColumn('要删除的列');
    
    repo.addColumn('Sheet1', column);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
    repo.deleteColumn('Sheet1', column.id);
    repo.commit('删除列', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.columns.has(column.id)).toBe(false);
  });

  test('应该能够添加和删除行', () => {
    const row1 = { id: 'row_1', height: 25, hidden: false, order: 0 };
    const row2 = { id: 'row_2', height: 30, hidden: false, order: 1 };
    
    repo.addRow('Sheet1', row1);
    repo.addRow('Sheet1', row2);
    repo.commit('添加行', 'Test User', 'test@example.com');
    
    let workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.rows.has('row_1')).toBe(true);
    expect(workingTree?.structure.rows.has('row_2')).toBe(true);
    
    // 删除一行
    repo.deleteRow('Sheet1', 'row_1');
    repo.commit('删除行', 'Test User', 'test@example.com');
    
    workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.rows.has('row_1')).toBe(false);
    expect(workingTree?.structure.rows.has('row_2')).toBe(true);
  });
});

describe('单元格格式测试', () => {
  let repo: TableGit;

  beforeEach(() => {
    repo = createTableGit();
  });

  test('应该能够保存和获取单元格格式', () => {
    const format = {
      fontWeight: 'bold' as const,
      textColor: '#FF0000',
      backgroundColor: '#FFFF00'
    };
    
    repo.addCellChange('Sheet1', 1, 1, 'Formatted Text', undefined, format);
    repo.commit('添加格式化文本', 'Test User', 'test@example.com');
    
    const cell = repo.getCell(1, 1);
    expect(cell?.format?.fontWeight).toBe('bold');
    expect(cell?.format?.textColor).toBe('#FF0000');
    expect(cell?.format?.backgroundColor).toBe('#FFFF00');
  });

  test('应该能够保存公式', () => {
    repo.addCellChange('Sheet1', 1, 1, 10);
    repo.addCellChange('Sheet1', 1, 2, 20);
    repo.addCellChange('Sheet1', 1, 3, 30, '=A1+B1');
    
    repo.commit('添加公式', 'Test User', 'test@example.com');
    
    const cell = repo.getCell(1, 3);
    expect(cell?.formula).toBe('=A1+B1');
    expect(cell?.value).toBe(30);
  });
});
