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
  getEmail,
} from "./notion"

export interface NotionSoftwareApplication {
  id: string
  type: "node--software_application"
  title: string
  alternate_name: string[]
  description: {
    value: string
    format: string
    processed: string
    summary: string
  } | null
  significant_link: string[]
  imageSrc: string | null
  parent_organization_ids: string[]
  author_ids: string[]
  funder_ids: string[]
  email: string | null
  application_category: Array<{ id: string; name: string }>
  field_licence: { id: string; name: string } | null
  field_modele_acces: { id: string; name: string } | null
}

export async function fetchSoftwareApplication(): Promise<
  NotionSoftwareApplication[]
> {
  const pages = await queryNotionDatabase(
    NOTION_DB.plateformes,
    APPROVED_FILTER,
    [{ property: "Nom", direction: "ascending" }],
  )

  return pages.map((page) => {
    const props = page.properties
    const descHtml = richTextToHtml(props, "Description")
    const descPlain = getRichText(props, "Description")
    const alias = getRichText(props, "Noms alternatifs")
    const mainUrl = getUrl(props, "Liens")
    const extraLinks = getRichText(props, "Liens supplémentaires")

    const links: string[] = []
    if (mainUrl) links.push(mainUrl)
    if (extraLinks) {
      const urlMatches = extraLinks.match(/https?:\/\/[^\s,;]+/g)
      if (urlMatches) links.push(...urlMatches)
    }

    const licenceSelect = props["Licence"]
    const licence =
      licenceSelect?.type === "select" && licenceSelect.select
        ? { id: licenceSelect.select.id, name: licenceSelect.select.name }
        : null

    const modeleAccesSelect = props["Modèle d'accès"]
    const modeleAcces =
      modeleAccesSelect?.type === "select" && modeleAccesSelect.select
        ? {
            id: modeleAccesSelect.select.id,
            name: modeleAccesSelect.select.name,
          }
        : null

    return {
      id: page.id,
      type: "node--software_application" as const,
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
      significant_link: links,
      imageSrc: getFileUrl(props, "Logo"),
      parent_organization_ids: getRelationIds(props, "Organisation-parente"),
      author_ids: getRelationIds(props, "Auteur·rice·s"),
      funder_ids: getRelationIds(props, "Financeur"),
      email: getEmail(props, "Email"),
      application_category: getMultiSelect(props, "Catégorie"),
      field_licence: licence,
      field_modele_acces: modeleAcces,
    }
  })
}
