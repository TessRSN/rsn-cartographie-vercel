"use client";

import { GraphEdge } from "reagraph";
import { MyDiagram } from "./Reagraph";
import { DetailCardRoot } from "./DetailCard/DetailCardRoot";
import { MapView } from "./MapView";
import { useState, useMemo } from "react";
import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";

interface DiagramRootProps {
  nodes: MyGraphNode[];
  edges: GraphEdge[];
}

// ─── Labels & couleurs ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  "node--organization": "Organisation",
  "node--government_organization": "Org. gouvernementale",
  "node--person": "Personne",
  "node--dataset": "Jeu de données",
  "node--data_catalog": "Catalogue de données",
  "node--software_application": "Application",
};

const NODE_FILL: Record<string, string> = {
  "node--organization": "#0061AF",
  "node--government_organization": "#64748b",
  "node--person": "#00A759",
  "node--dataset": "#FFCC4E",
  "node--data_catalog": "#FFCC4E",
  "node--software_application": "#EE3124",
};

const ORG_TYPE_LABELS: Record<string, string> = {
  consortium: "Regroupement de recherche",
  college_or_university: "Collège ou université",
  funding_scheme: "Programme de financement",
  government_organization: "Organisation gouvernementale",
  hospital: "Hôpital",
  autre: "Autre",
};

// ─── Options filtre d'arêtes ─────────────────────────────────────────────────

const EDGE_FILTER_OPTIONS = [
  { types: ["node--organization"], label: "Organisations", fill: "#0061AF" },
  { types: ["node--government_organization"], label: "Org. gouvernementales", fill: "#64748b" },
  { types: ["node--person"], label: "Personnes", fill: "#00A759" },
  { types: ["node--dataset", "node--data_catalog"], label: "Jeux de données", fill: "#FFCC4E" },
  { types: ["node--software_application"], label: "Applications", fill: "#EE3124" },
];

// Activés par défaut : tout sauf org. gouvernementales
const DEFAULT_ENABLED = new Set([
  "node--organization",
  "node--person",
  "node--dataset",
  "node--data_catalog",
  "node--software_application",
]);

// ─── Colonnes tabulaires ──────────────────────────────────────────────────────

type ColKey =
  | "subtype"
  | "parentOrg"
  | "localisation"
  | "couverture"
  | "axeRsn"
  | "santeDomain"
  | "digitalDomain"
  | "licence"
  | "acces"
  | "links";

const COL_HEADERS: Record<ColKey, string> = {
  subtype: "Sous-type / Catégorie",
  parentOrg: "Appartenance / Org. parente",
  localisation: "Localisation",
  couverture: "Couverture géo.",
  axeRsn: "Axe RSN",
  santeDomain: "Domaine de santé",
  digitalDomain: "Méthodes numériques",
  licence: "Licence",
  acces: "Modèle d'accès",
  links: "Liens",
};

const COL_MIN_W: Record<ColKey, string> = {
  subtype: "160px",
  parentOrg: "180px",
  localisation: "140px",
  couverture: "130px",
  axeRsn: "120px",
  santeDomain: "180px",
  digitalDomain: "180px",
  licence: "120px",
  acces: "140px",
  links: "180px",
};

