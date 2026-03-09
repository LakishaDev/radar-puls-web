"use client";

import {useEffect} from "react";
import {useTranslations} from "next-intl";
import {ArrowRight, Download} from "lucide-react";
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
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1b3f] via-[#132c63] to-[#7b1123] p-8 shadow-2xl shadow-[#070b18]/40 sm:p-12">
        <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/90">
          {t("badge")}
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={googlePlayUrl} target="_blank" rel="noreferrer">
            <Button
              size="lg"
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
        <p className="mt-5 text-sm text-white/75">{t("note")}</p>
      </div>
    </section>
  );
}
