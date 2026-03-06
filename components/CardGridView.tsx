"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";
import { NODE_FILL, TYPE_LABELS, ORG_TYPE_LABELS } from "@/app/lib/constants";
import { Logo } from "./DetailCard/Logo";
import { Adresse } from "./DetailCard/Adresse";

interface CardGridViewProps {
  nodes: MyGraphNode[];
  nodeById: Map<string, MyGraphNode>;
}

export function CardGridView({ nodes, nodeById }: CardGridViewProps) {
  const sortedNodes = [...nodes].sort((a, b) => {
    const titleA = (a.data?.title ?? a.label ?? "").toLowerCase();
    const titleB = (b.data?.title ?? b.label ?? "").toLowerCase();
    return titleA.localeCompare(titleB, "fr");
  });

  return (
    <div className="p-2 md:p-4">
      <p className="text-sm text-base-content/60 mb-3 md:mb-4">
        <span className="font-medium text-base-content">{sortedNodes.length}</span>{" "}
        entité{sortedNodes.length !== 1 ? "s" : ""} affichée{sortedNodes.length !== 1 ? "s" : ""}
      </p>
      {sortedNodes.length === 0 ? (
        <p className="text-center text-base-content/40 py-12">Aucun résultat</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sortedNodes.map((node) => (
            <EntityCard key={node.id} node={node} nodeById={nodeById} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card component ─────────────────────────────────────────────────────────

function EntityCard({
  node,
  nodeById,
}: {
  node: MyGraphNode;
  nodeById: Map<string, MyGraphNode>;
}) {
  const [expanded, setExpanded] = useState(false);
  const data = node.data as GraphNodeData;
  const fill = node.fill ?? "#888";
  const typeLabel = TYPE_LABELS[data.type] ?? data.type;

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm" style={{ borderLeft: `4px solid ${fill}` }}>
      <div className="card-body p-4 gap-3">
        {/* Header: titre + badge type */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base leading-tight">{data.title}</h3>
          <span
            className="badge badge-sm whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: fill, color: getTextColor(fill), border: "none" }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Résumé selon le type */}
        <SummaryByType data={data} nodeById={nodeById} />

        {/* Logo / Photo (petit format) */}
        {data.imageSrc && (
          <div className={data.type === "node--person" ? "" : "max-w-[120px]"}>
            <Logo imageSrc={data.imageSrc} alt={data.title} variant={data.type === "node--person" ? "photo" : "logo"} />
          </div>
        )}

        {/* Tags (domaines, méthodes, axes — selon type) */}
        <TagsByType data={data} />

        {/* Voir plus / Voir moins */}
        <button
          className="text-sm text-primary hover:underline self-start cursor-pointer"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Voir moins ▲" : "Voir plus ▼"}
        </button>

        {expanded && <ExpandedSection data={data} nodeById={nodeById} />}
      </div>
    </div>
  );
}

// ─── Summary by entity type ─────────────────────────────────────────────────

function SummaryByType({
  data,
  nodeById,
}: {
  data: GraphNodeData;
  nodeById: Map<string, MyGraphNode>;
}) {
  switch (data.type) {
    case "node--person":
      return (
        <div className="text-sm space-y-1">
          {data.member_of && data.member_of.length > 0 && (
            <p className="text-base-content/70">
              {data.member_of
                .filter((r) => r.id !== "missing")
                .map((r) => resolveTitle(r, nodeById))
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {data.link && data.link.length > 0 && (
            <p>
              <a href={`mailto:${data.link[0]}`} className="link link-primary text-sm">
                {data.link[0]}
              </a>
            </p>
          )}
          {data.field_person_type && (
            <Field label="Statut" value={data.field_person_type.name} />
          )}
        </div>
      );

    case "node--organization":
    case "node--government_organization":
      return (
        <div className="text-sm space-y-1">
          {"alternate_name" in data && data.alternate_name?.[0] && (
            <p className="text-base-content/70">{data.alternate_name[0]}</p>
          )}
          {data.schema_organization_type && (
            <Field
              label="Type"
              value={ORG_TYPE_LABELS[data.schema_organization_type] ?? data.schema_organization_type}
            />
          )}
          {data.link && data.link.length > 0 && (
            <div>
              <a href={data.link[0]} className="link link-primary text-sm truncate block" target="_blank" title={data.link[0]}>
                {data.link[0]}
              </a>
            </div>
          )}
        </div>
      );

    case "node--software_application":
      return (
        <div className="text-sm space-y-1">
          {"alternate_name" in data && data.alternate_name?.[0] && (
            <p className="text-base-content/70">{data.alternate_name[0]}</p>
          )}
          {data.schema_email && (
            <p>
              <a href={`mailto:${data.schema_email}`} className="link link-primary text-sm">
                {data.schema_email}
              </a>
            </p>
          )}
          {data.application_category && data.application_category.length > 0 && (
            <Field label="Catégorie" value={data.application_category.map((c) => c.name).join(", ")} />
          )}
        </div>
      );

    case "node--dataset":
    case "node--data_catalog":
      return (
        <div className="text-sm space-y-1">
          {"alternate_name" in data && data.alternate_name?.[0] && (
            <p className="text-base-content/70">{data.alternate_name[0]}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ─── Tags badges by type ────────────────────────────────────────────────────

function TagsByType({ data }: { data: GraphNodeData }) {
  const sections: React.ReactNode[] = [];

  // Domaine de santé (persons, datasets, catalogs)
  if ("field_applied_domain" in data && data.field_applied_domain && data.field_applied_domain.length > 0) {
    sections.push(
      <div key="domain">
        <p className="text-xs font-medium text-base-content/60 mb-1">Domaine de santé</p>
        <div className="flex flex-wrap gap-1.5">
          {data.field_applied_domain.map((d) => (
            <span key={d.id} className="badge badge-soft badge-success badge-sm">{d.name}</span>
          ))}
        </div>
      </div>
    );
  }

  // Méthodes numériques (persons)
  if (data.type === "node--person" && data.field_digital_domain && data.field_digital_domain.length > 0) {
    sections.push(
      <div key="digital">
        <p className="text-xs font-medium text-base-content/60 mb-1">Méthodes numériques</p>
        <div className="flex flex-wrap gap-1.5">
          {data.field_digital_domain.map((d) => (
            <span key={d.id} className="badge badge-soft badge-info badge-sm">{d.name}</span>
          ))}
        </div>
      </div>
    );
  }

  // Axe RSN (persons)
  if (data.type === "node--person" && data.field_axe_si_membre_rsn?.name) {
    sections.push(
      <div key="axe-rsn">
        <p className="text-xs font-medium text-base-content/60 mb-1">Axe RSN</p>
        <span className="badge badge-soft badge-warning badge-sm">{data.field_axe_si_membre_rsn.name}</span>
      </div>
    );
  }

  // Couverture géographique (organizations)
  if (
    (data.type === "node--organization" || data.type === "node--government_organization") &&
    "field_couverture_geographique" in data &&
    data.field_couverture_geographique &&
    data.field_couverture_geographique.length > 0
  ) {
    sections.push(
      <div key="couverture">
        <p className="text-xs font-medium text-base-content/60 mb-1">Couverture géographique</p>
        <div className="flex flex-wrap gap-1.5">
          {data.field_couverture_geographique.map((c) => (
            <span key={c.id} className="badge badge-soft badge-secondary badge-sm">{c.name}</span>
          ))}
        </div>
      </div>
    );
  }

  // Licence (software, dataset, catalog)
  if ("field_licence" in data && data.field_licence?.name) {
    sections.push(
      <div key="licence">
        <p className="text-xs font-medium text-base-content/60 mb-1">Licence</p>
        <span className="badge badge-soft badge-accent badge-sm">{data.field_licence.name}</span>
      </div>
    );
  }

  // Modèle d'accès (software, dataset, catalog)
  if ("field_modele_acces" in data && data.field_modele_acces?.name) {
    sections.push(
      <div key="acces">
        <p className="text-xs font-medium text-base-content/60 mb-1">Modèle d&apos;accès</p>
        <span className="badge badge-soft badge-error badge-sm">{data.field_modele_acces.name}</span>
      </div>
    );
  }

  if (sections.length === 0) return null;

  return <div className="space-y-2">{sections}</div>;
}

// ─── Expanded details section ───────────────────────────────────────────────

function ExpandedSection({
  data,
  nodeById,
}: {
  data: GraphNodeData;
  nodeById: Map<string, MyGraphNode>;
}) {
  return (
    <div className="border-t border-base-300 pt-3 space-y-3 text-sm">
      {/* Description */}
      {data.description?.value && (
        <div>
          <p className="font-medium mb-1">Description</p>
          <div
            className="max-h-40 overflow-y-auto bg-base-100 rounded px-2 py-1 text-sm"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(data.description.value),
            }}
          />
        </div>
      )}

      {/* Adresse (organizations) */}
      {"address" in data && data.address && (
        <div>
          <p className="font-medium mb-1">Adresse</p>
          <Adresse address={data.address} />
        </div>
      )}

      {/* Localisation administrative (organizations) */}
      {"field_organization_geographical" in data &&
        data.field_organization_geographical &&
        data.field_organization_geographical.length > 0 && (
          <div>
            <p className="font-medium mb-1">Localisation administrative</p>
            {data.field_organization_geographical.map((t: { id: string; name: string }) => (
              <p key={t.id}>{t.name}</p>
            ))}
          </div>
        )}

      {/* Personne responsable (software, dataset, catalog) */}
      {"author" in data && data.author && data.author.length > 0 && (
        <div>
          <p className="font-medium mb-1">Personne responsable</p>
          {(data.author as Array<{ id: string; title?: string }>).map((a) => (
            <p key={a.id}>{resolveTitle(a, nodeById)}</p>
          ))}
        </div>
      )}

      {/* Subventionné par */}
      {"field_funder" in data && data.field_funder && (data.field_funder as unknown[]).length > 0 && (
        <div>
          <p className="font-medium mb-1">Subventionné par</p>
          {(data.field_funder as Array<{ id: string; title?: string }>)
            .filter((f) => f.id !== "missing")
            .map((f) => (
              <p key={f.id}>{resolveTitle(f, nodeById)}</p>
            ))}
        </div>
      )}

      {/* Liens */}
      {data.link && data.link.length > 0 && (
        <div>
          <p className="font-medium mb-1">Lien(s)</p>
          <div className="space-y-1">
            {data.link.map((link, i) => (
              <a
                key={i}
                className="link link-primary link-hover block truncate text-sm"
                href={link}
                target="_blank"
                title={link}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Liens significatifs (persons) */}
      {data.type === "node--person" && data.significant_link && data.significant_link.length > 0 && (
        <div>
          <p className="font-medium mb-1">Liens</p>
          <div className="space-y-1">
            {data.significant_link.map((link, i) => (
              <a
                key={i}
                className="link link-primary link-hover block truncate text-sm"
                href={link.uri}
                target="_blank"
                title={link.uri}
              >
                {link.title || link.uri}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-medium text-base-content/70 min-w-[80px]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function resolveTitle(
  ref: { id: string; title?: string },
  nodeById: Map<string, MyGraphNode>
): string {
  if (ref.title) return ref.title;
  const found = nodeById.get(ref.id);
  return found?.data?.title ?? found?.label ?? ref.id;
}

function getTextColor(fill: string): string {
  const hex = fill.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a1a" : "#ffffff";
}
