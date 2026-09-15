"use client";

import { useEffect, useState } from "react";

interface SyncRun {
  status: "running" | "success" | "failed" | "partial";
  startedAt: string;
  finishedAt: string | null;
  filesDiscovered: number;
  filesChanged: number;
  filesSkipped: number;
  filesFailed: number;
}

const STATUS_LABEL: Record<SyncRun["status"], string> = {
  running: "Running",
  success: "Healthy",
  partial: "Completed with failures",
  failed: "Failed",
};

export function MediaSyncPanel() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [latest, setLatest] = useState<SyncRun | null>(null);
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
      const res = await fetch("/api/admin/media/sync", { method: "POST" });
      const data = await res.json();
      setFlash({ kind: data.ok ? "ok" : "bad", text: data.message ?? "Sync finished" });
      await load();
    } catch {
      setFlash({ kind: "bad", text: "Network error while syncing" });
    } finally {
      setBusy(false);
    }
  };

  if (configured === null) return null;

  return (
    <article className="admin-panel">
      <h3>Media sync</h3>
      {!configured ? (
        <p>
          <small>
            Not configured — set the Google Drive and Supabase environment variables to enable syncing original
            product photos from Drive.
          </small>
        </p>
      ) : (
        <>
          <label>
            Last sync
            <input readOnly value={latest ? new Date(latest.startedAt).toLocaleString() : "Never"} />
          </label>
          <label>
            Status
            <input readOnly value={latest ? STATUS_LABEL[latest.status] : "—"} />
          </label>
          {latest && latest.status !== "running" && (
            <p>
              <small>
                {latest.filesChanged} changed · {latest.filesSkipped} unchanged
                {latest.filesFailed > 0 ? ` · ${latest.filesFailed} failed` : ""}
              </small>
            </p>
          )}
          {flash && <div className={`admin-flash ${flash.kind}`}>{flash.text}</div>}
          <button className="primary-action" onClick={syncNow} disabled={busy || latest?.status === "running"}>
            {busy ? "Syncing…" : "Sync now"}
          </button>
        </>
      )}
    </article>
  );
}
