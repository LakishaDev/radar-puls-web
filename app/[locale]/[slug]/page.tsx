import type {Metadata} from "next";
import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import Link from "next/link";
import {routing} from "@/i18n/routing";
import {appConfig} from "@/lib/config";
import {futureSeoPages, getFutureSeoPageBySlug} from "@/lib/seo-slugs";

type SeoPageParams = {
  locale: string;
  slug: string;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    futureSeoPages.map((page) => ({
      locale,
      slug: page.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SeoPageParams>;
}): Promise<Metadata> {
  const {locale, slug} = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const seoPage = getFutureSeoPageBySlug(slug);
  if (!seoPage) {
    return {};
  }

  const t = await getTranslations({locale});
  const title = t(seoPage.titleKey);
  const description = t(seoPage.descriptionKey);
  const pageUrl = `${appConfig.siteUrl}/${locale}/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          `${appConfig.siteUrl}/${supportedLocale}/${slug}`,
        ]),
      ),
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: appConfig.siteName,
      images: [
        {
          url: `${appConfig.siteUrl}/images/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: appConfig.siteName,
        },
      ],
      type: "article",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${appConfig.siteUrl}/images/brand/og-default.png`],
    },
  };
}

const localeLabels: Record<string, string> = {
  "sr-latn": "sr-Latn",
  "sr-cyrl": "sr-Cyrl",
  en: "en",
};

export default async function SeoLandingPage({
  params,
}: {
  params: Promise<SeoPageParams>;
}) {
  const {locale, slug} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const seoPage = getFutureSeoPageBySlug(slug);
  if (!seoPage) {
    notFound();
  }

  const t = await getTranslations({locale});
  const title = t(seoPage.titleKey);
  const description = t(seoPage.descriptionKey);
  const pageUrl = `${appConfig.siteUrl}/${locale}/${slug}`;
  const ct = (key: string) => t(`${seoPage.contentKey}.${key}`);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: pageUrl,
      inLanguage: localeLabels[locale] ?? locale,
      isPartOf: {
        "@type": "WebSite",
        name: appConfig.siteName,
        url: `${appConfig.siteUrl}/${locale}`,
      },
      about: {
        "@type": "Thing",
        name: "Saobracajne prijave u Nisu",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: appConfig.siteName,
          item: `${appConfig.siteUrl}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: pageUrl,
        },
      ],
    },
  ];

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-12 text-[var(--rp-ink)] sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Radar Puls</p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--rp-deep)] sm:text-4xl">{ct("heading")}</h1>
      <p className="mt-4 text-base leading-7 text-[var(--rp-ink-soft)]">{ct("intro")}</p>

      <section className="mt-8 rounded-2xl border border-[var(--rp-border)] bg-white p-6 shadow-sm dark:bg-[var(--rp-card)]">
        <h2 className="text-lg font-semibold text-[var(--rp-deep)]">{ct("benefitsTitle")}</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--rp-ink-soft)]">
          <li>{ct("benefit1")}</li>
          <li>{ct("benefit2")}</li>
          <li>{ct("benefit3")}</li>
          <li>{ct("benefit4")}</li>
        </ul>
      </section>

      <div className="mt-8">
        <Link
          href={`/${locale}/mapa`}
          className="inline-flex items-center rounded-xl bg-[var(--rp-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--rp-primary-hover)]"
        >
          {ct("ctaText")}
        </Link>
      </div>
    </main>
  );
}
