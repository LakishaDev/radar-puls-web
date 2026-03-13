"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {getAdminToken} from "@/lib/admin-auth";
import {fetchAdminEvents, type AdminEventListItem} from "@/lib/admin-api";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
}

export function AdminEventsClient() {
  const t = useTranslations("admin");
  const [rows, setRows] = useState<AdminEventListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      try {
        const payload = await fetchAdminEvents(token, controller.signal);
        if (!cancelled) {
          setRows(payload.data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(t("errors.failedToLoad"));
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [t]);

  const tableRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{t("events.title")}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("events.subtitle")}</p>
        </div>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900">
        {error ? <p className="px-4 pt-3 text-xs text-amber-400">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{t("events.columns.type")}</th>
                <th className="px-4 py-3">{t("events.columns.location")}</th>
                <th className="px-4 py-3">{t("events.columns.rawMessage")}</th>
                <th className="px-4 py-3">{t("events.columns.status")}</th>
                <th className="px-4 py-3">{t("events.columns.parse")}</th>
                <th className="px-4 py-3">{t("events.columns.time")}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/80 text-slate-200">
                  <td className="px-4 py-3">
                    <Link href={`/admin/events/${row.id}`} className="font-semibold text-cyan-300 hover:text-cyan-200">
                      {row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.eventType}</td>
                  <td className="px-4 py-3">{row.locationText}</td>
                  <td className="max-w-[280px] px-4 py-3 text-xs italic text-slate-300">
                    <span className="block truncate" title={row.rawMessage ?? "-"}>
                      {row.rawMessage
                        ? (row.rawMessage.length > 60 ? `${row.rawMessage.slice(0, 60)}...` : row.rawMessage)
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.moderationStatus}</td>
                  <td className="px-4 py-3">{row.parseStatus}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
              {tableRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-xs text-slate-500" colSpan={7}>{t("events.empty")}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
