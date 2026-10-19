"use client";

import { useEffect, useState } from "react";

interface CleanupRun {
  status: "running" | "success" | "failed" | "partial";
  startedAt: string;
  finishedAt: string | null;
  filesChanged: number;
  filesFailed: number;
}

const STATUS_LABEL: Record<CleanupRun["status"], string> = {
  running: "Running",
  success: "Healthy",
  partial: "Completed with failures",
  failed: "Failed",
};

export function MediaSyncPanel() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [latest, setLatest] = useState<CleanupRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/media/status");
    const data = await res.json();
    setConfigured(data.configured);
    setLatest(data.latest ?? null);
  };

  useEffect(() => {
    void load();
  }, []);

  const syncNow = async () => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/media/cleanup", { method: "POST" });
      const data = await res.json();
      setFlash({ kind: data.ok ? "ok" : "bad", text: data.message ?? "Cleanup finished" });
      await load();
    } catch {
      setFlash({ kind: "bad", text: "Network error while cleaning up" });
    } finally {
      setBusy(false);
    }
  };

  if (configured === null) return null;

  return (
    <article className="admin-panel">
      <h3>Media storage</h3>
      {!configured ? (
        <p>
          <small>
            Not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Until then, product image
            uploads fall back to the local filesystem, which a serverless host will reject.
          </small>
        </p>
      ) : (
        <>
          <label>
            Last cleanup
            <input readOnly value={latest ? new Date(latest.startedAt).toLocaleString() : "Never"} />
          </label>
          <label>
            Status
            <input readOnly value={latest ? STATUS_LABEL[latest.status] : "—"} />
          </label>
          {latest && latest.status !== "running" && (
            <p>
              <small>
                {latest.filesChanged} replaced file(s) removed
                {latest.filesFailed > 0 ? ` · ${latest.filesFailed} failed` : ""}
              </small>
            </p>
          )}
          {flash && <div className={`admin-flash ${flash.kind}`}>{flash.text}</div>}
          <button className="primary-action" onClick={syncNow} disabled={busy || latest?.status === "running"}>
            {busy ? "Cleaning up…" : "Clean up now"}
          </button>
        </>
      )}
    </article>
  );
}
