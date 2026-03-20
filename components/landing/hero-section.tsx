"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRight, Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { appConfig } from "@/lib/config";
import { Reveal } from "@/components/motion/reveal";

export function HeroSection() {
  const t = useTranslations("hero");

  useEffect(() => {
    trackEvent("hero_view", { section: "hero", variant: "mockup" });
  }, []);

  return (
    <Reveal>
      <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-700/40 bg-gradient-to-br from-[#0A1628] via-[#0F2347] to-[#0A1A36] p-8 shadow-2xl shadow-blue-950/40 sm:p-12">
          {/* Glow blobs */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #DC2626 0%, transparent 70%)",
            }}
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

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
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
                <a
                  href={appConfig.googlePlayUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    size="lg"
                    className="bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-950/40 border-0"
                    onClick={() =>
                      trackEvent("cta_download_click", { store: "google_play" })
                    }
                  >
                    <Download className="h-4 w-4" />
                    {t("primaryCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a
                  href={appConfig.appStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() =>
                      trackEvent("cta_download_click", { store: "app_store" })
                    }
                  >
                    {t("secondaryCta")}
                  </Button>
                </a>
              </div>

              <p className="mt-5 text-sm text-white/45">{t("note")}</p>
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/40">
                <div className="mx-auto w-full max-w-xs">
                  <div className="relative rounded-[2rem] border border-white/20 bg-black/50 p-2 shadow-2xl shadow-black/40">
                    <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-white/30" />
                    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-900 to-blue-950 p-4">
                      <div className="mb-4 flex items-center justify-between text-[10px] text-white/60">
                        <span>Radar Puls Live</span>
                        <span>Niš</span>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                          🚔 Policija · Obrenovićeva · pre 2 min
                        </div>
                        <div className="rounded-md border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                          📡 Radar · Bulevar Nemanjića · pre 6 min
                        </div>
                        <div className="rounded-md border border-blue-300/25 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
                          🚧 Kontrola · Medijana · pre 9 min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
