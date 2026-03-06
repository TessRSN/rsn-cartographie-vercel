/**
 * DiagramRoot — Main client-side orchestrator for the four visualization views.
 *
 * Manages shared state across the cards, graph, table, and map tabs:
 * - Type filtering (show only certain node types)
 * - Advanced faceted filters (geographic coverage, RSN axis, health domain, etc.)
 * - Edge visibility toggles for the graph view
 * - Text search filtering for the table view
 * - Node selection (detail card) shared across all views
 */
"use client";

import { GraphEdge } from "reagraph";
import { MyDiagram } from "./Reagraph";
import { DetailCardRoot } from "./DetailCard/DetailCardRoot";
import { MapView } from "./MapView";
import { CardGridView } from "./CardGridView";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";
import { TYPE_LABELS, NODE_FILL, ORG_TYPE_LABELS } from "@/app/lib/constants";
import { removeAccents } from "@/app/lib/utils";

interface DiagramRootProps {
  nodes: MyGraphNode[];
  edges: GraphEdge[];
}

const EDGE_FILTER_OPTIONS = [
  { types: ["node--organization"],                    label: "Organisations",        fill: "#0061AF" },
  { types: ["node--government_organization"],         label: "Org. gouvernementales", fill: "#8C8C8C" },
  { types: ["node--person"],                          label: "Personnes",             fill: "#00A759" },
  { types: ["node--dataset", "node--data_catalog"],   label: "Jeux de données",       fill: "#FFCC4E" },
  { types: ["node--software_application"],            label: "Applications",          fill: "#EE3124" },
];

const DEFAULT_ENABLED_EDGES = new Set([
  "node--organization", "node--person",
  "node--dataset", "node--data_catalog", "node--software_application",
]);

// ─── Colonnes ─────────────────────────────────────────────────────────────────

type ColKey =
  | "alias" | "subtype" | "parentOrg" | "localisation" | "couverture"
  | "axeRsn" | "santeDomain" | "digitalDomain" | "licence" | "acces"
  | "funder" | "author" | "email" | "links";

const COL_HEADERS: Record<ColKey, string> = {
  alias: "Alias", subtype: "Sous-type / Catégorie", parentOrg: "Appartenance / Org. parente",
  localisation: "Localisation", couverture: "Couverture géo.",
  axeRsn: "Axe RSN", santeDomain: "Domaine de santé",
  digitalDomain: "Méthodes numériques", licence: "Licence",
  acces: "Modèle d'accès", funder: "Subventionné par",
  author: "Personne responsable", email: "Contact", links: "Liens",
};

const COL_MIN_W: Record<ColKey, string> = {
  alias: "140px", subtype: "160px", parentOrg: "180px", localisation: "140px", couverture: "130px",
  axeRsn: "130px", santeDomain: "180px", digitalDomain: "180px",
  licence: "130px", acces: "140px", funder: "180px", author: "180px", email: "180px", links: "180px",
};

