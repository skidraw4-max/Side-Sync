import type { MetadataRoute } from "next";

const BASE = "https://sidesync.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/explore`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
  ];
}
