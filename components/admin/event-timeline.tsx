"use client";

import {useEffect, useState} from "react";
import {
  CheckCircle,
  Clock,
  MapPin,
  MapPinCheck,
  PenLine,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {useTranslations} from "next-intl";
import {fetchEventActivityLog, type ActivityLogEntry} from "@/lib/admin-api";
import {getAdminToken} from "@/lib/admin-auth";
import {cn} from "@/lib/utils";

interface EventTimelineProps {
  eventId: string;
}

const ACTION_CONFIG: Record<
  string,
  {
    icon: typeof CheckCircle;
    color: string;
    label: string;
  }
> = {
  approve: {icon: CheckCircle, color: "text-emerald-400", label: "Odobren"},
  reject: {icon: XCircle, color: "text-rose-400", label: "Odbijen"},
  update: {icon: PenLine, color: "text-amber-400", label: "Izmenjen"},
  confirm_location: {icon: MapPinCheck, color: "text-[var(--rp-primary)]", label: "Lokacija potvrdjena"},
  re_enrich: {icon: RefreshCw, color: "text-violet-400", label: "Re-enrich"},
  restore: {icon: RotateCcw, color: "text-blue-400", label: "Restauriran"},
  bulk_confirm: {icon: MapPin, color: "text-emerald-400", label: "Bulk potvrda"},
};

export function EventTimeline({eventId}: EventTimelineProps) {
  const t = useTranslations("admin");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    const controller = new AbortController();
    fetchEventActivityLog(eventId, token, controller.signal)
      .then(setLogs)
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [eventId]);

  if (loading) {
    return <div className="h-20 animate-pulse rounded-lg bg-[var(--rp-surface)]" />;
  }

  if (logs.length === 0) {
    return <p className="text-xs italic text-[var(--rp-ink-soft)]">{t("eventDetail.timeline.empty")}</p>;
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-3 top-2 w-px bg-[var(--rp-border)]" />

      {logs.map((log) => {
        const config = ACTION_CONFIG[log.action] ?? {
          icon: Clock,
          color: "text-[var(--rp-ink-soft)]",
          label: log.action,
        };
        const Icon = config.icon;

        return (
          <div key={log.id} className="relative flex gap-3 py-2.5 pl-1">
            <div
              className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--rp-card)] ring-2 ring-[var(--rp-border)]",
                config.color,
              )}
            >
              <Icon className="h-3 w-3" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
                <span className="text-xs text-[var(--rp-ink-soft)]">{formatRelativeTime(log.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--rp-ink-soft)]">
                {log.performedBy}
                {log.note ? ` · ${log.note}` : ""}
              </p>
              {log.oldValues || log.newValues ? (
                <div className="mt-1 rounded bg-[var(--rp-surface)] px-2 py-1 text-xs text-[var(--rp-ink)]">
                  {renderChangeDiff(log.oldValues, log.newValues)}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderChangeDiff(
  oldVals: Record<string, unknown> | null,
  newVals: Record<string, unknown> | null,
): React.ReactNode {
  const allKeys = new Set([...Object.keys(oldVals ?? {}), ...Object.keys(newVals ?? {})]);

  return (
    <div className="space-y-0.5">
      {[...allKeys].map((key) => {
        const oldValue = oldVals?.[key];
        const newValue = newVals?.[key];
        if (oldValue === newValue) {
          return null;
        }

        return (
          <div key={key}>
            <span className="text-[var(--rp-ink-soft)]">{key}: </span>
            {oldValue !== undefined ? <span className="mr-1 text-rose-400 line-through">{String(oldValue)}</span> : null}
            {newValue !== undefined ? <span className="text-emerald-400">{String(newValue)}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(deltaMs / 1000));
  if (sec < 60) {
    return `pre ${sec}s`;
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `pre ${min} min`;
  }

  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `pre ${hr}h`;
  }

  const days = Math.floor(hr / 24);
  return `pre ${days}d`;
}
