import {
  NodeEditor,
  type GraphDefinitionWithMetadata,
  type NodeEditorOptions,
  type EditorVariableState,
  type EditorVariableType
} from '../packages/table-node-editor/src';
import { FlowBuilder, NodeRuntime as MemoryNodeRuntime, TableGitAdapter, registerBuiltinNodes } from '../packages/table-memory-engine/src';
import type { ConversationTurn } from '../packages/table-memory-engine/src/core/types';
import type { TableSnapshot } from '../packages/table-memory-engine/src/core/table-adapter';
import { createSampleTable } from '../src/index.ts';

type RuntimeContract = NodeEditorOptions['runtime'];

const DEFAULT_CONVERSATION: ConversationTurn[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: '[[table:setCell sheet=default row=1 column=1 value="Node Editor"]]'
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: '[[table:setCell sheet=default row=2 column=2 value="42"]]'
  }
];

const DEFAULT_CONVERSATION_TEXT = JSON.stringify(DEFAULT_CONVERSATION, null, 2);

function buildDefaultGraph(): GraphDefinitionWithMetadata {
  const graph = FlowBuilder.create('node-editor-demo', 'Node Editor Demo', 'Loads, parses, applies, and formats changes.')
    .useNode('LoadTable', { sheetId: 'default' }, { id: 'load-table' })
    .useNode('ParseTags', {}, { id: 'parse-tags', connectFrom: ['load-table'] })
    .useNode('ApplyChanges', { sheetId: 'default' }, { id: 'apply-changes', connectFrom: ['parse-tags'] })
    .useNode('FormatPrompt', { formatter: 'prompt' }, { id: 'format-output', connectFrom: ['apply-changes'] })
    .build();

  return {
    ...graph,
    metadata: {
      layout: {
        'load-table': { x: 80, y: 120 },
        'parse-tags': { x: 360, y: 100 },
        'apply-changes': { x: 640, y: 120 },
        'format-output': { x: 920, y: 140 }
      }
    }
  };
}

function parseConversation(source: string): ConversationTurn[] {
  try {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Conversation must be an array of messages.');
    }
    return parsed as ConversationTurn[];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid conversation JSON.';
    throw new Error(message);
  }
}

function renderSnapshot(target: HTMLElement | null, snapshot?: TableSnapshot): void {
  if (!target) {
    return;
  }
  if (!snapshot) {
    target.innerHTML = '<em>No snapshot available.</em>';
    return;
  }

  const columns = snapshot.columns && snapshot.columns.length ? snapshot.columns : snapshot.rows[0]?.map((_, idx) => `C${idx}`) ?? [];
  const rows = snapshot.rows ?? [];

  const parts: string[] = [];
  parts.push('<table><thead><tr>');
  for (const col of columns) {
    parts.push(`<th>${String(col ?? '')}</th>`);
  }
  parts.push('</tr></thead><tbody>');
  for (const row of rows) {
    parts.push('<tr>');
    for (let c = 0; c < columns.length; c += 1) {
      parts.push(`<td>${row?.[c] ?? ''}</td>`);
    }
    parts.push('</tr>');
  }
  parts.push('</tbody></table>');
  target.innerHTML = parts.join('');
}

