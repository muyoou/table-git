import { TableGit } from '../src/core/table-git';
import { DiffMergeEngine } from '../src/core/diff-merge';
import { createTableGit, createColumn } from '../src/index';

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
  repo.addCellChange('default', 1, 1, 'Hello');
  repo.addCellChange('default', 1, 2, 'World');
    
    // 检查暂存区
    expect(repo.getStagedChanges()).toHaveLength(2);
    
    // 提交
    const commitHash = repo.commit('添加测试数据', 'Test User', 'test@example.com');
    expect(commitHash).toBeDefined();
    expect(repo.getStagedChanges()).toHaveLength(0);
  });

  test('应该能够添加和管理列结构', () => {
    const column = createColumn('test_column', {
      dataType: 'string',
      width: 150,
      constraints: { required: true }
    });
    
  repo.addColumn('default', column);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.columns.has(column.id)).toBe(true);
  });

  test('应该能够创建和切换分支', () => {
    // 先添加一些数据
  repo.addCellChange('default', 1, 1, 'Original');
    repo.commit('初始提交', 'Test User', 'test@example.com');
    
    // 创建分支
    repo.createBranch('feature');
    repo.checkout('feature');
    
    expect(repo.getCurrentBranch()).toBe('feature');
    expect(repo.getBranches()).toContain('feature');
  });

  test('应该能够获取单元格值', () => {
  repo.addCellChange('default', 1, 1, 'Test Value');
    repo.commit('添加测试值', 'Test User', 'test@example.com');
    
    const value = repo.getCellValue(1, 1);
    expect(value).toBe('Test Value');
  });

  test('应该能够删除单元格', () => {
    // 先添加单元格
  repo.addCellChange('default', 1, 1, 'To Delete');
    repo.commit('添加要删除的单元格', 'Test User', 'test@example.com');
    
    // 删除单元格
  repo.deleteCellChange('default', 1, 1);
    repo.commit('删除单元格', 'Test User', 'test@example.com');
    
    const value = repo.getCellValue(1, 1);
    expect(value).toBeUndefined();
  });

  test('应该能够获取提交历史', () => {
  repo.addCellChange('default', 1, 1, 'First');
    repo.commit('第一次提交', 'Test User', 'test@example.com');
    
  repo.addCellChange('default', 1, 2, 'Second');
    repo.commit('第二次提交', 'Test User', 'test@example.com');
    
    const history = repo.getCommitHistory();
    expect(history).toHaveLength(3); // 包括初始提交
    expect(history[0].message).toBe('第二次提交');
    expect(history[1].message).toBe('第一次提交');
  });

  test('应该能够重置暂存区', () => {
  repo.addCellChange('default', 1, 1, 'Staged');
    expect(repo.getStagedChanges()).toHaveLength(1);
    
    repo.reset();
    expect(repo.getStagedChanges()).toHaveLength(0);
  });

  test('应该能够checkout到指定的提交历史', () => {
    // 创建第一个提交
  repo.addCellChange('default', 1, 1, 'Version 1');
  const commit1 = repo.commit('第一版本', 'Test User', 'test@example.com');
  const version1CellHash = repo.getCell(1, 1)?.hash;
    
    // 创建第二个提交
  repo.addCellChange('default', 1, 1, 'Version 2');
  repo.addCellChange('default', 1, 2, 'New Data');
    const commit2 = repo.commit('第二版本', 'Test User', 'test@example.com');
  const version2CellHash = repo.getCell(1, 1)?.hash;
  expect(version2CellHash).not.toBe(version1CellHash);
    
    // 创建第三个提交
  repo.addCellChange('default', 2, 1, 'More Data');
    const commit3 = repo.commit('第三版本', 'Test User', 'test@example.com');
    
    // 验证当前状态
    expect(repo.getCellValue(1, 1)).toBe('Version 2');
    expect(repo.getCellValue(1, 2)).toBe('New Data');
    expect(repo.getCellValue(2, 1)).toBe('More Data');
    
    // Checkout到第一个提交
    repo.checkout(commit1);
    expect(repo.isDetachedHead()).toBe(true);
    expect(repo.getCurrentCommitHash()).toBe(commit1);
    const commit1Sheet = repo.getSheetSnapshot('default', { commit: commit1 });
    expect(commit1Sheet?.getCellHash(1, 1)).toBe(version1CellHash);
    const workingSheetAfterCheckout = repo.getWorkingSheet('default');
    expect(workingSheetAfterCheckout?.hash).toBe(commit1Sheet?.hash);
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
  repo.addCellChange('default', 1, 1, 'Uncommitted');
    
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
    const col1 = createColumn('col1', { order: 0 });
    const col2 = createColumn('col2', { order: 1 });
    const col3 = createColumn('col3', { order: 2 });
    
  repo.addColumn('default', col1);
  repo.addColumn('default', col2);
  repo.addColumn('default', col3);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
    // 移动第一列到最后
  repo.moveColumn('default', col1.id, 2);
    repo.commit('移动列', 'Test User', 'test@example.com');
    
  const workingTree = repo.getWorkingTree();
    const columnOrder = workingTree?.structure.getColumnIds();
    expect(columnOrder?.[2]).toBe(col1.id);
  });

  test('应该能够更新列信息', () => {
    const column = createColumn('test_col');
    
  repo.addColumn('default', column);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
  repo.updateColumn('default', column.id, { description: '更新后的描述' });
    repo.commit('更新列描述', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    const updatedColumn = workingTree?.structure.getColumn(column.id);
    expect(updatedColumn?.description).toBe('更新后的描述');
  });

  test('应该能够删除列', () => {
    const column = createColumn('delete_col');
    
  repo.addColumn('default', column);
    repo.commit('添加列', 'Test User', 'test@example.com');
    
  repo.deleteColumn('default', column.id);
    repo.commit('删除列', 'Test User', 'test@example.com');
    
    const workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.columns.has(column.id)).toBe(false);
  });

  test('在缺少结构时应基于单元格边界计算下一个列顺序', () => {
    repo.addCellChange('default', 0, 0, 'A');
    repo.addCellChange('default', 0, 1, 'B');
    repo.commit('初始化单元格', 'Test User', 'test@example.com');

    const nextOrder = repo.getNextColumnOrder('default');
    expect(nextOrder).toBe(2);
  });

  test('deleteColumnByIndex 应在缺少结构时删除对应列', () => {
    repo.addCellChange('default', 0, 0, 'A');
    repo.addCellChange('default', 0, 1, 'B');
    repo.addCellChange('default', 1, 0, 'C');
    repo.addCellChange('default', 1, 1, 'D');
    repo.commit('初始化矩阵', 'Test User', 'test@example.com');

    repo.deleteColumnByIndex('default', 0);
    repo.commit('删除首列', 'Test User', 'test@example.com');

    expect(repo.getCellValue(0, 0)).toBeUndefined();
    expect(repo.getCellValue(0, 1)).toBe('B');
  });

  test('应该能够添加和删除行', () => {
    const row1 = { id: 'row_1', height: 25, hidden: false, order: 0 };
    const row2 = { id: 'row_2', height: 30, hidden: false, order: 1 };
    
  repo.addRow('default', row1);
  repo.addRow('default', row2);
    repo.commit('添加行', 'Test User', 'test@example.com');
    
    let workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.rows.has('row_1')).toBe(true);
    expect(workingTree?.structure.rows.has('row_2')).toBe(true);
    
    // 删除一行
  repo.deleteRow('default', 'row_1');
    repo.commit('删除行', 'Test User', 'test@example.com');
    
    workingTree = repo.getWorkingTree();
    expect(workingTree?.structure.rows.has('row_1')).toBe(false);
    expect(workingTree?.structure.rows.has('row_2')).toBe(true);
  });

  test('在缺少结构时应基于单元格边界计算下一个行顺序', () => {
    repo.addCellChange('default', 0, 0, 'Header');
    repo.addCellChange('default', 1, 0, 'Row1');
    repo.commit('初始化行', 'Test User', 'test@example.com');

    const nextOrder = repo.getNextRowOrder('default');
    expect(nextOrder).toBe(2);
  });

  test('deleteRowByIndex 应在缺少结构时删除对应行', () => {
    repo.addCellChange('default', 0, 0, 'Header');
    repo.addCellChange('default', 1, 0, 'Row1');
    repo.addCellChange('default', 2, 0, 'Row2');
    repo.commit('初始化多行', 'Test User', 'test@example.com');

    repo.deleteRowByIndex('default', 1);
    repo.commit('删除第二行', 'Test User', 'test@example.com');

    expect(repo.getCellValue(1, 0)).toBeUndefined();
    expect(repo.getCellValue(2, 0)).toBe('Row2');
  });

  test('应该能够像普通单元格一样操作列头', () => {
    // 添加列结构
    const col1 = createColumn('product_name', { dataType: 'string' });
    const col2 = createColumn('price', { dataType: 'number' });
    
    repo.addColumn('default', col1);
    repo.addColumn('default', col2);
    
    // 设置列头（第0行）- 就像普通单元格一样
    repo.addCellChange('default', 0, 0, '产品名称', undefined, { fontWeight: 'bold' });
    repo.addCellChange('default', 0, 1, '价格', undefined, { fontWeight: 'bold' });
    
    // 添加数据行
    repo.addCellChange('default', 1, 0, 'iPhone 15');
    repo.addCellChange('default', 1, 1, 5999);
    
    repo.commit('添加表格数据', 'Test User', 'test@example.com');
    
    // 验证列头和数据都是普通单元格
    expect(repo.getCellValue(0, 0)).toBe('产品名称');
    expect(repo.getCellValue(0, 1)).toBe('价格');
    expect(repo.getCellValue(1, 0)).toBe('iPhone 15');
    expect(repo.getCellValue(1, 1)).toBe(5999);
    
    // 列头可以像普通单元格一样修改
    repo.addCellChange('default', 0, 0, '商品名称');
    repo.commit('修改列头', 'Test User', 'test@example.com');
    
    expect(repo.getCellValue(0, 0)).toBe('商品名称');
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
    
  repo.addCellChange('default', 1, 1, 'Formatted Text', undefined, format);
    repo.commit('添加格式化文本', 'Test User', 'test@example.com');
    
    const cell = repo.getCell(1, 1);
    expect(cell?.format?.fontWeight).toBe('bold');
    expect(cell?.format?.textColor).toBe('#FF0000');
    expect(cell?.format?.backgroundColor).toBe('#FFFF00');
  });

  test('应该能够保存公式', () => {
  repo.addCellChange('default', 1, 1, 10);
  repo.addCellChange('default', 1, 2, 20);
  repo.addCellChange('default', 1, 3, 30, '=A1+B1');
    
    repo.commit('添加公式', 'Test User', 'test@example.com');
    
    const cell = repo.getCell(1, 3);
    expect(cell?.formula).toBe('=A1+B1');
    expect(cell?.value).toBe(30);
  });
});

