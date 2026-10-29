import { SMARTSHEET_CONFIG } from "./config";
import { getAccessToken } from "./smartsheet-auth";

export interface ContributorTaskRow extends Record<string, unknown> {
  _rowId: number;
  _rowNumber: number;
}

export interface ContributorTasks {
  user: {
    email: string;
    name: string;
  };
  tasks: {
    columns: string[];
    rows: ContributorTaskRow[];
  };
  unmatchedDriverCount: number;
}

export async function getContributorTasks(): Promise<ContributorTasks> {
  const token = await getAccessToken();
  const response = await fetch(`${SMARTSHEET_CONFIG.apiBaseUrl}/my-tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body;
    try {
      const error: unknown = JSON.parse(body);
      if (
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        typeof error.error === "string"
      ) {
        message = error.error;
      }
    } catch {
      if (!body) message = response.statusText;
    }
    throw new Error(`Could not load My Tasks (${response.status}): ${message}`);
  }

  return (await response.json()) as ContributorTasks;
}
