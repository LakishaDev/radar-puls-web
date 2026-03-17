"use client";

import {AnimatePresence, motion} from "framer-motion";
import {PencilLine} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";

interface EditableFieldProps {
  label: string;
  value: string | number | null;
  type?: "text" | "number" | "datetime";
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  formatter?: (value: string | number | null) => string;
  className?: string;
}

function toInputValue(value: string | number | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function EditableField({
  label,
  value,
  type = "text",
  placeholder,
  onSave,
  formatter,
  className,
}: EditableFieldProps) {
  const t = useTranslations("admin.eventDetail.editing");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toInputValue(value));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(toInputValue(value));
    }
  }, [editing, value]);

  useEffect(() => {
    if (!editing || !inputRef.current) {
      return;
    }

    inputRef.current.focus();
    inputRef.current.select();
  }, [editing]);

  const renderedValue = formatter ? formatter(value) : toInputValue(value) || "--";

  const save = async () => {
    if (busy) {
      return;
    }

    try {
      setBusy(true);
      await onSave(draft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const inputType = type === "datetime" ? "datetime-local" : type;

  const startEditing = () => {
    if (busy) {
      return;
    }
    setEditing(true);
  };

  const cancelEditing = () => {
    if (busy) {
      return;
    }
    setDraft(toInputValue(value));
    setEditing(false);
  };

  const moveFocusToAdjacentEditable = (backward: boolean) => {
    if (!inputRef.current) {
      return;
    }

    const activeInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[data-rp-editable-input='true']:not(:disabled)"),
    );
    if (activeInputs.length <= 1) {
      return;
    }

    const currentIndex = activeInputs.indexOf(inputRef.current);
    if (currentIndex === -1) {
      return;
    }

    const offset = backward ? -1 : 1;
    const targetIndex = (currentIndex + offset + activeInputs.length) % activeInputs.length;
    const targetInput = activeInputs[targetIndex];
    targetInput.focus();
    targetInput.select();
  };

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{label}</p>

      <AnimatePresence mode="wait" initial={false}>
        {!editing ? (
          <motion.div
            key="view"
            layout
            initial={{opacity: 0, y: 4}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -4}}
            className="mt-1 flex items-center gap-2"
          >
            <p className="text-sm text-[var(--rp-ink)]">{renderedValue}</p>
            <button
              type="button"
              onClick={startEditing}
              className="text-[var(--rp-ink-soft)] transition-colors hover:text-[var(--rp-primary)]"
            >
              <PencilLine className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            layout
            initial={{opacity: 0, y: 4}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -4}}
            className="mt-1 space-y-1"
          >
            <input
              ref={inputRef}
              data-rp-editable-input="true"
              value={draft}
              onChange={(evt) => setDraft(evt.target.value)}
              onKeyDown={(evt) => {
                if (evt.key === "Escape") {
                  evt.preventDefault();
                  cancelEditing();
                  return;
                }

                if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "s") {
                  evt.preventDefault();
                  void save();
                  return;
                }

                if (evt.key === "Enter") {
                  evt.preventDefault();
                  void save();
                  return;
                }

                if (evt.key === "Tab") {
                  evt.preventDefault();
                  moveFocusToAdjacentEditable(evt.shiftKey);
                }
              }}
              type={inputType}
              placeholder={placeholder}
              className="w-full rounded-md border border-cyan-500/60 bg-[var(--rp-bg)] px-2.5 py-1.5 text-sm text-[var(--rp-deep)] outline-none focus:ring-2 focus:ring-[var(--rp-primary)]/40"
            />
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                disabled={busy}
                onClick={save}
                className="text-emerald-400 transition-colors hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("save")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={cancelEditing}
                className="text-[var(--rp-ink-soft)] transition-colors hover:text-[var(--rp-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("cancel")}
              </button>
            </div>
            <p className="text-[11px] text-[var(--rp-ink-soft)]">{t("shortcutHint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
