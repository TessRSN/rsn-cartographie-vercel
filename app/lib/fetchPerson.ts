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

export interface NotionPerson {
  id: string
  type: "node--person"
  title: string
  description: {
    value: string
    format: string
    processed: string
    summary: string
  } | null
  member_of_ids: string[]
  liens: string[]
  profil_web: string[]
  same_as: string[]
  imageSrc: string | null
  email: string | null
  field_applied_domain: Array<{ id: string; name: string }>
  field_digital_domain: Array<{ id: string; name: string }>
  field_axe_si_membre_rsn: { id: string; name: string } | null
  field_person_type: { id: string; name: string } | null
}

export async function fetchPerson(): Promise<NotionPerson[]> {
  const pages = await queryNotionDatabase(
    NOTION_DB.personnes,
    APPROVED_FILTER,
    [{ property: "Nom", direction: "ascending" }],
  )

  return pages.map((page) => {
    const props = page.properties
    const descHtml = richTextToHtml(props, "Description")
    const descPlain = getRichText(props, "Description")
    const mainUrl = getUrl(props, "Liens")
    const profilWeb = getRichText(props, "Profil web")

    // Separate Liens (url) from Profil web (rich_text with URLs)
    const liens: string[] = []
    if (mainUrl) liens.push(mainUrl)
    const profilWebUrls: string[] = []
    if (profilWeb) {
      const urlMatches = profilWeb.match(/https?:\/\/[^\s,;]+/g)
      if (urlMatches) profilWebUrls.push(...urlMatches)
    }
    const allLinks = [...liens, ...profilWebUrls]

    // Axe RSN: select -> { id, name } or null
    const axeRsnSelect = props["Axe RSN"]
    const axeRsn =
      axeRsnSelect?.type === "select" && axeRsnSelect.select
        ? { id: axeRsnSelect.select.id, name: axeRsnSelect.select.name }
        : null

    // Type de personne: select
    const personTypeSelect = props["Type de personne"]
    const personType =
      personTypeSelect?.type === "select" && personTypeSelect.select
        ? {
            id: personTypeSelect.select.id,
            name: personTypeSelect.select.name,
          }
        : null

    return {
      id: page.id,
      type: "node--person" as const,
      title: getTitle(props, "Nom"),
      description: descPlain
        ? {
            value: descHtml || descPlain,
            format: "html",
            processed: descHtml || descPlain,
            summary: "",
          }
        : null,
      member_of_ids: getRelationIds(props, "Membre de"),
      liens,
      profil_web: profilWebUrls,
      same_as: allLinks,
      imageSrc: getFileUrl(props, "Photo"),
      email: getEmail(props, "Email"),
      field_applied_domain: getMultiSelect(props, "Domaine appliqué"),
      field_digital_domain: getMultiSelect(props, "Méthodes numériques"),
      field_axe_si_membre_rsn: axeRsn,
      field_person_type: personType,
    }
  })
}
