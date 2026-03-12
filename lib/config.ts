const defaultSiteUrl = "https://radarpuls.com";

export const appConfig = {
  siteName: "Radar Puls",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl,
  liveMapLaunchDate: process.env.NEXT_PUBLIC_LIVE_MAP_LAUNCH_DATE ?? "2026-06-01T00:00:00+02:00",
  heroExperimentMode: process.env.NEXT_PUBLIC_HERO_EXPERIMENT ?? "ab",
  googlePlayUrl:
    process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ?? "https://play.google.com/store",
  appStoreUrl:
    process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com",
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/radarpuls",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com/radarpuls",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://youtube.com/@radarpuls",
  },
  business: {
    city: "Nis",
    country: "RS",
    addressLocality: "Nis",
    addressRegion: "Nisavski okrug",
  },
} as const;
