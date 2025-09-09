import { FormatterFunction, TableData } from './types';

// CSV 格式化
export interface CsvOptions {
  delimiter?: string; // 默认为 ,
  newline?: string;   // 默认为 \n
  // 是否包含表头（若存在）
  includeHeader?: boolean;
  // 文本是否需要引号包裹
  quoteText?: boolean;
}

function escapeCsvValue(val: any, delimiter: string, quoteText: boolean): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'string' ? val : String(val);
  const mustQuote = quoteText || str.includes(delimiter) || /[\r\n]/.test(str) || str.includes('"');
  if (!mustQuote) return str;
  return '"' + str.replace(/"/g, '""') + '"';
}

export const csvFormatter: FormatterFunction<CsvOptions, string> = (data, options) => {
  const delimiter = options?.delimiter ?? ',';
  const newline = options?.newline ?? '\n';
  const includeHeader = options?.includeHeader ?? true;
  const quoteText = options?.quoteText ?? false;

  const lines: string[] = [];
  if (includeHeader && data.header.length) {
    lines.push(data.header.map(v => escapeCsvValue(v, delimiter, quoteText)).join(delimiter));
  }
  for (const row of data.rows) {
    lines.push((row ?? []).map(v => escapeCsvValue(v, delimiter, quoteText)).join(delimiter));
  }
  return lines.join(newline);
};

// JSON 格式化
export interface JsonOptions {
  space?: number;
  // 输出对象形状：matrix | rows | detailed
  shape?: 'matrix' | 'rows' | 'detailed';
}

export const jsonFormatter: FormatterFunction<JsonOptions, string> = (data, options) => {
  const space = options?.space ?? 2;
  const shape = options?.shape ?? 'rows';

  let payload: any;
  switch (shape) {
    case 'matrix':
      payload = data.matrix;
      break;
    case 'detailed':
      payload = data;
      break;
    case 'rows':
    default:
      payload = {
        header: data.header,
        rows: data.rows
      };
      break;
  }
  return JSON.stringify(payload, null, space);
};

// HTML 表格格式化
export interface HtmlOptions {
  tableClass?: string;
  includeHeader?: boolean;
  escapeHtml?: boolean;
}

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const htmlFormatter: FormatterFunction<HtmlOptions, string> = (data, options) => {
  const tableClass = options?.tableClass ?? 'table-git';
  const includeHeader = options?.includeHeader ?? true;
  const esc = options?.escapeHtml ?? true;

  const escVal = (v: any) => (esc ? escapeHtml(v) : (v ?? ''));

  const parts: string[] = [];
  parts.push(`<table class="${tableClass}">`);
  if (includeHeader && data.header.length) {
    parts.push('<thead><tr>');
    for (const h of data.header) parts.push(`<th>${escVal(h)}</th>`);
    parts.push('</tr></thead>');
  }
  parts.push('<tbody>');
  for (const row of data.rows) {
    parts.push('<tr>');
    for (const cell of (row ?? [])) parts.push(`<td>${escVal(cell)}</td>`);
    parts.push('</tr>');
  }
  parts.push('</tbody></table>');
  return parts.join('');
};
