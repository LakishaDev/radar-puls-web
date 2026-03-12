"use client";

import {FormEvent, useState} from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {Reveal} from "@/components/motion/reveal";

export function NewsletterSection() {
  const t = useTranslations("newsletter");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Reveal>
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8" id="newsletter">
        <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-primary)]">Notify me</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--rp-deep)]">{t("title")}</h2>
          <p className="mt-2 text-sm text-[var(--rp-ink-soft)]">{t("description")}</p>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
            <input
              type="email"
              required
              placeholder={t("placeholder")}
              className="h-12 flex-1 rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-4 text-sm text-[var(--rp-ink)] outline-none focus:border-[var(--rp-primary)]"
            />
            <Button size="lg" type="submit" className="sm:min-w-40">
              {t("cta")}
            </Button>
          </form>

          {submitted && (
            <p className="mt-3 text-sm font-medium text-emerald-600">{t("success")}</p>
          )}
        </div>
      </section>
    </Reveal>
  );
}
