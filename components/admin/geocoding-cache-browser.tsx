"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {CheckCircle2, Circle, Pencil, Save, Trash2, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useToast} from "@/components/ui/toast";
import {
  deleteGeocodingCacheEntry,
  fetchGeocodingCache,
  type GeocodingCacheEntry,
  updateGeocodingCacheEntry,
} from "@/lib/admin-api";
import {getAdminToken} from "@/lib/admin-auth";

interface EditState {
  id: string;
  locationText: string;
  lat: string;
  lng: string;
  verified: boolean;
}

export function GeocodingCacheBrowser() {
  const t = useTranslations("admin");
  const {showToast} = useToast();
  const [items, setItems] = useState<GeocodingCacheEntry[]>([]);
  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState<"all" | "true" | "false">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const payload = await fetchGeocodingCache(
        token,
        {
          search: search.trim() || undefined,
          verified: verified === "all" ? undefined : verified,
          page: 1,
          limit: 100,
        },
        signal,
      );
      setItems(payload.items);
      setError(null);
    } catch {
      setError(t("errors.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [search, t, verified]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadData(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadData]);

  const sorted = useMemo(() => [...items].sort((a, b) => b.hitCount - a.hitCount), [items]);

  const startEdit = (entry: GeocodingCacheEntry) => {
    setEdit({
      id: entry.id,
      locationText: entry.locationText,
      lat: String(entry.lat),
      lng: String(entry.lng),
      verified: entry.verified,
    });
  };

  const saveEdit = async () => {
    if (!edit) {
      return;
    }

    const token = getAdminToken();
    if (!token) {
      return;
    }

    try {
      await updateGeocodingCacheEntry(edit.id, token, {
        locationText: edit.locationText,
        lat: Number(edit.lat),
        lng: Number(edit.lng),
        verified: edit.verified,
      });
      showToast("success", t("geocodingCache.edit.success"));
      setEdit(null);
      await loadData();
    } catch {
      showToast("error", t("geocodingCache.edit.failed"));
    }
  };

  const removeEntry = async (id: string) => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    if (!window.confirm(t("geocodingCache.delete.confirm"))) {
      return;
    }

    try {
      await deleteGeocodingCacheEntry(id, token);
      showToast("success", t("geocodingCache.delete.success"));
      await loadData();
    } catch {
      showToast("error", t("geocodingCache.delete.failed"));
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--rp-deep)]">{t("geocodingCache.title")}</h1>
        <p className="mt-1 text-sm text-[var(--rp-ink-soft)]">{t("geocodingCache.subtitle")}</p>
      </header>

      <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("geocodingCache.search")}
            className="w-full max-w-sm rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-3 py-2 text-sm text-[var(--rp-deep)] outline-none focus:border-[var(--rp-primary)]"
          />
          <select
            value={verified}
            onChange={(event) => setVerified(event.target.value as "all" | "true" | "false")}
            className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-2 text-sm text-[var(--rp-deep)]"
          >
            <option value="all">{t("filters.all")}</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-md border border-[var(--rp-border)] px-3 py-2 text-xs text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
          >
            {t("common.refresh")}
          </button>
        </div>

        {error ? <p className="mt-3 text-xs text-amber-400">{error}</p> : null}

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--rp-border)] text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">
              <tr>
                <th className="px-3 py-2">{t("geocodingCache.columns.location")}</th>
                <th className="px-3 py-2">{t("geocodingCache.columns.coordinates")}</th>
                <th className="px-3 py-2">{t("geocodingCache.columns.hits")}</th>
                <th className="px-3 py-2">{t("geocodingCache.columns.type")}</th>
                <th className="px-3 py-2">{t("geocodingCache.columns.verified")}</th>
                <th className="px-3 py-2">{t("geocodingCache.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                const editing = edit?.id === entry.id;
                return (
                  <tr key={entry.id} className="border-b border-[var(--rp-border)] text-[var(--rp-ink)]">
                    <td className="px-3 py-2 align-top">
                      {editing ? (
                        <input
                          value={edit.locationText}
                          onChange={(event) => setEdit({...edit, locationText: event.target.value})}
                          className="w-full rounded border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-1 text-xs"
                        />
                      ) : (
                        <>
                          <p>{entry.locationText}</p>
                          {entry.formattedAddr ? <p className="text-xs text-[var(--rp-ink-soft)]">{entry.formattedAddr}</p> : null}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      {editing ? (
                        <div className="flex gap-1">
                          <input
                            value={edit.lat}
                            onChange={(event) => setEdit({...edit, lat: event.target.value})}
                            className="w-24 rounded border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-1"
                          />
                          <input
                            value={edit.lng}
                            onChange={(event) => setEdit({...edit, lng: event.target.value})}
                            className="w-24 rounded border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2 py-1"
                          />
                        </div>
                      ) : (
                        <a
                          href={`https://www.google.com/maps?q=${entry.lat},${entry.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--rp-primary)] hover:text-[var(--rp-primary-hover)]"
                        >
                          {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">{entry.hitCount}</td>
                    <td className="px-3 py-2 align-top text-xs text-[var(--rp-ink-soft)]">{entry.locationType ?? "-"}</td>
                    <td className="px-3 py-2 align-top">
                      {editing ? (
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={edit.verified}
                            onChange={(event) => setEdit({...edit, verified: event.target.checked})}
                          />
                          Verified
                        </label>
                      ) : entry.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rp-surface)] px-2 py-0.5 text-xs text-[var(--rp-ink-soft)]">
                          <Circle className="h-3 w-3" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-1">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void saveEdit()}
                              className="rounded-md p-1 text-emerald-300 hover:bg-[var(--rp-surface)]"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEdit(null)}
                              className="rounded-md p-1 text-[var(--rp-ink)] hover:bg-[var(--rp-surface)]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(entry)}
                              className="rounded-md p-1 text-[var(--rp-primary)] hover:bg-[var(--rp-surface)]"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeEntry(entry.id)}
                              className="rounded-md p-1 text-rose-300 hover:bg-[var(--rp-surface)]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-xs text-[var(--rp-ink-soft)]">{t("events.empty")}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
