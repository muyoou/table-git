#!/usr/bin/env node

/**
 * 表格版本控制系统演示脚本
 */

const { 
  createTableGit, 
  createColumn, 
  createSampleTable 
} = require('./dist/index.js');

function demo() {
  console.log('🚀 表格版本控制系统演示');
  console.log('='.repeat(50));
  
  // 创建示例表格
  console.log('\n📊 创建示例表格...');
  const repo = createSampleTable();
  
  // 查看当前状态
  const status = repo.status();
  console.log(`当前分支: ${status.branch}`);
  console.log(`最后提交: ${status.lastCommit || '无'}`);
  
  // 显示提交历史
  console.log('\n📝 提交历史:');
  const history = repo.getCommitHistory(3);
  history.forEach((commit, index) => {
    console.log(`  ${index + 1}. ${commit.getShortHash()} - ${commit.message}`);
    console.log(`     作者: ${commit.author} | 时间: ${new Date(commit.timestamp).toLocaleString()}`);
  });
  
  // 显示表格内容
  console.log('\n📋 当前表格内容:');
  const workingTree = repo.getWorkingTree();
  if (workingTree) {
    // 显示列结构
    console.log('列结构:');
    workingTree.structure.getColumnIds().forEach((id, index) => {
      const column = workingTree.structure.getColumn(id);
      console.log(`  ${index + 1}. ${column.name} (${column.dataType}) - 宽度: ${column.width}`);
    });
    
    // 显示数据
    console.log('\n数据内容:');
    for (let row = 1; row <= 3; row++) {
      const rowData = [];
      for (let col = 1; col <= 4; col++) {
        const value = repo.getCellValue(row, col);
        rowData.push(value || '');
      }
      console.log(`  第${row}行: ${rowData.join(' | ')}`);
    }
  }
  
  // 演示分支操作
  console.log('\n🌿 创建分支进行价格调整...');
  repo.createBranch('price-update');
  repo.checkout('price-update');
  
  // 修改价格
  repo.addCellChange('default', 1, 2, 6999); // iPhone价格调整
  repo.addCellChange('default', 2, 2, 13999); // MacBook价格调整
  
  const newCommit = repo.commit('调整产品价格', 'Sales Manager', 'sales@company.com');
  console.log(`价格调整提交: ${newCommit.substring(0, 7)}`);
  
  // 显示修改后的价格
  console.log('\n💰 调整后的价格:');
  console.log(`  iPhone 15: ${repo.getCellValue(1, 2)}`);
  console.log(`  MacBook Pro: ${repo.getCellValue(2, 2)}`);
  console.log(`  iPad Air: ${repo.getCellValue(3, 2)}`);
  
  console.log('\n🔄 切换回主分支');
  console.log(`  iPhone 15: ${repo.getCellValue(1, 2)} (原价格)`);
  console.log(`  MacBook Pro: ${repo.getCellValue(2, 2)} (原价格)`);
  
  // 演示删除行功能
  console.log('\n🗑️ 演示删除行功能...');
  console.log('删除前的数据:');
  for (let row = 1; row <= 3; row++) {
    const rowData = [];
    for (let col = 1; col <= 4; col++) {
      const value = repo.getCellValue(row, col);
      rowData.push(value || '');
    }
    console.log(`  第${row}行: ${rowData.join(' | ')}`);
  }
  
  // 添加行元数据以便演示删除
  repo.addRow('default', { id: 'row_2', height: 25, hidden: false, order: 1 });
  repo.commit('添加行元数据', 'Data Manager', 'data@company.com');
  
  // 删除第2行（MacBook Pro）
  console.log('\n删除第2行 (MacBook Pro)...');
  
  // 删除第2行的所有数据
  repo.deleteCellChange('default', 2, 1);
  repo.deleteCellChange('default', 2, 2);
  repo.deleteCellChange('default', 2, 3);
  repo.deleteCellChange('default', 2, 4);
  
  // 删除行元数据
  repo.deleteRow('default', 'row_2');
  
  const deleteCommit = repo.commit('删除MacBook Pro产品行', 'Product Manager', 'pm@company.com');
  console.log(`删除行提交: ${deleteCommit.substring(0, 7)}`);
  
  console.log('\n删除后的数据:');
  for (let row = 1; row <= 3; row++) {
    const rowData = [];
    for (let col = 1; col <= 4; col++) {
      const value = repo.getCellValue(row, col);
      if (value !== undefined) {
        rowData.push(value);
      }
    }
    if (rowData.length > 0) {
      console.log(`  第${row}行: ${rowData.join(' | ')}`);
    }
  }
  
  // 演示行排序功能
  console.log('\n↕️ 演示行排序功能...');
  
  // 添加更多行数据用于排序演示
  repo.addCellChange('default', 4, 1, 'Apple Watch');
  repo.addCellChange('default', 4, 2, 2999);
  repo.addCellChange('default', 4, 3, 200);
  repo.addCellChange('default', 4, 4, '智能手表');
  
  repo.addCellChange('default', 5, 1, 'AirPods Pro');
  repo.addCellChange('default', 5, 2, 1999);
  repo.addCellChange('default', 5, 3, 150);
  repo.addCellChange('default', 5, 4, '无线耳机');
  
  repo.commit('添加更多产品', 'Product Manager', 'pm@company.com');
  
  console.log('\n排序前的产品（按添加顺序）:');
  for (let row = 1; row <= 5; row++) {
    const name = repo.getCellValue(row, 1);
    const price = repo.getCellValue(row, 2);
    if (name && price) {
      console.log(`  ${name}: ¥${price}`);
    }
  }
  
  // 模拟按价格排序（这里简化演示，实际排序逻辑在sortRows方法中）
  console.log('\n🔄 按价格从低到高排序...');
  repo.sortRows('default', [{ columnId: 'col_2', ascending: true }]);
  repo.commit('按价格排序产品', 'Data Analyst', 'analyst@company.com');
  
  console.log('注意：完整的排序功能需要根据实际数据实现，这里展示了排序操作的记录');
  
  // 显示分支列表
  console.log('\n🌳 所有分支:');
  const branches = repo.getBranches();
  branches.forEach(branch => {
    const marker = branch === repo.getCurrentBranch() ? '* ' : '  ';
    console.log(`${marker}${branch}`);
  });
  
  // 演示checkout到历史提交
  console.log('\n🕰️  演示切换到历史提交...');
  const allHistory = repo.getCommitHistory(10);
  
  if (allHistory.length >= 2) {
    const oldCommit = allHistory[allHistory.length - 2]; // 倒数第二个提交
    console.log(`切换到历史提交: ${oldCommit.getShortHash()} - ${oldCommit.message}`);
    
    repo.checkout(oldCommit.hash);
    console.log(`当前状态: ${repo.isDetachedHead() ? 'detached HEAD' : 'on branch'}`);
    console.log(`当前提交: ${repo.getCurrentCommitHash()?.substring(0, 7)}`);
    
    // 显示历史版本的数据
    console.log('\n📅 历史版本的数据:');
    console.log(`  iPhone 15: ${repo.getCellValue(1, 2) || '无数据'}`);
    console.log(`  MacBook Pro: ${repo.getCellValue(2, 2) || '无数据'}`);
    console.log(`  iPad Air: ${repo.getCellValue(3, 2) || '无数据'}`);
    
    // 切换回最新提交
    console.log('\n🔄 切换回最新状态...');
    repo.checkout('main');
    console.log(`当前分支: ${repo.getCurrentBranch()}`);
    console.log(`  iPhone 15: ${repo.getCellValue(1, 2)}`);
    console.log(`  MacBook Pro: ${repo.getCellValue(2, 2)}`);
  }
  
  console.log('\n✅ 演示完成！');
  console.log('\n📖 更多功能请查看 examples/usage-examples.ts');
}

// 运行演示
if (require.main === module) {
  try {
    demo();
  } catch (error) {
    console.error('❌ 演示出错:', error.message);
    process.exit(1);
  }
}
