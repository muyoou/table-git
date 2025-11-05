import type { CellValue, ColumnMetadata, RowMetadata } from 'table-git';
import { TableGit } from 'table-git';
import type {
  ApplyChangesOptions,
  SnapshotOptions,
  TableAdapter,
  TableChangeCommand,
  TableSnapshot,
  TableCellPayload
} from '../core/table-adapter';

export interface TableGitAdapterOptions {
  tableGit?: TableGit;
  defaultSheetId?: string;
  defaultAuthor?: string;
  defaultEmail?: string;
  defaultCommitMessage?: string | ((commands: TableChangeCommand[]) => string);
  autoInit?: boolean;
  initBranch?: string;
  initSheetName?: string;
}

interface NormalizedCellPayload extends TableCellPayload {
  value: CellValue;
}

export class TableGitAdapter implements TableAdapter {
  private readonly engine: TableGit;
  private readonly defaultSheetId?: string;
  private readonly author: string;
  private readonly email: string;
  private readonly defaultCommitMessage?: string | ((commands: TableChangeCommand[]) => string);

  constructor(private readonly options: TableGitAdapterOptions = {}) {
    this.engine = options.tableGit ?? new TableGit();
    this.defaultSheetId = options.defaultSheetId ?? options.initSheetName;
    this.author = options.defaultAuthor ?? 'Memory Engine';
    this.email = options.defaultEmail ?? 'memory-engine@tablegit.local';
    this.defaultCommitMessage = options.defaultCommitMessage;

    if (!options.tableGit && options.autoInit !== false) {
      this.engine.init(options.initBranch ?? 'main', {
        defaultSheetName: options.initSheetName ?? this.defaultSheetId ?? 'memory',
        createDefaultSheet: true
      });
    }
  }

  async load(sheetId: string): Promise<TableSnapshot> {
    const targetSheet = sheetId ?? this.defaultSheetId;
    if (!targetSheet) {
      throw new Error('TableGitAdapter.load requires a sheet id.');
    }

    await this.ensureSheet(targetSheet);
    return this.snapshot(targetSheet);
  }

  async applyChanges(sheetId: string, changes: TableChangeCommand[], options: ApplyChangesOptions = {}): Promise<TableSnapshot> {
    const targetSheet = sheetId ?? this.defaultSheetId;
    if (!targetSheet) {
      throw new Error('TableGitAdapter.applyChanges requires a sheet id.');
    }

    await this.ensureSheet(targetSheet);
    const applied: TableChangeCommand[] = [];

    for (const change of changes) {
      const sheetTarget = change.sheetId ?? targetSheet;
      const result = this.applyCommand(sheetTarget, change);
      if (result) {
        applied.push(result);
      }
    }

    if (options.dryRun) {
      this.engine.reset();
      return this.snapshot(targetSheet);
    }

    await this.commitIfNeeded(options, applied);
    return this.snapshot(targetSheet);
  }

