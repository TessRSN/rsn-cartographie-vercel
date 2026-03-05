/**
 * Builds JSON-LD (schema.org) structured data for an entity page.
 */

import type { ParsedEntity } from "./parseEntity"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app"

const SCHEMA_TYPE: Record<string, string> = {
  "node--organization": "Organization",
  "node--government_organization": "GovernmentOrganization",
  "node--person": "Person",
  "node--dataset": "Dataset",
  "node--data_catalog": "DataCatalog",
  "node--software_application": "SoftwareApplication",
}

export function buildJsonLd(entity: ParsedEntity): Record<string, unknown> {
  const schemaType = SCHEMA_TYPE[entity.type] ?? "Thing"
  const pageUrl = `${SITE_URL}/entite/${entity.id}`

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: entity.title,
    url: pageUrl,
  }

  if (entity.description) {
    ld.description = entity.description.slice(0, 300)
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
