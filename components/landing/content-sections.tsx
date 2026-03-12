"use client";

import {useTranslations} from "next-intl";
import {ShieldCheck, RadioTower, Users} from "lucide-react";
import {Reveal, StaggerContainer, StaggerItem} from "@/components/motion/reveal";

const topReporters = [
  {name: "NiskiVozac", reports: 124, accuracy: "97%"},
  {name: "MedijanaAlert", reports: 103, accuracy: "95%"},
  {name: "BulevarScout", reports: 88, accuracy: "94%"},
  {name: "PalilulaDrive", reports: 72, accuracy: "92%"},
];

export function ContentSections() {
  const problem = useTranslations("problem");
  const how = useTranslations("how");
  const stats = useTranslations("stats");

  return (
    <>
      <Reveal>
        <StaggerContainer className="mx-auto mt-8 grid w-full max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">

        {/* Problem card */}
        <StaggerItem>
          <article className="group rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-sm transition-shadow hover:shadow-md">
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
        </StaggerItem>

        {/* How it works card */}
        <StaggerItem>
          <article id="kako-radi" className="group rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-sm transition-shadow hover:shadow-md">
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
        </StaggerItem>

        {/* Stats card */}
        <StaggerItem>
          <article id="zajednica" className="group rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-sm transition-shadow hover:shadow-md">
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
        </StaggerItem>
        </StaggerContainer>
      </Reveal>

      {/* Community leaderboard (placeholder) */}
      <Reveal>
        <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Community</p>
              <h3 className="mt-1 text-xl font-semibold text-[var(--rp-deep)]">Top reporteri ove nedelje</h3>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-700">
              Placeholder
            </span>
          </div>

          <StaggerContainer className="grid gap-3 sm:grid-cols-2">
            {topReporters.map((reporter, index) => (
              <StaggerItem key={reporter.name}>
                <article
                  className="flex items-center justify-between rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--rp-primary)] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--rp-ink)]">{reporter.name}</p>
                      <p className="text-xs text-[var(--rp-ink-soft)]">{reporter.reports} potvrdenih prijava</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600">Tacnost {reporter.accuracy}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
          </div>
        </section>
      </Reveal>
    </>
  );
}
