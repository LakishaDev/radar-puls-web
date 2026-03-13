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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--rp-bg)] text-[var(--rp-ink)]">
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
