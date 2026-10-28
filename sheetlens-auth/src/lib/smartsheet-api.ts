import { getAccessToken } from "./smartsheet-auth";
import { SMARTSHEET_CONFIG } from "./config";

async function sApi<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const r = await fetch(`${SMARTSHEET_CONFIG.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Smartsheet API ${r.status}: ${body}`);
  }
  return (await r.json()) as T;
}

export interface SheetColumn {
  id: number;
  index: number;
  title: string;
  type: string;
}
export interface SheetCell {
  columnId: number;
  value?: string | number | boolean | null;
  displayValue?: string;
}
export interface SheetRow {
  id: number;
  rowNumber: number;
  cells: SheetCell[];
}
export interface Sheet {
  id: number;
  name: string;
  columns: SheetColumn[];
  rows: SheetRow[];
}
export interface SheetData {
  columns: string[];
  rows: Record<string, unknown>[];
}

/**
 * Returns the full sheet including columns + rows.
 * The rows come with cells keyed by columnId; use rowToObject() to flatten.
 */
export async function getSheet(sheetId: string): Promise<Sheet> {
  return sApi(`/sheets/${sheetId}?include=objectValue&level=1&pageSize=5000`);
}

export async function getCurrentUser(): Promise<unknown> {
  return sApi(`/users/me`);
}

/**
 * Flattens a Smartsheet row into { ColumnTitle: value } using the sheet's columns.
 */
export function rowToObject(row: SheetRow, columns: SheetColumn[]): Record<string, unknown> {
  const byId = new Map(columns.map((c) => [c.id, c.title]));
  const obj: Record<string, unknown> = { _rowId: row.id, _rowNumber: row.rowNumber };
  for (const cell of row.cells) {
    const title = byId.get(cell.columnId);
    if (title) obj[title] = cell.displayValue ?? cell.value ?? "";
  }
  return obj;
}

/**
 * Convenience: fetch a sheet and return every row as a flat object array.
 */
export async function getSheetAsObjects(sheetId: string): Promise<Record<string, unknown>[]> {
  const sheet = await getSheet(sheetId);
  return sheet.rows.map((r) => rowToObject(r, sheet.columns));
}

export async function getSheetData(sheetId: string): Promise<SheetData> {
  const sheet = await getSheet(sheetId);
  return {
    columns: sheet.columns.map((column) => column.title),
    rows: sheet.rows.map((row) => rowToObject(row, sheet.columns)),
  };
}