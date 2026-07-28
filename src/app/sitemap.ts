import type { MetadataRoute } from "next";
import { reviewedEventsPreview } from "@/data/reviewed-events-preview";
import { getPublicSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getPublicSiteUrl();
  const routes = [
    "",
    "/events",
    "/about",
    "/methodology",
    "/editorial-policy",
    "/sources-verification",
    "/corrections",
    "/media-policy",
    "/privacy",
    "/terms",
    "/contact",
    "/copyright",
  ];

  return [
    ...routes.map((route) => ({
      url: new URL(route || "/", site).toString(),
      changeFrequency: route === "/events" ? ("daily" as const) : ("monthly" as const),
    })),
    ...reviewedEventsPreview
      .filter((event) => event.publicationStatus === "published")
      .map((event) => ({
        url: new URL(`/events/${event.slug}`, site).toString(),
        lastModified: event.lastReviewed,
        changeFrequency: "weekly" as const,
      })),
  ];
}
