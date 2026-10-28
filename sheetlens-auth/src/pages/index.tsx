import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, LogOut, RefreshCw, Rows3 } from "lucide-react";
import { signOut } from "../lib/smartsheet-auth";
import { loadLiveData, type LiveData } from "../lib/sheetlens-data";

type RegisterKey = keyof LiveData;

const registers: { key: RegisterKey; label: string }[] = [
  { key: "projects", label: "Projects" },
  { key: "tasks", label: "Tasks" },
  { key: "requests", label: "Requests" },
  { key: "people", label: "People" },
];

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function HomePage() {
  const [data, setData] = useState<LiveData | null>(null);
  const [activeRegister, setActiveRegister] = useState<RegisterKey>("projects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadLiveData());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load Smartsheet data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rows = data?.[activeRegister].rows ?? [];
  const columns = data?.[activeRegister].columns ?? [];
  const activeLabel =
    registers.find((register) => register.key === activeRegister)?.label ?? "Register";

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
            <h1>Registers</h1>
            <p className="muted">Live, read-only data from your Smartsheet workspace.</p>
          </div>
          <div className="status-pill">
            <span className={`status-dot ${loading ? "status-loading" : error ? "status-error" : ""}`} />
            {loading ? "Updating" : error ? "Needs attention" : "Connected"}
          </div>
        </div>

        <nav className="register-tabs" aria-label="Smartsheet registers">
          {registers.map((register) => (
            <button
              key={register.key}
              className={`register-tab ${activeRegister === register.key ? "active" : ""}`}
              onClick={() => setActiveRegister(register.key)}
              aria-current={activeRegister === register.key ? "page" : undefined}
            >
              {register.label}
              <span className="tab-count">
                {data ? data[register.key].rows.length : "—"}
              </span>
            </button>
          ))}
        </nav>

        <section className="data-card" aria-label={`${activeLabel} data`}>
          <div className="data-card-heading">
            <div className="data-title">
              <Rows3 size={18} />
              <h2>{activeLabel}</h2>
            </div>
            {!loading && !error && (
              <span className="muted">{rows.length} rows</span>
            )}
          </div>

          {error ? (
            <div className="message-panel error-panel" role="alert">
              <h3>Couldn’t load your registers</h3>
              <p>{error}</p>
              <button className="button button-primary" onClick={() => void refresh()}>
                Try again
              </button>
            </div>
          ) : loading && !data ? (
            <div className="message-panel">
              <div className="spinner" />
              <p>Loading your Smartsheet registers…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="message-panel">
              <p>No rows were returned for this register.</p>
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
                  {rows.map((row, rowIndex) => (
                    <tr key={String(row._rowId ?? rowIndex)}>
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
        <p className="footnote">
          Access is controlled by Smartsheet. This first version does not edit sheet data.
        </p>
      </section>
    </main>
  );
}