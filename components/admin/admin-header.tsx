"use client";

import {LogOut} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {clearAdminToken} from "@/lib/admin-auth";

export function AdminHeader() {
  const t = useTranslations("admin");
  const router = useRouter();

  const handleLogout = () => {
    clearAdminToken();
    router.replace("/admin/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-sm md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("header.title")}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
      >
        <LogOut className="h-3.5 w-3.5" />
        {t("header.logout")}
      </button>
    </header>
  );
}
