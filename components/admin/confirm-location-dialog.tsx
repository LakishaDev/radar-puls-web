"use client";

import {useEffect} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {AlertTriangle, Loader2, MapPin, X} from "lucide-react";
import {useTranslations} from "next-intl";

interface ConfirmLocationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  locationText: string;
  lat: number;
  lng: number;
}

export function ConfirmLocationDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  locationText,
  lat,
  lng,
}: ConfirmLocationDialogProps) {
  const t = useTranslations("admin.eventDetail.confirmDialog");

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onConfirm, open]);

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          className="fixed inset-0 z-50 bg-black/60 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{opacity: 0, scale: 0.95, y: 10}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.95, y: 10}}
            transition={{duration: 0.15}}
            className="mx-auto mt-[20vh] w-full max-w-md rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-[var(--rp-deep)]">{t("title")}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-[var(--rp-ink-soft)] transition-colors hover:bg-[var(--rp-surface)] hover:text-[var(--rp-ink)]"
                aria-label={t("cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-[var(--rp-surface)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("location")}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--rp-deep)]">{locationText}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[var(--rp-ink-soft)]">{t("coordinates")}</p>
              <p className="mt-1 font-mono text-sm text-[var(--rp-primary)]">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm text-emerald-400 transition-colors hover:text-emerald-300"
              >
                {t("openMaps")}
              </a>
            </div>

            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="flex items-start gap-2 text-xs text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {t("warning", {location: locationText})}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[var(--rp-border)] px-3 py-1.5 text-xs font-semibold text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {t("confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
