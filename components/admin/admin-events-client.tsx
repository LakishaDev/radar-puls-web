"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {CheckSquare, ListTree, Map as MapIcon, Square, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {Link, useRouter} from "@/i18n/navigation";
import {AdminEventsMap} from "@/components/admin/admin-events-map";
import {EditSourceBadge} from "@/components/admin/edit-source-badge";
import {GeoSourceBadge} from "@/components/admin/geo-source-badge";
import {useToast} from "@/components/ui/toast";
import {getAdminToken} from "@/lib/admin-auth";
import {
  bulkApproveEvents,
  bulkConfirmLocations,
  bulkRejectEvents,
  fetchAdminEvents,
  fetchConfirmLocationCandidates,
  type AdminEventListItem,
  type ConfirmLocationCandidate,
} from "@/lib/admin-api";
import {useAdminRealtime} from "@/lib/hooks/use-admin-realtime";
import {cn} from "@/lib/utils";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
}

export function AdminEventsClient() {
  const t = useTranslations("admin");
  const router = useRouter();
  const {showToast} = useToast();
  const [rows, setRows] = useState<AdminEventListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editSourceFilter, setEditSourceFilter] = useState<string>("all");
  const [enrichStatusFilter, setEnrichStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "confidence" | "editSource">("createdAt");
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState<"approve" | "reject" | "confirm" | null>(null);
  const [bulkNote, setBulkNote] = useState("");
  const [candidates, setCandidates] = useState<ConfirmLocationCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  const loadEvents = useCallback(async (signal?: AbortSignal) => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    try {
      const payload = await fetchAdminEvents(token, signal);
      setRows(payload.data);
      setError(null);
    } catch {
      setError(t("errors.failedToLoad"));
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadEvents(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadEvents]);

  useAdminRealtime({
    onNewReport: () => void loadEvents(),
    onReportUpdated: () => void loadEvents(),
    onReportRemoved: () => void loadEvents(),
  });

  const loadCandidates = useCallback(async (signal?: AbortSignal) => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    setCandidatesLoading(true);
    try {
      const payload = await fetchConfirmLocationCandidates(token, signal);
      setCandidates(payload);
      setCandidateError(null);
    } catch {
      setCandidateError(t("errors.failedToLoad"));
    } finally {
      setCandidatesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadCandidates(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCandidates]);

  const tableRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      const editSourceOk = editSourceFilter === "all" || row.editSource === editSourceFilter;
      const enrichStatusOk = enrichStatusFilter === "all" || (row.enrichStatus ?? "") === enrichStatusFilter;
      return editSourceOk && enrichStatusOk;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "confidence") {
        return (b.confidence ?? -1) - (a.confidence ?? -1);
      }
      if (sortBy === "editSource") {
        return a.editSource.localeCompare(b.editSource);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rows, editSourceFilter, enrichStatusFilter, sortBy]);

  const formatCoordinates = (row: AdminEventListItem) => {
    if (typeof row.lat !== "number" || typeof row.lng !== "number") {
      return "--";
    }
    return `${row.lat.toFixed(2)}, ${row.lng.toFixed(2)}`;
  };

  useEffect(() => {
    const visibleIds = new Set(rows.map((row) => row.id));
    setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [rows]);

  const selectedCount = selectedIds.length;
  const tableRowIds = tableRows.map((row) => row.id);
  const allVisibleSelected = tableRows.length > 0 && tableRows.every((row) => selectedIds.includes(row.id));

  const toggleVisibleSelection = () => {
    if (allVisibleSelected) {
      const visible = new Set(tableRowIds);
      setSelectedIds((current) => current.filter((id) => !visible.has(id)));
      return;
    }

    setSelectedIds((current) => {
      const merged = new Set([...current, ...tableRowIds]);
      return Array.from(merged);
    });
  };

  const toggleSelection = (eventId: string) => {
    setSelectedIds((current) => {
      if (current.includes(eventId)) {
        return current.filter((id) => id !== eventId);
      }
      return [...current, eventId];
    });
  };

  const runBulkAction = async (action: "approve" | "reject" | "confirm") => {
    const token = getAdminToken();
    if (!token || selectedIds.length === 0) {
      return;
    }

    setBulkBusy(action);
    try {
      if (action === "approve") {
        await bulkApproveEvents(token, selectedIds);
        showToast("success", t("events.bulk.feedback.approveSuccess", {count: selectedIds.length}));
      }

      if (action === "reject") {
        await bulkRejectEvents(token, selectedIds, bulkNote.trim() || undefined);
        showToast("success", t("events.bulk.feedback.rejectSuccess", {count: selectedIds.length}));
      }

      if (action === "confirm") {
        const result = await bulkConfirmLocations(token, selectedIds);
        showToast(
          "success",
          t("events.bulk.feedback.confirmSuccess", {confirmed: result.confirmed, cached: result.cached}),
        );
      }

      setSelectedIds([]);
      setBulkNote("");
      await loadEvents();
      await loadCandidates();
    } catch {
      showToast("error", t("errors.actionFailed"));
    } finally {
      setBulkBusy(null);
    }
  };

  const applyCandidateSelection = (candidate: ConfirmLocationCandidate) => {
    setSelectedIds((current) => {
      const merged = new Set([...current, ...candidate.event_ids]);
      return Array.from(merged);
    });
  };

  const confirmCandidate = async (candidate: ConfirmLocationCandidate) => {
    const token = getAdminToken();
    if (!token || candidate.event_ids.length === 0) {
      return;
    }

    setBulkBusy("confirm");
    try {
      const result = await bulkConfirmLocations(token, candidate.event_ids);
      showToast(
        "success",
        t("events.bulk.feedback.confirmSuccess", {confirmed: result.confirmed, cached: result.cached}),
      );
      await loadEvents();
      await loadCandidates();
    } catch {
      showToast("error", t("errors.actionFailed"));
    } finally {
      setBulkBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--rp-deep)]">{t("events.title")}</h1>
          <p className="mt-1 text-sm text-[var(--rp-ink-soft)]">{t("events.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--rp-border)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "table" ? "bg-[var(--rp-surface)] text-[var(--rp-primary)]" : "text-[var(--rp-ink-soft)] hover:text-[var(--rp-ink)]",
              )}
            >
              <ListTree className="mr-1 inline h-3.5 w-3.5" />
              {t("events.viewMode.table")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "map" ? "bg-[var(--rp-surface)] text-[var(--rp-primary)]" : "text-[var(--rp-ink-soft)] hover:text-[var(--rp-ink)]",
              )}
            >
              <MapIcon className="mr-1 inline h-3.5 w-3.5" />
              {t("events.viewMode.map")}
            </button>
          </div>

          <label className="text-xs text-[var(--rp-ink-soft)]">
            {t("filters.editSource")}
            <select
              value={editSourceFilter}
              onChange={(evt) => setEditSourceFilter(evt.target.value)}
              className="ml-2 rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-1 text-xs text-[var(--rp-ink)]"
            >
              <option value="all">{t("filters.all")}</option>
              <option value="ai_raw">{t("eventDetail.editSource.ai_raw")}</option>
              <option value="admin_edited">{t("eventDetail.editSource.admin_edited")}</option>
              <option value="admin_confirmed">{t("eventDetail.editSource.admin_confirmed")}</option>
              <option value="web_submitted">{t("eventDetail.editSource.web_submitted")}</option>
            </select>
          </label>

          <label className="text-xs text-[var(--rp-ink-soft)]">
            {t("filters.enrichStatus")}
            <select
              value={enrichStatusFilter}
              onChange={(evt) => setEnrichStatusFilter(evt.target.value)}
              className="ml-2 rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-1 text-xs text-[var(--rp-ink)]"
            >
              <option value="all">{t("filters.all")}</option>
              <option value="pending">pending</option>
              <option value="enriched">enriched</option>
              <option value="failed">failed</option>
            </select>
          </label>

          <label className="text-xs text-[var(--rp-ink-soft)]">
            Sort
            <select
              value={sortBy}
              onChange={(evt) => setSortBy(evt.target.value as "createdAt" | "confidence" | "editSource")}
              className="ml-2 rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-1 text-xs text-[var(--rp-ink)]"
            >
              <option value="createdAt">Created at</option>
              <option value="confidence">Confidence</option>
              <option value="editSource">Edit source</option>
            </select>
          </label>
        </div>
      </header>

      <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)]">
        {error ? <p className="px-4 pt-3 text-xs text-amber-400">{error}</p> : null}

        {viewMode === "table" ? (
          <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-x-auto rounded-lg border border-[var(--rp-border)]">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-[var(--rp-border)] bg-[var(--rp-card)] text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">
                  <tr>
                    <th className="w-10 px-2 py-3">
                      <button
                        type="button"
                        onClick={toggleVisibleSelection}
                        className="rounded p-1 text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
                        aria-label={allVisibleSelected ? t("events.bulk.clearSelection") : t("events.bulk.selectAllVisible")}
                      >
                        {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">{t("events.columns.type")}</th>
                    <th className="px-4 py-3">{t("events.columns.location")}</th>
                    <th className="px-4 py-3">{t("events.columns.coordinates")}</th>
                    <th className="px-4 py-3">{t("events.columns.editSource")}</th>
                    <th className="px-4 py-3">{t("events.columns.geoSource")}</th>
                    <th className="px-4 py-3">{t("events.columns.rawMessage")}</th>
                    <th className="px-4 py-3">{t("events.columns.status")}</th>
                    <th className="px-4 py-3">{t("events.columns.parse")}</th>
                    <th className="px-4 py-3">{t("events.columns.time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--rp-border)] text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]">
                      <td className="px-2 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelection(row.id)}
                          aria-label={t("events.bulk.selectOne")}
                          className="h-4 w-4 cursor-pointer rounded border-[var(--rp-border)] bg-[var(--rp-bg)] text-[var(--rp-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/events/${row.id}`} className="font-semibold text-[var(--rp-primary)] hover:text-[var(--rp-primary-hover)]">
                          {row.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.eventType}</td>
                      <td className="px-4 py-3">{row.locationText}</td>
                      <td className="px-4 py-3 text-xs">
                        {typeof row.lat === "number" && typeof row.lng === "number" ? (
                          <a
                            href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--rp-primary)] hover:text-[var(--rp-primary-hover)]"
                          >
                            {formatCoordinates(row)}
                          </a>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="px-4 py-3"><EditSourceBadge value={row.editSource} /></td>
                      <td className="px-4 py-3"><GeoSourceBadge value={row.geoSource} /></td>
                      <td className="max-w-[280px] px-4 py-3 text-xs italic text-[var(--rp-ink)]">
                        <span className="block truncate" title={row.rawMessage ?? "-"}>
                          {row.rawMessage
                            ? (row.rawMessage.length > 60 ? `${row.rawMessage.slice(0, 60)}...` : row.rawMessage)
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.moderationStatus}</td>
                      <td className="px-4 py-3">{row.parseStatus}</td>
                      <td className="px-4 py-3 text-[var(--rp-ink-soft)]">{formatDateTime(row.createdAt)}</td>
                    </tr>
                  ))}
                  {tableRows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-xs text-[var(--rp-ink-soft)]" colSpan={11}>{t("events.empty")}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <aside className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-bg)] p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--rp-deep)]">{t("events.bulk.candidates.title")}</h2>
                <button
                  type="button"
                  onClick={() => void loadCandidates()}
                  className="rounded-md border border-[var(--rp-border)] px-2 py-1 text-[11px] text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
                >
                  {t("common.refresh")}
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--rp-ink-soft)]">{t("events.bulk.candidates.subtitle")}</p>
              {candidateError ? <p className="mt-2 text-xs text-amber-400">{candidateError}</p> : null}

              <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {!candidatesLoading && candidates.length === 0 ? (
                  <p className="rounded-md border border-[var(--rp-border)] px-2 py-2 text-xs text-[var(--rp-ink-soft)]">{t("events.bulk.candidates.empty")}</p>
                ) : null}
                {candidates.map((candidate) => (
                  <article key={`${candidate.location_text}-${candidate.lat}-${candidate.lng}`} className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-card)] p-2">
                    <p className="text-xs font-medium text-[var(--rp-deep)]">{candidate.location_text}</p>
                    <p className="mt-1 text-[11px] text-[var(--rp-ink-soft)]">
                      {candidate.lat.toFixed(4)}, {candidate.lng.toFixed(4)} · {candidate.occurrence_count}x
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--rp-ink-soft)]">{candidate.geo_source}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => applyCandidateSelection(candidate)}
                        className="rounded-md border border-[var(--rp-border)] px-2 py-1 text-[11px] text-[var(--rp-primary)] transition-colors hover:bg-[var(--rp-surface)]"
                      >
                        {t("events.bulk.candidates.select")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void confirmCandidate(candidate)}
                        disabled={bulkBusy === "confirm"}
                        className="rounded-md border border-emerald-700/60 px-2 py-1 text-[11px] text-emerald-300 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("events.bulk.candidates.confirm")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div className="p-3">
            <AdminEventsMap events={tableRows} onEventClick={(eventId) => router.push(`/admin/events/${eventId}`)} />
          </div>
        )}

        {viewMode === "table" && selectedCount > 0 ? (
          <div className="sticky bottom-2 z-20 mx-3 mb-3 rounded-lg border border-[var(--rp-primary)] bg-[var(--rp-bg)] p-3 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--rp-primary)]">
                {t("events.bulk.selected", {count: selectedCount})}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--rp-border)] px-2 py-1 text-xs text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
              >
                <X className="h-3.5 w-3.5" />
                {t("events.bulk.clearSelection")}
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <input
                  value={bulkNote}
                  onChange={(event) => setBulkNote(event.target.value)}
                  placeholder={t("events.bulk.rejectNotePlaceholder")}
                  className="w-56 rounded-md border border-[var(--rp-border)] bg-[var(--rp-card)] px-2 py-1 text-xs text-[var(--rp-deep)]"
                />
                <button
                  type="button"
                  onClick={() => void runBulkAction("approve")}
                  disabled={bulkBusy !== null}
                  className="rounded-md border border-emerald-700/60 px-2.5 py-1.5 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("events.bulk.actions.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => void runBulkAction("confirm")}
                  disabled={bulkBusy !== null}
                  className="rounded-md border border-[var(--rp-primary)] px-2.5 py-1.5 text-xs text-[var(--rp-primary)] transition-colors hover:bg-[var(--rp-primary-hover)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("events.bulk.actions.confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => void runBulkAction("reject")}
                  disabled={bulkBusy !== null}
                  className="rounded-md border border-rose-700/60 px-2.5 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("events.bulk.actions.reject")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
