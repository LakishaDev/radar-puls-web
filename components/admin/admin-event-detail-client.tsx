"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {EditableField} from "@/components/admin/editable-field";
import {EditSourceBadge} from "@/components/admin/edit-source-badge";
import {EventTimeline} from "@/components/admin/event-timeline";
import {ConfirmLocationDialog} from "@/components/admin/confirm-location-dialog";
import {LocationPanel} from "@/components/admin/location-panel";
import {GeoSourceBadge} from "@/components/admin/geo-source-badge";
import {useToast} from "@/components/ui/toast";
import {getAdminToken} from "@/lib/admin-auth";
import {useKeyboardShortcut} from "@/lib/hooks/use-keyboard-shortcut";
import {
  type AdminEventUpdateInput,
  approveAdminEvent,
  confirmEventLocation,
  fetchAdminEventDetail,
  rejectAdminEvent,
  updateAdminEvent,
  type AdminEventDetail,
} from "@/lib/admin-api";

interface AdminEventDetailClientProps {
  id: string;
}

export function AdminEventDetailClient({id}: AdminEventDetailClientProps) {
  const t = useTranslations("admin");
  const {showToast} = useToast();
  const [event, setEvent] = useState<AdminEventDetail | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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

  const submitUpdate = async (payload: AdminEventUpdateInput) => {
    const token = getAdminToken();
    if (!token || !event) {
      return;
    }

    try {
      await updateAdminEvent(event.id, token, payload);
      const refreshed = await fetchAdminEventDetail(event.id, token);
      setEvent(refreshed);
      showToast("success", t("eventDetail.editing.saveSuccess"));
      setError(null);
    } catch {
      showToast("error", t("eventDetail.editing.saveFailed"));
      setError(t("errors.actionFailed"));
    }
  };

  const saveField = async (key: keyof AdminEventUpdateInput | "latitude" | "longitude", value: string) => {
    const trimmed = value.trim();

    if (key === "confidence") {
      await submitUpdate({confidence: trimmed ? Number(trimmed) : null});
      return;
    }
    if (key === "latitude") {
      await submitUpdate({latitude: trimmed ? Number(trimmed) : null});
      return;
    }
    if (key === "longitude") {
      await submitUpdate({longitude: trimmed ? Number(trimmed) : null});
      return;
    }
    if (key === "eventTime") {
      await submitUpdate({eventTime: trimmed ? new Date(trimmed).toISOString() : null});
      return;
    }
    if (key === "expiresAt") {
      await submitUpdate({expiresAt: trimmed ? new Date(trimmed).toISOString() : null});
      return;
    }

    await submitUpdate({[key]: trimmed || null});
  };

  const handleConfirmLocation = async () => {
    const token = getAdminToken();
    if (!token || !event || typeof event.lat !== "number" || typeof event.lng !== "number") {
      return;
    }

    try {
      setIsConfirmingLocation(true);
      await confirmEventLocation(event.id, token, {
        latitude: event.lat,
        longitude: event.lng,
        locationText: event.locationText,
      });
      const refreshed = await fetchAdminEventDetail(event.id, token);
      setEvent(refreshed);
      showToast("success", t("eventDetail.location.confirmSuccess"));
      setError(null);
    } catch {
      showToast("error", t("eventDetail.location.confirmFailed"));
      setError(t("errors.actionFailed"));
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const hasCoordinates = typeof event?.lat === "number" && typeof event?.lng === "number";

  useKeyboardShortcut(
    {key: "Enter", ctrl: true},
    () => {
      if (hasCoordinates) {
        setConfirmDialogOpen(true);
      }
    },
    Boolean(event),
  );

  useKeyboardShortcut(
    {key: "Escape"},
    () => {
      setConfirmDialogOpen(false);
    },
    confirmDialogOpen,
  );

  const toDateTimeLocal = (iso: string | null): string => {
    if (!iso) {
      return "";
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--rp-ink-soft)]">{t("eventDetail.label")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--rp-deep)]">{id}</h1>
          {event ? (
            <div className="mt-2 flex items-center gap-2">
              <EditSourceBadge value={event.editSource} />
              <span className="text-xs text-[var(--rp-ink-soft)]">ID: {event.id}</span>
            </div>
          ) : null}
        </div>
        <Link href="/admin/events" className="rounded-md border border-[var(--rp-border)] px-2.5 py-1.5 text-xs text-[var(--rp-ink)] hover:bg-[var(--rp-surface)]">
          {t("eventDetail.back")}
        </Link>
      </header>

      {error ? <p className="text-xs text-amber-400">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.rawMessage")}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--rp-ink)]">
            {event?.rawMessage ?? t("eventDetail.emptyMessage")}
          </p>
        </article>

        <article className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.parsedData")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <EditableField
              label={t("eventDetail.fields.type")}
              value={event?.eventType ?? null}
              onSave={(value) => saveField("eventType", value)}
            />
            <EditableField
              label={t("eventDetail.fields.location")}
              value={event?.locationText ?? null}
              onSave={(value) => saveField("locationText", value)}
            />
            <EditableField
              label={t("eventDetail.fields.senderName")}
              value={event?.senderName ?? null}
              onSave={(value) => saveField("senderName", value)}
            />
            <EditableField
              label={t("eventDetail.fields.description")}
              value={event?.description ?? null}
              onSave={(value) => saveField("description", value)}
            />
            <EditableField
              label={t("eventDetail.fields.confidence")}
              value={event?.confidence ?? null}
              type="number"
              onSave={(value) => saveField("confidence", value)}
              formatter={(value) => (typeof value === "number" ? `${Math.round(value)}%` : "--")}
            />
            <EditableField
              label={t("eventDetail.fields.eventTime")}
              value={toDateTimeLocal(event?.eventTime ?? null)}
              type="datetime"
              onSave={(value) => saveField("eventTime", value)}
            />
            <EditableField
              label={t("eventDetail.fields.expiresAt")}
              value={toDateTimeLocal(event?.expiresAt ?? null)}
              type="datetime"
              onSave={(value) => saveField("expiresAt", value)}
            />

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.fields.geoSource")}</p>
              <div className="mt-1">
                <GeoSourceBadge value={event?.geoSource ?? null} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.fields.editSource")}</p>
              <div className="mt-1">{event ? <EditSourceBadge value={event.editSource} /> : <span className="text-[var(--rp-ink-soft)]">--</span>}</div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.fields.enrichStatus")}</p>
              <p className="mt-1 text-sm text-[var(--rp-ink)]">{event?.enrichStatus ?? "--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.fields.status")}</p>
              <p className="mt-1 text-sm text-[var(--rp-ink)]">{event?.moderationStatus ?? "--"}</p>
            </div>
          </div>
        </article>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <LocationPanel
          latitude={event?.lat ?? null}
          longitude={event?.lng ?? null}
          geoSource={event?.geoSource ?? null}
          formattedAddress={event?.formattedAddress ?? null}
          confirming={isConfirmingLocation}
          onConfirmLocation={() => setConfirmDialogOpen(true)}
          onChangeCoordinates={(lat, lng) => {
            if (!event) {
              return;
            }
            setEvent({...event, lat, lng});
            void submitUpdate({latitude: lat, longitude: lng});
          }}
        />

        <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.fields.coordinates")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <EditableField
              label={t("eventDetail.fields.latitude")}
              value={event?.lat ?? null}
              type="number"
              onSave={(value) => saveField("latitude", value)}
            />
            <EditableField
              label={t("eventDetail.fields.longitude")}
              value={event?.lng ?? null}
              type="number"
              onSave={(value) => saveField("longitude", value)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.actions.title")}</h2>
        <label className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]" htmlFor="reject-note">
          {t("eventDetail.actions.rejectNote")}
        </label>
        <textarea
          id="reject-note"
          value={note}
          onChange={(evt) => setNote(evt.target.value)}
          className="mt-2 min-h-20 w-full rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-3 py-2 text-sm text-[var(--rp-deep)] outline-none focus:border-[var(--rp-primary)]"
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

      <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("eventDetail.timeline.title")}</h2>
        <div className="mt-3">
          <EventTimeline eventId={id} />
        </div>
      </section>

      <footer className="mt-1 flex flex-wrap gap-4 text-xs text-[var(--rp-ink-soft)]">
        <span>
          <kbd className="rounded border border-[var(--rp-border)] bg-[var(--rp-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--rp-ink-soft)]">Ctrl+Enter</kbd>{" "}
          {t("eventDetail.shortcuts.confirmLocation")}
        </span>
        <span>
          <kbd className="rounded border border-[var(--rp-border)] bg-[var(--rp-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--rp-ink-soft)]">Esc</kbd>{" "}
          {t("eventDetail.shortcuts.cancel")}
        </span>
      </footer>

      {hasCoordinates && event ? (
        <ConfirmLocationDialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            if (!isConfirmingLocation) {
              void handleConfirmLocation();
              setConfirmDialogOpen(false);
            }
          }}
          isLoading={isConfirmingLocation}
          locationText={event.locationText}
          lat={event.lat as number}
          lng={event.lng as number}
        />
      ) : null}
    </div>
  );
}
