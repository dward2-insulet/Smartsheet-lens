import { getAccessToken } from "./smartsheet-auth";

const BASE = "https://api.smartsheet.com/2.0";

async function sApi(path: string): Promise<any> {
  const token = await getAccessToken();
  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Smartsheet API ${r.status}: ${body}`);
  }
  return r.json();
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

/**
 * Returns the full sheet including columns + rows.
 * The rows come with cells keyed by columnId; use rowToObject() to flatten.
 */
export async function getSheet(sheetId: string): Promise<Sheet> {
  return sApi(`/sheets/${sheetId}?include=objectValue&level=1&pageSize=5000`);
}

export async function getCurrentUser(): Promise<any> {
  return sApi(`/users/me`);
}

/**
 * Flattens a Smartsheet row into { ColumnTitle: value } using the sheet's columns.
 */
export function rowToObject(row: SheetRow, columns: SheetColumn[]): Record<string, any> {
  const byId = new Map(columns.map((c) => [c.id, c.title]));
  const obj: Record<string, any> = { _rowId: row.id, _rowNumber: row.rowNumber };
  for (const cell of row.cells) {
    const title = byId.get(cell.columnId);
    if (title) obj[title] = cell.displayValue ?? cell.value ?? "";
  }
  return obj;
}

/**
 * Convenience: fetch a sheet and return every row as a flat object array.
 */
export async function getSheetAsObjects(sheetId: string): Promise<Record<string, any>[]> {
  const sheet = await getSheet(sheetId);
  return sheet.rows.map((r) => rowToObject(r, sheet.columns));
}