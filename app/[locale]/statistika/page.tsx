import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {appConfig} from "@/lib/config";
import {PublicStatsSection} from "@/components/map/public-stats";

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "statsPage"});
  const siteUrl = appConfig.siteUrl;
  const pageUrl = `${siteUrl}/${locale}/statistika`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: pageUrl,
      languages: {
        "sr-latn": `${siteUrl}/sr-latn/statistika`,
        "sr-cyrl": `${siteUrl}/sr-cyrl/statistika`,
        en: `${siteUrl}/en/statistika`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: pageUrl,
      siteName: appConfig.siteName,
      images: [
        {
          url: `${siteUrl}/images/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: appConfig.siteName,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${siteUrl}/images/brand/og-default.png`],
    },
  };
}

export default async function StatistikaPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "statsPage"});

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--rp-deep)]">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--rp-ink-soft)]">{t("subtitle")}</p>
      </header>
      <PublicStatsSection />
    </main>
  );
}
