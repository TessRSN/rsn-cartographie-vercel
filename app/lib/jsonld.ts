/**
 * Builds JSON-LD (schema.org) structured data for an entity page.
 */

import type { ParsedEntity } from "./parseEntity"
import { buildEntityKeywords, cleanMetaText } from "./seo"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cartographie.rsn.quebec"

const SCHEMA_TYPE: Record<string, string> = {
  "node--organization": "Organization",
  "node--government_organization": "GovernmentOrganization",
  "node--person": "Person",
  "node--dataset": "Dataset",
  "node--data_catalog": "DataCatalog",
  "node--software_application": "SoftwareApplication",
}

export function buildJsonLd(
  entity: ParsedEntity,
  locale: string = "fr",
): Record<string, unknown> {
  const schemaType = SCHEMA_TYPE[entity.type] ?? "Thing"
  const localePath = locale === "fr" ? "" : `/${locale}`
  const pageUrl = `${SITE_URL}${localePath}/entite/${entity.id}`
  const cartographyUrl = `${SITE_URL}${localePath}`

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: entity.title,
    url: pageUrl,
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    isPartOf: {
      "@type": "WebSite",
      name: locale === "fr" ? "Cartographie RSN" : "RSN Cartography",
      url: cartographyUrl,
    },
  }

  if (entity.description) {
    ld.description = cleanMetaText(entity.description, 300)
  }

  if (entity.imageSrc) {
    ld.image = entity.imageSrc
  }

  if (entity.alternateNames.length > 0) {
    ld.alternateName = entity.alternateNames
  }

  if (entity.links.length > 0) {
    ld.sameAs = entity.links
  }

  if (entity.email) {
    ld.email = entity.email
  }

  if (entity.lastEdited) {
    ld.dateModified = entity.lastEdited
  }

  const keywords = buildEntityKeywords(entity)
  if (keywords.length > 0) {
    ld.keywords = keywords.join(", ")
  }

  // Type-specific fields
  switch (entity.type) {
    case "node--organization":
    case "node--government_organization":
      if (entity.address) {
        ld.address = { "@type": "PostalAddress", streetAddress: entity.address }
      }
      break

    case "node--dataset":
    case "node--data_catalog":
      if (entity.licence) {
        ld.license = entity.licence
      }
      break

    case "node--software_application":
      if (entity.licence) {
        ld.license = entity.licence
      }
      if (entity.categories.length > 0) {
        ld.applicationCategory = entity.categories.join(", ")
      }
      break
  }

  return ld
}
