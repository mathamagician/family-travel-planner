export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/share/"],
      },
    ],
    sitemap: "https://www.toddlertrip.com/sitemap.xml",
  };
}
