# 高级主题

本节介绍 `table-git` 中更深入的用法，包括分支策略、冲突解决、撤销重做与性能建议。

## 分支与协作策略

### Detached HEAD 模式

当使用提交哈希执行 `checkout` 时，仓库会进入 `detached HEAD`：

- 可读取历史，但无法直接提交。
- 若需继续在此基础上开发，调用 `createBranch` 建立新分支。

### 推荐实践

1. **主线稳定**：保持 `main` 仅合并通过审查的提交。
2. **特性分支**：以 `feature/<name>` 命名，方便筛选与清理。
3. **数据审查**：在合并前使用 `diff` 或格式化器导出差异结果进行评审。

## 差异与冲突

```typescript
import { DiffMergeEngine, ConflictResolver } from 'table-git';

const engine = new DiffMergeEngine(repo);
const diff = engine.diff('feature/forecast');

const result = engine.merge('feature/forecast');
if (!result.success && result.conflicts) {
  const resolver = new ConflictResolver();
  const resolved = resolver.batchResolve(result.conflicts, 'current');
  if (!resolved.every(Boolean)) {
    // fallback to手动处理
  }
}
```

- `diff` 返回结构化的差异报告，包含单元格与结构变更。
- `merge` 在冲突时会保留冲突列表，便于逐条处理。
- `ConflictResolver` 支持策略：
  - `current`：保留当前分支。
  - `incoming`：接受目标分支。
  - `merge`：针对单元格尝试合并（例如公式或字符串拼接）。

## 撤销与重做

`UndoManager` 允许在工作区级别执行撤销/重做栈管理。

```typescript
import { UndoManager } from 'table-git';

const undoManager = new UndoManager(repo);
undoManager.recordSnapshot('添加促销价');

repo.addCellChange('default', 1, 1, 5799);

undoManager.undo(); // 回到录制时的状态
undoManager.redo(); // 再次应用修改
```

> 撤销仅针对尚未提交的工作区状态；提交后需通过分支或历史恢复。

## 性能与内存

- **深克隆开销**：`deepClone` 对复杂结构使用惰性缓存与 Map/Set 复制，尽量避免过度频繁的全量克隆。
- **哈希计算**：`calculateHash` 会对对象排序与标准化，建议在批量重算时做好节流。
- **大数据表**：可通过拆分多个工作表或按模块划分分支降低单次提交压力。

## 集成建议

| 场景 | 建议 |
| ---- | ---- |
| Web 前端 | 通过构建工具打包 `table-git`，结合 Web Worker 处理重计算。 |
| Node.js 服务 | 在服务端执行合并与冲突解决，向客户端返回差异摘要。 |
| Electron/桌面端 | 将 `UndoManager` 与前端 UI 绑定，实现完整的撤销/重做体验。 |

## 调试工具

- `status()`：查看暂存区与 HEAD 的差异概览。
- `getStagedChanges()`：直接读取准备提交的变更列表。
- `getCommitHistory()`：用于生成审计日志或提交列表。

## 进一步阅读

- API 详情：[`api-reference.md`](./api-reference.md)
- 格式化输出：[`formatters.md`](./formatters.md)
- 示例代码：`examples/usage-examples.ts`
