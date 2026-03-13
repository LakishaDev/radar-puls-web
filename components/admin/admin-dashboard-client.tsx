"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {getAdminToken} from "@/lib/admin-auth";
import {fetchAdminEvents, fetchAdminStats, type AdminEventListItem, type AdminStats} from "@/lib/admin-api";

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(deltaMs / 1000));
  if (sec < 60) {
    return `${sec}s`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} min`;
  }
  const hr = Math.floor(min / 60);
  return `${hr}h`;
}

export function AdminDashboardClient() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<AdminEventListItem[]>([]);
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
        const [statsPayload, eventsPayload] = await Promise.all([
          fetchAdminStats(token, controller.signal),
          fetchAdminEvents(token, controller.signal),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsPayload);
        setRecent(eventsPayload.data.slice(0, 8));
        setError(null);
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

  const cards = useMemo(() => {
    return [
      {label: t("dashboard.cards.totalEvents"), value: stats?.total_raw_events ?? "--"},
      {label: t("dashboard.cards.pendingReview"), value: stats?.pending_review ?? "--"},
      {label: t("dashboard.cards.approved"), value: stats?.approved ?? "--"},
      {label: t("dashboard.cards.rejected"), value: stats?.rejected ?? "--"},
    ];
  }, [stats, t]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-100">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("dashboard.subtitle")}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-100">{t("dashboard.recentEvents")}</h2>
          <Link
            href="/admin/events"
            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 transition-colors hover:bg-slate-800"
          >
            {t("dashboard.openList")}
          </Link>
        </div>

        {error ? <p className="mb-3 text-xs text-amber-400">{error}</p> : null}

        <ul className="space-y-2">
          {recent.map((item) => (
            <li key={item.id} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <Link href={`/admin/events/${item.id}`} className="font-semibold text-cyan-300 hover:text-cyan-200">
                  {item.id}
                </Link>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{item.moderationStatus}</span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{item.eventType} - {item.locationText}</p>
              <p className="text-xs text-slate-500">{t("common.ago", {value: formatRelativeTime(item.createdAt)})}</p>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="rounded-md border border-slate-800 bg-slate-950 px-3 py-4 text-xs text-slate-400">
              {t("events.empty")}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
