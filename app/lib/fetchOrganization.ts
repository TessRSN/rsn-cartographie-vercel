import {
  queryNotionDatabase,
  NOTION_DB,
  APPROVED_FILTER,
  getTitle,
  getRichText,
  richTextToHtml,
  getSelect,
  getMultiSelect,
  getRelationIds,
  getFileUrl,
  getUrl,
  getPlace,
} from "./notion"

export interface NotionOrganization {
  id: string
  type: "node--organization"
  title: string
  alternate_name: string[]
  description: {
    value: string
    format: string
    processed: string
    summary: string
  } | null
  schema_organization_type: string
  address: {
    address_line1?: string
    locality?: string
    administrative_area?: string
    postal_code?: string
    country_code?: string
    latitude?: number
    longitude?: number
  } | null
  significant_link: string[]
  imageSrc: string | null
  sub_organization_ids: string[]
  parent_organization_ids: string[]
  funder_ids: string[]
  field_organization_geographical: Array<{ id: string; name: string }>
  field_couverture_geographique: Array<{ id: string; name: string }>
}

function parseAddress(place: ReturnType<typeof getPlace>) {
  if (!place) return null
  // Notion place.address is a full string like "1650 Avenue Cedar, Montreal, QC H3G 1A4, Canada"
  // Parse into structured fields
  const parts = place.address.split(",").map((s) => s.trim())
  const lastPart = parts[parts.length - 1] ?? ""
  const isCanada =
    lastPart.toLowerCase() === "canada" ||
    lastPart.toLowerCase() === "ca"

  // Typical Canadian format: "Street, City, PROVINCE PostalCode, Country"
  let address_line1 = parts[0] ?? ""
  let locality = parts[1] ?? ""
  let administrative_area = ""
  let postal_code = ""

  if (parts.length >= 3) {
    // The province+postal code part: "QC H3G 1A4"
    const provPostal = parts[2] ?? ""
    const match = provPostal.match(
      /^([A-Z]{2})\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i,
    )
    if (match) {
      administrative_area = match[1]
      postal_code = match[2]
    } else {
      administrative_area = provPostal
    }
  }

  return {
    address_line1,
    locality,
    administrative_area,
    postal_code,
    country_code: isCanada ? "CA" : lastPart || undefined,
    latitude: place.lat,
    longitude: place.lon,
  }
}

export async function fetchOrganization(): Promise<NotionOrganization[]> {
  const pages = await queryNotionDatabase(
    NOTION_DB.organisations,
    APPROVED_FILTER,
    [{ property: "Nom", direction: "ascending" }],
  )

  return pages.map((page) => {
    const props = page.properties
    const descHtml = richTextToHtml(props, "Description")
    const descPlain = getRichText(props, "Description")
    const place = getPlace(props, "Adresse")
    const alias = getRichText(props, "Noms alternatifs - Alias")
    const mainUrl = getUrl(props, "Liens")
    const extraLinks = getRichText(props, "Liens supplémentaires")

    const links: string[] = []
    if (mainUrl) links.push(mainUrl)
    if (extraLinks) {
      // Extract URLs from rich text
      const urlMatches = extraLinks.match(/https?:\/\/[^\s,;]+/g)
      if (urlMatches) links.push(...urlMatches)
    }

    return {
      id: page.id,
      type: "node--organization" as const,
      title: getTitle(props, "Nom"),
      alternate_name: alias ? [alias] : [],
      description: descPlain
        ? {
            value: descHtml || descPlain,
            format: "html",
            processed: descHtml || descPlain,
            summary: "",
          }
        : null,
      schema_organization_type: getSelect(props, "Type") ?? "",
      address: parseAddress(place),
      significant_link: links,
      imageSrc: getFileUrl(props, "Logo"),
      sub_organization_ids: getRelationIds(props, "Sous-organisations"),
      parent_organization_ids: getRelationIds(props, "Organisation parente"),
      funder_ids: getRelationIds(props, "Financeur"),
      field_organization_geographical: getMultiSelect(props, "Région"),
      field_couverture_geographique: getMultiSelect(
        props,
        "Couverture géographique",
      ),
    }
  })
}
