import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sr-latn", "sr-cyrl", "en"],
  defaultLocale: "sr-latn",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
