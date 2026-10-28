import { getSheetData, type SheetData } from "./smartsheet-api";
import { SMARTSHEET_CONFIG } from "./config";

export interface LiveData {
  projects: SheetData;
  tasks: SheetData;
  requests: SheetData;
  people: SheetData;
}

export async function loadLiveData(): Promise<LiveData> {
  const [projects, tasks, requests, people] = await Promise.all([
    getSheetData(SMARTSHEET_CONFIG.sheets.projects),
    getSheetData(SMARTSHEET_CONFIG.sheets.tasks),
    getSheetData(SMARTSHEET_CONFIG.sheets.requests),
    getSheetData(SMARTSHEET_CONFIG.sheets.people),
  ]);

  return { projects, tasks, requests, people };
}