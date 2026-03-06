import DOMPurify from "isomorphic-dompurify"
import Link from "next/link"
import { TYPE_LABELS, NODE_FILL, ORG_TYPE_LABELS } from "@/app/lib/constants"
import type { ParsedEntity } from "@/app/lib/parseEntity"

interface Props {
  entity: ParsedEntity
}

export function EntityPageContent({ entity }: Props) {
  const typeLabel = TYPE_LABELS[entity.type] ?? entity.type
  const typeColor = NODE_FILL[entity.type] ?? "#888"

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-base-content/60 hover:text-base-content mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour à la cartographie
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-4">
          {entity.imageSrc && (
            <img
              src={entity.imageSrc}
              alt={entity.title}
              className="w-16 h-16 object-contain rounded-lg shrink-0"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{entity.title}</h1>
            <span
              className="inline-block mt-2 px-3 py-0.5 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: typeColor }}
            >
              {typeLabel}
            </span>
          </div>
        </div>

        {entity.alternateNames.length > 0 && (
          <p className="mt-3 text-base-content/70">
            <span className="font-medium">Alias :</span>{" "}
            {entity.alternateNames.join(", ")}
          </p>
        )}
      </header>

      {/* Type-specific content */}
      {renderTypeContent(entity)}

      {/* Links */}
      {entity.links.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Lien(s)</h2>
          <ul className="space-y-1">
            {entity.links.map((link, i) => (
              <li key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-sm break-all"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

// ─── Type-specific rendering ────────────────────────────────────────────────

function renderTypeContent(entity: ParsedEntity) {
  switch (entity.type) {
    case "node--organization":
    case "node--government_organization":
      return <OrganizationContent entity={entity} />
    case "node--person":
      return <PersonContent entity={entity} />
    case "node--dataset":
    case "node--data_catalog":
      return <DataContent entity={entity} />
    case "node--software_application":
      return <SoftwareContent entity={entity} />
  }
}

function OrganizationContent({ entity }: Props) {
  return (
    <>
      {entity.organizationType && (
        <MetaField
          label="Type"
          value={
            ORG_TYPE_LABELS[entity.organizationType] ??
            entity.organizationType
          }
        />
      )}

      <Description html={entity.descriptionHtml} />

      <BadgeList label="Localisation administrative" items={entity.regions} />

      {entity.address && <MetaField label="Adresse" value={entity.address} />}

      <BadgeList
        label="Couverture géographique"
        items={entity.geographicCoverage}
      />

      <NameList label="Subventionné par" names={entity.funderNames} />
    </>
  )
}

function PersonContent({ entity }: Props) {
  return (
    <>
      {entity.organizationType && (
        <MetaField label="Type" value={entity.organizationType} />
      )}

      <BadgeList
        label="Domaine de santé"
        items={entity.categories}
        color="badge-success"
      />

      <BadgeList
        label="Méthodes numériques"
        items={entity.digitalMethods}
        color="badge-info"
      />

      {entity.axeRsn && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Axe RSN
          </h2>
          <span className="badge badge-soft badge-warning">
            {entity.axeRsn}
          </span>
        </div>
      )}

      <Description html={entity.descriptionHtml} />

      {entity.email && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Contact
          </h2>
          <a href={`mailto:${entity.email}`} className="link link-primary">
            {entity.email}
          </a>
        </div>
      )}

      {entity.profileLinks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Profil web
          </h2>
          <ul className="space-y-1">
            {entity.profileLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-sm break-all"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function DataContent({ entity }: Props) {
  return (
    <>
      <BadgeList
        label="Domaine de santé"
        items={entity.categories}
        color="badge-success"
      />

      <Description html={entity.descriptionHtml} />

      {entity.licence && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Licence
          </h2>
          <span className="badge badge-soft badge-accent">
            {entity.licence}
          </span>
        </div>
      )}

      {entity.accessModel && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Modèle d&apos;accès
          </h2>
          <span className="badge badge-soft badge-error">
            {entity.accessModel}
          </span>
        </div>
      )}

      <NameList label="Personne responsable" names={entity.authorNames} />
      <NameList label="Subventionné par" names={entity.funderNames} />
    </>
  )
}

function SoftwareContent({ entity }: Props) {
  return (
    <>
      <BadgeList
        label="Type"
        items={entity.categories}
        color="badge-primary"
      />

      <Description html={entity.descriptionHtml} />

      {entity.licence && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Licence
          </h2>
          <span className="badge badge-soft badge-accent">
            {entity.licence}
          </span>
        </div>
      )}

      {entity.accessModel && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Modèle d&apos;accès
          </h2>
          <span className="badge badge-soft badge-error">
            {entity.accessModel}
          </span>
        </div>
      )}

      <NameList label="Personne responsable" names={entity.authorNames} />
      <NameList label="Subventionné par" names={entity.funderNames} />

      {entity.email && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-base-content/60 mb-1">
            Contact
          </h2>
          <a href={`mailto:${entity.email}`} className="link link-primary">
            {entity.email}
          </a>
        </div>
      )}
    </>
  )
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function Description({ html }: { html: string }) {
  if (!html) return null
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">Description</h2>
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(html),
        }}
      />
    </section>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-6">
      <dt className="text-sm font-medium text-base-content/60">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  )
}

function BadgeList({
  label,
  items,
  color = "badge-outline",
}: {
  label: string
  items: string[]
  color?: string
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-base-content/60 mb-1">
        {label}
      </h2>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className={`badge badge-soft ${color}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function NameList({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-base-content/60 mb-1">
        {label}
      </h2>
      {names.map((name) => (
        <div key={name}>{name}</div>
      ))}
    </div>
  )
}
