import type {MetadataRoute} from "next";
import {routing} from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://radarpuls.com";
  const now = new Date();

  return routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));
}
