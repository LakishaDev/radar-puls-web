import type {Metadata} from "next";
import {hasLocale} from "next-intl";
import {notFound} from "next/navigation";
import {LegalPageLayout} from "@/components/legal/legal-page-layout";
import {routing} from "@/i18n/routing";
import {appConfig} from "@/lib/config";
import {getLegalDocument} from "@/lib/legal-content";

type LocaleParams = {locale: string};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const {locale} = await params;
  const safeLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const content = await getLegalDocument(safeLocale, "terms");

  return {
    title: content.title,
    description: content.intro,
    alternates: {
      canonical: `${appConfig.siteUrl}/${safeLocale}/terms`,
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const content = await getLegalDocument(locale, "terms");

  return (
    <LegalPageLayout
      title={content.title}
      intro={content.intro}
      sections={content.sections}
      lastUpdated={content.lastUpdated}
    />
  );
}
