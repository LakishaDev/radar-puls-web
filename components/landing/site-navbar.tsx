import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {LanguageSwitcher} from "@/components/navbar/language-switcher";

export function SiteNavbar() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0F172A]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="h-2 w-2 rounded-full bg-blue-400 group-hover:bg-blue-300 transition-colors" />
          <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase">
            {t("brand")}
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-white/60 md:flex">
          <a href="#kako-radi" className="hover:text-white transition-colors">
            {t("howItWorks")}
          </a>
          <a href="#zajednica" className="hover:text-white transition-colors">
            {t("community")}
          </a>
          <a href="#mapa" className="hover:text-white transition-colors">
            Mapa
          </a>
          <a
            href="#preuzmi"
            className="rounded-md bg-blue-600 px-3.5 py-1.5 text-white hover:bg-blue-500 transition-colors"
          >
            {t("download")}
          </a>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
