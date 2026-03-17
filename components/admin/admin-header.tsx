"use client";

import {useState} from "react";
import {LogOut, Moon, Sun} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {clearAdminToken} from "@/lib/admin-auth";
import {useAdminTheme} from "@/lib/hooks/use-admin-theme";
import {useAdminRealtime} from "@/lib/hooks/use-admin-realtime";

export function AdminHeader() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const {theme, toggle} = useAdminTheme();

  useAdminRealtime({onConnectionChange: setConnected});

  const handleLogout = () => {
    clearAdminToken();
    router.replace("/admin/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--rp-border)] bg-[var(--rp-bg)] px-4 py-3 backdrop-blur-sm md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--rp-ink-soft)]">{t("header.title")}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {connected ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            ) : null}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-[var(--rp-ink-soft)]"}`} />
          </span>
          <span className="text-xs text-[var(--rp-ink-soft)]">{connected ? t("realtime.connected") : t("realtime.disconnected")}</span>
        </div>

        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center rounded-md border border-[var(--rp-border)] p-1.5 text-[var(--rp-ink-soft)] transition-colors hover:bg-[var(--rp-surface)] hover:text-[var(--rp-deep)]"
          aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
          title={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--rp-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--rp-ink)] transition-colors hover:bg-[var(--rp-surface)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("header.logout")}
        </button>
      </div>
    </header>
  );
}
