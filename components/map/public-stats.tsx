"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {fetchPublicStats, type PublicStats as PublicStatsDto} from "@/lib/api";

const fallbackStats: PublicStatsDto = {
  total_reports_today: 0,
  total_reports_week: 0,
  busiest_area: "-",
  most_common_type: "-",
  peak_hour: "-",
  reports_by_type: [],
  reports_by_hour: [],
};

function maxCount<T extends {count: number}>(rows: T[]): number {
  return rows.reduce((max, row) => Math.max(max, row.count), 0);
}

export function PublicStatsSection() {
  const t = useTranslations("statsPage");
  const [stats, setStats] = useState<PublicStatsDto>(fallbackStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      try {
        const payload = await fetchPublicStats(controller.signal);
        if (!cancelled) {
          setStats(payload);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setStats(fallbackStats);
          setError(t("error"));
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [t]);

  const typeMax = useMemo(() => maxCount(stats.reports_by_type), [stats.reports_by_type]);
  const hourMax = useMemo(() => maxCount(stats.reports_by_hour), [stats.reports_by_hour]);

  return (
    <section className="space-y-6">
      {error ? <p className="text-sm text-amber-700">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("cards.today")}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--rp-deep)]">{stats.total_reports_today}</p>
        </article>
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("cards.week")}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--rp-deep)]">{stats.total_reports_week}</p>
        </article>
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("cards.busiestArea")}</p>
          <p className="mt-2 text-base font-semibold text-[var(--rp-deep)]">{stats.busiest_area}</p>
        </article>
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("cards.commonType")}</p>
          <p className="mt-2 text-base font-semibold text-[var(--rp-deep)]">{stats.most_common_type}</p>
        </article>
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("cards.peakHour")}</p>
          <p className="mt-2 text-base font-semibold text-[var(--rp-deep)]">{stats.peak_hour}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <h2 className="text-base font-semibold text-[var(--rp-deep)]">{t("charts.byType")}</h2>
          <div className="mt-4 space-y-2">
            {stats.reports_by_type.map((row) => (
              <div key={row.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--rp-ink-soft)]">{row.type}</span>
                  <span className="font-semibold text-[var(--rp-deep)]">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--rp-surface)]">
                  <div
                    className="h-2 rounded-full bg-[var(--rp-primary)]"
                    style={{width: `${typeMax > 0 ? (row.count / typeMax) * 100 : 0}%`}}
                  />
                </div>
              </div>
            ))}
            {stats.reports_by_type.length === 0 ? <p className="text-xs text-[var(--rp-ink-soft)]">{t("empty")}</p> : null}
          </div>
        </article>

        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <h2 className="text-base font-semibold text-[var(--rp-deep)]">{t("charts.byHour")}</h2>
          <div className="mt-4 grid grid-cols-12 gap-1">
            {stats.reports_by_hour.map((row) => (
              <div key={row.hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-cyan-500/80"
                  style={{height: `${hourMax > 0 ? Math.max(8, (row.count / hourMax) * 100) : 8}px`}}
                />
                <span className="text-[10px] text-[var(--rp-ink-soft)]">{row.hour}</span>
              </div>
            ))}
          </div>
          {stats.reports_by_hour.length === 0 ? <p className="mt-3 text-xs text-[var(--rp-ink-soft)]">{t("empty")}</p> : null}
        </article>
      </div>
    </section>
  );
}
