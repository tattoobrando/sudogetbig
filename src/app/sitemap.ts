import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://sudogetbig.com", changeFrequency: "monthly", priority: 1 },
    { url: "https://sudogetbig.com/lifts", changeFrequency: "weekly", priority: 0.8 },
  ];
}
