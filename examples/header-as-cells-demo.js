const { createTableGit, createColumn } = require('../demo');

// 演示将列头作为普通单元格的设计
console.log('=== 列头作为单元格演示 ===\n');

// 1. 创建表格仓库
const repo = createTableGit();

// 2. 添加列结构（只有ID，没有名称）
const columns = [
  createColumn('product_id', { 
    dataType: 'string',
    description: '产品唯一标识',
    constraints: { required: true, unique: true }
  }),
  createColumn('name', { 
    dataType: 'string',
    description: '产品名称',
    constraints: { required: true }
  }),
  createColumn('price', { 
    dataType: 'number',
    description: '产品价格',
    constraints: { required: true, min: 0 }
  }),
  createColumn('category', { 
    dataType: 'string',
    description: '产品分类'
  })
];

columns.forEach(col => repo.addColumn('default', col));

// 3. 设置列头（第0行作为普通单元格）
repo.addCellChange('default', 0, 0, 'ID', undefined, { fontWeight: 'bold' });
repo.addCellChange('default', 0, 1, '产品名称', undefined, { fontWeight: 'bold' });
repo.addCellChange('default', 0, 2, '价格(￥)', undefined, { fontWeight: 'bold' });
repo.addCellChange('default', 0, 3, '分类', undefined, { fontWeight: 'bold' });

// 4. 添加数据行
repo.addCellChange('default', 1, 0, 'P001');
repo.addCellChange('default', 1, 1, 'MacBook Pro');
repo.addCellChange('default', 1, 2, 12999);
repo.addCellChange('default', 1, 3, '电脑');

repo.addCellChange('default', 2, 0, 'P002');
repo.addCellChange('default', 2, 1, 'iPhone 15');
repo.addCellChange('default', 2, 2, 5999);
repo.addCellChange('default', 2, 3, '手机');

// 5. 提交初始数据
repo.commit('初始化产品表', 'Demo', 'demo@example.com');

// 6. 展示新设计的特性
console.log('📋 表格结构:');
console.log('列定义（结构层面）:');
columns.forEach((col, index) => {
  console.log(`  ${index}: ${col.id} (${col.dataType}) - ${col.description}`);
});

console.log('\n列头（显示层面）:');
const headers = [];
for (let i = 0; i < columns.length; i++) {
  const headerCell = repo.getCellValue(0, i);
  headers.push(headerCell ? String(headerCell) : '');
}
headers.forEach((header, index) => {
  console.log(`  ${index}: "${header}"`);
});

console.log('\n📊 表格数据:');
console.log('行\\列 |', headers.map(h => h.padEnd(12)).join('|'));
console.log('-----|' + headers.map(() => '------------').join('|'));

for (let row = 1; row <= 2; row++) {
  const rowData = [];
  for (let col = 0; col < headers.length; col++) {
    const value = repo.getCellValue(row, col);
    rowData.push(String(value || '').padEnd(12));
  }
  console.log(`  ${row}  |${rowData.join('|')}`);
}

// 7. 演示列头的版本控制特性
console.log('\n🔄 列头版本控制演示:');
console.log('原列头:', repo.getCellValue(0, 2));

// 修改列头（就像修改普通单元格）
repo.addCellChange('default', 0, 2, '单价(元)', undefined, { fontWeight: 'bold' });
repo.commit('更新价格列头显示', 'Demo', 'demo@example.com');

console.log('新列头:', repo.getCellValue(0, 2));

// 8. 演示查询功能
console.log('\n🔍 查询功能演示:');
// 获取列头值需要直接访问单元格
console.log('第1列的列头:', repo.getCellValue(0, 1)); 
console.log('第2列的列头:', repo.getCellValue(0, 2));

// 获取列结构信息
const sheet = repo.getWorkingTree();
const columnIds = sheet.structure.getColumnIds();
console.log('列ID列表:', columnIds);

const priceColumn = sheet.structure.getColumn('price');
console.log('价格列元数据:', {
  id: priceColumn.id,
  dataType: priceColumn.dataType,
  description: priceColumn.description
});

// 9. 展示设计优势
console.log('\n✨ 设计优势:');
console.log('1. 列头支持版本控制 - 可以像修改数据一样修改列头');
console.log('2. 统一的操作模型 - 所有内容都通过单元格操作');
console.log('3. 灵活的显示名称 - 列头可以随时修改，不影响结构');
console.log('4. 简化的数据模型 - Column只管结构，不管显示');
console.log('5. 未来可扩展 - 支持多行列头、合并列头等高级功能');

console.log('\n🏗️ 结构与显示分离:');
console.log('- 结构层(Column): 提供ID、类型、约束等元数据');
console.log('- 显示层(第0行单元格): 提供用户友好的列头名称');
console.log('- 两者解耦，各司其职，既保证了结构稳定性，又提供了显示灵活性');
