"use client";

import { GraphEdge } from "reagraph";
import { MyDiagram } from "./Reagraph";
import { DetailCardRoot } from "./DetailCard/DetailCardRoot";
import { MapView } from "./MapView";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";

interface DiagramRootProps {
  nodes: MyGraphNode[];
  edges: GraphEdge[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  "node--organization":            "Organisation",
  "node--government_organization": "Org. gouvernementale",
  "node--person":                  "Personne",
  "node--dataset":                 "Jeu de données",
  "node--data_catalog":            "Catalogue de données",
  "node--software_application":    "Application",
};

const NODE_FILL: Record<string, string> = {
  "node--organization":            "#0061AF",
  "node--government_organization": "#64748b",
  "node--person":                  "#00A759",
  "node--dataset":                 "#FFCC4E",
  "node--data_catalog":            "#FFCC4E",
  "node--software_application":    "#EE3124",
};

const ORG_TYPE_LABELS: Record<string, string> = {
  consortium:              "Regroupement de recherche",
  college_or_university:   "Collège ou université",
  funding_scheme:          "Programme de financement",
  government_organization: "Organisation gouvernementale",
  hospital:                "Hôpital",
  autre:                   "Autre",
};

const EDGE_FILTER_OPTIONS = [
  { types: ["node--organization"],                    label: "Organisations",        fill: "#0061AF" },
  { types: ["node--government_organization"],         label: "Org. gouvernementales", fill: "#64748b" },
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
  | "subtype" | "parentOrg" | "localisation" | "couverture"
  | "axeRsn" | "santeDomain" | "digitalDomain" | "licence" | "acces" | "links";

const COL_HEADERS: Record<ColKey, string> = {
  subtype: "Sous-type / Catégorie", parentOrg: "Appartenance / Org. parente",
  localisation: "Localisation", couverture: "Couverture géo.",
  axeRsn: "Axe RSN", santeDomain: "Domaine de santé",
  digitalDomain: "Méthodes numériques", licence: "Licence",
  acces: "Modèle d'accès", links: "Liens",
};

const COL_MIN_W: Record<ColKey, string> = {
  subtype: "160px", parentOrg: "180px", localisation: "140px", couverture: "130px",
  axeRsn: "130px", santeDomain: "180px", digitalDomain: "180px",
  licence: "130px", acces: "140px", links: "180px",
};

const COLS_BY_TYPE: Record<string, ColKey[]> = {
  all:                             ["subtype","parentOrg","localisation","couverture","axeRsn","santeDomain","digitalDomain","licence","acces","links"],
  "node--organization":            ["subtype","localisation","couverture","links"],
  "node--government_organization": ["subtype","localisation","couverture","links"],
  "node--person":                  ["subtype","parentOrg","axeRsn","santeDomain","digitalDomain","links"],
  "node--dataset":                 ["parentOrg","santeDomain","licence","acces","links"],
  "node--data_catalog":            ["parentOrg","santeDomain","licence","acces","links"],
  "node--software_application":    ["subtype","parentOrg","santeDomain","licence","acces","links"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function removeAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

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

function cellContent(node: MyGraphNode, col: ColKey, nodeById: Map<string, MyGraphNode>): React.ReactNode {
  const data = node.data as GraphNodeData;
  const fill = node.fill ?? "#888";

  switch (col) {
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

function FilterDropdown({ label, options, selected, onChange, fill, filterKey, openKey, setOpenKey }: {
  label: string; options: string[]; selected: Set<string>;
  onChange: (next: Set<string>) => void; fill?: string;
  filterKey: string; openKey: string | null; setOpenKey: (k: string | null) => void;
}) {
  if (options.length === 0) return null;
  const isOpen = openKey === filterKey;
  const toggle = () => setOpenKey(isOpen ? null : filterKey);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        className={`btn btn-xs gap-1 ${selected.size > 0 ? "btn-primary" : "btn-ghost border border-base-300"}`}
        onClick={toggle}
      >
        {fill && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />}
        {label}
        {selected.size > 0 && <span className="badge badge-xs badge-neutral">{selected.size}</span>}
        <span className="opacity-40 text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-[2000] bg-base-100 border border-base-300 rounded-xl shadow-xl min-w-52 max-h-72 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          <button className="text-xs text-left px-2 py-1 rounded hover:bg-base-200 text-base-content/50"
            onClick={() => { onChange(new Set()); setOpenKey(null); }}>Effacer</button>
          <div className="divider my-0.5" />
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-base-200">
              <input type="checkbox" className="checkbox checkbox-xs" checked={selected.has(opt)}
                onChange={() => { const n = new Set(selected); n.has(opt) ? n.delete(opt) : n.add(opt); onChange(n); }} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TypeFilterBar ────────────────────────────────────────────────────────────

function TypeFilterBar({ nodes, typeFilter, onChange }: {
  nodes: MyGraphNode[]; typeFilter: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 bg-base-50 flex-shrink-0 flex-wrap">
      <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider">Type</span>
      <button className={`btn btn-xs ${typeFilter === "all" ? "btn-primary" : "btn-ghost"}`}
        onClick={() => onChange("all")}>Tous ({nodes.length})</button>
      {Object.entries(TYPE_LABELS).map(([type, label]) => {
        const count = nodes.filter(n => n.data?.type === type).length;
        if (count === 0) return null;
        const active = typeFilter === type;
        const fill = NODE_FILL[type];
        return (
          <button key={type}
            className="btn btn-xs gap-1.5 transition-all"
            style={active
              ? { backgroundColor: fill, borderColor: fill, color: getTextColor(fill) }
              : { background: "transparent", borderColor: "transparent", opacity: 0.75 }}
            onClick={() => onChange(active ? "all" : type)}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function DiagramRoot({ nodes, edges }: DiagramRootProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const [selectedNode, setSelectedNode] = useState<MyGraphNode | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"graph" | "table" | "map">("graph");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Filtres avancés — partagés entre graphe et tableau
  const [fCouverture, setFCouverture] = useState<Set<string>>(new Set());
  const [fOrgType,    setFOrgType]    = useState<Set<string>>(new Set());
  const [fAxeRsn,     setFAxeRsn]     = useState<Set<string>>(new Set());
  const [fDomain,     setFDomain]     = useState<Set<string>>(new Set());
  const [fDigital,    setFDigital]    = useState<Set<string>>(new Set());
  const [fLicence,    setFLicence]    = useState<Set<string>>(new Set());
  const [fAcces,      setFAcces]      = useState<Set<string>>(new Set());

  // Filtre arêtes graphe
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState<Set<string>>(DEFAULT_ENABLED_EDGES);
  const [edgeDropdownOpen, setEdgeDropdownOpen] = useState(false);

  // Clé du FilterDropdown ouvert (un seul à la fois)
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  // ── Lookup id → node (pour résoudre les UUIDs en titres) ─────────────────
  const nodeById = useMemo(() => {
    const m = new Map<string, MyGraphNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  // ── Options filtres (computed from all nodes) ─────────────────────────────
  const filterOptions = useMemo(() => {
    const couverture = new Set<string>(), orgType = new Set<string>(),
          axeRsn = new Set<string>(), domain = new Set<string>(),
          digital = new Set<string>(), licence = new Set<string>(), acces = new Set<string>();
    nodes.forEach(n => {
      const d = n.data as GraphNodeData;
      if (d.type === "node--organization" || d.type === "node--government_organization") {
        d.field_couverture_geographique?.forEach(t => couverture.add(t.name));
        if (d.schema_organization_type) orgType.add(ORG_TYPE_LABELS[d.schema_organization_type] ?? d.schema_organization_type);
      }
      if (d.type === "node--person") {
        if (d.field_axe_si_membre_rsn) axeRsn.add(d.field_axe_si_membre_rsn.name);
        d.field_digital_domain?.forEach(t => digital.add(t.name));
      }
      if ("field_applied_domain" in d) d.field_applied_domain?.forEach(t => domain.add(t.name));
      if ("field_licence" in d && d.field_licence) licence.add(d.field_licence.name);
      if ("field_modele_acces" in d && d.field_modele_acces) acces.add(d.field_modele_acces.name);
    });
    return {
      couverture: [...couverture].sort(), orgType: [...orgType].sort(),
      axeRsn: [...axeRsn].sort(), domain: [...domain].sort(),
      digital: [...digital].sort(), licence: [...licence].sort(), acces: [...acces].sort(),
    };
  }, [nodes]);

  // ── Filtre par type ───────────────────────────────────────────────────────
  const typeFilteredNodes = useMemo(() =>
    typeFilter === "all" ? nodes : nodes.filter(n => n.data?.type === typeFilter),
    [nodes, typeFilter]);

  // ── Filtres avancés (shared graph + table) ────────────────────────────────
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
    return r;
  }, [typeFilteredNodes, fCouverture, fOrgType, fAxeRsn, fDomain, fDigital, fLicence, fAcces]);

  // ── Tableau : recherche textuelle sur les nœuds avancés filtrés ───────────
  const tableNodes = useMemo(() => {
    if (!searchQuery.trim()) return advancedFilteredNodes;
    const q = removeAccents(searchQuery.toLowerCase().trim());
    return advancedFilteredNodes.filter(n =>
      n.data?.tag.some(t => removeAccents(t.toLowerCase()).includes(q)) ||
      removeAccents((n.data?.title ?? n.label ?? "").toLowerCase()).includes(q)
    );
  }, [advancedFilteredNodes, searchQuery]);

  const visibleCols: ColKey[] = COLS_BY_TYPE[typeFilter] ?? COLS_BY_TYPE.all;

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
  const advFilterCount  = fCouverture.size + fOrgType.size + fAxeRsn.size + fDomain.size + fDigital.size + fLicence.size + fAcces.size;

  const clearAdv = () => {
    setFCouverture(new Set()); setFOrgType(new Set()); setFAxeRsn(new Set());
    setFDomain(new Set()); setFDigital(new Set()); setFLicence(new Set()); setFAcces(new Set());
  };

  // Ferme tous les dropdowns flottants sur click extérieur
  const closeDropdowns = () => { setEdgeDropdownOpen(false); setOpenFilterKey(null); };

  return (
    <div className="flex flex-col h-full" onClick={closeDropdowns}>

      {/* ── Onglets + stats ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 bg-base-100 border-b border-base-300 flex-shrink-0">
        <div className="tabs tabs-border">
          {(["graph", "table", "map"] as const).map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "graph" ? "Cartographie" : tab === "table" ? "Vue tabulaire" : "Vue géographique"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-base-content/70 py-2">
          {[
            { count: counts.orgs,     fill: "#0061AF", label: "organisations" },
            { count: counts.gouvOrgs, fill: "#64748b", label: "org. gouv." },
            { count: counts.persons,  fill: "#00A759", label: "personnes" },
            { count: counts.datasets, fill: "#FFCC4E", label: "jeux de données" },
            { count: counts.apps,     fill: "#EE3124", label: "applications" },
          ].map(({ count, fill, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
              <span><strong className="text-base-content">{count}</strong> {label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Barre de filtre de type — graph et table seulement ──────────────── */}
      {activeTab !== "map" && (
        <TypeFilterBar nodes={nodes} typeFilter={typeFilter} onChange={setTypeFilter} />
      )}

      {/* ── Barre de filtres carte ───────────────────────────────────────────── */}
      {activeTab === "map" && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 bg-base-50 flex-shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
          <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider">Filtrer</span>
          <FilterDropdown label="Sous-type d'org." options={filterOptions.orgType}    selected={fOrgType}    onChange={setFOrgType}    filterKey="map-orgType"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
          <FilterDropdown label="Couverture géo."  options={filterOptions.couverture} selected={fCouverture} onChange={setFCouverture} filterKey="map-couverture" openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
          <FilterDropdown label="Axe RSN"          options={filterOptions.axeRsn}     selected={fAxeRsn}     onChange={setFAxeRsn}    filterKey="map-axeRsn"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
          <FilterDropdown label="Domaine de santé" options={filterOptions.domain}     selected={fDomain}     onChange={setFDomain}    filterKey="map-domain"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
          {(fOrgType.size + fCouverture.size + fAxeRsn.size + fDomain.size) > 0 && (
            <button className="btn btn-xs btn-ghost text-error ml-1"
              onClick={() => { setFOrgType(new Set()); setFCouverture(new Set()); setFAxeRsn(new Set()); setFDomain(new Set()); }}>
              ✕ Effacer
            </button>
          )}
        </div>
      )}

      {/* ── Bannière filtres avancés — graph ─────────────────────────────── */}
      {activeTab === "graph" && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 bg-base-50 flex-shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
          <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider mr-1">Filtrer</span>
          <FilterDropdown label="Couverture géo."     options={filterOptions.couverture} selected={fCouverture} onChange={setFCouverture} filterKey="graph-couverture" openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
          <FilterDropdown label="Type d'org."         options={filterOptions.orgType}    selected={fOrgType}    onChange={setFOrgType}    filterKey="graph-orgType"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
          <FilterDropdown label="Axe RSN"             options={filterOptions.axeRsn}     selected={fAxeRsn}     onChange={setFAxeRsn}    filterKey="graph-axeRsn"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
          <FilterDropdown label="Domaine de santé"    options={filterOptions.domain}     selected={fDomain}     onChange={setFDomain}    filterKey="graph-domain"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
          <FilterDropdown label="Méthodes numériques" options={filterOptions.digital}    selected={fDigital}    onChange={setFDigital}   filterKey="graph-digital"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
          <FilterDropdown label="Licence"             options={filterOptions.licence}    selected={fLicence}    onChange={setFLicence}   filterKey="graph-licence"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
          <FilterDropdown label="Modèle d'accès"      options={filterOptions.acces}      selected={fAcces}      onChange={setFAcces}     filterKey="graph-acces"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
          <span className="ml-auto text-xs text-base-content/50">
            {advancedFilteredNodes.length} nœud{advancedFilteredNodes.length !== 1 ? "s" : ""}
          </span>
          {advFilterCount > 0 && (
            <button className="btn btn-xs btn-ghost text-error" onClick={clearAdv}>✕ Effacer</button>
          )}
        </div>
      )}

      {/* ── Vue graphe ──────────────────────────────────────────────────────── */}
      {activeTab === "graph" && (
        <div className="relative flex-1">

          {/* Bouton filtre connexions */}
          <div className="absolute z-20 left-4 top-4" onClick={e => e.stopPropagation()}>
            <button
              className={`btn btn-sm gap-1.5 ${hiddenEdgeCount > 0 ? "btn-warning btn-outline" : "btn-ghost border border-base-300"}`}
              onClick={() => { setEdgeDropdownOpen(v => !v); setOpenFilterKey(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93A10 10 0 0 1 21 12a10 10 0 0 1-2.93 7.07M4.93 4.93A10 10 0 0 0 3 12a10 10 0 0 0 1.93 7.07" />
              </svg>
              Connexions
              {hiddenEdgeCount > 0 && <span className="badge badge-warning badge-sm">{hiddenEdgeCount} masqué{hiddenEdgeCount > 1 ? "s" : ""}</span>}
            </button>
            {edgeDropdownOpen && (
              <div className="mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl w-58 p-2 flex flex-col gap-0.5">
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
          <div className="absolute z-10 right-12 top-4 max-h-[80vh]">
            {selectedNode && <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />}
          </div>

          <MyDiagram
            nodes={advancedFilteredNodes}
            edges={filteredEdges}
            onNodeClick={data => setSelectedNode(data as MyGraphNode)}
          />
        </div>
      )}

      {/* ── Vue géographique — toujours montée ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ display: activeTab === "map" ? "flex" : "none" }}>
        {/* Tous les nodes passés à MapView pour ne pas relancer le géocodage.
            Les filtres (fOrgType, fCouverture, fAxeRsn, fDomain) sont appliqués
            visuellement dans MapContent. */}
        <MapView
          nodes={nodes}
          onSelectNode={node => setSelectedNode(node)}
          selectedNode={selectedNode}
          visible={activeTab === "map"}
          fOrgType={fOrgType}
          fCouverture={fCouverture}
          fAxeRsn={fAxeRsn}
          fDomain={fDomain}
        />
        {selectedNode && (
          <div className="w-[400px] border-l border-base-300 overflow-y-auto bg-base-100 p-4 flex-shrink-0">
            <DetailCardRoot node={selectedNode} onClose={() => setSelectedNode(undefined)} />
          </div>
        )}
      </div>

      {/* ── Vue tabulaire ────────────────────────────────────────────────────── */}
      {activeTab === "table" && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Filtres avancés tableau */}
            <div className="flex items-center gap-2 p-3 border-b border-base-300 bg-base-50 flex-shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
              <span className="text-xs font-medium text-base-content/50 uppercase tracking-wider mr-1">Filtrer</span>
              <FilterDropdown label="Couverture géo."     options={filterOptions.couverture} selected={fCouverture} onChange={setFCouverture} filterKey="table-couverture" openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Type d'org."         options={filterOptions.orgType}    selected={fOrgType}    onChange={setFOrgType}    filterKey="table-orgType"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Axe RSN"             options={filterOptions.axeRsn}     selected={fAxeRsn}     onChange={setFAxeRsn}    filterKey="table-axeRsn"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <FilterDropdown label="Domaine de santé"    options={filterOptions.domain}     selected={fDomain}     onChange={setFDomain}    filterKey="table-domain"    openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <FilterDropdown label="Méthodes numériques" options={filterOptions.digital}    selected={fDigital}    onChange={setFDigital}   filterKey="table-digital"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} fill="#00A759" />
              <FilterDropdown label="Licence"             options={filterOptions.licence}    selected={fLicence}    onChange={setFLicence}   filterKey="table-licence"   openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <FilterDropdown label="Modèle d'accès"      options={filterOptions.acces}      selected={fAcces}      onChange={setFAcces}     filterKey="table-acces"     openKey={openFilterKey} setOpenKey={setOpenFilterKey} />
              <span className="ml-auto text-xs text-base-content/50">
                {tableNodes.length} résultat{tableNodes.length !== 1 ? "s" : ""}
                {searchQuery && <span className="ml-1 text-primary">· « {searchQuery} »</span>}
              </span>
              {advFilterCount > 0 && (
                <button className="btn btn-xs btn-ghost text-error" onClick={clearAdv}>✕ Effacer</button>
              )}
            </div>

            {/* Tableau */}
            <div className="overflow-auto flex-1">
              <table className="table table-zebra table-sm" style={{ minWidth: "max-content", width: "100%" }}>
                <thead className="sticky top-0 bg-base-200 z-10">
                  <tr>
                    <th className="sticky left-0 bg-base-200 z-20" style={{ minWidth: "200px" }}>Nom</th>
                    <th style={{ minWidth: "150px" }}>Type</th>
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
          </div>

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
