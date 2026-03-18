import type {MetadataRoute} from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://radarpuls.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
