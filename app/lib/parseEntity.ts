/**
 * Unified entity parser for SEO pages.
 * Takes a raw Notion page + resolved entity type and returns a flat ParsedEntity.
 */

import type { NotionPage, EntityType } from "./notion"
import {
  getTitle,
  getRichText,
  richTextToHtml,
  getSelect,
  getMultiSelect,
  getRelationIds,
  getFileUrl,
  getUrl,
  getEmail,
  getPlace,
} from "./notion"

export interface ParsedEntity {
  id: string
  type: EntityType
  title: string
  description: string
  descriptionHtml: string
  imageSrc: string | null
  links: string[]
  email: string | null
  alternateNames: string[]
  organizationType: string | null
  licence: string | null
  accessModel: string | null
  categories: string[]
  address: string | null
  lastEdited: string | null

  // Organization-specific
  regions: string[]
  geographicCoverage: string[]

  // Person-specific
  digitalMethods: string[]
  axeRsn: string | null
  profileLinks: string[]

  // Relation IDs (raw, for resolution in page.tsx)
  funderIds: string[]
  authorIds: string[]

  // Resolved relation names (hydrated in page.tsx)
  funderNames: string[]
  authorNames: string[]
}

/** Extract links from a main URL field + supplementary rich_text field. */
function extractLinks(
  props: Record<string, unknown>,
  urlKey: string,
  extraKey: string,
): string[] {
  const links: string[] = []
  const mainUrl = getUrl(props, urlKey)
  if (mainUrl) links.push(mainUrl)
  const extra = getRichText(props, extraKey)
  if (extra) {
    const matches = extra.match(/https?:\/\/[^\s,;]+/g)
    if (matches) links.push(...matches)
  }
  return links
}

export function parseEntity(
  page: NotionPage,
  entityType: EntityType,
): ParsedEntity {
  const props = page.properties
  const descPlain = getRichText(props, "Description")
  const descHtml = richTextToHtml(props, "Description")

  const base: ParsedEntity = {
    id: page.id,
    type: entityType,
    title: getTitle(props, "Nom"),
    description: descPlain,
    descriptionHtml: descHtml,
    imageSrc: null,
    links: [],
    email: null,
    alternateNames: [],
    organizationType: null,
    licence: null,
    accessModel: null,
    categories: [],
    address: null,
    lastEdited: page.last_edited_time ?? null,
    regions: [],
    geographicCoverage: [],
    digitalMethods: [],
    axeRsn: null,
    profileLinks: [],
    funderIds: [],
    authorIds: [],
    funderNames: [],
    authorNames: [],
  }

  switch (entityType) {
    case "node--organization": {
      const alias = getRichText(props, "Noms alternatifs - Alias")
      const place = getPlace(props, "Adresse")
      base.imageSrc = getFileUrl(props, "Logo")
      base.links = extractLinks(props, "Liens", "Liens supplémentaires")
      base.alternateNames = alias ? [alias] : []
      base.organizationType = getSelect(props, "Type")
      base.address = place?.address ?? null
      base.regions = getMultiSelect(props, "Région").map((s) => s.name)
      base.categories = base.regions
      base.geographicCoverage = getMultiSelect(
        props,
        "Couverture géographique",
      ).map((s) => s.name)
      base.funderIds = getRelationIds(props, "Financeur")
      break
    }

    case "node--government_organization": {
      const alias = getRichText(props, "Noms alternatifs")
      const place = getPlace(props, "Adresse")
      base.imageSrc = getFileUrl(props, "Logo")
      base.links = extractLinks(props, "Liens", "Liens supplémentaires")
      base.alternateNames = alias ? [alias] : []
      base.organizationType = "Organisation gouvernementale"
      base.address = place?.address ?? null
      base.regions = getMultiSelect(props, "Région").map((s) => s.name)
      base.categories = base.regions
      base.geographicCoverage = getMultiSelect(
        props,
        "Couverture géographique",
      ).map((s) => s.name)
      base.funderIds = getRelationIds(props, "Financeur")
      break
    }

    case "node--person": {
      base.imageSrc = getFileUrl(props, "Photo")
      base.email = getEmail(props, "Email")

      // Liens (url property) — regular links
      const mainUrl = getUrl(props, "Liens")
      base.links = mainUrl ? [mainUrl] : []

      // Profil web (rich_text with URLs) — separate field
      const profilWeb = getRichText(props, "Profil web")
      if (profilWeb) {
        const matches = profilWeb.match(/https?:\/\/[^\s,;]+/g)
        if (matches) base.profileLinks = matches
      }

      base.categories = getMultiSelect(props, "Domaine appliqué").map(
        (s) => s.name,
      )
      base.digitalMethods = getMultiSelect(props, "Méthodes numériques").map(
        (s) => s.name,
      )
      base.axeRsn = getSelect(props, "Axe RSN")
      const personType = getSelect(props, "Type de personne")
      if (personType) base.organizationType = personType
      break
    }

    case "node--dataset": {
      const alias = getRichText(props, "Noms alternatifs")
      base.imageSrc = getFileUrl(props, "Logo")
      base.links = extractLinks(props, "Liens", "Liens supplémentaires")
      base.email = getEmail(props, "Email")
      base.alternateNames = alias ? [alias] : []
      base.licence = getSelect(props, "Licence")
      base.accessModel = getSelect(props, "Modèle d'accès")
      base.categories = getMultiSelect(props, "Domaine appliqué").map(
        (s) => s.name,
      )
      base.authorIds = getRelationIds(props, "Auteur·rice·s")
      base.funderIds = getRelationIds(props, "Financeur")
      break
    }

    case "node--data_catalog": {
      const alias = getRichText(props, "Noms alternatifs")
      base.imageSrc = getFileUrl(props, "Logo")
      base.links = extractLinks(props, "Liens", "Liens supplémentaires")
      base.email = getEmail(props, "Email")
      base.alternateNames = alias ? [alias] : []
      base.accessModel = getSelect(props, "Modèle d'accès")
      base.categories = getMultiSelect(props, "Domaine appliqué").map(
        (s) => s.name,
      )
      base.authorIds = getRelationIds(props, "Auteur·rice·s")
      base.funderIds = getRelationIds(props, "Financeur")
      break
    }

    case "node--software_application": {
      const alias = getRichText(props, "Noms alternatifs")
      base.imageSrc = getFileUrl(props, "Logo")
      base.links = extractLinks(props, "Liens", "Liens supplémentaires")
      base.email = getEmail(props, "Email")
      base.alternateNames = alias ? [alias] : []
      base.licence = getSelect(props, "Licence")
      base.accessModel = getSelect(props, "Modèle d'accès")
      base.categories = getMultiSelect(props, "Catégorie").map((s) => s.name)
      base.authorIds = getRelationIds(props, "Auteur·rice·s")
      base.funderIds = getRelationIds(props, "Financeur")
      break
    }
  }

  return base
}
