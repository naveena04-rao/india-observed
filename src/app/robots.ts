import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getPublicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/admin/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", site).toString(),
  };
}
