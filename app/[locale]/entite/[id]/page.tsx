import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  findEntityById,
  fetchAllPersonNames,
  fetchAllOrgNames,
} from "@/app/lib/notion"
import { parseEntity } from "@/app/lib/parseEntity"
import { buildJsonLd } from "@/app/lib/jsonld"
import { TYPE_LABELS } from "@/app/lib/constants"
import { EntityPageContent } from "@/components/EntityPage/EntityPageContent"

export const revalidate = 60

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app"

const UUID_RE =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ id: string }>
}

async function loadEntity(id: string) {
  if (!UUID_RE.test(id)) return null

  const result = await findEntityById(id)
  if (!result) return null

  const entity = parseEntity(result.page, result.entityType)

  // Resolve relation names (funder + author) if needed
  if (entity.funderIds.length > 0 || entity.authorIds.length > 0) {
    const [personNames, orgNames] = await Promise.all([
      entity.authorIds.length > 0
        ? fetchAllPersonNames()
        : Promise.resolve(new Map<string, string>()),
      entity.funderIds.length > 0
        ? fetchAllOrgNames()
        : Promise.resolve(new Map<string, string>()),
    ])

    entity.authorNames = entity.authorIds
      .map((id) => personNames.get(id))
      .filter((n): n is string => !!n)

    // Funders can be orgs or persons
    entity.funderNames = entity.funderIds
      .map((id) => orgNames.get(id) ?? personNames.get(id))
      .filter((n): n is string => !!n)
  }

  return entity
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const entity = await loadEntity(id)
  if (!entity) return {}

  const typeLabel = TYPE_LABELS[entity.type] ?? ""
  const description =
    entity.description.length > 160
      ? entity.description.slice(0, 157) + "..."
      : entity.description || `${typeLabel} — Cartographie RSN`

  return {
    title: entity.title,
    description,
    openGraph: {
      title: entity.title,
      description,
      url: `${SITE_URL}/entite/${id}`,
      siteName: "Cartographie RSN",
      locale: "fr_CA",
      type: "article",
      ...(entity.imageSrc && {
        images: [{ url: entity.imageSrc, alt: entity.title }],
      }),
    },
    twitter: {
      card: entity.imageSrc ? "summary_large_image" : "summary",
      title: entity.title,
      description,
    },
  }
}

export default async function EntityPage({ params }: Props) {
  const { id } = await params
  const entity = await loadEntity(id)
  if (!entity) notFound()

  const jsonLd = buildJsonLd(entity)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EntityPageContent entity={entity} />
    </>
  )
}
