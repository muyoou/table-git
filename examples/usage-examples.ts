/**
 * 表格版本控制系统使用示例
 */

import { 
  createTableGit, 
  createColumn, 
  createRow, 
  createSampleTable,
  DiffMergeEngine,
  ConflictResolver
} from '../src/index';

// 示例1：基础表格操作
function basicTableOperations() {
  console.log('\n=== 基础表格操作示例 ===');
  
  // 创建新的表格仓库
  const repo = createTableGit('main');
  
  // 添加列定义
  const columns = [
    createColumn('员工姓名', { 
      dataType: 'string', 
      width: 120,
      constraints: { required: true }
    }),
    createColumn('部门', { 
      dataType: 'string', 
      width: 100 
    }),
    createColumn('薪资', { 
      dataType: 'number', 
      width: 100,
      constraints: { min: 0 }
    }),
    createColumn('入职日期', { 
      dataType: 'date', 
      width: 120 
    })
  ];
  
  // 添加列到表格
  columns.forEach(col => repo.addColumn('员工表', col));
  
  // 添加员工数据
  repo.addCellChange('员工表', 1, 1, '张三', undefined, { fontWeight: 'bold' });
  repo.addCellChange('员工表', 1, 2, '技术部');
  repo.addCellChange('员工表', 1, 3, 15000);
  repo.addCellChange('员工表', 1, 4, new Date('2023-01-15'));
  
  repo.addCellChange('员工表', 2, 1, '李四', undefined, { fontWeight: 'bold' });
  repo.addCellChange('员工表', 2, 2, '销售部');
  repo.addCellChange('员工表', 2, 3, 12000);
  repo.addCellChange('员工表', 2, 4, new Date('2023-03-20'));
  
  repo.addCellChange('员工表', 3, 1, '王五', undefined, { fontWeight: 'bold' });
  repo.addCellChange('员工表', 3, 2, '财务部');
  repo.addCellChange('员工表', 3, 3, 13000);
  repo.addCellChange('员工表', 3, 4, new Date('2023-06-01'));

  // 提交初始数据
  const commit1 = repo.commit('初始化员工表', 'HR Manager', 'hr@company.com');
  console.log(`初始提交: ${commit1.substring(0, 7)}`);
  
  // 添加新员工
  repo.addCellChange('员工表', 4, 1, '赵六', undefined, { fontWeight: 'bold' });
  repo.addCellChange('员工表', 4, 2, '市场部');
  repo.addCellChange('员工表', 4, 3, 11000);
  repo.addCellChange('员工表', 4, 4, new Date('2023-08-10'));

  const commit2 = repo.commit('添加新员工赵六', 'HR Manager', 'hr@company.com');
  console.log(`第二次提交: ${commit2.substring(0, 7)}`);
  
  // 演示删除员工（删除行）
  console.log('\n删除员工李四...');
  
  // 删除第2行的所有数据
  repo.deleteCellChange('员工表', 2, 1);
  repo.deleteCellChange('员工表', 2, 2);
  repo.deleteCellChange('员工表', 2, 3);
  repo.deleteCellChange('员工表', 2, 4);
  
  // 如果有行元数据，也要删除
  repo.deleteRow('员工表', 'row_2');
  
  const commit3 = repo.commit('删除员工李四', 'HR Manager', 'hr@company.com');
  console.log(`删除员工提交: ${commit3.substring(0, 7)}`);
  
  // 查看当前状态
  const status = repo.status();
  console.log('当前状态:', status);
  
  // 查看提交历史
  const history = repo.getCommitHistory(5);
  console.log('\n提交历史:');
  history.forEach(commit => {
    console.log(`  ${commit.getShortHash()} - ${commit.message}`);
    console.log(`    作者: ${commit.author} (${new Date(commit.timestamp).toLocaleString()})`);
  });
  
  return repo;
}

