import type {MetadataRoute} from "next";
import {routing} from "@/i18n/routing";
import {appConfig} from "@/lib/config";
import {futureSeoPages} from "@/lib/seo-slugs";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const legalRoutes = ["legal", "disclaimer", "cookies", "community-guidelines", "privacy", "terms"];

  const localePages = routing.locales.map((locale) => ({
    url: `${appConfig.siteUrl}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const legalPages = routing.locales.flatMap((locale) =>
    legalRoutes.map((route) => ({
      url: `${appConfig.siteUrl}/${locale}/${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  );

  const seoPages = routing.locales.flatMap((locale) =>
    futureSeoPages.map((page) => ({
      url: `${appConfig.siteUrl}/${locale}/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [...localePages, ...legalPages, ...seoPages];
}
