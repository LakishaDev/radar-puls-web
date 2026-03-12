"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {ChevronDown} from "lucide-react";
import {Reveal, StaggerContainer, StaggerItem} from "@/components/motion/reveal";

const faqItems = ["q1", "q2", "q3", "q4", "q5", "q6"];

export function FaqSection() {
  const t = useTranslations("faq");
  const [openItem, setOpenItem] = useState<string>(faqItems[0]);

  return (
    <Reveal>
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8" id="faq">
        <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-primary)]">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--rp-deep)]">{t("title")}</h2>

          <StaggerContainer className="mt-6 space-y-3">
            {faqItems.map((itemKey) => {
              const open = openItem === itemKey;
              return (
                <StaggerItem key={itemKey}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-[var(--rp-border)] bg-[var(--rp-bg)] px-4 py-3 text-left"
                    onClick={() => setOpenItem((current) => (current === itemKey ? "" : itemKey))}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[var(--rp-ink)]">{t(`${itemKey}.question`)}</span>
                      <ChevronDown className={`h-4 w-4 text-[var(--rp-ink-soft)] transition-transform ${open ? "rotate-180" : ""}`} />
                    </span>
                    <span
                      className={`grid transition-all duration-300 ${open ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <span className="overflow-hidden text-sm leading-6 text-[var(--rp-ink-soft)]">
                        {t(`${itemKey}.answer`)}
                      </span>
                    </span>
                  </button>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>
    </Reveal>
  );
}
