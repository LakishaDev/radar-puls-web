"use client";

import dynamic from "next/dynamic";
import {useMemo} from "react";
import {useTranslations} from "next-intl";

export function FullMap() {
  const t = useTranslations("map");
  const MapClient = useMemo(() => {
    return dynamic(() => import("@/components/landing/map-client"), {
      ssr: false,
      loading: () => (
        <div className="flex h-[72vh] items-center justify-center rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)]">
          <div className="flex flex-col items-center gap-3 text-[var(--rp-ink-soft)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--rp-border)] border-t-[var(--rp-primary)]" />
            <p className="text-sm">{t("loading")}</p>
          </div>
        </div>
      ),
    });
  }, [t]);

  return <MapClient heightClassName="h-[72vh] md:h-[78vh]" showDisclaimer />;
}
