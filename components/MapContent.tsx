"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSearchParams } from "next/navigation";
import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";
import { GraphEdge } from "reagraph";

const TYPE_LABELS: Record<string, string> = {
  "node--organization": "Organisation",
  "node--government_organization": "Org. gouvernementale",
  "node--person": "Personne",
  "node--dataset": "Jeu de données",
  "node--data_catalog": "Catalogue de données",
  "node--software_application": "Application",
};

type OrgWithCoords = {
  node: MyGraphNode;
  lat: number;
  lng: number;
  related: MyGraphNode[];
};

interface Address {
  address_line1?: string;
  locality?: string;
  administrative_area?: string;
  postal_code?: string;
  country_code?: string;
}

/** Construit plusieurs requêtes de géocodage du plus précis au plus large */
function buildAddressQueries(address: Address): string[] {
  const country = address.country_code === "CA" ? "Canada" : address.country_code;
  const queries: string[] = [];

  // 1. Adresse complète : rue, ville, province, pays
  const full = [address.address_line1, address.locality, address.administrative_area, country].filter(Boolean);
  if (full.length > 1) queries.push(full.join(", "));

  // 2. Sans la rue : ville, province, pays
  const noStreet = [address.locality, address.administrative_area, country].filter(Boolean);
  if (noStreet.length > 1 && noStreet.join(", ") !== full.join(", "))
    queries.push(noStreet.join(", "));

  // 3. Ville + pays seulement
  if (address.locality && country)
    queries.push(`${address.locality}, ${country}`);

  // 4. Code postal + pays
  if (address.postal_code && country)
    queries.push(`${address.postal_code}, ${country}`);

  return queries;
}

const CACHE_KEY = "rsn_geocode_cache";

function loadCache(): Record<string, { lat: number; lng: number }> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, { lat: number; lng: number }>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function geocode(
  address: Address,
  cache: Record<string, { lat: number; lng: number }>
): Promise<{ lat: number; lng: number } | null> {
  const queries = buildAddressQueries(address);
  if (queries.length === 0) return null;

  // Vérifier le cache pour chaque variante
  for (const q of queries) {
    if (cache[q]) return cache[q];
  }

  // Essayer chaque requête du plus précis au plus large
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "User-Agent": "RSN-Cartographie/1.0" } }
      );
      const data = await res.json();
      if (data[0]) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        cache[q] = coords;
        saveCache(cache);
        return coords;
      }
    } catch (e) {
      console.error("Géocodage échoué pour:", q, e);
    }
    // Respecter le rate limit de Nominatim entre chaque tentative
    await new Promise((r) => setTimeout(r, 1100));
  }
  return null;
}

function removeAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Surveille la taille du conteneur Leaflet via ResizeObserver et appelle
 * invalidateSize() automatiquement — gère à la fois le retour d'onglet
 * et l'ouverture/fermeture du panneau latéral.
 */
function MapResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  consortium:              "Regroupement de recherche",
  college_or_university:   "Collège ou université",
  funding_scheme:          "Programme de financement",
  government_organization: "Organisation gouvernementale",
  hospital:                "Hôpital",
  autre:                   "Autre",
};

interface MapContentProps {
  nodes: MyGraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: MyGraphNode) => void;
  selectedNode: MyGraphNode | undefined;
  visible: boolean;
  fOrgType:    Set<string>;   // Filtres visuels — ne déclenchent PAS le géocodage
  fCouverture: Set<string>;
  fAxeRsn:     Set<string>;
  fDomain:     Set<string>;
}

