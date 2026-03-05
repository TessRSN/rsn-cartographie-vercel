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

      {/* Description */}
      {entity.descriptionHtml ? (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(entity.descriptionHtml),
            }}
          />
        </section>
      ) : null}

      {/* Metadata grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {entity.organizationType && (
          <MetaField
            label="Type"
            value={ORG_TYPE_LABELS[entity.organizationType] ?? entity.organizationType}
          />
        )}
        {entity.licence && <MetaField label="Licence" value={entity.licence} />}
        {entity.accessModel && (
          <MetaField label="Modèle d'accès" value={entity.accessModel} />
        )}
        {entity.address && (
          <MetaField label="Adresse" value={entity.address} />
        )}
        {entity.email && <MetaField label="Email" value={entity.email} />}
        {entity.categories.length > 0 && (
          <div>
            <dt className="text-sm font-medium text-base-content/60">
              Catégories
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {entity.categories.map((c) => (
                <span key={c} className="badge badge-sm badge-outline">
                  {c}
                </span>
              ))}
            </dd>
          </div>
        )}
      </section>

      {/* Links */}
      {entity.links.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Liens</h2>
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

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-base-content/60">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  )
}
