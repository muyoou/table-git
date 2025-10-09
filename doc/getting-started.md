# 快速开始

本文档帮助你在项目中集成 `table-git`，并完成最小可行示例。

## 安装

```bash
npm install table-git
# 或者使用 pnpm / yarn
```

## TypeScript 支持

`table-git` 使用 TypeScript 编写并提供完整的声明文件。安装完成后即可享受类型提示，无需额外配置。

## 基础概念

- **仓库 (`TableGit`)**：表格的版本化容器，负责暂存区、提交历史和分支。
- **结构 (`TableStructure`)**：管理列、行的元数据。
- **变更 (`Change`)**：单元格或结构级别的修改记录。
- **提交 (`CommitObject`)**：将暂存区的变更快照化并保存至历史。

## 最小示例

```typescript
import { createTableGit, createColumn } from 'table-git';

// 1. 创建仓库
const repo = createTableGit('main');

// 2. 定义列
const nameCol = createColumn('product_name', {
  dataType: 'string',
  order: 0,
  constraints: { required: true }
});

const priceCol = createColumn('price', {
  dataType: 'number',
  order: 1
});

repo.addColumn('default', nameCol);
repo.addColumn('default', priceCol);

// 3. 写入单元格变更
repo.addCellChange('default', 1, 0, 'iPhone 15');
repo.addCellChange('default', 1, 1, 5999);

// 4. 创建提交
const commitHash = repo.commit('初始化产品表', 'Alice', 'alice@example.com');
console.log(`提交成功: ${commitHash}`);
```

## 分支与合并

```typescript
import { DiffMergeEngine } from 'table-git';

repo.createBranch('promo');
repo.checkout('promo');
repo.addCellChange('default', 1, 1, 5799);
repo.commit('促销价', 'Alice', 'alice@example.com');

repo.checkout('main');

const diffEngine = new DiffMergeEngine(repo);
const mergeResult = diffEngine.merge('promo');

if (!mergeResult.success) {
  console.log('存在冲突，使用 ConflictResolver 处理');
}
```

## 下一步

- 深入了解主要 API：[`api-reference.md`](./api-reference.md)
- 探索更多使用场景：[`advanced-topics.md`](./advanced-topics.md)
- 输出不同格式的数据：[`formatters.md`](./formatters.md)
