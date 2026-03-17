"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {appConfig} from "@/lib/config";
import {Reveal} from "@/components/motion/reveal";

type CounterState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(targetDate: Date): CounterState {
  const now = new Date();
  const diff = Math.max(0, targetDate.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownSection() {
  const t = useTranslations("countdown");
  const targetDate = useMemo(() => new Date(appConfig.liveMapLaunchDate), []);
  const [timeLeft, setTimeLeft] = useState<CounterState>(() => getTimeLeft(targetDate));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  const blocks: Array<{label: string; value: number}> = [
    {label: t("days"), value: timeLeft.days},
    {label: t("hours"), value: timeLeft.hours},
    {label: t("minutes"), value: timeLeft.minutes},
    {label: t("seconds"), value: timeLeft.seconds},
  ];

  return (
    <Reveal>
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8" id="launch">
        <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-sm sm:p-8 dark:border-blue-400/20 dark:from-slate-900 dark:to-blue-950">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300">Launch</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--rp-deep)]">{t("title")}</h2>
          <p className="mt-2 text-sm text-[var(--rp-ink-soft)]">{t("description")}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {blocks.map((block) => (
              <div key={block.label} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] px-4 py-3 text-center">
                <p className="text-3xl font-bold tabular-nums text-[var(--rp-deep)]">{String(block.value).padStart(2, "0")}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--rp-ink-soft)]">{block.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
