"use client";

import {useLocale, useTranslations} from "next-intl";
import {routing, type AppLocale} from "@/i18n/routing";
import {usePathname, useRouter} from "@/i18n/navigation";
import {trackEvent} from "@/lib/analytics";

const localeLabels: Record<AppLocale, string> = {
  "sr-latn": "SR (latinica)",
  "sr-cyrl": "SR (cirilica)",
  en: "EN",
};

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/90">
      <span className="hidden sm:inline">{t("language")}</span>
      <select
        aria-label={t("language")}
        className="bg-transparent text-xs outline-none"
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as AppLocale;
          trackEvent("locale_switch", {from: locale, to: nextLocale});
          router.replace(pathname, {locale: nextLocale});
        }}
      >
        {routing.locales.map((option) => (
          <option className="text-black" key={option} value={option}>
            {localeLabels[option as AppLocale]}
          </option>
        ))}
      </select>
    </label>
  );
}
