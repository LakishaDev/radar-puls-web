import {useTranslations} from "next-intl";
import {Facebook, Instagram, Youtube} from "lucide-react";
import {Link} from "@/i18n/navigation";
import {appConfig} from "@/lib/config";
import {BrandLogo} from "@/components/brand/brand-logo";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--rp-border)] bg-[var(--rp-card)]/90 backdrop-blur-sm">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <BrandLogo
            imageClassName="ring-1 ring-[var(--rp-border)]"
            wordmarkClassName="text-[var(--rp-deep)]"
          />
          <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--rp-ink-soft)]">{t("text")}</p>
          <div className="mt-4 flex items-center gap-2">
            <a
              href={appConfig.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--rp-border)] text-[var(--rp-ink-soft)] transition-colors hover:border-[var(--rp-primary)] hover:text-[var(--rp-primary)]"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={appConfig.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--rp-border)] text-[var(--rp-ink-soft)] transition-colors hover:border-[var(--rp-primary)] hover:text-[var(--rp-primary)]"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={appConfig.social.youtube}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--rp-border)] text-[var(--rp-ink-soft)] transition-colors hover:border-[var(--rp-primary)] hover:text-[var(--rp-primary)]"
              aria-label="YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-ink-soft)]">{t("product")}</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rp-ink)]">
            <li><a className="hover:text-[var(--rp-primary)]" href="#kako-radi">{t("links.how")}</a></li>
            <li><Link className="hover:text-[var(--rp-primary)]" href="/mapa">{t("links.map")}</Link></li>
            <li><a className="hover:text-[var(--rp-primary)]" href="#preuzmi">{t("links.download")}</a></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-ink-soft)]">{t("company")}</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rp-ink)]">
            <li><a className="hover:text-[var(--rp-primary)]" href="#launch">{t("links.about")}</a></li>
            <li><a className="hover:text-[var(--rp-primary)]" href="#newsletter">{t("links.contact")}</a></li>
            <li><a className="hover:text-[var(--rp-primary)]" href="#iskustva">{t("links.community")}</a></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-ink-soft)]">{t("legal")}</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rp-ink)]">
            <li><Link className="hover:text-[var(--rp-primary)]" href="/legal">{t("links.legal")}</Link></li>
            <li><Link className="hover:text-[var(--rp-primary)]" href="/privacy">{t("links.privacy")}</Link></li>
            <li><Link className="hover:text-[var(--rp-primary)]" href="/terms">{t("links.terms")}</Link></li>
            <li><Link className="hover:text-[var(--rp-primary)]" href="/disclaimer">{t("links.disclaimer")}</Link></li>
            <li><Link className="hover:text-[var(--rp-primary)]" href="/cookies">{t("links.cookies")}</Link></li>
            <li><Link className="hover:text-[var(--rp-primary)]" href="/community-guidelines">{t("links.communityGuidelines")}</Link></li>
          </ul>
          <p className="mt-4 text-xs font-semibold text-[var(--rp-primary)]">{t("domain")}</p>
        </div>
      </div>

      <div className="border-t border-[var(--rp-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-[var(--rp-ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} Radar Puls</p>
          <p>{t("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
