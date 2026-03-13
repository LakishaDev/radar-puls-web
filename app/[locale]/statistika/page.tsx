import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {PublicStatsSection} from "@/components/map/public-stats";

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "statsPage"});

  return {
    title: t("title"),
    description: t("description"),
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
