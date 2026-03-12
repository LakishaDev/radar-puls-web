"use client";

import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {trackEvent} from "@/lib/analytics";
import {appConfig} from "@/lib/config";
import {Reveal} from "@/components/motion/reveal";

export function DownloadCtaSection() {
  const download = useTranslations("download");

  return (
    <Reveal>
      <section id="preuzmi" className="mx-auto mt-10 w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[var(--rp-surface)] to-white p-8 shadow-sm sm:p-10 dark:border-blue-400/20 dark:from-slate-900 dark:to-slate-800">
          <div
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 opacity-30"
            style={{background: "radial-gradient(circle at top right, #BFDBFE, transparent 70%)"}}
          />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-500">Beta</p>
            <h2 className="text-2xl font-semibold text-[var(--rp-deep)]">{download("title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--rp-ink-soft)]">{download("description")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={appConfig.googlePlayUrl} target="_blank" rel="noreferrer">
                <Button
                  size="lg"
                  onClick={() => trackEvent("cta_download_click", {store: "google_play", section: "bottom"})}
                >
                  {download("play")}
                </Button>
              </a>
              <a href={appConfig.appStoreUrl} target="_blank" rel="noreferrer">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border border-[var(--rp-border)]"
                  onClick={() => trackEvent("cta_download_click", {store: "app_store", section: "bottom"})}
                >
                  {download("store")}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
