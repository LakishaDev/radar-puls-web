"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {Menu, Moon, Sun, X} from "lucide-react";
import {Link} from "@/i18n/navigation";
import {LanguageSwitcher} from "@/components/navbar/language-switcher";
import {useTheme} from "@/lib/hooks/use-theme";
import {BrandLogo} from "@/components/brand/brand-logo";

export function SiteNavbar() {
  const t = useTranslations("nav");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {theme, toggleTheme} = useTheme();

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0F172A]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
          <BrandLogo
            imageClassName="ring-1 ring-white/20"
            wordmarkClassName="text-white group-hover:text-white/90 transition-colors"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-white/60 md:flex">
          <a href="#kako-radi" className="hover:text-white transition-colors">
            {t("howItWorks")}
          </a>
          <a href="#zajednica" className="hover:text-white transition-colors">
            {t("community")}
          </a>
          <Link href="/mapa" className="hover:text-white transition-colors">
            Mapa
          </Link>
          <a
            href="#preuzmi"
            className="rounded-md bg-blue-600 px-3.5 py-1.5 text-white hover:bg-blue-500 transition-colors"
          >
            {t("download")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors hover:bg-white/10"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

        {isMobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0B1326] md:hidden" id="mobile-nav">
            <nav className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6">
              <a
                href="#kako-radi"
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={closeMenu}
              >
                {t("howItWorks")}
              </a>
              <a
                href="#zajednica"
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={closeMenu}
              >
                {t("community")}
              </a>
              <Link
                href="/mapa"
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={closeMenu}
              >
                Mapa
              </Link>
              <a
                href="#preuzmi"
                className="mt-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                onClick={closeMenu}
              >
                {t("download")}
              </a>
            </nav>
          </div>
        )}
    </header>
  );
}
