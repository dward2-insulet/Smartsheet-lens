import { getContributorTasks, type ContributorTasks } from "./smartsheet-api";

export type { ContributorTasks };

export async function loadContributorTasks(): Promise<ContributorTasks> {
  return getContributorTasks();
}
