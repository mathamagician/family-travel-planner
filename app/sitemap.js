import { DESTINATIONS, slugify } from "./_lib/destinations";
// import { getAllPosts } from "./_lib/blog-posts"; // TODO: re-enable when blog goes live

export default function sitemap() {
  const baseUrl = "https://www.toddlertrip.com";
  const now = new Date();

  const staticPages = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/plan`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/destinations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    // { url: `${baseUrl}/blog`, ... }, // TODO: re-enable when blog goes live
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const destinationPages = DESTINATIONS.map(d => ({
    url: `${baseUrl}/destinations/${slugify(d.city)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...destinationPages];
}
