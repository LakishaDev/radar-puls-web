import {useTranslations} from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[var(--rp-border)] bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[var(--rp-ink-soft)] sm:px-6 lg:px-8">
        <p>{t("text")}</p>
        <p className="font-medium text-[var(--rp-deep)]">{t("domain")}</p>
      </div>
    </footer>
  );
}
