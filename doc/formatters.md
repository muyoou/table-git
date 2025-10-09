# 格式化器体系

`table-git` 提供一套函数式格式化器，可将仓库数据转换为 CSV、JSON、HTML 等输出格式，同时支持自定义扩展。

## 数据适配器

```typescript
import { TableDataAdapter } from 'table-git';

const adapter = new TableDataAdapter(repo);
const data = adapter.build({ includeStaged: false });
```

- 默认输出包含列、行元数据以及二维单元格值矩阵。
- `build` 方法支持选项：
  - `includeStaged`：是否包含暂存区尚未提交的变更。
  - `sheets`：限定需要导出的工作表名称数组。

## FormatterRegistry

```typescript
import { FormatterRegistry, FunctionFormatter } from 'table-git';

const registry = new FormatterRegistry();
registry.register(new FunctionFormatter({
  name: 'csv',
  format: csvFormatter
}));
```

- `register(formatter)`：注册格式化器，`name` 字段将作为调用时的唯一标识。
- `format(name, data, options?)`：执行对应格式化器并返回结果。
- `list()`：查看已注册格式化器。

## 内置格式化器

| 名称 | 说明 | 常用选项 |
| ---- | ---- | -------- |
| `csvFormatter` | 生成 CSV 字符串，兼容 Excel 等工具。 | `includeHeader`, `quoteText`, `delimiter` |
| `jsonFormatter` | 输出 JSON，可选择 `rows` 或 `columns` 结构。 | `shape`, `space` |
| `htmlFormatter` | 输出包含 `thead` / `tbody` 的表格 HTML。 | `includeHeader`, `className` |

示例：

```typescript
import {
  FormatterRegistry,
  FunctionFormatter,
  csvFormatter,
  jsonFormatter,
  htmlFormatter
} from 'table-git';

const registry = new FormatterRegistry();
registry.register(new FunctionFormatter({ name: 'csv', format: csvFormatter }));
registry.register(new FunctionFormatter({ name: 'json', format: jsonFormatter }));
registry.register(new FunctionFormatter({ name: 'html', format: htmlFormatter }));

const csv = registry.format('csv', data, { includeHeader: true });
const json = registry.format('json', data, { shape: 'rows', space: 2 });
const html = registry.format('html', data);
```

## 自定义格式化器

任何遵循 `FormatterFunction` 类型签名的函数都可以注册。签名如下：

```typescript
type FormatterFunction = (data: TableData, options?: Record<string, unknown>) => unknown;
```

例如导出 Markdown 表格：

```typescript
import {
  TableData,
  FormatterRegistry,
  FunctionFormatter
} from 'table-git';

const markdownTableFormatter = (data: TableData) => {
  const [header, ...rows] = data.cells;
  const separator = header.map(() => '---');
  const toRow = (arr: (string | number | boolean | null)[]) =>
    `| ${arr.map(value => value ?? '').join(' | ')} |`;

  return [header, separator, ...rows].map(toRow).join('\n');
};

const registry = new FormatterRegistry();
registry.register(new FunctionFormatter({
  name: 'markdown',
  format: markdownTableFormatter
}));

const markdown = registry.format('markdown', data);
```

## 错误处理建议

- 注册时若重复名称会抛出异常，可使用 `registry.has(name)` 预先检查。
- 格式化函数内部发生的异常将直接冒泡，建议在业务层捕获并提示。

## 参考资料

- `TableData` 结构定义：见 [`types/index.ts`](../src/types/index.ts)。
- 更复杂的示例：查看 `examples/usage-examples.ts`。
