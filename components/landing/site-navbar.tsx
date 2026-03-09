import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {LanguageSwitcher} from "@/components/navbar/language-switcher";

export function SiteNavbar() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[color:var(--rp-deep)]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-white">
          {t("brand")}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <a href="#kako-radi" className="hover:text-white">
            {t("howItWorks")}
          </a>
          <a href="#zajednica" className="hover:text-white">
            {t("community")}
          </a>
          <a href="#preuzmi" className="hover:text-white">
            {t("download")}
          </a>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
