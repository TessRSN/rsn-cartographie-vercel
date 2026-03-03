import {
  queryNotionDatabase,
  NOTION_DB,
  APPROVED_FILTER,
  getTitle,
  getRichText,
  richTextToHtml,
  getMultiSelect,
  getRelationIds,
  getFileUrl,
  getUrl,
  getPlace,
} from "./notion"

export interface NotionGouvOrganization {
  id: string
  type: "node--government_organization"
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
  sous_org_non_gouv_ids: string[]
  funder_ids: string[]
  field_organization_geographical: Array<{ id: string; name: string }>
  field_couverture_geographique: Array<{ id: string; name: string }>
}

function parseAddress(place: ReturnType<typeof getPlace>) {
  if (!place) return null
  const parts = place.address.split(",").map((s) => s.trim())
  const lastPart = parts[parts.length - 1] ?? ""
  const isCanada =
    lastPart.toLowerCase() === "canada" ||
    lastPart.toLowerCase() === "ca"

  let address_line1 = parts[0] ?? ""
  let locality = parts[1] ?? ""
  let administrative_area = ""
  let postal_code = ""

  if (parts.length >= 3) {
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

export async function fetchGouvOrganization(): Promise<
  NotionGouvOrganization[]
> {
  const pages = await queryNotionDatabase(
    NOTION_DB.orgGouvernementales,
    APPROVED_FILTER,
    [{ property: "Nom", direction: "ascending" }],
  )

  return pages.map((page) => {
    const props = page.properties
    const descHtml = richTextToHtml(props, "Description")
    const descPlain = getRichText(props, "Description")
    const place = getPlace(props, "Adresse")
    const alias = getRichText(props, "Noms alternatifs")
    const mainUrl = getUrl(props, "Liens")
    const extraLinks = getRichText(props, "Liens supplémentaires")

    const links: string[] = []
    if (mainUrl) links.push(mainUrl)
    if (extraLinks) {
      const urlMatches = extraLinks.match(/https?:\/\/[^\s,;]+/g)
      if (urlMatches) links.push(...urlMatches)
    }

    return {
      id: page.id,
      type: "node--government_organization" as const,
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
      schema_organization_type: "government_organization",
      address: parseAddress(place),
      significant_link: links,
      imageSrc: getFileUrl(props, "Logo"),
      sub_organization_ids: getRelationIds(props, "Sous-organisations"),
      parent_organization_ids: getRelationIds(props, "Organisation parente"),
      sous_org_non_gouv_ids: getRelationIds(props, "sous-org non gouv"),
      funder_ids: [],
      field_organization_geographical: getMultiSelect(props, "Région"),
      field_couverture_geographique: getMultiSelect(
        props,
        "Couverture géographique",
      ),
    }
  })
}
