import {getTranslations} from "next-intl/server";
import {SiteNavbar} from "@/components/landing/site-navbar";
import {HeroSection} from "@/components/landing/hero-section";
import {ContentSections} from "@/components/landing/content-sections";
import {CountdownSection} from "@/components/landing/countdown-section";
import {TestimonialsSection} from "@/components/landing/testimonials-section";
import {MapSection} from "@/components/landing/map-section";
import {NewsletterSection} from "@/components/landing/newsletter-section";
import {FaqSection} from "@/components/landing/faq-section";
import {DownloadCtaSection} from "@/components/landing/download-cta-section";
import {SiteFooter} from "@/components/landing/site-footer";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export default async function LandingPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "faq"});

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqKeys.map((key) => ({
      "@type": "Question",
      name: t(`${key}.question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`${key}.answer`),
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--rp-bg)] text-[var(--rp-ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(faqJsonLd)}}
      />
      <SiteNavbar />
      <HeroSection />
      <MapSection />
      <ContentSections />
      <CountdownSection />
      <TestimonialsSection />
      <NewsletterSection />
      <FaqSection />
      <DownloadCtaSection />
      <SiteFooter />
    </main>
  );
}
