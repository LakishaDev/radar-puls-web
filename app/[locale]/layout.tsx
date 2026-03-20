import type {Metadata} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {appConfig} from "@/lib/config";
import {CookieBanner} from "@/components/cookie-banner";
import {ScrollToTop} from "@/components/scroll-to-top";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({locale, namespace: "seo"});
  const siteUrl = appConfig.siteUrl;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        "sr-latn": `${siteUrl}/sr-latn`,
        "sr-cyrl": `${siteUrl}/sr-cyrl`,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${siteUrl}/${locale}`,
      siteName: "Radar Puls",
      images: [
        {
          url: `${siteUrl}/images/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: "Radar Puls",
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

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const localeUrl = `${appConfig.siteUrl}/${locale}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: appConfig.siteName,
      applicationCategory: "TravelApplication",
      operatingSystem: "Android, iOS",
      inLanguage: locale,
      url: localeUrl,
      description: messages.seo?.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RSD",
      },
      areaServed: {
        "@type": "City",
        name: appConfig.business.city,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: appConfig.siteName,
      url: localeUrl,
      image: `${appConfig.siteUrl}/images/brand/og-default.png`,
      address: {
        "@type": "PostalAddress",
        addressLocality: appConfig.business.addressLocality,
        addressRegion: appConfig.business.addressRegion,
        addressCountry: appConfig.business.country,
      },
      areaServed: appConfig.business.city,
      sameAs: [appConfig.googlePlayUrl, appConfig.appStoreUrl],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: appConfig.siteName,
      url: appConfig.siteUrl,
      logo: `${appConfig.siteUrl}/images/brand/logo.svg`,
      sameAs: [
        appConfig.social.instagram,
        appConfig.social.facebook,
        appConfig.social.youtube,
        appConfig.googlePlayUrl,
        appConfig.appStoreUrl,
      ],
    },
  ];

  return (
    <NextIntlClientProvider locale={locale as AppLocale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      {children}
      <ScrollToTop />
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
