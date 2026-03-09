"use client";

import {useTranslations} from "next-intl";
import {ShieldCheck, RadioTower, Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {trackEvent} from "@/lib/analytics";

const googlePlayUrl =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ?? "https://play.google.com/store";
const appStoreUrl =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com";

export function ContentSections() {
  const problem = useTranslations("problem");
  const how = useTranslations("how");
  const stats = useTranslations("stats");
  const download = useTranslations("download");

  return (
    <>
      <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <article className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-5">
          <h2 className="mb-3 text-xl font-semibold text-[var(--rp-deep)]">{problem("title")}</h2>
          <ul className="space-y-2 text-sm leading-6 text-[var(--rp-ink-soft)]">
            <li>{problem("point1")}</li>
            <li>{problem("point2")}</li>
            <li>{problem("point3")}</li>
          </ul>
        </article>
        <article id="kako-radi" className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-5">
          <h2 className="mb-3 text-xl font-semibold text-[var(--rp-deep)]">{how("title")}</h2>
          <ul className="space-y-3 text-sm leading-6 text-[var(--rp-ink-soft)]">
            <li><strong>{how("step1Title")}</strong><br />{how("step1Desc")}</li>
            <li><strong>{how("step2Title")}</strong><br />{how("step2Desc")}</li>
            <li><strong>{how("step3Title")}</strong><br />{how("step3Desc")}</li>
          </ul>
        </article>
        <article id="zajednica" className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-5">
          <h2 className="mb-3 text-xl font-semibold text-[var(--rp-deep)]">{stats("title")}</h2>
          <div className="space-y-4 text-sm text-[var(--rp-ink-soft)]">
            <p className="flex items-center gap-2"><Users className="h-4 w-4 text-[var(--rp-primary)]" />{stats("reports")}</p>
            <p className="flex items-center gap-2"><RadioTower className="h-4 w-4 text-[var(--rp-primary)]" />{stats("active")}</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--rp-primary)]" />{stats("latest")}</p>
          </div>
        </article>
      </section>

      <section id="preuzmi" className="mx-auto mt-8 w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-surface)] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-[var(--rp-deep)]">{download("title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--rp-ink-soft)]">{download("description")}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={googlePlayUrl} target="_blank" rel="noreferrer">
              <Button
                size="lg"
                onClick={() => trackEvent("cta_download_click", {store: "google_play", section: "bottom"})}
              >
                {download("play")}
              </Button>
            </a>
            <a href={appStoreUrl} target="_blank" rel="noreferrer">
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
      </section>
    </>
  );
}
