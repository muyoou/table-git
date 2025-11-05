export interface TableCellPayload {
  row: number;
  column: number;
  value: unknown;
  meta?: Record<string, unknown>;
}

export interface TableChangeCommand {
  type: 'set' | 'delete' | 'insertRow' | 'insertColumn' | 'removeRow' | 'removeColumn';
  sheetId?: string;
  payload: TableCellPayload | Record<string, unknown>;
  tags?: string[];
}

export interface TableSnapshot {
  sheetId: string;
  rows: Array<Array<unknown>>;
  columns?: string[];
  metadata?: Record<string, unknown>;
  revision?: string;
  generatedAt: string;
}

export interface ApplyChangesOptions {
  author?: string;
  message?: string;
  dryRun?: boolean;
  extras?: Record<string, unknown>;
}

export interface SnapshotOptions {
  format?: 'default' | 'wide' | 'long';
  includeMetadata?: boolean;
  includeHistory?: boolean;
}

export interface TableAdapter {
  load(sheetId: string): Promise<TableSnapshot>;
  applyChanges(sheetId: string, changes: TableChangeCommand[], options?: ApplyChangesOptions): Promise<TableSnapshot>;
  snapshot(sheetId: string, options?: SnapshotOptions): Promise<TableSnapshot>;
}

export type TableAdapterFactory = (options?: Record<string, unknown>) => TableAdapter;