// 示例2：分支操作和合并
function branchingAndMerging() {
  console.log('\n=== 分支操作和合并示例 ===');
  
  const repo = createSampleTable();
  
  // 创建分支进行价格调整
  repo.createBranch('price-adjustment');
  repo.checkout('price-adjustment');
  console.log(`切换到分支: ${repo.getCurrentBranch()}`);
  
  // 在分支中修改价格
  repo.addCellChange('default', 1, 2, 6299);  // iPhone涨价
  repo.addCellChange('default', 2, 2, 11999); // MacBook降价
  repo.addCellChange('default', 3, 2, 4299);  // iPad降价
  
  const branchCommit = repo.commit('调整产品价格', 'Product Manager', 'pm@company.com');
  console.log(`分支提交: ${branchCommit.substring(0, 7)}`);
  
  // 切回主分支，进行结构调整
  repo.checkout('main');
  console.log(`切换回分支: ${repo.getCurrentBranch()}`);
  
  // 添加新列
  const supplierColumn = createColumn('供应商', {
    dataType: 'string',
    width: 120,
    order: 4
  });
  repo.addColumn('default', supplierColumn);
  
  // 添加供应商信息
  repo.addCellChange('default', 1, 5, 'Apple Inc.');
  repo.addCellChange('default', 2, 5, 'Apple Inc.');
  repo.addCellChange('default', 3, 5, 'Apple Inc.');
  
  const mainCommit = repo.commit('添加供应商列', 'Data Manager', 'dm@company.com');
  console.log(`主分支提交: ${mainCommit.substring(0, 7)}`);
  
  // 尝试合并
  const diffEngine = new DiffMergeEngine(repo);
  const mergeResult = diffEngine.merge('price-adjustment');
  
  if (mergeResult.success) {
    console.log('✅ 自动合并成功');
  } else {
    console.log('❌ 合并冲突，需要手动解决');
    console.log('冲突数量:', mergeResult.conflicts?.length);
    
    if (mergeResult.conflicts) {
      const resolver = new ConflictResolver();
      const report = resolver.generateConflictReport(mergeResult.conflicts);
      console.log('\n' + report);
    }
  }
  
  return repo;
}

// 示例3：差异比较
function diffComparison() {
  console.log('\n=== 差异比较示例 ===');
  
  const repo = createSampleTable();
  const history = repo.getCommitHistory(2);
  
  if (history.length >= 2) {
    const diffEngine = new DiffMergeEngine(repo);
    const diff = diffEngine.diff(history[1].hash, history[0].hash);
    
    console.log('单元格变更:');
    console.log(`  新增: ${diff.cellChanges.added.length} 个`);
    console.log(`  修改: ${diff.cellChanges.modified.length} 个`);
    console.log(`  删除: ${diff.cellChanges.deleted.length} 个`);
    
    console.log('\n结构变更:');
    console.log(`  新增列: ${diff.structureChanges.columns.added.length} 个`);
    console.log(`  修改列: ${diff.structureChanges.columns.modified.length} 个`);
    console.log(`  删除列: ${diff.structureChanges.columns.deleted.length} 个`);
    console.log(`  移动列: ${diff.structureChanges.columns.moved.length} 个`);
  }
}

