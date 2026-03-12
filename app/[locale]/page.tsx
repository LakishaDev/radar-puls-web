import {SiteNavbar} from "@/components/landing/site-navbar";
import {HeroSection} from "@/components/landing/hero-section";
import {ContentSections} from "@/components/landing/content-sections";
import {MapSection} from "@/components/landing/map-section";
import {SiteFooter} from "@/components/landing/site-footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--rp-bg)] text-[var(--rp-ink)]">
      <SiteNavbar />
      <HeroSection />
      <ContentSections />
      <MapSection />
      <SiteFooter />
    </main>
  );
}
