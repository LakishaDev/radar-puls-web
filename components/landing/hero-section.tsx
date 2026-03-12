"use client";

import {useEffect} from "react";
import {useTranslations} from "next-intl";
import {ArrowRight, Download, MapPin} from "lucide-react";
import {Button} from "@/components/ui/button";
import {trackEvent} from "@/lib/analytics";

const googlePlayUrl =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ?? "https://play.google.com/store";
const appStoreUrl =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com";

export function HeroSection() {
  const t = useTranslations("hero");

  useEffect(() => {
    trackEvent("hero_view", {section: "hero"});
  }, []);

  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-2xl overflow-hidden border border-slate-700/40 bg-gradient-to-br from-[#0A1628] via-[#0F2347] to-[#0A1A36] p-8 shadow-2xl shadow-blue-950/40 sm:p-12 relative">

        {/* Glow blobs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-20"
          style={{background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)"}}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-10"
          style={{background: "radial-gradient(circle, #DC2626 0%, transparent 70%)"}}
        />

        {/* Road grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative">
          {/* Location badge */}
          <div className="mb-5 flex items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/75">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
              </span>
              {t("badge")}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <MapPin className="h-3 w-3" />
              Niš, Srbija
            </span>
          </div>

          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={googlePlayUrl} target="_blank" rel="noreferrer">
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-950/40 border-0"
                onClick={() => trackEvent("cta_download_click", {store: "google_play"})}
              >
                <Download className="h-4 w-4" />
                {t("primaryCta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href={appStoreUrl} target="_blank" rel="noreferrer">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => trackEvent("cta_download_click", {store: "app_store"})}
              >
                {t("secondaryCta")}
              </Button>
            </a>
          </div>

          <p className="mt-5 text-sm text-white/45">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
