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

export interface NotionDataCatalog {
  id: string
  type: "node--data_catalog"
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
  field_applied_domain: Array<{ id: string; name: string }>
  field_licence: { id: string; name: string } | null
  field_modele_acces: { id: string; name: string } | null
}

export async function fetchDataCatalog(): Promise<NotionDataCatalog[]> {
  const pages = await queryNotionDatabase(
    NOTION_DB.catalogues,
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
      type: "node--data_catalog" as const,
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
      field_applied_domain: getMultiSelect(props, "Domaine appliqué"),
      field_licence: null, // Catalogues don't have Licence in Notion
      field_modele_acces: modeleAcces,
    }
  })
}
