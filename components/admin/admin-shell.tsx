"use client";

import {useEffect, useMemo} from "react";
import {useTranslations} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {AdminHeader} from "@/components/admin/admin-header";
import {AdminSidebar} from "@/components/admin/admin-sidebar";
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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <p className="text-sm">{t("common.checkingSession")}</p>
      </main>
    );
  }

  if (isLoginRoute) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
