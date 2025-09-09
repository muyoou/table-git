import { createSampleTable } from '../src/utils/factory';
import { TableDataAdapter } from '../src/formatters/adapter';
import { FormatterRegistry, FunctionFormatter } from '../src/formatters/function-formatter';
import { csvFormatter, jsonFormatter, htmlFormatter } from '../src/formatters/builtin';

describe('Function-based formatters', () => {
  test('csv/json/html produce outputs', () => {
    const repo = createSampleTable();
    const adapter = new TableDataAdapter(repo);
    const data = adapter.build();

    const registry = new FormatterRegistry();
    registry.register(new FunctionFormatter({ name: 'csv', format: csvFormatter }));
    registry.register(new FunctionFormatter({ name: 'json', format: jsonFormatter }));
    registry.register(new FunctionFormatter({ name: 'html', format: htmlFormatter }));

    const csv = registry.format('csv', data, { includeHeader: true, quoteText: true });
    const json = registry.format('json', data, { shape: 'rows', space: 0 });
    const html = registry.format('html', data, { tableClass: 'tg' });

    expect(csv).toContain('产品名称');
    expect(json).toContain('rows');
    expect(html).toContain('<table');
  });
});
