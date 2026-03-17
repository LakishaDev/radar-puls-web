"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {CheckCircle2, Clock3, FileText, MapPin, PenLine, ShieldCheck, ShieldX, Sparkles} from "lucide-react";
import {Link} from "@/i18n/navigation";
import {getAdminToken} from "@/lib/admin-auth";
import {fetchAdminEvents, fetchAdminStats, type AdminEventListItem, type AdminStats} from "@/lib/admin-api";
import {useAdminRealtime} from "@/lib/hooks/use-admin-realtime";

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

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    try {
      const [statsPayload, eventsPayload] = await Promise.all([
        fetchAdminStats(token, signal),
        fetchAdminEvents(token, signal),
      ]);
      setStats(statsPayload);
      setRecent(eventsPayload.data.slice(0, 8));
      setError(null);
    } catch {
      setError(t("errors.failedToLoad"));
    }
  }, [t]);

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

  useAdminRealtime({
    onNewReport: () => void loadData(),
    onReportUpdated: () => void loadData(),
  });

  const cards = useMemo(() => {
    return [
      {label: t("dashboard.cards.totalEvents"), value: stats?.total_raw_events ?? "--", Icon: FileText, valueClass: "text-[var(--rp-primary)]"},
      {label: t("dashboard.cards.pendingReview"), value: stats?.pending_review ?? "--", Icon: Clock3, valueClass: "text-amber-300"},
      {label: t("dashboard.cards.approved"), value: stats?.approved ?? "--", Icon: ShieldCheck, valueClass: "text-emerald-300"},
      {label: t("dashboard.cards.rejected"), value: stats?.rejected ?? "--", Icon: ShieldX, valueClass: "text-rose-300"},
      {label: t("dashboard.cards.aiParsed"), value: stats?.total_parsed ?? "--", Icon: Sparkles, valueClass: "text-violet-300"},
      {label: t("stats.adminEdited"), value: stats?.admin_edited_count ?? "--", Icon: PenLine, valueClass: "text-amber-300"},
      {label: t("stats.adminConfirmed"), value: stats?.admin_confirmed_count ?? "--", Icon: CheckCircle2, valueClass: "text-emerald-300"},
      {label: t("stats.adminGeo"), value: stats?.admin_geo_count ?? "--", Icon: MapPin, valueClass: "text-[var(--rp-primary)]"},
    ];
  }, [stats, t]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-[var(--rp-deep)]">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-[var(--rp-ink-soft)]">{t("dashboard.subtitle")}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--rp-ink-soft)]">{card.label}</p>
              <card.Icon className="h-4 w-4 text-[var(--rp-ink-soft)]" />
            </div>
            <p className={`mt-2 text-2xl font-semibold ${card.valueClass}`}>{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--rp-deep)]">{t("dashboard.recentEvents")}</h2>
          <Link
            href="/admin/events"
            className="rounded-md border border-[var(--rp-border)] px-2.5 py-1.5 text-xs text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
          >
            {t("dashboard.openList")}
          </Link>
        </div>

        {error ? <p className="mb-3 text-xs text-amber-400">{error}</p> : null}

        <ul className="space-y-2">
          {recent.map((item) => (
            <li key={item.id} className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <Link href={`/admin/events/${item.id}`} className="font-semibold text-[var(--rp-primary)] hover:text-[var(--rp-primary-hover)]">
                  {item.id}
                </Link>
                <span className="rounded-full bg-[var(--rp-surface)] px-2 py-0.5 text-[var(--rp-ink)]">{item.moderationStatus}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--rp-ink)]">{item.eventType} - {item.locationText}</p>
              <p className="text-xs text-[var(--rp-ink-soft)]">{t("common.ago", {value: formatRelativeTime(item.createdAt)})}</p>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-3 py-4 text-xs text-[var(--rp-ink-soft)]">
              {t("events.empty")}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
