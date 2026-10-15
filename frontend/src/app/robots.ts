import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/auth", "/auth/forgot-password"],
        disallow: [
          "/app/",
          "/api/",
          "/version/",
          "/*?*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/auth", "/auth/forgot-password"],
        disallow: ["/app/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