function renderOutput(target: HTMLElement | null, content: unknown): void {
  if (!target) {
    return;
  }
  target.textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => valuesEqual(value, b[index]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!valuesEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function formatVariableDisplay(type: EditorVariableType, value: unknown): string {
  if (typeof value === 'undefined') {
    return '未设置';
  }
  switch (type) {
    case 'string':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return String(value);
    case 'array':
    case 'object':
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}

function variableValueToInput(type: EditorVariableType, value: unknown): string {
  if (typeof value === 'undefined') {
    return '';
  }
  switch (type) {
    case 'string':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return String(value);
    case 'array':
    case 'object':
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}

function parseVariableInput(type: EditorVariableType, raw: string): unknown {
  if (type === 'string') {
    return raw;
  }
  const trimmed = raw.trim();
  if (!trimmed.length) {
    return undefined;
  }
  switch (type) {
    case 'boolean': {
      const normalized = trimmed.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false;
      }
      throw new Error('布尔值请输入 true/false 或 1/0。');
    }
    case 'number': {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
      throw new Error('请输入合法的数值。');
    }
    case 'array': {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        throw new Error('请提供 JSON 数组。');
      } catch (error) {
        const message = error instanceof Error ? error.message : '无法解析 JSON 数组。';
        throw new Error(message);
      }
    }
    case 'object': {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
        throw new Error('请提供 JSON 对象。');
      } catch (error) {
        const message = error instanceof Error ? error.message : '无法解析 JSON 对象。';
        throw new Error(message);
      }
    }
    default:
      return trimmed;
  }
}

function attachPromptFormatter(runtime: MemoryNodeRuntime): void {
  const registry = runtime.getFormatters();
  if (registry.has('prompt')) {
    return;
  }
  registry.register({
    name: 'prompt',
    title: 'Prompt Preview',
    description: 'Plain-text summary of the latest snapshot.',
    factory: ({ snapshot }) => {
      const header = snapshot.columns ?? [];
      const lines = snapshot.rows.map((row, index) => {
        const label = header.length ? header.map((col, colIndex) => `${col}: ${row?.[colIndex] ?? ''}`) : row.map((value, colIndex) => `C${colIndex}: ${value ?? ''}`);
        return `${index + 1}. ${label.join(' | ')}`;
      });
      return ['# Snapshot preview', ...lines].join('\n');
    }
  });
}

async function main(): Promise<void> {
  const container = document.getElementById('node-editor-root') as HTMLElement | null;
  const runButton = document.getElementById('btn-run-flow') as HTMLButtonElement | null;
  const resetButton = document.getElementById('btn-reset-graph') as HTMLButtonElement | null;
  const conversationInput = document.getElementById('conversation-input') as HTMLTextAreaElement | null;
  const statusEl = document.getElementById('run-status');
  const outputEl = document.getElementById('run-output');
  const debugEl = document.getElementById('debug-output');
  const snapshotEl = document.getElementById('snapshot-view');
  const variablesListEl = document.getElementById('variables-list') as HTMLDivElement | null;
  const variablesEmptyEl = document.getElementById('variables-empty') as HTMLDivElement | null;
  const variableForm = document.getElementById('variable-form') as HTMLFormElement | null;
  const variableNameInput = document.getElementById('variable-name') as HTMLInputElement | null;
  const variableTypeSelect = document.getElementById('variable-type') as HTMLSelectElement | null;
  const variableDefaultInput = document.getElementById('variable-default') as HTMLTextAreaElement | null;
  const variableSubmitButton = document.getElementById('variable-submit') as HTMLButtonElement | null;
  const variableCancelButton = document.getElementById('variable-cancel') as HTMLButtonElement | null;
  const variableErrorEl = document.getElementById('variable-error');
  const resetVariablesButton = document.getElementById('btn-reset-variables') as HTMLButtonElement | null;

  if (!container || !runButton || !conversationInput) {
    console.warn('Node editor demo elements are missing.');
    return;
  }

  conversationInput.value = DEFAULT_CONVERSATION_TEXT;

  const debugEntries: string[] = [];
  let editingVariableId: string | null = null;

  const showVariableError = (message?: string) => {
    if (variableErrorEl) {
      variableErrorEl.textContent = message ?? '';
    }
  };

  const renderDebugLogs = () => {
    if (!debugEl) {
      return;
    }
    if (!debugEntries.length) {
      debugEl.textContent = '暂无调试输出';
      return;
    }
    debugEl.textContent = debugEntries.join('\n\n');
  };

  const clearDebugLogs = () => {
    debugEntries.length = 0;
    renderDebugLogs();
  };

  const formatDebugValue = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'undefined') {
      return 'undefined';
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const recordDebugLog = (message: string, extras?: Record<string, unknown>) => {
    if (!extras || extras.nodeType !== 'DebugLog') {
      return;
    }
    const previewValue = typeof extras.preview === 'string' && extras.preview.trim().length > 0 ? extras.preview : undefined;
    const payload = previewValue ?? formatDebugValue(extras.value);
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const lines = [`[${timestamp}] ${message}`];
    if (!message.includes(payload)) {
      lines.push(payload);
    }
    debugEntries.push(lines.join('\n'));
    if (debugEntries.length > 30) {
      debugEntries.shift();
    }
    renderDebugLogs();
  };

  renderDebugLogs();

  const tableGit = createSampleTable();
  const adapter = new TableGitAdapter({ tableGit, defaultSheetId: 'default', autoInit: false });
  const runtime = new MemoryNodeRuntime({ adapter, logger: recordDebugLog });
  registerBuiltinNodes(runtime);
  attachPromptFormatter(runtime);

  const defaultGraph = buildDefaultGraph();
  const width = container.clientWidth || 960;
  const height = container.clientHeight || 640;

  const editor = await NodeEditor.create({
    container,
    runtime: runtime as unknown as RuntimeContract,
    width,
    height,
    graph: defaultGraph
  });

  const setVariableForm = (variable?: EditorVariableState) => {
    if (!variableForm || !variableNameInput || !variableTypeSelect || !variableDefaultInput || !variableSubmitButton || !variableCancelButton) {
      return;
    }

    if (variable) {
      editingVariableId = variable.id;
      variableNameInput.value = variable.name;
      variableTypeSelect.value = variable.type;
      variableDefaultInput.value = variableValueToInput(variable.type, variable.defaultValue);
      variableSubmitButton.textContent = '更新变量';
      variableCancelButton.disabled = false;
      variableCancelButton.style.visibility = 'visible';
    } else {
      editingVariableId = null;
      variableForm.reset();
      if (variableTypeSelect) {
        variableTypeSelect.value = 'string';
      }
      if (variableDefaultInput) {
        variableDefaultInput.value = '';
      }
      variableSubmitButton.textContent = '保存变量';
      variableCancelButton.disabled = true;
      variableCancelButton.style.visibility = 'hidden';
    }
    showVariableError('');
  };

  const renderVariables = (variables?: EditorVariableState[]) => {
    if (!variablesListEl || !variablesEmptyEl) {
      return;
    }
    const list = variables ?? editor.listVariables();
    variablesListEl.innerHTML = '';
    variablesEmptyEl.style.display = list.length ? 'none' : 'block';

    for (const variable of list) {
      const currentValue = typeof variable.value === 'undefined' ? variable.defaultValue : variable.value;
      const dirty = !valuesEqual(currentValue, variable.defaultValue);

      const item = document.createElement('div');
      item.className = 'variable-item';

      const header = document.createElement('div');
      header.className = 'variable-header';
      const title = document.createElement('span');
      title.textContent = variable.name;
      const headerRight = document.createElement('div');
      headerRight.style.display = 'flex';
      headerRight.style.alignItems = 'center';
      headerRight.style.gap = '6px';

      const typeBadge = document.createElement('span');
      typeBadge.className = 'variable-type-badge';
      typeBadge.textContent = variable.type;
      headerRight.appendChild(typeBadge);

      if (dirty) {
        const dirtyBadge = document.createElement('span');
        dirtyBadge.className = 'variable-dirty';
        dirtyBadge.textContent = '已覆盖';
        headerRight.appendChild(dirtyBadge);
      }

      header.appendChild(title);
      header.appendChild(headerRight);
      item.appendChild(header);

      const metaRow = document.createElement('div');
      metaRow.className = 'variable-meta';
      const defaultSpan = document.createElement('span');
      defaultSpan.textContent = `默认：${formatVariableDisplay(variable.type, variable.defaultValue)}`;
      const currentSpan = document.createElement('span');
      currentSpan.textContent = `当前：${formatVariableDisplay(variable.type, currentValue)}`;
      if (dirty) {
        currentSpan.classList.add('variable-dirty');
      }
      metaRow.appendChild(defaultSpan);
      metaRow.appendChild(currentSpan);
      item.appendChild(metaRow);

      const editorRow = document.createElement('div');
      editorRow.className = 'variable-value-editor';
      const valueInput = document.createElement(variable.type === 'array' || variable.type === 'object' ? 'textarea' : 'input') as HTMLInputElement | HTMLTextAreaElement;
      valueInput.value = variableValueToInput(variable.type, currentValue);
      valueInput.placeholder = '根据类型输入当前值';
      if ('rows' in valueInput) {
        (valueInput as HTMLTextAreaElement).rows = variable.type === 'array' || variable.type === 'object' ? 3 : 2;
      }

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.textContent = '应用当前值';
      applyBtn.className = 'secondary';
      applyBtn.addEventListener('click', () => {
        try {
          const parsed = parseVariableInput(variable.type, valueInput.value);
          editor.setVariableValue(variable.id, parsed);
          showVariableError('');
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          showVariableError(message);
        }
      });

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.textContent = '恢复默认';
      resetBtn.className = 'secondary';
      resetBtn.addEventListener('click', () => {
        try {
          editor.setVariableValue(variable.id, variable.defaultValue);
          showVariableError('');
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          showVariableError(message);
        }
      });

      editorRow.appendChild(valueInput);
      editorRow.appendChild(applyBtn);
      editorRow.appendChild(resetBtn);
      item.appendChild(editorRow);

      const actionsRow = document.createElement('div');
      actionsRow.className = 'variable-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'secondary';
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', () => {
        setVariableForm(variable);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'secondary';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', () => {
        if (!confirm(`确定删除变量 ${variable.name} 吗？`)) {
          return;
        }
        try {
          editor.deleteVariable(variable.id);
          if (editingVariableId === variable.id) {
            setVariableForm();
          }
          showVariableError('');
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          showVariableError(message);
        }
      });

      actionsRow.appendChild(editBtn);
      actionsRow.appendChild(deleteBtn);
      item.appendChild(actionsRow);

      variablesListEl.appendChild(item);
    }

    if (editingVariableId) {
      const editingVariable = list.find(variable => variable.id === editingVariableId);
      if (editingVariable) {
        setVariableForm(editingVariable);
      } else {
        setVariableForm();
      }
    }
  };

  const disposeVariables = editor.onVariablesChanged(renderVariables);
  setVariableForm();

  if (variableForm && variableNameInput && variableTypeSelect && variableDefaultInput && variableSubmitButton) {
    variableForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = variableNameInput.value.trim();
      if (!name) {
        showVariableError('变量名称不能为空。');
        return;
      }

      const type = (variableTypeSelect.value as EditorVariableType) ?? 'string';
      let defaultValue: unknown;
      try {
        defaultValue = parseVariableInput(type, variableDefaultInput.value);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showVariableError(message);
        return;
      }

      try {
        if (editingVariableId) {
          editor.updateVariable(editingVariableId, { name, type, defaultValue });
        } else {
          editor.createVariable({ name, type, defaultValue });
        }
        setVariableForm();
        showVariableError('');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showVariableError(message);
      }
    });
  }

  if (variableCancelButton) {
    variableCancelButton.addEventListener('click', () => {
      setVariableForm();
      showVariableError('');
    });
  }

  if (resetVariablesButton) {
    resetVariablesButton.addEventListener('click', () => {
      editor.resetVariables();
      showVariableError('');
    });
  }

  const refreshSnapshot = async () => {
    const snapshot = await adapter.snapshot('default', { includeMetadata: true });
    renderSnapshot(snapshotEl, snapshot);
  };

  const setStatus = (message: string, tone: 'info' | 'error' = 'info') => {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.setAttribute('data-tone', tone);
  };

  setStatus('Loaded default graph. Click Run Flow to execute.');
  await refreshSnapshot();

  runButton.addEventListener('click', async () => {
    try {
      clearDebugLogs();
      setStatus('Running flow...');
      runButton.disabled = true;
      const conversation = parseConversation(conversationInput.value);
      const result = await editor.run({
        conversation,
        sheetId: 'default',
        services: {}
      });

      const formatNodeOutput = result.state.get('format-output') as Record<string, unknown> | undefined;
      const formatted = formatNodeOutput?.formatted;
      renderOutput(outputEl, typeof formatted === 'undefined' ? '(无格式化输出)' : formatted);
      await refreshSnapshot();
      setStatus('Flow executed successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Flow failed.';
      renderOutput(outputEl, message);
      setStatus(message, 'error');
    } finally {
      runButton.disabled = false;
    }
  });

  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      editor.loadGraph(buildDefaultGraph());
      conversationInput.value = DEFAULT_CONVERSATION_TEXT;
      renderOutput(outputEl, '');
      clearDebugLogs();
      setVariableForm();
      showVariableError('');
      await refreshSnapshot();
      setStatus('Graph reset to defaults.');
    });
  }

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target === container && entry.contentRect) {
        editor.resize(entry.contentRect.width, entry.contentRect.height);
      }
    }
  });
  resizeObserver.observe(container);

  window.addEventListener('beforeunload', () => {
    resizeObserver.disconnect();
    disposeVariables();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  void main();
});