export default function MapContent({
  nodes,
  edges,
  onSelectNode,
  selectedNode,
  visible: _visible,
  fOrgType,
  fCouverture,
  fAxeRsn,
  fDomain,
}: MapContentProps) {
  const [orgsWithCoords, setOrgsWithCoords] = useState<OrgWithCoords[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const query = removeAccents(rawQuery.toLowerCase());

  // Lookup rapide id → node
  const nodeById = useMemo(() => {
    const m = new Map<string, MyGraphNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  // Set des IDs d'org (pour filtrer les edges pertinents)
  const orgTypeSet = useMemo(() => new Set(["node--organization", "node--government_organization"]), []);

  // Tous les nœuds orga avec adresse — NE dépend PAS de typeFilter
  const orgNodes = useMemo(
    () =>
      nodes.filter((n) => {
        if (!orgTypeSet.has(n.data?.type ?? "")) return false;
        const addr = (n.data as any)?.address;
        // Accepter toute adresse avec au moins une info géocodable
        if (!addr) return false;
        return !!(addr.locality || addr.address_line1 || addr.administrative_area || addr.postal_code);
      }),
    [nodes, orgTypeSet]
  );

  // Entités liées par org ID — construit à partir des EDGES du graphe
  // Ceci est plus robuste que le parsing de member_of/parent_organization
  // car les edges sont déjà vérifiés et visibles dans la vue graphe.
  const relatedByOrgId = useMemo(() => {
    const map = new Map<string, MyGraphNode[]>();
    const orgIds = new Set(orgNodes.map(n => n.id));

    edges.forEach(edge => {
      const sourceType = nodeById.get(edge.source)?.data?.type ?? "";
      const targetType = nodeById.get(edge.target)?.data?.type ?? "";

      // Cas 1 : source est une org, target est une entité non-org → target est liée à source
      if (orgIds.has(edge.source) && !orgTypeSet.has(targetType)) {
        const relNode = nodeById.get(edge.target);
        if (relNode) {
          if (!map.has(edge.source)) map.set(edge.source, []);
          map.get(edge.source)!.push(relNode);
        }
      }
      // Cas 2 : target est une org, source est une entité non-org → source est liée à target
      if (orgIds.has(edge.target) && !orgTypeSet.has(sourceType)) {
        const relNode = nodeById.get(edge.source);
        if (relNode) {
          if (!map.has(edge.target)) map.set(edge.target, []);
          map.get(edge.target)!.push(relNode);
        }
      }
    });

    return map;
  }, [edges, orgNodes, nodeById, orgTypeSet]);

  // Géocodage — se lance une seule fois et ne redémarre PAS quand typeFilter change
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const cache = loadCache();
      const cached: OrgWithCoords[] = [];
      const toGeocode: MyGraphNode[] = [];

      for (const node of orgNodes) {
        const address = (node.data as any)?.address as Address | undefined;
        if (!address) continue;
        const queries = buildAddressQueries(address);
        // Chercher dans le cache pour n'importe quelle variante
        const cachedQ = queries.find(q => cache[q]);
        if (cachedQ) {
          cached.push({ node, ...cache[cachedQ], related: relatedByOrgId.get(node.id) ?? [] });
        } else if (queries.length > 0) {
          toGeocode.push(node);
        }
      }

      if (cached.length > 0) setOrgsWithCoords([...cached]);
      if (toGeocode.length === 0) { setProgress(null); return; }

      const results = [...cached];
      setProgress({ done: cached.length, total: orgNodes.length });

      for (let i = 0; i < toGeocode.length; i++) {
        if (cancelled) break;
        const node = toGeocode[i];
        const address = (node.data as any)?.address as Address | undefined;
        if (!address) continue;
        const coords = await geocode(address, cache);
        if (coords && !cancelled) {
          results.push({ node, ...coords, related: relatedByOrgId.get(node.id) ?? [] });
          setOrgsWithCoords([...results]);
        }
        setProgress({ done: cached.length + i + 1, total: orgNodes.length });
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) setProgress(null);
    }
    run();
    return () => { cancelled = true; };
  }, [orgNodes, relatedByOrgId]);

  // Filtrage visuel — pas de re-géocodage
  const visibleOrgs = useMemo(() => {
    let result = orgsWithCoords;

    // Filtre sous-type d'org.
    if (fOrgType.size > 0) {
      result = result.filter(({ node }) => {
        const d = node.data as GraphNodeData;
        if (d.type !== "node--organization" && d.type !== "node--government_organization") return false;
        const lbl = d.schema_organization_type
          ? (ORG_TYPE_LABELS[d.schema_organization_type] ?? d.schema_organization_type) : "";
        return fOrgType.has(lbl);
      });
    }

    // Filtre couverture géo.
    if (fCouverture.size > 0) {
      result = result.filter(({ node }) => {
        const d = node.data as GraphNodeData;
        if (d.type !== "node--organization" && d.type !== "node--government_organization") return false;
        return d.field_couverture_geographique?.some(t => fCouverture.has(t.name));
      });
    }

    // Filtre axe RSN : orgs ayant au moins une personne liée avec cet axe
    if (fAxeRsn.size > 0) {
      result = result.filter(({ related }) =>
        related.some(r => {
          const d = r.data as GraphNodeData;
          return d.type === "node--person" && d.field_axe_si_membre_rsn && fAxeRsn.has(d.field_axe_si_membre_rsn.name);
        })
      );
    }

    // Filtre domaine de santé : orgs ayant au moins une entité liée avec ce domaine
    if (fDomain.size > 0) {
      result = result.filter(({ related }) =>
        related.some(r => {
          const d = r.data as GraphNodeData;
          return "field_applied_domain" in d && d.field_applied_domain?.some(t => fDomain.has(t.name));
        })
      );
    }

    // Filtre recherche textuelle (titre, alias, entités liées)
    if (query) {
      result = result.filter(({ node, related }) => {
        const title = removeAccents((node.data?.title ?? node.label ?? "").toLowerCase());
        if (title.includes(query)) return true;
        // Recherche par alias de l'org
        const aliases = (node.data as any)?.alternate_name as string[] | undefined;
        if (aliases?.some(a => removeAccents(a.toLowerCase()).includes(query))) return true;
        // Recherche dans les entités liées (titre + alias)
        return related.some(r => {
          if (removeAccents((r.data?.title ?? r.label ?? "").toLowerCase()).includes(query)) return true;
          const rAliases = (r.data as any)?.alternate_name as string[] | undefined;
          return rAliases?.some(a => removeAccents(a.toLowerCase()).includes(query)) ?? false;
        });
      });
    }

    return result;
  }, [orgsWithCoords, fOrgType, fCouverture, fAxeRsn, fDomain, query]);

  function groupRelated(related: MyGraphNode[], searchQuery?: string) {
    // Si une recherche est active, ne garder que les entités correspondantes
    const filtered = searchQuery
      ? related.filter(r => {
          if (removeAccents((r.data?.title ?? r.label ?? "").toLowerCase()).includes(searchQuery)) return true;
          const aliases = (r.data as any)?.alternate_name as string[] | undefined;
          return aliases?.some(a => removeAccents(a.toLowerCase()).includes(searchQuery)) ?? false;
        })
      : related;
    const groups: Record<string, MyGraphNode[]> = {};
    filtered.forEach((n) => {
      const type = n.data?.type ?? "unknown";
      if (!groups[type]) groups[type] = [];
      groups[type].push(n);
    });
    return groups;
  }

  return (
    <div className="flex flex-col h-full">
      {progress && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-info/10 border-b border-info/20 text-xs text-info flex-shrink-0">
          <span className="loading loading-spinner loading-xs" />
          Localisation en cours… {progress.done}/{progress.total} organisations
          <span className="text-info/60 ml-1">(mis en cache après la 1ʳᵉ visite)</span>
        </div>
      )}

      <div className="flex-1" style={{ minHeight: 0 }}>
        <MapContainer
          center={[46.8, -71.2]}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizeWatcher />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
          />

          {visibleOrgs.map(({ node, lat, lng, related }) => {
            const isSelected = selectedNode?.id === node.id;
            const radius = Math.min(7 + Math.sqrt(related.length) * 2.5, 22);
            // Couleur uniforme pour toutes les orgs sur la carte (bleu RSN)
            const fill = "#0061AF";
            const groups = groupRelated(related, query || undefined);

            return (
              <CircleMarker
                key={node.id}
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  fillColor: fill,
                  color: isSelected ? "#fff" : fill,
                  weight: isSelected ? 3 : 1.5,
                  opacity: 1,
                  fillOpacity: isSelected ? 1 : 0.75,
                }}
                eventHandlers={{ click: () => onSelectNode(node) }}
              >
                <Popup maxWidth={300} autoPan={false}>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fill, marginBottom: "0.15rem" }}>
                      {node.data?.title ?? node.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#718096", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {TYPE_LABELS[node.data?.type ?? ""] ?? node.data?.type}
                    </div>
                    {Object.entries(groups).map(([type, items]) => (
                      <div key={type} style={{ marginBottom: "0.4rem" }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a0aec0", marginBottom: "0.2rem" }}>
                          {TYPE_LABELS[type] ?? type} ({items.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          {items.slice(0, 7).map((r) => (
                            <div key={r.id}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                              onClick={() => onSelectNode(r)}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: r.fill ?? "#888", flexShrink: 0, display: "inline-block" }} />
                              <span style={{ fontSize: "0.82rem" }}>{r.data?.title ?? r.label}</span>
                            </div>
                          ))}
                          {items.length > 7 && (
                            <div style={{ fontSize: "0.72rem", color: "#a0aec0" }}>+{items.length - 7} autres</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {related.length === 0 && (
                      <div style={{ fontSize: "0.78rem", color: "#a0aec0", fontStyle: "italic" }}>Aucun élément associé</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
