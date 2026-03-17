"use client";

import {useTranslations} from "next-intl";
import {cn} from "@/lib/utils";
import {type GeoSource} from "@/lib/api";

interface GeoSourceBadgeProps {
  value: GeoSource;
}

function classForGeoSource(value: GeoSource): string {
  switch (value) {
    case "google":
      return "border-emerald-500/30 bg-emerald-500/20 text-emerald-300";
    case "google_partial":
      return "border-amber-500/30 bg-amber-500/20 text-amber-300";
    case "cache":
      return "border-cyan-500/30 bg-cyan-500/20 text-[var(--rp-primary)]";
    case "admin":
      return "border-amber-500/30 bg-amber-500/20 text-amber-300";
    case "admin_confirmed":
      return "border-emerald-500/30 bg-emerald-500/20 text-emerald-300";
    case "nominatim":
      return "border-blue-500/30 bg-blue-500/20 text-blue-300";
    case "fallback":
    default:
      return "border-[var(--rp-border)] bg-[var(--rp-surface)] text-[var(--rp-ink)]";
  }
}

export function GeoSourceBadge({value}: GeoSourceBadgeProps) {
  const tMap = useTranslations("map");
  if (!value) {
    return <span className="text-[var(--rp-ink-soft)]">--</span>;
  }

  const label = value === "google_partial" ? tMap("geo.approximate") : tMap(`geo.source.${value}`);

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", classForGeoSource(value))}>
      {label}
    </span>
  );
}
