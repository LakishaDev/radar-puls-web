# Radar Puls Landing MVP Plan

Date: 2026-03-09
Scope: Landing page only (with i18n, SEO baseline, analytics baseline, brand placeholders, and future SEO slug config).

## Steps
1. Scaffold Next.js App Router app (TypeScript, Tailwind, ESLint), add shadcn/ui and `next-intl`.
2. Set env and domain-ready metadata baseline for future `radarpuls.com`.
3. Add localization content model for `sr-latn` (default), `sr-cyrl`, and `en`.
4. Implement landing UI sections + language switcher + download CTA buttons.
5. Add analytics baseline for `cta_download_click`, `locale_switch`, `hero_view`.
6. Add brand placeholders (logo, OG) and replacement checklist.
7. Add typed config with 3-5 future SEO slugs (no page implementation yet).
8. Harden SEO/perf and run lint/build verification.

## Accepted Decisions
- Primary CTA: Download app (Google Play/App Store), placeholder links for now.
- Visual direction: modern tech with navy/red signal accents.
- Localization: `next-intl` with Serbian Latin default.

## Out of Scope
- Live map implementation
- Backend API/auth/community logic
- SEO content page implementation
