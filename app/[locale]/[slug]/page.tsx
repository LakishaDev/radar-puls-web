import type {Metadata} from "next";
import {hasLocale} from "next-intl";
import {notFound} from "next/navigation";
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

  const pageUrl = `${appConfig.siteUrl}/${locale}/${slug}`;
  return {
    title: seoPage.title,
    description: seoPage.description,
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
      title: seoPage.title,
      description: seoPage.description,
      url: pageUrl,
      siteName: appConfig.siteName,
      images: [
        {
          url: `${appConfig.siteUrl}/images/brand/og-placeholder.svg`,
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
      title: seoPage.title,
      description: seoPage.description,
      images: [`${appConfig.siteUrl}/images/brand/og-placeholder.svg`],
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

  const pageUrl = `${appConfig.siteUrl}/${locale}/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoPage.title,
    description: seoPage.description,
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
  };

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-12 text-[var(--rp-ink)] sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Radar Puls SEO</p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--rp-deep)] sm:text-4xl">{seoPage.title}</h1>
      <p className="mt-4 text-base leading-7 text-[var(--rp-ink-soft)]">{seoPage.description}</p>

      <section className="mt-8 rounded-2xl border border-[var(--rp-border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--rp-deep)]">Sta dobijas uz Radar Puls</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--rp-ink-soft)]">
          <li>Prijave saobracajnih kontrola i radara na jednom mestu.</li>
          <li>Brz pregled situacije pre nego sto krenes na put.</li>
          <li>Zajednica vozaca fokusirana na Nis i okolinu.</li>
        </ul>
      </section>
    </main>
  );
}
