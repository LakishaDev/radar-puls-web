export type FutureSeoPage = {
  slug: string;
  titleKey: string;
  descriptionKey: string;
  contentKey: string;
};

export const futureSeoPages: FutureSeoPage[] = [
  {
    slug: "radar-nis",
    titleKey: "seoPages.radarNis.title",
    descriptionKey: "seoPages.radarNis.description",
    contentKey: "seoPages.radarNis",
  },
  {
    slug: "gde-su-radari-u-nisu",
    titleKey: "seoPages.gdeRadari.title",
    descriptionKey: "seoPages.gdeRadari.description",
    contentKey: "seoPages.gdeRadari",
  },
  {
    slug: "policija-nis-danas",
    titleKey: "seoPages.policija.title",
    descriptionKey: "seoPages.policija.description",
    contentKey: "seoPages.policija",
  },
  {
    slug: "kamere-nis",
    titleKey: "seoPages.kamere.title",
    descriptionKey: "seoPages.kamere.description",
    contentKey: "seoPages.kamere",
  },
  {
    slug: "kontrole-nis",
    titleKey: "seoPages.kontrole.title",
    descriptionKey: "seoPages.kontrole.description",
    contentKey: "seoPages.kontrole",
  },
];

export const futureSeoPageSlugs = futureSeoPages.map((page) => page.slug);

export function getFutureSeoPageBySlug(slug: string) {
  return futureSeoPages.find((page) => page.slug === slug);
}
