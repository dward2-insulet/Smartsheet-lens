import { getSheetAsObjects } from "./smartsheet-api";
import { SMARTSHEET_CONFIG } from "./sheetlens-config";
/**
 * Load all four registers from the live Smartsheet API and overwrite the
 * in-memory store. Call this once after sign-in.
 */
export async function loadLiveData() {
  const [projects, tasks, requests, people] = await Promise.all([
    getSheetAsObjects(SMARTSHEET_CONFIG.sheets.projects),
    getSheetAsObjects(SMARTSHEET_CONFIG.sheets.tasks),
    getSheetAsObjects(SMARTSHEET_CONFIG.sheets.requests),
    getSheetAsObjects(SMARTSHEET_CONFIG.sheets.people),
  ]);

  // Each array now contains objects keyed by Smartsheet column title.
  // Columns titles match your CSVs exactly, so we can reuse the existing
  // CSV parsers.
  // TODO (Step 5): map these into INSULET_PROJECTS etc. For now, log them
  // so you can inspect the shape in the browser console.
  console.log("[SheetLens] projects:", projects);
  console.log("[SheetLens] tasks:", tasks);
  console.log("[SheetLens] requests:", requests);
  console.log("[SheetLens] people:", people);

  return { projects, tasks, requests, people };
}