const COLS_BY_TYPE: Record<string, ColKey[]> = {
  all: [
    "subtype", "parentOrg", "localisation", "couverture",
    "axeRsn", "santeDomain", "digitalDomain",
    "licence", "acces", "links",
  ],
  "node--organization": ["subtype", "localisation", "couverture", "links"],
  "node--government_organization": ["subtype", "localisation", "couverture", "links"],
  "node--person": ["subtype", "parentOrg", "axeRsn", "santeDomain", "digitalDomain", "links"],
  "node--dataset": ["parentOrg", "santeDomain", "licence", "acces", "links"],
  "node--data_catalog": ["parentOrg", "santeDomain", "licence", "acces", "links"],
  "node--software_application": ["subtype", "parentOrg", "santeDomain", "licence", "acces", "links"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTextColor(fill?: string): string {
  if (!fill) return "#000";
  const hex = fill.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#1a1a1a" : "#ffffff";
}

/** Chip de tag avec couleur d'entité — visible en dark ET light mode */
function EntityChip({ label, fill }: { label: string; fill: string }) {
  return (
    <span
      title={label}
      style={{
        color: fill,
        border: `1.5px solid ${fill}`,
        borderRadius: "5px",
        padding: "1px 7px",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        maxWidth: "170px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-block",
        verticalAlign: "middle",
        background: "transparent",
      }}
    >
      {label}
    </span>
  );
}

/** Chip neutre — outline, visible en dark ET light mode */
function NeutralChip({ label }: { label: string }) {
  return (
    <span
      className="badge badge-outline badge-sm"
      title={label}
      style={{
        maxWidth: "170px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    >
      {label}
    </span>
  );
}

const DASH = <span className="opacity-30">—</span>;

/** Contenu d'une cellule pour une colonne donnée */
function cellContent(node: MyGraphNode, col: ColKey): React.ReactNode {
  const data = node.data as GraphNodeData;
  const fill = node.fill ?? "#888";

  switch (col) {
    case "subtype": {
      if (data.type === "node--organization" || data.type === "node--government_organization") {
        const v = data.schema_organization_type
          ? (ORG_TYPE_LABELS[data.schema_organization_type] ?? data.schema_organization_type)
          : null;
        return v ? <EntityChip label={v} fill={fill} /> : DASH;
      }
      if (data.type === "node--person") {
        const v = data.field_person_type?.name ?? null;
        return v ? <EntityChip label={v} fill={fill} /> : DASH;
      }
      if (data.type === "node--software_application") {
        const v = data.application_category?.map((c) => c.name).join(", ") ?? null;
        return v ? <EntityChip label={v} fill={fill} /> : DASH;
      }
      return DASH;
    }

    case "parentOrg": {
      let refs: Array<{ id: string; title?: string }> | null = null;
      if (data.type === "node--person") {
        refs = (data.member_of ?? []) as Array<{ id: string; title?: string }>;
      } else if (
        data.type === "node--dataset" ||
        data.type === "node--data_catalog" ||
        data.type === "node--software_application"
      ) {
        refs = (data.parent_organization ?? []) as Array<{ id: string; title?: string }>;
      }
      if (!refs || refs.length === 0) return DASH;
      const label = refs.map((r) => r.title ?? r.id).filter(Boolean).join(", ");
      return label ? (
        <span className="block truncate text-sm" title={label}>{label}</span>
      ) : DASH;
    }

    case "localisation": {
      if (data.type === "node--organization" || data.type === "node--government_organization") {
        const geo = data.field_organization_geographical ?? [];
        const v = geo.map((t) => t.name).join(", ");
        return v ? <NeutralChip label={v} /> : DASH;
      }
      return DASH;
    }

    case "couverture": {
      if (data.type === "node--organization" || data.type === "node--government_organization") {
        const cov = data.field_couverture_geographique ?? [];
        const v = cov.map((t) => t.name).join(", ");
        return v ? <NeutralChip label={v} /> : DASH;
      }
      return DASH;
    }

    case "axeRsn": {
      if (data.type === "node--person") {
        const v = data.field_axe_si_membre_rsn?.name ?? null;
        return v ? <EntityChip label={v} fill={fill} /> : DASH;
      }
      return DASH;
    }

    case "santeDomain": {
      if (
        data.type === "node--person" ||
        data.type === "node--dataset" ||
        data.type === "node--data_catalog" ||
        data.type === "node--software_application"
      ) {
        const fd = data.field_applied_domain ?? [];
        if (fd.length === 0) return DASH;
        return (
          <div className="flex flex-col gap-0.5">
            {fd.map((d, i) => (
              <EntityChip key={i} label={d.name} fill={fill} />
            ))}
          </div>
        );
      }
      return DASH;
    }

    case "digitalDomain": {
      if (data.type === "node--person") {
        const fd = data.field_digital_domain ?? [];
        if (fd.length === 0) return DASH;
        return (
          <div className="flex flex-col gap-0.5">
            {fd.map((d, i) => (
              <EntityChip key={i} label={d.name} fill={fill} />
            ))}
          </div>
        );
      }
      return DASH;
    }

    case "licence": {
      if (
        data.type === "node--dataset" ||
        data.type === "node--data_catalog" ||
        data.type === "node--software_application"
      ) {
        const v = data.field_licence?.name ?? null;
        return v ? <NeutralChip label={v} /> : DASH;
      }
      return DASH;
    }

    case "acces": {
      if (
        data.type === "node--dataset" ||
        data.type === "node--data_catalog" ||
        data.type === "node--software_application"
      ) {
        const v = data.field_modele_acces?.name ?? null;
        return v ? <NeutralChip label={v} /> : DASH;
      }
      return DASH;
    }

    case "links": {
      const links: string[] = data.link ?? [];
      if (links.length === 0) return DASH;
      return (
        <div className="flex flex-wrap gap-1">
          {links.slice(0, 3).map((url, i) => {
            let display = url;
            try {
              const u = new URL(url.startsWith("http") ? url : `https://${url}`);
              display = u.hostname.replace(/^www\./, "");
            } catch {
              // garde l'URL brute si parsing échoue
              display = url.length > 22 ? url.slice(0, 22) + "…" : url;
            }
            return (
              <a
                key={i}
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-sm badge-outline hover:badge-primary"
                style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={url}
                onClick={(e) => e.stopPropagation()}
              >
                ↗ {display}
              </a>
            );
          })}
          {links.length > 3 && (
            <span className="badge badge-sm badge-ghost opacity-60">+{links.length - 3}</span>
          )}
        </div>
      );
    }

    default:
      return DASH;
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function DiagramRoot({ nodes, edges }: DiagramRootProps) {
  const [selectedNode, setSelectedNode] = useState<MyGraphNode | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"graph" | "table" | "map">("graph");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState<Set<string>>(DEFAULT_ENABLED);
  const [edgeDropdownOpen, setEdgeDropdownOpen] = useState(false);

  // Colonnes visibles selon le filtre de type actif
  const visibleCols: ColKey[] = COLS_BY_TYPE[typeFilter] ?? COLS_BY_TYPE.all;

  // Nœuds filtrés pour le tableau
  const filteredNodes = typeFilter === "all"
    ? nodes
    : nodes.filter((n) => n.data?.type === typeFilter);

  // Map id → type pour le filtre d'arêtes
  const nodeTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    nodes.forEach((n) => m.set(n.id, n.data?.type ?? ""));
    return m;
  }, [nodes]);

  // Arêtes filtrées selon les types activés
  const filteredEdges = useMemo(() => {
    return edges.filter((e) => {
      const st = nodeTypeMap.get(e.source) ?? "";
      const tt = nodeTypeMap.get(e.target) ?? "";
      return enabledEdgeTypes.has(st) && enabledEdgeTypes.has(tt);
    });
  }, [edges, nodeTypeMap, enabledEdgeTypes]);

  // Comptage par type
  const counts = {
    orgs: nodes.filter((n) => n.data?.type === "node--organization").length,
    gouvOrgs: nodes.filter((n) => n.data?.type === "node--government_organization").length,
    persons: nodes.filter((n) => n.data?.type === "node--person").length,
    datasets: nodes.filter(
      (n) => n.data?.type === "node--dataset" || n.data?.type === "node--data_catalog"
    ).length,
    apps: nodes.filter((n) => n.data?.type === "node--software_application").length,
  };

  // Toggle un groupe de types d'arête
  const toggleEdgeGroup = (types: string[]) => {
    const allEnabled = types.every((t) => enabledEdgeTypes.has(t));
    const next = new Set(enabledEdgeTypes);
    if (allEnabled) types.forEach((t) => next.delete(t));
    else types.forEach((t) => next.add(t));
    setEnabledEdgeTypes(next);
  };

  const hiddenCount = EDGE_FILTER_OPTIONS.filter(
    (opt) => !opt.types.every((t) => enabledEdgeTypes.has(t))
  ).length;

  return (
    <div className="flex flex-col h-full" onClick={() => setEdgeDropdownOpen(false)}>
      {/* Barre onglets + statistiques */}
      <div className="flex items-center justify-between px-4 bg-base-100 border-b border-base-300 flex-shrink-0">
        <div className="tabs tabs-border">
          <button className={`tab ${activeTab === "graph" ? "tab-active" : ""}`} onClick={() => setActiveTab("graph")}>
            Cartographie
          </button>
          <button className={`tab ${activeTab === "table" ? "tab-active" : ""}`} onClick={() => setActiveTab("table")}>
            Vue tabulaire
          </button>
          <button className={`tab ${activeTab === "map" ? "tab-active" : ""}`} onClick={() => setActiveTab("map")}>
            Vue géographique
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-base-content/70 py-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0061AF" }} />
            <span><strong className="text-base-content">{counts.orgs}</strong> organisations</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#64748b" }} />
            <span><strong className="text-base-content">{counts.gouvOrgs}</strong> org. gouv.</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#00A759" }} />
            <span><strong className="text-base-content">{counts.persons}</strong> personnes</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#FFCC4E" }} />
            <span><strong className="text-base-content">{counts.datasets}</strong> jeux de données</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#EE3124" }} />
            <span><strong className="text-base-content">{counts.apps}</strong> applications</span>
          </span>
        </div>
      </div>

      {/* ── Vue graphe ─────────────────────────────────────────────────────── */}
      {activeTab === "graph" && (
        <div className="relative flex-1">
          {/* Filtre arêtes */}
          <div
            className="absolute z-20 left-4 top-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`btn btn-sm gap-1.5 ${hiddenCount > 0 ? "btn-warning btn-outline" : "btn-ghost border border-base-300"}`}
              onClick={() => setEdgeDropdownOpen((v) => !v)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-2.93 7.07M4.93 4.93A10 10 0 0 0 3 12a10 10 0 0 0 1.93 7.07"/>
              </svg>
              Connexions
              {hiddenCount > 0 && (
                <span className="badge badge-warning badge-sm">{hiddenCount} masqué{hiddenCount > 1 ? "s" : ""}</span>
              )}
            </button>

            {edgeDropdownOpen && (
              <div className="mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl w-58 p-2 flex flex-col gap-0.5">
                <p className="text-xs text-base-content/50 px-2 pt-1 pb-0.5 font-medium uppercase tracking-wider">
                  Afficher les connexions
                </p>
                {EDGE_FILTER_OPTIONS.map((opt) => {
                  const checked = opt.types.every((t) => enabledEdgeTypes.has(t));
                  return (
                    <label
                      key={opt.types[0]}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={checked}
                        onChange={() => toggleEdgeGroup(opt.types)}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: opt.fill }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panneau détail */}
          <div className="absolute z-10 right-12 top-4 max-h-[80vh]">
            {selectedNode && (
              <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />
            )}
          </div>

          <MyDiagram
            nodes={nodes}
            edges={filteredEdges}
            onNodeClick={(data) => setSelectedNode(data as MyGraphNode)}
          />
        </div>
      )}

      {/* ── Vue géographique — toujours montée ─────────────────────────────── */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ display: activeTab === "map" ? "flex" : "none" }}
      >
        <MapView
          nodes={nodes}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNode={selectedNode}
          visible={activeTab === "map"}
        />
        {selectedNode && (
          <div className="w-[400px] border-l border-base-300 overflow-y-auto bg-base-100 p-4 flex-shrink-0">
            <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />
          </div>
        )}
      </div>

      {/* ── Vue tabulaire ───────────────────────────────────────────────────── */}
      {activeTab === "table" && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Filtre par type */}
            <div className="flex gap-2 p-3 border-b border-base-300 flex-wrap bg-base-50 flex-shrink-0">
              <button
                className={`btn btn-xs ${typeFilter === "all" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTypeFilter("all")}
              >
                Tous ({nodes.length})
              </button>
              {Object.entries(TYPE_LABELS).map(([type, label]) => {
                const count = nodes.filter((n) => n.data?.type === type).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    className={`btn btn-xs ${typeFilter === type ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setTypeFilter(type)}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tableau */}
            <div className="overflow-auto flex-1">
              <table className="table table-zebra table-sm" style={{ minWidth: "max-content", width: "100%" }}>
                <thead className="sticky top-0 bg-base-200 z-10">
                  <tr>
                    <th className="sticky left-0 bg-base-200 z-20" style={{ minWidth: "200px" }}>Nom</th>
                    <th style={{ minWidth: "150px" }}>Type</th>
                    {visibleCols.map((col) => (
                      <th key={col} style={{ minWidth: COL_MIN_W[col] }}>
                        {COL_HEADERS[col]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <tr
                        key={node.id}
                        className={`cursor-pointer hover ${isSelected ? "bg-base-300" : ""}`}
                        onClick={() => setSelectedNode(isSelected ? undefined : node)}
                      >
                        {/* Nom sticky */}
                        <td
                          className="sticky left-0 bg-inherit font-medium"
                          style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={node.data?.title ?? node.label}
                        >
                          {node.data?.title ?? node.label}
                        </td>

                        {/* Badge type */}
                        <td>
                          <span
                            className="badge badge-sm whitespace-nowrap"
                            style={{
                              backgroundColor: node.fill ?? "#888",
                              color: getTextColor(node.fill),
                              border: "none",
                            }}
                          >
                            {TYPE_LABELS[node.data?.type ?? ""] ?? "—"}
                          </span>
                        </td>

                        {/* Colonnes contextuelles */}
                        {visibleCols.map((col) => (
                          <td key={col} className="align-middle">
                            {cellContent(node, col)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panneau latéral détail */}
          {selectedNode && (
            <div className="w-[420px] border-l border-base-300 overflow-y-auto bg-base-100 p-4 flex-shrink-0">
              <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
