import { useCallback, useEffect, useState } from "react";
import { ClipboardList, LayoutDashboard, LogOut, RefreshCw } from "lucide-react";
import { signOut } from "../lib/smartsheet-auth";
import { loadContributorTasks, type ContributorTasks } from "../lib/sheetlens-data";

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function HomePage() {
  const [data, setData] = useState<ContributorTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadContributorTasks());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load your tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rows = data?.tasks.rows ?? [];
  const columns = data?.tasks.columns ?? [];

  return (
    <main className="app-page">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="SheetLens home">
          <span className="brand-mark brand-mark-small">
            <LayoutDashboard size={19} />
          </span>
          <span>SheetLens</span>
        </a>
        <div className="topbar-actions">
          <button
            className="button button-quiet"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
          <button className="button button-quiet" onClick={signOut}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <section className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PROJECT ENGINEERING</p>
            <h1>My Tasks</h1>
            <p className="muted">
              Tasks where you are the Driver
              {data ? ` · ${data.user.email}` : ""}
            </p>
          </div>
          <div className="status-pill">
            <span
              className={`status-dot ${loading ? "status-loading" : error ? "status-error" : ""}`}
            />
            {loading ? "Checking access" : error ? "Needs attention" : "Connected"}
          </div>
        </div>

        <section className="data-card" aria-label="My assigned tasks">
          <div className="data-card-heading">
            <div className="data-title">
              <ClipboardList size={18} />
              <h2>Assigned to me</h2>
            </div>
            {!loading && !error && (
              <span className="muted">{rows.length} tasks</span>
            )}
          </div>

          {error ? (
            <div className="message-panel error-panel" role="alert">
              <h3>Couldn’t load your tasks</h3>
              <p>{error}</p>
              <button className="button button-primary" onClick={() => void refresh()}>
                Try again
              </button>
            </div>
          ) : loading && !data ? (
            <div className="message-panel">
              <div className="spinner" />
              <p>Checking your role and assigned tasks…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="message-panel">
              <p>You don’t have any tasks assigned as Driver.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {columns.map((column) => <th key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._rowId}>
                      {columns.map((column) => (
                        <td key={column} title={formatCell(row[column])}>
                          {formatCell(row[column]) || <span className="empty-cell">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {data && data.unmatchedDriverCount > 0 && (
          <p className="footnote warning-note" role="status">
            {data.unmatchedDriverCount} Driver assignment(s) did not include a contact email,
            so they could not be matched to your account.
          </p>
        )}
        <p className="footnote">
          This first contributor view is read-only. Status, Contributor(s), and Due Date editing
          will be added after this assignment view is verified.
        </p>
      </section>
    </main>
  );
}
