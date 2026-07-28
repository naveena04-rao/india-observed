import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "India Observed",
    short_name: "India Observed",
    description: "Independent records of protests and civic movements across India.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#151616",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
