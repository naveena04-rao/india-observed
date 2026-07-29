import type { MetadataRoute } from "next";
import { getReviewedEvents } from "@/lib/events/getReviewedEvents";
import { getPublicSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getPublicSiteUrl();
  const events = await getReviewedEvents();
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
    ...events.map((event) => ({
      url: new URL(`/events/${event.slug}`, site).toString(),
      lastModified: event.lastReviewed,
      changeFrequency: "weekly" as const,
    })),
  ];
}
