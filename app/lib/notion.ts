/**
 * Notion API client and helpers.
 *
 * Replaces the old Drupal integration (`drupal.ts` + `next-drupal`).
 * Uses raw `fetch` (no @notionhq/client SDK).
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const NOTION_API_BASE = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

/** IDs of the six Notion databases. */
export const NOTION_DB = {
  organisations: "31332389-45e6-81ff-b1a6-db25c818c0c4",
  orgGouvernementales: "31332389-45e6-81e3-bc19-f0dea4337fb8",
  personnes: "31332389-45e6-81e1-9766-f32d463fbc1f",
  plateformes: "31332389-45e6-81c5-a2bb-f1c41c5c1181",
  catalogues: "31332389-45e6-8101-9460-c389149c029c",
  jeuxDeDonnees: "31332389-45e6-81a0-bb7e-d08e963e36c8",
} as const

/** Filter applied to every query: only approved records. */
export const APPROVED_FILTER = {
  property: "Statut",
  select: { equals: "Approuvé" },
}

// ─── Types ───────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface NotionPage {
  id: string
  properties: Record<string, any>
  icon?: any
  cover?: any
  created_time?: string
  last_edited_time?: string
}

export interface NotionPlace {
  lat: number
  lon: number
  name: string
  address: string
}

// ─── Core query with pagination ──────────────────────────────────────────────

/**
 * Queries a Notion database with automatic pagination.
 * Applies the "Approuvé" filter by default (can be overridden).
 */
export async function queryNotionDatabase(
  databaseId: string,
  filter?: object,
  sorts?: object[],
): Promise<NotionPage[]> {
  const token = process.env.NOTION_TOKEN
  if (!token) throw new Error("NOTION_TOKEN is not set")

  const allResults: NotionPage[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const body: Record<string, unknown> = {
      page_size: 100,
      ...(filter && { filter }),
      ...(sorts && { sorts }),
      ...(startCursor && { start_cursor: startCursor }),
    }

    const res = await fetch(
      `${NOTION_API_BASE}/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 3600 },
      },
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Notion API error ${res.status}: ${text}`)
    }

    const data = await res.json()
    allResults.push(...data.results)
    hasMore = data.has_more
    startCursor = data.next_cursor ?? undefined
  }

  return allResults
}

// ─── Property extraction helpers ─────────────────────────────────────────────

/** Extract plain text from a `title` property. */
export function getTitle(
  props: Record<string, any>,
  key: string,
): string {
  const prop = props[key]
  if (!prop || prop.type !== "title") return ""
  return prop.title.map((t: any) => t.plain_text).join("")
}

/** Extract plain text from a `rich_text` property. */
export function getRichText(
  props: Record<string, any>,
  key: string,
): string {
  const prop = props[key]
  if (!prop || prop.type !== "rich_text") return ""
  return prop.rich_text.map((t: any) => t.plain_text).join("")
}

/**
 * Convert Notion rich_text annotations to basic HTML.
 * Handles bold, italic, strikethrough, code, underline, and links.
 */
export function richTextToHtml(
  props: Record<string, any>,
  key: string,
): string {
  const prop = props[key]
  if (!prop || prop.type !== "rich_text") return ""

  return prop.rich_text
    .map((block: any) => {
      let text: string = block.plain_text
      // Escape basic HTML entities
      text = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

      const a = block.annotations ?? {}
      if (a.bold) text = `<strong>${text}</strong>`
      if (a.italic) text = `<em>${text}</em>`
      if (a.strikethrough) text = `<s>${text}</s>`
      if (a.underline) text = `<u>${text}</u>`
      if (a.code) text = `<code>${text}</code>`
      if (block.href) text = `<a href="${block.href}">${text}</a>`

      return text
    })
    .join("")
}

/** Extract the selected value from a `select` property (or null). */
export function getSelect(
  props: Record<string, any>,
  key: string,
): string | null {
  const prop = props[key]
  if (!prop || prop.type !== "select" || !prop.select) return null
  return prop.select.name
}

/** Extract all values from a `multi_select` property. */
export function getMultiSelect(
  props: Record<string, any>,
  key: string,
): Array<{ id: string; name: string }> {
  const prop = props[key]
  if (!prop || prop.type !== "multi_select") return []
  return prop.multi_select.map((s: any) => ({ id: s.id, name: s.name }))
}

/** Extract page IDs from a `relation` property. */
export function getRelationIds(
  props: Record<string, any>,
  key: string,
): string[] {
  const prop = props[key]
  if (!prop || prop.type !== "relation") return []
  return prop.relation.map((r: any) => r.id)
}

/** Extract the first file URL from a `files` property (or null). */
export function getFileUrl(
  props: Record<string, any>,
  key: string,
): string | null {
  const prop = props[key]
  if (!prop || prop.type !== "files" || !prop.files?.length) return null

  const file = prop.files[0]
  if (file.type === "external") return file.external.url
  if (file.type === "file") return file.file.url
  return null
}

/** Extract URL from a `url` property (or null). */
export function getUrl(
  props: Record<string, any>,
  key: string,
): string | null {
  const prop = props[key]
  if (!prop || prop.type !== "url") return null
  return prop.url
}

/** Extract email from an `email` property (or null). */
export function getEmail(
  props: Record<string, any>,
  key: string,
): string | null {
  const prop = props[key]
  if (!prop || prop.type !== "email") return null
  return prop.email
}

/** Extract the `place` property (lat/lon/address) or null. */
export function getPlace(
  props: Record<string, any>,
  key: string,
): NotionPlace | null {
  const prop = props[key]
  if (!prop || prop.type !== "place" || !prop.place) return null
  return {
    lat: prop.place.lat,
    lon: prop.place.lon,
    name: prop.place.name ?? "",
    address: prop.place.address ?? "",
  }
}
