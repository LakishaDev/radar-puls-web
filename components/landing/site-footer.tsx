import {useTranslations} from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[var(--rp-border)] bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-[13px] text-[var(--rp-ink-soft)]">{t("text")}</p>
        <p className="text-[13px] font-semibold tracking-wide text-[var(--rp-primary)]">{t("domain")}</p>
      </div>
    </footer>
  );
}
