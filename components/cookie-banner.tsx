"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";

const storageKey = "cookie_consent";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(storageKey) !== "accepted";
  });

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-4xl rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)]/95 p-4 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--rp-ink-soft)]">
          {t("text")}{" "}
          <Link href="/cookies" className="font-medium text-[var(--rp-primary)] underline underline-offset-2">
            {t("learnMore")}
          </Link>
        </p>
        <button
          type="button"
          className="rounded-md bg-[var(--rp-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--rp-primary-hover)]"
          onClick={() => {
            window.localStorage.setItem(storageKey, "accepted");
            setVisible(false);
          }}
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
