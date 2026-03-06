"use client";

import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";
import { TYPE_LABELS, ORG_TYPE_LABELS } from "@/app/lib/constants";

interface CardGridViewProps {
  nodes: MyGraphNode[];
  nodeById: Map<string, MyGraphNode>;
  selectedNodeId?: string;
  onSelectNode: (node: MyGraphNode) => void;
}

export function CardGridView({ nodes, nodeById, selectedNodeId, onSelectNode }: CardGridViewProps) {
  const sortedNodes = [...nodes].sort((a, b) => {
    const titleA = (a.data?.title ?? a.label ?? "").toLowerCase();
    const titleB = (b.data?.title ?? b.label ?? "").toLowerCase();
    return titleA.localeCompare(titleB, "fr");
  });

  return (
    <div className="p-4">
      <p className="text-sm text-base-content/60 mb-4">
        <span className="font-medium text-base-content">{sortedNodes.length}</span>{" "}
        entité{sortedNodes.length !== 1 ? "s" : ""} affichée{sortedNodes.length !== 1 ? "s" : ""}
      </p>
      {sortedNodes.length === 0 ? (
        <p className="text-center text-base-content/40 py-12">Aucun résultat</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedNodes.map((node) => (
            <CompactCard
              key={node.id}
              node={node}
              nodeById={nodeById}
              isSelected={node.id === selectedNodeId}
              onSelect={() => onSelectNode(node)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Compact card ────────────────────────────────────────────────────────────

function CompactCard({
  node,
  nodeById,
  isSelected,
  onSelect,
}: {
  node: MyGraphNode;
  nodeById: Map<string, MyGraphNode>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const data = node.data as GraphNodeData;
  const fill = node.fill ?? "#888";
  const typeLabel = TYPE_LABELS[data.type] ?? data.type;

  // Subtitle: the most useful single-line info per type
  const subtitle = getSubtitle(data, nodeById);

  // Key tags (up to 3)
  const tags = getKeyTags(data);

  return (
    <div
      className={`card bg-base-200 border shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-base-300"
      }`}
      style={{ borderLeft: `4px solid ${fill}` }}
      onClick={onSelect}
    >
      <div className="card-body p-3 gap-2">
        {/* Row 1: titre + logo miniature */}
        <div className="flex items-start gap-2">
          {data.imageSrc && (
            <img
              src={data.imageSrc}
              alt=""
              className="w-8 h-8 rounded object-contain bg-base-100 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{data.title}</h3>
            {subtitle && (
              <p className="text-xs text-base-content/60 truncate mt-0.5" title={subtitle}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Row 2: badge type */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="badge badge-xs whitespace-nowrap"
            style={{ backgroundColor: fill, color: getTextColor(fill), border: "none" }}
          >
            {typeLabel}
          </span>
          {tags.map((tag, i) => (
            <span key={i} className="badge badge-xs badge-outline truncate max-w-[120px]" title={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a short subtitle string for the card based on entity type. */
function getSubtitle(data: GraphNodeData, nodeById: Map<string, MyGraphNode>): string | null {
  switch (data.type) {
    case "node--organization":
    case "node--government_organization": {
      if (data.schema_organization_type)
        return ORG_TYPE_LABELS[data.schema_organization_type] ?? data.schema_organization_type;
      const alias = "alternate_name" in data ? data.alternate_name?.[0] : null;
      return alias ?? null;
    }
    case "node--person": {
      // Show org membership
      const orgs = (data.member_of ?? [])
        .filter(r => r.id !== "missing")
        .map(r => {
          if (r.title) return r.title;
          const found = nodeById.get(r.id);
          return found?.data?.title ?? found?.label ?? null;
        })
        .filter(Boolean);
      if (orgs.length > 0) return orgs.join(", ");
      return data.field_person_type?.name ?? null;
    }
    case "node--software_application": {
      const cats = data.application_category?.map(c => c.name).join(", ");
      return cats || ("alternate_name" in data ? data.alternate_name?.[0] ?? null : null);
    }
    case "node--dataset":
    case "node--data_catalog": {
      return "alternate_name" in data ? data.alternate_name?.[0] ?? null : null;
    }
    default:
      return null;
  }
}

/** Returns up to 3 key tags for compact display. */
function getKeyTags(data: GraphNodeData): string[] {
  const tags: string[] = [];

  // Health domain
  if ("field_applied_domain" in data && data.field_applied_domain) {
    for (const d of data.field_applied_domain) {
      if (tags.length >= 3) break;
      tags.push(d.name);
    }
  }

  // Geographic coverage (orgs)
  if (tags.length < 3 && (data.type === "node--organization" || data.type === "node--government_organization")) {
    for (const c of data.field_couverture_geographique ?? []) {
      if (tags.length >= 3) break;
      tags.push(c.name);
    }
  }

  // Axe RSN (persons)
  if (tags.length < 3 && data.type === "node--person" && data.field_axe_si_membre_rsn) {
    tags.push(data.field_axe_si_membre_rsn.name);
  }

  // Licence
  if (tags.length < 3 && "field_licence" in data && data.field_licence) {
    tags.push(data.field_licence.name);
  }

  return tags;
}

function getTextColor(fill: string): string {
  const hex = fill.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a1a" : "#ffffff";
}