const COLS_BY_TYPE: Record<string, ColKey[]> = {
  all:                             ["alias","subtype","parentOrg","localisation","couverture","axeRsn","santeDomain","digitalDomain","licence","acces","funder","author","email","links"],
  "node--organization":            ["alias","subtype","localisation","couverture","funder","links"],
  "node--government_organization": ["alias","subtype","localisation","couverture","funder","links"],
  "node--person":                  ["subtype","parentOrg","axeRsn","santeDomain","digitalDomain","email","links"],
  "node--dataset":                 ["alias","parentOrg","santeDomain","licence","acces","author","funder","links"],
  "node--data_catalog":            ["alias","parentOrg","santeDomain","licence","acces","author","funder","links"],
  "node--software_application":    ["alias","subtype","parentOrg","santeDomain","licence","acces","author","funder","email","links"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTextColor(fill?: string): string {
  if (!fill) return "#000";
  const hex = fill.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a1a" : "#ffffff";
}

function EntityChip({ label, fill }: { label: string; fill: string }) {
  return (
    <span title={label} style={{
      color: fill, border: `1.5px solid ${fill}`, borderRadius: "5px",
      padding: "1px 7px", fontSize: "0.68rem", fontWeight: 600,
      maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis",
      whiteSpace: "nowrap", display: "inline-block", verticalAlign: "middle",
    }}>{label}</span>
  );
}

function NeutralChip({ label }: { label: string }) {
  return (
    <span className="badge badge-outline badge-sm" title={label} style={{
      maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis",
      whiteSpace: "nowrap", display: "inline-block", verticalAlign: "middle",
    }}>{label}</span>
  );
}

const DASH = <span className="opacity-30">—</span>;

/** Résout un ID de nœud en titre lisible via le lookup */
function resolveOrgTitle(id: string, title: string | undefined, nodeById: Map<string, MyGraphNode>): string | null {
  if (title) return title;
  const found = nodeById.get(id);
  return found?.data?.title ?? found?.label ?? null;
}

/** Resolves the display content for a single table cell based on the column key and node type. */
function cellContent(node: MyGraphNode, col: ColKey, nodeById: Map<string, MyGraphNode>): React.ReactNode {
  const data = node.data as GraphNodeData;
  const fill = node.fill ?? "#888";

  switch (col) {
    case "alias": {
      const aliases = "alternate_name" in data ? (data.alternate_name ?? []) : [];
      if (!aliases || aliases.length === 0) return DASH;
      return (
        <span className="block truncate text-sm opacity-70" title={aliases.join(", ")}>
          {aliases.join(", ")}
        </span>
      );
    }

    case "subtype": {
      let v: string | null = null;
      if (data.type === "node--organization" || data.type === "node--government_organization")
        v = data.schema_organization_type
          ? (ORG_TYPE_LABELS[data.schema_organization_type] ?? data.schema_organization_type)
          : null;
      else if (data.type === "node--person")
        v = data.field_person_type?.name ?? null;
      else if (data.type === "node--software_application")
        v = data.application_category?.map(c => c.name).join(", ") ?? null;
      return v ? <EntityChip label={v} fill={fill} /> : DASH;
    }

    case "parentOrg": {
      let refs: Array<{ id: string; title?: string }> = [];
      if (data.type === "node--person")
        refs = (data.member_of ?? []) as Array<{ id: string; title?: string }>;
      else if (data.type === "node--dataset" || data.type === "node--data_catalog" || data.type === "node--software_application")
        refs = (data.parent_organization ?? []) as Array<{ id: string; title?: string }>;

      const label = refs
        .filter(r => r.id !== "missing")
        .map(r => resolveOrgTitle(r.id, r.title, nodeById))
        .filter(Boolean)
        .join(", ");
      return label
        ? <span className="block truncate text-sm" title={label}>{label}</span>
        : DASH;
    }

    case "localisation": {
      if (data.type === "node--organization" || data.type === "node--government_organization") {
        const v = (data.field_organization_geographical ?? []).map(t => t.name).join(", ");
        return v ? <NeutralChip label={v} /> : DASH;
      }
      return DASH;
    }

    case "couverture": {
      if (data.type === "node--organization" || data.type === "node--government_organization") {
        const v = (data.field_couverture_geographique ?? []).map(t => t.name).join(", ");
        return v ? <NeutralChip label={v} /> : DASH;
      }
      return DASH;
    }

    case "axeRsn":
      return data.type === "node--person" && data.field_axe_si_membre_rsn
        ? <EntityChip label={data.field_axe_si_membre_rsn.name} fill={fill} />
        : DASH;

    case "santeDomain": {
      const fd = "field_applied_domain" in data ? (data.field_applied_domain ?? []) : [];
      return fd.length > 0
        ? <div className="flex flex-col gap-0.5">{fd.map((d, i) => <EntityChip key={i} label={d.name} fill={fill} />)}</div>
        : DASH;
    }

    case "digitalDomain": {
      if (data.type !== "node--person") return DASH;
      const fd = data.field_digital_domain ?? [];
      return fd.length > 0
        ? <div className="flex flex-col gap-0.5">{fd.map((d, i) => <EntityChip key={i} label={d.name} fill={fill} />)}</div>
        : DASH;
    }

    case "licence": {
      const v = "field_licence" in data ? (data.field_licence?.name ?? null) : null;
      return v ? <NeutralChip label={v} /> : DASH;
    }

    case "acces": {
      const v = "field_modele_acces" in data ? (data.field_modele_acces?.name ?? null) : null;
      return v ? <NeutralChip label={v} /> : DASH;
    }

    case "funder": {
      const funders = "field_funder" in data ? (data.field_funder ?? []) : [];
      const fNames = funders
        .filter((f: { id: string; title?: string }) => f.id !== "missing")
        .map((f: { id: string; title?: string }) => resolveOrgTitle(f.id, f.title, nodeById))
        .filter(Boolean)
        .join(", ");
      return fNames
        ? <span className="block truncate text-sm" title={fNames}>{fNames}</span>
        : DASH;
    }

    case "author": {
      const authors = "author" in data ? (data.author ?? []) : [];
      const aNames = authors
        .filter((a: { id?: string; title?: string }) => a.id !== "missing")
        .map((a: { id?: string; title?: string }) => a.title ?? (a.id ? resolveOrgTitle(a.id, undefined, nodeById) : null))
        .filter(Boolean)
        .join(", ");
      return aNames
        ? <span className="block truncate text-sm" title={aNames}>{aNames}</span>
        : DASH;
    }

    case "email": {
      let emailVal: string | null = null;
      if (data.type === "node--person") emailVal = data.email ?? null;
      else if (data.type === "node--software_application") emailVal = data.schema_email ?? null;
      return emailVal
        ? <a href={`mailto:${emailVal}`} className="link link-primary text-sm truncate block" title={emailVal} onClick={e => e.stopPropagation()}>{emailVal}</a>
        : DASH;
    }

    case "links": {
      const links: string[] = [...(data.link ?? [])];
      if (data.type === "node--person" && data.significant_link)
        links.push(...data.significant_link.map(l => l.uri).filter(Boolean));
      if (links.length === 0) return DASH;
      return (
        <div className="flex flex-wrap gap-1">
          {links.slice(0, 3).map((url, i) => {
            let display = url;
            try { display = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch {}
            return (
              <a key={i} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                className="badge badge-sm badge-outline hover:badge-primary"
                style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={url} onClick={e => e.stopPropagation()}>↗ {display}</a>
            );
          })}
          {links.length > 3 && <span className="badge badge-sm badge-ghost opacity-60">+{links.length - 3}</span>}
        </div>
      );
    }

    default: return DASH;
  }
}

// ─── FilterDropdown (contrôlé — un seul ouvert à la fois) ─────────────────────

function FilterDropdown({ label, options, selected, onChange, fill, filterKey, openKey, setOpenKey, glass = true, counts }: {
  label: string; options: string[]; selected: Set<string>;
  onChange: (next: Set<string>) => void; fill?: string;
  filterKey: string; openKey: string | null; setOpenKey: (k: string | null) => void;
  glass?: boolean; counts?: Map<string, number>;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const isOpen = openKey === filterKey;

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Clamp left position so the dropdown doesn't overflow the viewport on mobile
      const maxLeft = window.innerWidth - 220; // min-w-52 ≈ 208px + margin
      setPos({ top: rect.bottom + 4, left: Math.max(4, Math.min(rect.left, maxLeft)) });
    }
  }, [isOpen]);

  if (options.length === 0) return null;
  const toggle = () => setOpenKey(isOpen ? null : filterKey);
  const panelBg = glass
    ? "bg-base-100/75 backdrop-blur-xl border border-base-300/40"
    : "bg-base-100 border border-base-300";
  return (
    <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        className={`btn btn-xs gap-1 whitespace-nowrap ${selected.size > 0 ? "btn-primary" : "btn-ghost border border-base-300"}`}
        onClick={toggle}
      >
        {fill && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />}
        {label}
        {selected.size > 0 && <span className="badge badge-xs badge-neutral">{selected.size}</span>}
        <span className="opacity-40 text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && createPortal(
        <div
          className={`fixed z-[2000] rounded-xl shadow-xl min-w-52 max-h-72 overflow-hidden p-1.5 ${panelBg}`}
          style={{ top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          <div className="overflow-y-auto overscroll-contain max-h-[calc(18rem-0.75rem)] flex flex-col gap-0.5">
            <button className="text-xs text-left px-2 py-1 rounded hover:bg-base-200/60 text-base-content/50"
              onClick={() => { onChange(new Set()); setOpenKey(null); }}>Effacer</button>
            <div className="divider my-0.5" />
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200/60">
                <input type="checkbox" className="checkbox checkbox-xs" checked={selected.has(opt)}
                  onChange={() => { const n = new Set(selected); n.has(opt) ? n.delete(opt) : n.add(opt); onChange(n); }} />
                <span className="text-sm flex-1">{opt}</span>
                {counts && <span className="text-xs text-base-content/40 tabular-nums">{counts.get(opt) ?? 0}</span>}
              </label>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const VALID_TABS = new Set(["graph", "cards", "table", "map"] as const);
type TabKey = "graph" | "cards" | "table" | "map";

export function DiagramRoot({ nodes, edges }: DiagramRootProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchQuery = searchParams.get("q") ?? "";
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  /** Glassmorphism enabled everywhere except geomap dark mode.
   *  Default to true before mount to avoid hydration mismatch (resolvedTheme is undefined on server). */
  const mapGlass = mounted ? resolvedTheme !== "dark" : true;

  const [selectedNode, setSelectedNode] = useState<MyGraphNode | undefined>(undefined);

  // Tab state driven by URL query param ?tab=
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = rawTab && VALID_TABS.has(rawTab as TabKey) ? (rawTab as TabKey) : "graph";
  const setActiveTab = useCallback((tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "graph") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);
  const [fType, setFType] = useState<Set<string>>(new Set());

  // Filtres avancés — partagés entre graphe et tableau
  const [fCouverture,  setFCouverture]  = useState<Set<string>>(new Set());
  const [fOrgType,     setFOrgType]     = useState<Set<string>>(new Set());
  const [fAxeRsn,      setFAxeRsn]      = useState<Set<string>>(new Set());
  const [fDomain,      setFDomain]      = useState<Set<string>>(new Set());
  const [fDigital,     setFDigital]     = useState<Set<string>>(new Set());
  const [fLicence,     setFLicence]     = useState<Set<string>>(new Set());
  const [fAcces,       setFAcces]       = useState<Set<string>>(new Set());
  const [fPersonType,  setFPersonType]  = useState<Set<string>>(new Set());

  // Filtre types d'entités pour la géomap (vide = tout montrer)

  // Filtre arêtes graphe
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState<Set<string>>(DEFAULT_ENABLED_EDGES);
  const [edgeDropdownOpen, setEdgeDropdownOpen] = useState(false);

  // Clé du FilterDropdown ouvert (un seul à la fois)
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  // Hydration guard for theme-dependent classNames
  useEffect(() => { setMounted(true); }, []);

  // ── Lookup id → node (pour résoudre les UUIDs en titres) ─────────────────
  const nodeById = useMemo(() => {
    const m = new Map<string, MyGraphNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  // ── Options filtres + compteurs (computed from all nodes) ───────────────
  const filterOptions = useMemo(() => {
    const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

    const entityType = new Map<string, number>(), couverture = new Map<string, number>(),
          orgType = new Map<string, number>(), axeRsn = new Map<string, number>(),
          domain = new Map<string, number>(), digital = new Map<string, number>(),
          licence = new Map<string, number>(), acces = new Map<string, number>(),
          personType = new Map<string, number>();

    nodes.forEach(n => {
      const d = n.data as GraphNodeData;
      const typeLabel = TYPE_LABELS[d.type];
      if (typeLabel) inc(entityType, typeLabel);
      if (d.type === "node--organization" || d.type === "node--government_organization") {
        d.field_couverture_geographique?.forEach(t => inc(couverture, t.name));
        if (d.schema_organization_type) inc(orgType, ORG_TYPE_LABELS[d.schema_organization_type] ?? d.schema_organization_type);
      }
      if (d.type === "node--person") {
        if (d.field_axe_si_membre_rsn) inc(axeRsn, d.field_axe_si_membre_rsn.name);
        d.field_digital_domain?.forEach(t => inc(digital, t.name));
        if (d.field_person_type) inc(personType, d.field_person_type.name);
      }
      if ("field_applied_domain" in d) d.field_applied_domain?.forEach(t => inc(domain, t.name));
      if ("field_licence" in d && d.field_licence) inc(licence, d.field_licence.name);
      if ("field_modele_acces" in d && d.field_modele_acces) inc(acces, d.field_modele_acces.name);
    });

    const sorted = (m: Map<string, number>) => [...m.keys()].sort();
    return {
      entityType: sorted(entityType), couverture: sorted(couverture), orgType: sorted(orgType),
      axeRsn: sorted(axeRsn), domain: sorted(domain),
      digital: sorted(digital), licence: sorted(licence), acces: sorted(acces),
      personType: sorted(personType),
      // Count maps
      counts: { entityType, couverture, orgType, axeRsn, domain, digital, licence, acces, personType },
    };
  }, [nodes]);

  // ── Filtre par type ───────────────────────────────────────────────────────
  const typeFilteredNodes = useMemo(() =>
    fType.size === 0 ? nodes : nodes.filter(n => {
      const label = TYPE_LABELS[n.data?.type ?? ""];
      return label !== undefined && fType.has(label);
    }),
    [nodes, fType]);

  // ── Filtres avancés (shared graph + table) ────────────────────────────────
  // Apply faceted filters sequentially. Each active filter narrows the result set.
  // Filters are type-aware: e.g., couverture only applies to organizations,
  // axeRsn only to persons. Nodes that don't match the filter's target type
  // are excluded when that filter is active.
  const advancedFilteredNodes = useMemo(() => {
    let r = typeFilteredNodes;
    if (fCouverture.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      if (d.type !== "node--organization" && d.type !== "node--government_organization") return false;
      return d.field_couverture_geographique?.some(t => fCouverture.has(t.name));
    });
    if (fOrgType.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      if (d.type !== "node--organization" && d.type !== "node--government_organization") return false;
      const lbl = d.schema_organization_type
        ? (ORG_TYPE_LABELS[d.schema_organization_type] ?? d.schema_organization_type) : "";
      return fOrgType.has(lbl);
    });
    if (fAxeRsn.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      return d.type === "node--person" && d.field_axe_si_membre_rsn && fAxeRsn.has(d.field_axe_si_membre_rsn.name);
    });
    if (fDomain.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      return "field_applied_domain" in d && d.field_applied_domain?.some(t => fDomain.has(t.name));
    });
    if (fDigital.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      return d.type === "node--person" && d.field_digital_domain?.some(t => fDigital.has(t.name));
    });
    if (fLicence.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      return "field_licence" in d && d.field_licence && fLicence.has(d.field_licence.name);
    });
    if (fAcces.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      return "field_modele_acces" in d && d.field_modele_acces && fAcces.has(d.field_modele_acces.name);
    });
    if (fPersonType.size > 0) r = r.filter(n => {
      const d = n.data as GraphNodeData;
      return d.type === "node--person" && d.field_person_type && fPersonType.has(d.field_person_type.name);
    });
    return r;
  }, [typeFilteredNodes, fCouverture, fOrgType, fAxeRsn, fDomain, fDigital, fLicence, fAcces, fPersonType]);

  // ── Tableau : recherche textuelle sur les nœuds avancés filtrés + tri A→Z ──
  const tableNodes = useMemo(() => {
    let result = advancedFilteredNodes;
    if (searchQuery.trim()) {
      const q = removeAccents(searchQuery.toLowerCase().trim());
      result = result.filter(n => {
        if (n.data?.tag.some(t => removeAccents(t.toLowerCase()).includes(q))) return true;
        if (removeAccents((n.data?.title ?? n.label ?? "").toLowerCase()).includes(q)) return true;
        // Recherche par alias
        const d = n.data as GraphNodeData;
        const aliases = "alternate_name" in d ? (d.alternate_name ?? []) : [];
        if (aliases.some(a => removeAccents(a.toLowerCase()).includes(q))) return true;
        return false;
      });
    }
    return [...result].sort((a, b) => {
      const titleA = (a.data?.title ?? a.label ?? "").toLowerCase();
      const titleB = (b.data?.title ?? b.label ?? "").toLowerCase();
      return titleA.localeCompare(titleB, "fr");
    });
  }, [advancedFilteredNodes, searchQuery]);

  // ── Cartes : même recherche textuelle que le tableau ─────────────────────
  const cardNodes = useMemo(() => {
    if (!searchQuery.trim()) return advancedFilteredNodes;
    const q = removeAccents(searchQuery.toLowerCase().trim());
    return advancedFilteredNodes.filter(n => {
      if (n.data?.tag.some(t => removeAccents(t.toLowerCase()).includes(q))) return true;
      if (removeAccents((n.data?.title ?? n.label ?? "").toLowerCase()).includes(q)) return true;
      const d = n.data as GraphNodeData;
      const aliases = "alternate_name" in d ? (d.alternate_name ?? []) : [];
      if (aliases.some(a => removeAccents(a.toLowerCase()).includes(q))) return true;
      return false;
    });
  }, [advancedFilteredNodes, searchQuery]);

  const singleTypeKey = fType.size === 1
    ? Object.entries(TYPE_LABELS).find(([, v]) => v === [...fType][0])?.[0]
    : undefined;
  const visibleCols: ColKey[] = singleTypeKey ? (COLS_BY_TYPE[singleTypeKey] ?? COLS_BY_TYPE.all) : COLS_BY_TYPE.all;

  // ── Arêtes filtrées (graphe) ──────────────────────────────────────────────
  const nodeTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    nodes.forEach(n => m.set(n.id, n.data?.type ?? ""));
    return m;
  }, [nodes]);

  const advancedNodeIds = useMemo(() => new Set(advancedFilteredNodes.map(n => n.id)), [advancedFilteredNodes]);

  const filteredEdges = useMemo(() => edges.filter(e => {
    const st = nodeTypeMap.get(e.source) ?? "";
    const tt = nodeTypeMap.get(e.target) ?? "";
    return enabledEdgeTypes.has(st) && enabledEdgeTypes.has(tt)
      && advancedNodeIds.has(e.source) && advancedNodeIds.has(e.target);
  }), [edges, nodeTypeMap, enabledEdgeTypes, advancedNodeIds]);

  // Comptages
  const counts = {
    orgs:     nodes.filter(n => n.data?.type === "node--organization").length,
    gouvOrgs: nodes.filter(n => n.data?.type === "node--government_organization").length,
    persons:  nodes.filter(n => n.data?.type === "node--person").length,
    datasets: nodes.filter(n => n.data?.type === "node--dataset" || n.data?.type === "node--data_catalog").length,
    apps:     nodes.filter(n => n.data?.type === "node--software_application").length,
  };

  const toggleEdgeGroup = (types: string[]) => {
    const allOn = types.every(t => enabledEdgeTypes.has(t));
    const next = new Set(enabledEdgeTypes);
    allOn ? types.forEach(t => next.delete(t)) : types.forEach(t => next.add(t));
    setEnabledEdgeTypes(next);
  };

  const hiddenEdgeCount = EDGE_FILTER_OPTIONS.filter(opt => !opt.types.every(t => enabledEdgeTypes.has(t))).length;
  const advFilterCount  = fType.size + fCouverture.size + fOrgType.size + fAxeRsn.size + fDomain.size + fDigital.size + fLicence.size + fAcces.size + fPersonType.size;

  const clearAdv = () => {
    setFType(new Set()); setFCouverture(new Set()); setFOrgType(new Set()); setFAxeRsn(new Set());
    setFDomain(new Set()); setFDigital(new Set()); setFLicence(new Set()); setFAcces(new Set());
    setFPersonType(new Set());
  };

  // Raccourci compteurs filtres
  const fc = filterOptions.counts;

  // Ferme tous les dropdowns flottants sur click extérieur
  const closeDropdowns = () => { setEdgeDropdownOpen(false); setOpenFilterKey(null); };

  return (
    <div className="flex flex-col h-full relative" onClick={closeDropdowns}>

      {/* ── Onglets + stats compactes ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 md:px-4 bg-base-100 border-b border-base-300 flex-shrink-0">
        <div className="tabs tabs-border">
          {(["graph", "cards", "table", "map"] as const).map(tab => (
            <button key={tab} className={`tab gap-1 md:gap-1.5 text-xs md:text-sm ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "cards" && <svg className="w-3.5 h-3.5 md:w-[15px] md:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/></svg>}
              {tab === "graph" && <svg className="w-3.5 h-3.5 md:w-[15px] md:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><line x1="8.5" y1="7.5" x2="15.5" y2="16.5"/><line x1="15.5" y1="7.5" x2="8.5" y2="16.5"/></svg>}
              {tab === "table" && <svg className="w-3.5 h-3.5 md:w-[15px] md:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>}
              {tab === "map" && <svg className="w-3.5 h-3.5 md:w-[15px] md:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              <span className="hidden sm:inline">{tab === "cards" ? "Galerie" : tab === "graph" ? "Graphe" : tab === "table" ? "Tableau" : "Carte"}</span>
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-base-content/60 py-2">
          {[
            { count: counts.orgs,     fill: "#0061AF", label: "org." },
            { count: counts.gouvOrgs, fill: "#8C8C8C", label: "gouv." },
            { count: counts.persons,  fill: "#00A759", label: "pers." },
            { count: counts.datasets, fill: "#FFCC4E", label: "données" },
            { count: counts.apps,     fill: "#EE3124", label: "apps" },
          ].map(({ count, fill, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
              <span className="text-base-content font-medium">{count}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>


      {/* ── Vue cartes — bannières sticky avec glassmorphism ──────────────── */}
      {activeTab === "cards" && (
        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10">
            <div className="relative z-[50] flex items-center gap-2 px-2 md:px-4 py-2 border-b border-base-300/40 bg-base-200/45 backdrop-blur-xl flex-shrink-0 overflow-x-auto" onClick={e => e.stopPropagation()}>
              <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider mr-1 flex-shrink-0">Filtrer</span>
              <FilterDropdown label="Type d'entité"       options={filterOptions.entityType} selected={fType}       onChange={setFType}       counts={fc.entityType}       filterKey="cards-type"       openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Couverture géo."     options={filterOptions.couverture} selected={fCouverture} onChange={setFCouverture} counts={fc.couverture} filterKey="cards-couverture" openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Type d'org."         options={filterOptions.orgType}    selected={fOrgType}    onChange={setFOrgType}    counts={fc.orgType}    filterKey="cards-orgType"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Axe RSN"             options={filterOptions.axeRsn}     selected={fAxeRsn}     onChange={setFAxeRsn}    counts={fc.axeRsn}    filterKey="cards-axeRsn"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <FilterDropdown label="Domaine de santé"    options={filterOptions.domain}     selected={fDomain}     onChange={setFDomain}    counts={fc.domain}    filterKey="cards-domain"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <FilterDropdown label="Méthodes numériques" options={filterOptions.digital}    selected={fDigital}    onChange={setFDigital}   counts={fc.digital}   filterKey="cards-digital"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <FilterDropdown label="Licence"             options={filterOptions.licence}    selected={fLicence}    onChange={setFLicence}   counts={fc.licence}   filterKey="cards-licence"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Modèle d'accès"      options={filterOptions.acces}      selected={fAcces}      onChange={setFAcces}     counts={fc.acces}     filterKey="cards-acces"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Type de personne"    options={filterOptions.personType} selected={fPersonType} onChange={setFPersonType} counts={fc.personType} filterKey="cards-personType" openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <span className="ml-auto text-xs text-base-content/50 flex-shrink-0">
                {advancedFilteredNodes.length} nœud{advancedFilteredNodes.length !== 1 ? "s" : ""}
              </span>
              {advFilterCount > 0 && (
                <button className="btn btn-xs btn-ghost text-error flex-shrink-0" onClick={clearAdv}>✕ Effacer</button>
              )}
            </div>
          </div>
          <CardGridView nodes={cardNodes} nodeById={nodeById} />
        </div>
      )}

      {/* ── Vue graphe — bannières glass + graphe en dessous ────────────────── */}
      {activeTab === "graph" && (
        <>
          <div className="relative z-[50] flex items-center gap-2 px-2 md:px-4 py-2 border-b border-base-300/40 bg-base-200/45 backdrop-blur-xl flex-shrink-0 overflow-x-auto" onClick={e => e.stopPropagation()}>
            <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider mr-1 flex-shrink-0">Filtrer</span>
            <FilterDropdown label="Type d'entité"       options={filterOptions.entityType} selected={fType}       onChange={setFType}       counts={fc.entityType}       filterKey="graph-type"       openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Couverture géo."     options={filterOptions.couverture} selected={fCouverture} onChange={setFCouverture} counts={fc.couverture} filterKey="graph-couverture" openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Type d'org."         options={filterOptions.orgType}    selected={fOrgType}    onChange={setFOrgType}    counts={fc.orgType}    filterKey="graph-orgType"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Axe RSN"             options={filterOptions.axeRsn}     selected={fAxeRsn}     onChange={setFAxeRsn}    counts={fc.axeRsn}    filterKey="graph-axeRsn"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <FilterDropdown label="Domaine de santé"    options={filterOptions.domain}     selected={fDomain}     onChange={setFDomain}    counts={fc.domain}    filterKey="graph-domain"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <FilterDropdown label="Méthodes numériques" options={filterOptions.digital}    selected={fDigital}    onChange={setFDigital}   counts={fc.digital}   filterKey="graph-digital"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <FilterDropdown label="Licence"             options={filterOptions.licence}    selected={fLicence}    onChange={setFLicence}   counts={fc.licence}   filterKey="graph-licence"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Modèle d'accès"      options={filterOptions.acces}      selected={fAcces}      onChange={setFAcces}     counts={fc.acces}     filterKey="graph-acces"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Type de personne"    options={filterOptions.personType} selected={fPersonType} onChange={setFPersonType} counts={fc.personType} filterKey="graph-personType" openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <span className="ml-auto text-xs text-base-content/50 flex-shrink-0">
              {advancedFilteredNodes.length} nœud{advancedFilteredNodes.length !== 1 ? "s" : ""}
            </span>
            {advFilterCount > 0 && (
              <button className="btn btn-xs btn-ghost text-error flex-shrink-0" onClick={clearAdv}>✕ Effacer</button>
            )}
          </div>

          <div className="relative flex-1">
            {/* Bouton filtre connexions */}
            <div className="absolute z-20 left-2 md:left-4 top-2 md:top-4" onClick={e => e.stopPropagation()}>
              <button
                className={`btn btn-xs md:btn-sm gap-1.5 ${hiddenEdgeCount > 0 ? "btn-warning btn-outline" : "btn-ghost border border-base-300"}`}
                onClick={() => { setEdgeDropdownOpen(v => !v); setOpenFilterKey(null); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-2.93 7.07M4.93 4.93A10 10 0 0 0 3 12a10 10 0 0 0 1.93 7.07" />
                </svg>
                <span className="hidden sm:inline">Connexions</span>
                {hiddenEdgeCount > 0 && <span className="badge badge-warning badge-sm">{hiddenEdgeCount} masqué{hiddenEdgeCount > 1 ? "s" : ""}</span>}
              </button>
              {edgeDropdownOpen && (
                <div className="mt-1 bg-base-100/75 backdrop-blur-xl border border-base-300/40 rounded-xl shadow-xl w-58 p-2 flex flex-col gap-0.5">
                  <p className="text-xs text-base-content/50 px-2 pt-1 pb-0.5 font-medium uppercase tracking-wider">Afficher les connexions</p>
                  {EDGE_FILTER_OPTIONS.map(opt => {
                    const checked = opt.types.every(t => enabledEdgeTypes.has(t));
                    return (
                      <label key={opt.types[0]} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200">
                        <input type="checkbox" className="checkbox checkbox-xs" checked={checked} onChange={() => toggleEdgeGroup(opt.types)} />
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.fill }} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panneau détail */}
            <div className="absolute z-10 inset-x-2 bottom-2 top-auto max-h-[60vh] md:inset-x-auto md:right-12 md:top-4 md:bottom-4 md:max-h-none overflow-hidden">
              {selectedNode && <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />}
            </div>

            <MyDiagram
              nodes={advancedFilteredNodes}
              edges={filteredEdges}
              onNodeClick={data => setSelectedNode(data as MyGraphNode)}
            />
          </div>
        </>
      )}

      {/* ── Vue géographique — toujours montée ──────────────────────────────── */}
      {/* Toujours monté, visibility:hidden au lieu de display:none pour que
           Leaflet ait toujours des dimensions valides (résout les bugs de tiles grises). */}
      <div className={activeTab === "map"
        ? "flex flex-col flex-1 overflow-hidden"
        : "flex flex-col overflow-hidden absolute inset-0 invisible pointer-events-none"
      }>
        {/* Bannière filtres géomap */}
        <div className={`flex items-center gap-2 px-2 md:px-4 py-2 border-b flex-shrink-0 overflow-x-auto relative z-[401] ${mapGlass ? "border-base-300/40 bg-base-200/45 backdrop-blur-xl" : "border-base-300 bg-base-200"}`} onClick={e => e.stopPropagation()}>
          <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider mr-1 flex-shrink-0">Filtrer</span>
          <FilterDropdown label="Axe RSN"             options={filterOptions.axeRsn}      selected={fAxeRsn}      onChange={setFAxeRsn}     counts={fc.axeRsn}     filterKey="map-axeRsn"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" glass={mapGlass} />
          <FilterDropdown label="Domaine de santé"    options={filterOptions.domain}      selected={fDomain}      onChange={setFDomain}     counts={fc.domain}     filterKey="map-domain"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" glass={mapGlass} />
          <FilterDropdown label="Méthodes numériques" options={filterOptions.digital}     selected={fDigital}     onChange={setFDigital}    counts={fc.digital}    filterKey="map-digital"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" glass={mapGlass} />
          <FilterDropdown label="Type de personne"    options={filterOptions.personType}  selected={fPersonType}  onChange={setFPersonType} counts={fc.personType} filterKey="map-personType" openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" glass={mapGlass} />
          {(fAxeRsn.size + fDomain.size + fDigital.size + fPersonType.size) > 0 && (
            <button className="btn btn-xs btn-ghost text-error" onClick={() => { setFAxeRsn(new Set()); setFDomain(new Set()); setFDigital(new Set()); setFPersonType(new Set()); }}>✕ Effacer</button>
          )}
        </div>
        {/* Tous les nodes passés à MapView pour ne pas relancer le géocodage.
            Les filtres sont appliqués visuellement dans MapContent. */}
        <div className="relative flex flex-1 overflow-hidden">
          <MapView
            nodes={nodes}
            edges={edges}
            onSelectNode={node => setSelectedNode(node)}
            selectedNode={selectedNode}
            visible={activeTab === "map"}
            fOrgType={fOrgType}
            fCouverture={fCouverture}
            fAxeRsn={fAxeRsn}
            fDomain={fDomain}
            fDigital={fDigital}
            fPersonType={fPersonType}
          />
          <div className="absolute z-[1000] inset-x-2 bottom-2 top-auto max-h-[60vh] md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:max-h-none overflow-hidden">
            {selectedNode && <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} glass={mapGlass} />}
          </div>
        </div>
      </div>

      {/* ── Vue tabulaire ────────────────────────────────────────────────────── */}
      {activeTab === "table" && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Filtres avancés tableau */}
          <div className="relative z-[50] flex items-center gap-2 px-2 md:px-4 py-2 border-b border-base-300/40 bg-base-200/45 backdrop-blur-xl flex-shrink-0 overflow-x-auto" onClick={e => e.stopPropagation()}>
            <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider mr-1 flex-shrink-0">Filtrer</span>
            <FilterDropdown label="Type d'entité"       options={filterOptions.entityType} selected={fType}       onChange={setFType}       counts={fc.entityType}       filterKey="table-type"       openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Couverture géo."     options={filterOptions.couverture} selected={fCouverture} onChange={setFCouverture} counts={fc.couverture} filterKey="table-couverture" openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Type d'org."         options={filterOptions.orgType}    selected={fOrgType}    onChange={setFOrgType}    counts={fc.orgType}    filterKey="table-orgType"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Axe RSN"             options={filterOptions.axeRsn}     selected={fAxeRsn}     onChange={setFAxeRsn}    counts={fc.axeRsn}    filterKey="table-axeRsn"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <FilterDropdown label="Domaine de santé"    options={filterOptions.domain}     selected={fDomain}     onChange={setFDomain}    counts={fc.domain}    filterKey="table-domain"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <FilterDropdown label="Méthodes numériques" options={filterOptions.digital}    selected={fDigital}    onChange={setFDigital}   counts={fc.digital}   filterKey="table-digital"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <FilterDropdown label="Licence"             options={filterOptions.licence}    selected={fLicence}    onChange={setFLicence}   counts={fc.licence}   filterKey="table-licence"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Modèle d'accès"      options={filterOptions.acces}      selected={fAcces}      onChange={setFAcces}     counts={fc.acces}     filterKey="table-acces"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
            <FilterDropdown label="Type de personne"    options={filterOptions.personType} selected={fPersonType} onChange={setFPersonType} counts={fc.personType} filterKey="table-personType" openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
            <span className="ml-auto text-xs text-base-content/50 flex-shrink-0">
              {tableNodes.length} résultat{tableNodes.length !== 1 ? "s" : ""}
              {searchQuery && <span className="ml-1 text-primary">· « {searchQuery} »</span>}
            </span>
            {advFilterCount > 0 && (
              <button className="btn btn-xs btn-ghost text-error flex-shrink-0" onClick={clearAdv}>✕ Effacer</button>
            )}
          </div>

          {/* Tableau + DetailCard côte à côte — relative container starts BELOW filters */}
          <div className="relative flex flex-1 overflow-hidden">
            <div className="overflow-auto flex-1">
              <table className="table table-zebra table-sm text-xs md:text-sm" style={{ minWidth: "max-content", width: "100%" }}>
                <thead className="sticky top-0 bg-base-200 z-10">
                  <tr>
                    <th className="sticky left-0 bg-base-200 z-20" style={{ minWidth: "140px" }}>Nom</th>
                    <th style={{ minWidth: "100px" }}>Type</th>
                    {visibleCols.map(col => (
                      <th key={col} style={{ minWidth: COL_MIN_W[col] }}>{COL_HEADERS[col]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableNodes.length === 0 ? (
                    <tr><td colSpan={2 + visibleCols.length} className="text-center text-base-content/40 py-12">Aucun résultat</td></tr>
                  ) : (
                    tableNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <tr key={node.id}
                          className={`cursor-pointer hover ${isSelected ? "bg-base-300" : ""}`}
                          onClick={() => setSelectedNode(isSelected ? undefined : node)}>
                          <td className="sticky left-0 bg-inherit font-medium"
                            style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            title={node.data?.title ?? node.label}>
                            {node.data?.title ?? node.label}
                          </td>
                          <td>
                            <span className="badge badge-sm whitespace-nowrap"
                              style={{ backgroundColor: node.fill ?? "#888", color: getTextColor(node.fill), border: "none" }}>
                              {TYPE_LABELS[node.data?.type ?? ""] ?? "—"}
                            </span>
                          </td>
                          {visibleCols.map(col => (
                            <td key={col} className="align-middle">{cellContent(node, col, nodeById)}</td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="absolute z-10 inset-x-2 bottom-2 top-auto max-h-[60vh] md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:max-h-none overflow-hidden">
              {selectedNode && <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
