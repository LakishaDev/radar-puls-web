"use client";

import {LayoutDashboard, ListTree, MapPin, ShieldCheck} from "lucide-react";
import {useTranslations} from "next-intl";
import {Link, usePathname} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

const items = [
  {href: "/admin", key: "sidebar.dashboard", icon: LayoutDashboard},
  {href: "/admin/events", key: "sidebar.events", icon: ListTree},
  {href: "/admin/geocoding-cache", key: "sidebar.geocodingCache", icon: MapPin},
];

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-[var(--rp-border)] bg-[var(--rp-bg)] px-3 py-3 md:w-64 md:border-b-0 md:border-r md:px-4 md:py-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <ShieldCheck className="h-4 w-4 text-[var(--rp-primary)]" />
        <p className="text-sm font-semibold tracking-wide text-[var(--rp-deep)]">{t("sidebar.title")}</p>
      </div>
      <nav className="flex flex-row gap-2 md:flex-col">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--rp-surface)] text-[var(--rp-primary)]"
                  : "text-[var(--rp-ink)] hover:bg-[var(--rp-card)] hover:text-[var(--rp-deep)]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