describe('多工作表操作', () => {
  let repo: TableGit;

  beforeEach(() => {
    repo = createTableGit();
  });

  test('应该能够创建并提交新的工作表', () => {
    repo.createSheet('SheetA');
    repo.commit('创建 SheetA', 'Tester', 'tester@example.com');

    const sheets = repo.listSheets();
    expect(sheets).toContain('SheetA');
  });

  test('复制工作表应保留单元格数据', () => {
    repo.addCellChange('default', 0, 0, 'Origin');
    repo.commit('初始化数据', 'Tester', 'tester@example.com');

    repo.duplicateSheet('default', 'Copy');
    repo.commit('复制默认工作表', 'Tester', 'tester@example.com');

    expect(repo.listSheets()).toContain('Copy');
    expect(repo.getCellValue(0, 0, 'Copy')).toBe('Origin');
  });

  test('重命名工作表后应阻止对旧名称的访问', () => {
    repo.createSheet('SheetB');
    repo.commit('创建 SheetB', 'Tester', 'tester@example.com');

    repo.renameSheet('SheetB', 'SheetC');
    repo.commit('重命名 SheetB', 'Tester', 'tester@example.com');

    expect(repo.listSheets()).toContain('SheetC');
    expect(repo.hasSheet('SheetB')).toBe(false);
  });
});

describe('DiffMergeEngine 多工作表差异', () => {
  test('应识别新增工作表与单元格变更', () => {
    const repo = createTableGit();
    const engine = new DiffMergeEngine(repo);

    const baseCommit = repo.getCurrentCommitHash()!;

    repo.createSheet('SheetX');
    repo.commit('新增 SheetX', 'Tester', 'tester@example.com');

    const afterAddSheet = repo.getCurrentCommitHash()!;
    const diffSheets = engine.diff(baseCommit, afterAddSheet);
    expect(diffSheets.sheetChanges.added).toContain('SheetX');

    repo.addCellChange('default', 1, 1, 'Delta');
    repo.commit('修改默认工作表', 'Tester', 'tester@example.com');

    const afterCellChange = repo.getCurrentCommitHash()!;
    expect(repo.getSheetSnapshot('default', { commit: afterAddSheet })?.getCellHash(1, 1)).toBeUndefined();
    expect(repo.getSheetSnapshot('default', { commit: afterCellChange })?.getCellHash(1, 1)).toBeDefined();
    const diffCells = engine.diff(afterAddSheet, afterCellChange);
    expect(diffCells.sheets['default'].cellChanges.added).toHaveLength(1);
  });
});
