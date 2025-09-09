#!/usr/bin/env node
/*
  使用 dist 导出的 API 构建示例数据，并通过函数式格式化器生成静态文件：
  - demo/table.html
  - demo/data.csv
  - demo/data.json
*/
const fs = require('fs');
const path = require('path');

const {
  createSampleTable,
  TableDataAdapter,
  FunctionFormatter,
  FormatterRegistry,
  csvFormatter,
  jsonFormatter,
  htmlFormatter,
} = require('../dist/index.js');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function main() {
  const repo = createSampleTable();
  const adapter = new TableDataAdapter(repo);
  const data = adapter.build();

  const registry = new FormatterRegistry();
  registry.register(new FunctionFormatter({ name: 'csv', format: csvFormatter }));
  registry.register(new FunctionFormatter({ name: 'json', format: jsonFormatter }));
  registry.register(new FunctionFormatter({ name: 'html', format: htmlFormatter }));

  const outDir = path.resolve(__dirname);
  ensureDir(outDir);

  const csv = registry.format('csv', data, { includeHeader: true, quoteText: true });
  const json = registry.format('json', data, { shape: 'rows', space: 2 });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Table</title>
  <style>table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}</style>
  </head><body>${registry.format('html', data, { tableClass: 'table-git', includeHeader: true })}</body></html>`;

  fs.writeFileSync(path.join(outDir, 'data.csv'), csv, 'utf8');
  fs.writeFileSync(path.join(outDir, 'data.json'), json, 'utf8');
  fs.writeFileSync(path.join(outDir, 'table.html'), html, 'utf8');

  console.log('Demo files generated in demo/: table.html, data.csv, data.json');
}

if (require.main === module) {
  main();
}
