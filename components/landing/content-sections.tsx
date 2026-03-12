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
      {/* Info grid */}
      <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">

        {/* Problem card */}
        <article className="group rounded-xl border border-[var(--rp-border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[var(--rp-danger)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
          </div>
          <h2 className="mb-3 text-base font-semibold text-[var(--rp-deep)]">{problem("title")}</h2>
          <ul className="space-y-2 text-sm leading-6 text-[var(--rp-ink-soft)]">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--rp-danger)]" />
              {problem("point1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--rp-danger)]" />
              {problem("point2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--rp-danger)]" />
              {problem("point3")}
            </li>
          </ul>
        </article>

        {/* How it works card */}
        <article id="kako-radi" className="group rounded-xl border border-[var(--rp-border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[var(--rp-primary)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <h2 className="mb-4 text-base font-semibold text-[var(--rp-deep)]">{how("title")}</h2>
          <ol className="space-y-4 text-sm leading-6 text-[var(--rp-ink-soft)]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--rp-primary)] text-[10px] font-bold text-white">1</span>
              <div>
                <strong className="block font-medium text-[var(--rp-ink)]">{how("step1Title")}</strong>
                {how("step1Desc")}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--rp-primary)] text-[10px] font-bold text-white">2</span>
              <div>
                <strong className="block font-medium text-[var(--rp-ink)]">{how("step2Title")}</strong>
                {how("step2Desc")}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--rp-primary)] text-[10px] font-bold text-white">3</span>
              <div>
                <strong className="block font-medium text-[var(--rp-ink)]">{how("step3Title")}</strong>
                {how("step3Desc")}
              </div>
            </li>
          </ol>
        </article>

        {/* Stats card */}
        <article id="zajednica" className="group rounded-xl border border-[var(--rp-border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[var(--rp-primary)]">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="mb-4 text-base font-semibold text-[var(--rp-deep)]">{stats("title")}</h2>
          <div className="space-y-4 text-sm text-[var(--rp-ink-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--rp-surface)]">
                <Users className="h-3.5 w-3.5 text-[var(--rp-primary)]" />
              </div>
              <span>{stats("reports")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--rp-surface)]">
                <RadioTower className="h-3.5 w-3.5 text-[var(--rp-primary)]" />
              </div>
              <span>{stats("active")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--rp-surface)]">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--rp-primary)]" />
              </div>
              <span>{stats("latest")}</span>
            </div>
          </div>
        </article>
      </section>

      {/* Download CTA */}
      <section id="preuzmi" className="mx-auto mt-8 w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[var(--rp-surface)] to-white p-8 shadow-sm sm:p-10">
          {/* Subtle decoration */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 opacity-30"
            style={{background: "radial-gradient(circle at top right, #BFDBFE, transparent 70%)"}}
          />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-500">Beta</p>
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
        </div>
      </section>
    </>
  );
}
