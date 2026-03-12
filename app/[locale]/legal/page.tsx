import type {Metadata} from "next";
import {Cookie, FileText, Lock, Shield, Users} from "lucide-react";
import {hasLocale} from "next-intl";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";
import {appConfig} from "@/lib/config";
import {getLegalHubContent} from "@/lib/legal-content";

type LocaleParams = {locale: string};

const cardIcons = {
  Shield,
  FileText,
  Lock,
  Cookie,
  Users,
};

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
  const content = await getLegalHubContent(safeLocale);

  return {
    title: content.metadataTitle ?? content.title,
    description: content.metadataDescription ?? content.intro,
    alternates: {
      canonical: `${appConfig.siteUrl}/${safeLocale}/legal`,
    },
  };
}

export default async function LegalHubPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const content = await getLegalHubContent(locale);

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-12 text-[var(--rp-ink)] sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--rp-deep)] sm:text-4xl">{content.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--rp-ink-soft)]">{content.intro}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.cards.map((card) => {
          const Icon = cardIcons[card.icon];

          return (
            <Link
              key={card.route}
              href={card.route}
              className="group rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--rp-primary)] hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--rp-border)] text-[var(--rp-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--rp-deep)] transition-colors group-hover:text-[var(--rp-primary)]">
                  {card.title}
                </h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--rp-ink-soft)]">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
