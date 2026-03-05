import { MetadataRoute } from "next"
import { queryNotionDatabase, NOTION_DB, APPROVED_FILTER, getTitle } from "./lib/notion"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dbIds = Object.values(NOTION_DB)

  const allPages = await Promise.all(
    dbIds.map((dbId) => queryNotionDatabase(dbId, APPROVED_FILTER)),
  )

  const entityEntries: MetadataRoute.Sitemap = allPages
    .flat()
    .filter((page) => getTitle(page.properties, "Nom"))
    .map((page) => ({
      url: `${SITE_URL}/entite/${page.id}`,
      lastModified: page.last_edited_time
        ? new Date(page.last_edited_time)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...entityEntries,
  ]
}