  async snapshot(sheetId: string, options: SnapshotOptions = {}): Promise<TableSnapshot> {
    const targetSheet = sheetId ?? this.defaultSheetId;
    if (!targetSheet) {
      throw new Error('TableGitAdapter.snapshot requires a sheet id.');
    }

    const sheet = this.engine.getPreviewSheet(targetSheet, { includeStaged: true }) ?? this.engine.getSheetSnapshot(targetSheet);
    if (!sheet) {
      throw new Error(`Sheet '${targetSheet}' could not be found.`);
    }

    const bounds = sheet.getBounds();
    const columnOrder = sheet.structure.getColumnIds();
    const rowOrder = sheet.structure.getRowIds();

    const rows: Array<Array<unknown>> = [];
    if (bounds) {
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
        const rowValues: unknown[] = [];
        for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
          const cell = this.engine.getCellFromTree(sheet, row, col, targetSheet);
          rowValues.push(cell ? cell.value : null);
        }
        rows.push(rowValues);
      }
    }

    const columns = columnOrder.length
      ? columnOrder.map((id: string) => sheet.structure.getColumn(id)?.description ?? id)
      : this.generateColumnHeaders(bounds);

    const revision = this.engine.getCurrentCommitHash();

    return {
      sheetId: targetSheet,
      rows,
      columns,
      metadata: {
        columnOrder,
        rowOrder,
        structure: options.includeMetadata ? sheet.structure.toJSON() : undefined
      },
      revision: revision ?? undefined,
      generatedAt: new Date().toISOString()
    };
  }

  private applyCommand(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    switch (command.type) {
      case 'set':
        return this.applySet(sheetId, command);
      case 'delete':
        return this.applyDelete(sheetId, command);
      case 'insertRow':
        return this.applyInsertRow(sheetId, command);
      case 'removeRow':
        return this.applyRemoveRow(sheetId, command);
      case 'insertColumn':
        return this.applyInsertColumn(sheetId, command);
      case 'removeColumn':
        return this.applyRemoveColumn(sheetId, command);
      default:
        return undefined;
    }
  }

  private applySet(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    const payload = command.payload as Partial<NormalizedCellPayload>;
    if (typeof payload.row !== 'number' || typeof payload.column !== 'number') {
      return undefined;
    }
    this.engine.addCellChange(sheetId, payload.row, payload.column, payload.value ?? null);
    return command;
  }

  private applyDelete(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    const payload = command.payload as Partial<TableCellPayload>;
    if (typeof payload.row !== 'number' || typeof payload.column !== 'number') {
      return undefined;
    }
    this.engine.deleteCellChange(sheetId, payload.row, payload.column);
    return command;
  }

  private applyInsertRow(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    const payload = command.payload as { index?: number; values?: unknown[]; meta?: Record<string, unknown> };
    const index = typeof payload.index === 'number' && payload.index >= 0
      ? payload.index
      : this.engine.getNextRowOrder(sheetId, { includeStaged: true });

    const rowMeta: RowMetadata = {
      id: `row_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      order: index
    };

    this.engine.addRow(sheetId, rowMeta);

    if (Array.isArray(payload.values)) {
      payload.values.forEach((value, column) => {
        this.engine.addCellChange(sheetId, index, column, value as CellValue);
      });
    }
    return command;
  }

  private applyRemoveRow(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    const payload = command.payload as { index?: number };
    if (typeof payload.index !== 'number' || payload.index < 0) {
      return undefined;
    }
    this.engine.deleteRowByIndex(sheetId, payload.index, { includeStaged: true });
    return command;
  }

  private applyInsertColumn(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    const payload = command.payload as { index?: number; meta?: Partial<ColumnMetadata>; values?: unknown[] };
    const order = typeof payload.index === 'number' && payload.index >= 0
      ? payload.index
      : this.engine.getNextColumnOrder(sheetId, { includeStaged: true });

    const column: ColumnMetadata = {
      id: payload.meta?.id ?? `col_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      order,
      description: payload.meta?.description,
      dataType: payload.meta?.dataType ?? 'mixed',
      width: payload.meta?.width ?? 120,
      hidden: payload.meta?.hidden ?? false,
      constraints: payload.meta?.constraints
    };

    this.engine.addColumn(sheetId, column);

    if (Array.isArray(payload.values)) {
      payload.values.forEach((value, row) => {
        this.engine.addCellChange(sheetId, row, order, value as CellValue);
      });
    }
    return command;
  }

  private applyRemoveColumn(sheetId: string, command: TableChangeCommand): TableChangeCommand | undefined {
    const payload = command.payload as { index?: number };
    if (typeof payload.index !== 'number' || payload.index < 0) {
      return undefined;
    }
    this.engine.deleteColumnByIndex(sheetId, payload.index, { includeStaged: true });
    return command;
  }

  private async commitIfNeeded(options: ApplyChangesOptions, changes: TableChangeCommand[]): Promise<void> {
    if (this.engine.getStagedChanges().length === 0) {
      return;
    }

    const author = options.author ?? this.author;
    const message = options.message
      ?? (typeof this.defaultCommitMessage === 'function'
        ? this.defaultCommitMessage(changes)
        : this.defaultCommitMessage)
      ?? `Apply ${changes.length} change(s)`;

    this.engine.commit(message, author, this.email);
  }

  private async ensureSheet(sheetId: string): Promise<void> {
    if (this.engine.hasSheet(sheetId, { includeStaged: true })) {
      return;
    }
    this.engine.createSheet(sheetId, { order: this.engine.listSheets({ includeStaged: true }).length });
    this.engine.commit(`Create sheet ${sheetId}`, this.author, this.email);
  }

  private generateColumnHeaders(bounds: { minRow: number; maxRow: number; minCol: number; maxCol: number } | null): string[] {
    if (!bounds) {
      return [];
    }
    const headers: string[] = [];
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      headers.push(`C${col}`);
    }
    return headers;
  }
}
