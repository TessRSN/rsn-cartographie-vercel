import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchNotionPage } from "@/app/lib/notion"
import { parseEntity } from "@/app/lib/parseEntity"
import { buildJsonLd } from "@/app/lib/jsonld"
import { TYPE_LABELS } from "@/app/lib/constants"
import { EntityPageContent } from "@/components/EntityPage/EntityPageContent"

export const revalidate = 60

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app"

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return {}

  const result = await fetchNotionPage(id)
  if (!result) return {}

  const entity = parseEntity(result.page, result.entityType)
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
  if (!UUID_RE.test(id)) notFound()

  const result = await fetchNotionPage(id)
  if (!result) notFound()

  const entity = parseEntity(result.page, result.entityType)
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