// 示例4：冲突解决
function conflictResolution() {
  console.log('\n=== 冲突解决示例 ===');
  
  const repo = createSampleTable();
  
  // 创建两个分支，都修改同一个单元格
  repo.createBranch('branch-a');
  repo.createBranch('branch-b');
  
  // 在分支A中修改
  repo.checkout('branch-a');
  repo.addCellChange('default', 1, 2, 6999); // iPhone改为6999
  repo.commit('分支A价格调整', 'User A', 'usera@company.com');
  
  // 在分支B中修改同一个单元格
  repo.checkout('branch-b');
  repo.addCellChange('default', 1, 2, 5799); // iPhone改为5799
  repo.commit('分支B价格调整', 'User B', 'userb@company.com');
  
  // 切换到主分支尝试合并
  repo.checkout('main');
  
  const diffEngine = new DiffMergeEngine(repo);
  const mergeResult = diffEngine.merge('branch-a');
  
  if (mergeResult.success) {
    console.log('与分支A合并成功');
    
    // 尝试合并分支B（会产生冲突）
    const conflictResult = diffEngine.merge('branch-b');
    if (!conflictResult.success && conflictResult.conflicts) {
      console.log('检测到冲突，使用解决器处理...');
      
      const resolver = new ConflictResolver();
      
      // 尝试不同的解决策略
      console.log('\n使用不同解决策略:');
      
      conflictResult.conflicts.forEach((conflict, index) => {
        console.log(`\n冲突 ${index + 1}:`);
        
        if ('position' in conflict) {
          const cellConflict = conflict;
          
          // 策略1：选择当前分支
          const currentResolution = resolver.resolveCellConflict(cellConflict, 'current');
          console.log(`  选择当前: ${currentResolution?.value}`);
          
          // 策略2：选择目标分支
          const targetResolution = resolver.resolveCellConflict(cellConflict, 'target');
          console.log(`  选择目标: ${targetResolution?.value}`);
          
          // 策略3：智能合并
          const mergeResolution = resolver.resolveCellConflict(cellConflict, 'merge');
          console.log(`  智能合并: ${mergeResolution?.value}`);
          
          // 策略4：自定义值
          const customResolution = resolver.resolveCellConflict(cellConflict, {
            value: 6399, // 取中间值
            format: { backgroundColor: '#FFFF99' } // 高亮显示已解决的冲突
          });
          console.log(`  自定义值: ${customResolution?.value}`);
        }
      });
    }
  }
}

// 示例5：表格结构版本控制
function structureVersioning() {
  console.log('\n=== 表格结构版本控制示例 ===');
  
  const repo = createTableGit();
  
  // 第一阶段：基础表结构
  const basicColumns = [
    createColumn('ID', { dataType: 'number', width: 60 }),
    createColumn('名称', { dataType: 'string', width: 150 }),
    createColumn('状态', { dataType: 'string', width: 100 })
  ];
  
  basicColumns.forEach(col => repo.addColumn('项目表', col));
  repo.commit('创建基础项目表结构', 'System', 'system@company.com');
  
  // 第二阶段：扩展字段
  const extendedColumns = [
    createColumn('开始日期', { dataType: 'date', width: 120 }),
    createColumn('结束日期', { dataType: 'date', width: 120 }),
    createColumn('负责人', { dataType: 'string', width: 100 }),
    createColumn('优先级', { dataType: 'string', width: 80 })
  ];
  
  extendedColumns.forEach(col => repo.addColumn('项目表', col));
  repo.commit('扩展项目表字段', 'Product Manager', 'pm@company.com');
  
  // 第三阶段：重新排列列顺序
  const workingTree = repo.getWorkingTree();
  const columnIds = workingTree?.structure.getColumnIds() || [];
  
  // 将优先级列移到前面
  const priorityColumnId = extendedColumns[3].id;
  repo.moveColumn('项目表', priorityColumnId, 1);
  repo.commit('调整列顺序：优先级前置', 'UX Designer', 'ux@company.com');
  
  // 查看结构变化历史
  const history = repo.getCommitHistory();
  console.log('结构变化历史:');
  history.forEach(commit => {
    console.log(`  ${commit.getShortHash()} - ${commit.message}`);
  });
  
  // 显示当前表结构
  const currentTree = repo.getWorkingTree();
  if (currentTree) {
    console.log('\n当前表结构:');
    currentTree.structure.getColumnIds().forEach((id, index) => {
      const column = currentTree.structure.getColumn(id);
      console.log(`  ${index + 1}. ${column?.name} (${column?.dataType}, 宽度: ${column?.width})`);
    });
  }
}

// 运行所有示例
function runAllExamples() {
  console.log('🚀 表格版本控制系统示例演示');
  console.log('=====================================');
  
  try {
    basicTableOperations();
    branchingAndMerging();
    diffComparison();
    conflictResolution();
    structureVersioning();
    
    console.log('\n✅ 所有示例执行完成！');
  } catch (error) {
    console.error('❌ 示例执行出错:', error);
  }
}

// 如果在Node.js环境中直接运行此文件
// if (require.main === module) {
//   runAllExamples();
// }

export {
  basicTableOperations,
  branchingAndMerging,
  diffComparison,
  conflictResolution,
  structureVersioning,
  runAllExamples
};
