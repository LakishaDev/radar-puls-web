"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {getAdminToken} from "@/lib/admin-auth";
import {approveAdminEvent, fetchAdminEventDetail, rejectAdminEvent, type AdminEventDetail} from "@/lib/admin-api";

interface AdminEventDetailClientProps {
  id: string;
}

export function AdminEventDetailClient({id}: AdminEventDetailClientProps) {
  const t = useTranslations("admin");
  const [event, setEvent] = useState<AdminEventDetail | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [note, setNote] = useState("");
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
        const payload = await fetchAdminEventDetail(id, token, controller.signal);
        if (!cancelled) {
          setEvent(payload);
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
  }, [id, t]);

  const handleApprove = async () => {
    const token = getAdminToken();
    if (!token || !event) {
      return;
    }

    try {
      setIsActing(true);
      await approveAdminEvent(event.id, token);
      setEvent({...event, moderationStatus: "approved"});
      setError(null);
    } catch {
      setError(t("errors.actionFailed"));
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    const token = getAdminToken();
    if (!token || !event) {
      return;
    }

    try {
      setIsActing(true);
      await rejectAdminEvent(event.id, token, note);
      setEvent({...event, moderationStatus: "rejected", moderationNote: note || null});
      setError(null);
    } catch {
      setError(t("errors.actionFailed"));
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("eventDetail.label")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100">{id}</h1>
        </div>
        <Link href="/admin/events" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800">
          {t("eventDetail.back")}
        </Link>
      </header>

      {error ? <p className="text-xs text-amber-400">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">{t("eventDetail.rawMessage")}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
            {event?.rawMessage ?? t("eventDetail.emptyMessage")}
          </p>
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">{t("eventDetail.parsedData")}</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-200">
            <div><dt className="text-slate-500">{t("eventDetail.fields.type")}</dt><dd>{event?.eventType ?? "--"}</dd></div>
            <div><dt className="text-slate-500">{t("eventDetail.fields.location")}</dt><dd>{event?.locationText ?? "--"}</dd></div>
            <div><dt className="text-slate-500">{t("eventDetail.fields.confidence")}</dt><dd>{typeof event?.confidence === "number" ? `${Math.round(event.confidence)}%` : "--"}</dd></div>
            <div><dt className="text-slate-500">{t("eventDetail.fields.status")}</dt><dd>{event?.moderationStatus ?? "--"}</dd></div>
          </dl>
        </article>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">{t("eventDetail.actions.title")}</h2>
        <label className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-slate-500" htmlFor="reject-note">
          {t("eventDetail.actions.rejectNote")}
        </label>
        <textarea
          id="reject-note"
          value={note}
          onChange={(evt) => setNote(evt.target.value)}
          className="mt-2 min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
          placeholder={t("eventDetail.actions.rejectPlaceholder")}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isActing}
            onClick={handleApprove}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("eventDetail.actions.approve")}
          </button>
          <button
            type="button"
            disabled={isActing}
            onClick={handleReject}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("eventDetail.actions.reject")}
          </button>
        </div>
      </section>
    </div>
  );
}
