import { MetadataRoute } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

// Fetch a public list endpoint and return the Slug of each item. Resilient: any
// failure (backend down at build time, unexpected shape) yields an empty list.
async function slugsFrom(path: string): Promise<string[]> {
  try {
    const res = await fetch(`${API}/api/v1/${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = Object.values(json).find(Array.isArray) as Array<{ Slug?: string }> | undefined;
    return (arr || []).map((x) => x?.Slug).filter((s): s is string => Boolean(s));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://xcreativs.com";
  const locales = ["en", "fr"];

  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/labs",
    "/work",
    "/industries",
    "/insights",
    "/reading-list",
    "/audio-briefs",
    "/webinars",
    "/subsidiaries",
    "/careers",
    "/careers/talent-network",
    "/partners",
    "/tools",
    "/contact",
    "/faq",
    "/glossary",
    "/press",
    "/media-kit",
    "/legal/privacy",
    "/legal/terms",
    "/legal/security",
    "/legal/data-residency",
  ];

  // Entity list endpoint -> detail route prefix
  const entities: Array<[string, string]> = [
    ["services", "/services"],
    ["work", "/work"],
    ["insights", "/insights"],
    ["industries", "/industries"],
    ["labs", "/labs"],
    ["reading-list", "/reading-list"],
    ["audio-briefs", "/audio-briefs"],
    ["webinars", "/webinars"],
  ];

  const dynamicRoutes = (
    await Promise.all(
      entities.map(async ([apiPath, prefix]) => (await slugsFrom(apiPath)).map((slug) => `${prefix}/${slug}`))
    )
  ).flat();

  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const route of allRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.7,
      });
    }
  }

  return entries;
}
