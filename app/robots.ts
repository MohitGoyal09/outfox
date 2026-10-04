import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/share/", "/auth/", "/onboarding", "/ask", "/board", "/boards", "/brands", "/chats", "/cohorts", "/feed", "/runs", "/signals", "/dev/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
