"use client";

import {useTranslations} from "next-intl";
import {Reveal, StaggerContainer, StaggerItem} from "@/components/motion/reveal";

const testimonialKeys = ["item1", "item2", "item3"];

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <Reveal>
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8" id="iskustva">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-primary)]">Social Proof</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--rp-deep)]">{t("title")}</h2>

        <StaggerContainer className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonialKeys.map((key) => (
            <StaggerItem key={key}>
              <article className="h-full rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-5 shadow-sm">
                <p className="text-sm leading-6 text-[var(--rp-ink)]">&ldquo;{t(`${key}.quote`)}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rp-primary)] text-xs font-bold text-white">
                    {t(`${key}.initials`)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--rp-deep)]">{t(`${key}.name`)}</p>
                    <p className="text-xs text-[var(--rp-ink-soft)]">{t(`${key}.location`)}</p>
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </Reveal>
  );
}
