"use client";

import {useEffect, useMemo} from "react";
import {useTranslations} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {AdminHeader} from "@/components/admin/admin-header";
import {AdminSidebar} from "@/components/admin/admin-sidebar";
import {ToastProvider} from "@/components/ui/toast";
import {hasAdminToken} from "@/lib/admin-auth";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({children}: AdminShellProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = useMemo(() => pathname.endsWith("/admin/login"), [pathname]);
  const authorized = hasAdminToken();

  useEffect(() => {
    if (!isLoginRoute && !authorized) {
      router.replace("/admin/login");
      return;
    }

    if (isLoginRoute && authorized) {
      router.replace("/admin");
    }
  }, [authorized, isLoginRoute, router]);

  if ((!isLoginRoute && !authorized) || (isLoginRoute && authorized)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--rp-bg)] text-[var(--rp-ink)]">
        <p className="text-sm">{t("common.checkingSession")}</p>
      </main>
    );
  }

  if (isLoginRoute) {
    return (
      <ToastProvider>
        <main className="min-h-screen bg-[var(--rp-bg)]">{children}</main>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="admin-shell min-h-screen bg-[var(--rp-bg)] text-[var(--rp-deep)] md:flex">
        <AdminSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
