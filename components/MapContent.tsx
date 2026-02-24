"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSearchParams } from "next/navigation";
import { MyGraphNode } from "@/app/lib/types";
import { GraphNodeData } from "@/app/lib/schema";

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
  postal_code?: string;
  country_code?: string;
}

function buildAddressQuery(address: Address): string | null {
  const parts = [
    address.address_line1,
    address.locality,
    address.country_code === "CA" ? "Canada" : address.country_code,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
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
  const query = buildAddressQuery(address);
  if (!query) return null;
  if (cache[query]) return cache[query];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "User-Agent": "RSN-Cartographie/1.0" } }
    );
    const data = await res.json();
    if (data[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      cache[query] = coords;
      saveCache(cache);
      return coords;
    }
  } catch (e) {
    console.error("Géocodage échoué pour:", query, e);
  }
  return null;
}

function removeAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Appelle map.invalidateSize() quand la carte redevient visible (après display:none) */
function MapInvalidator({ visible }: { visible: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => map.invalidateSize(), 80);
      return () => clearTimeout(t);
    }
  }, [visible, map]);
  return null;
}

interface MapContentProps {
  nodes: MyGraphNode[];
  onSelectNode: (node: MyGraphNode) => void;
  selectedNode: MyGraphNode | undefined;
  visible: boolean;
}

export default function MapContent({ nodes, onSelectNode, selectedNode, visible }: MapContentProps) {
  const [orgsWithCoords, setOrgsWithCoords] = useState<OrgWithCoords[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const query = removeAccents(rawQuery.toLowerCase());

  // Org nodes with a locality address
  const orgNodes = useMemo(
    () =>
      nodes.filter(
        (n) =>
          (n.data?.type === "node--organization" ||
            n.data?.type === "node--government_organization") &&
          (n.data as any)?.address?.locality
      ),
    [nodes]
  );

  // Related nodes per org ID
  const relatedByOrgId = useMemo(() => {
    const map = new Map<string, MyGraphNode[]>();
    nodes.forEach((n) => {
      const data = n.data as GraphNodeData;
      let orgIds: string[] = [];
      if (data.type === "node--person" && data.member_of) {
        orgIds = data.member_of.map((o) => o.id);
      } else if (
        (data.type === "node--dataset" ||
          data.type === "node--data_catalog" ||
          data.type === "node--software_application") &&
        data.parent_organization
      ) {
        orgIds = data.parent_organization.map((o) => o.id);
      }
      orgIds.forEach((id) => {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(n);
      });
    });
    return map;
  }, [nodes]);

  // Geocoding: show cache immediately, then fetch uncached
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const cache = loadCache();
      const cached: OrgWithCoords[] = [];
      const toGeocode: MyGraphNode[] = [];

      for (const node of orgNodes) {
        const address = (node.data as any)?.address as Address | undefined;
        if (!address) continue;
        const q = buildAddressQuery(address);
        if (q && cache[q]) {
          cached.push({ node, ...cache[q], related: relatedByOrgId.get(node.id) ?? [] });
        } else {
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

  // Filter by search query (title or related entities)
  const visibleOrgs = useMemo(() => {
    if (!query) return orgsWithCoords;
    return orgsWithCoords.filter(({ node, related }) => {
      const title = removeAccents((node.data?.title ?? node.label ?? "").toLowerCase());
      if (title.includes(query)) return true;
      return related.some((r) =>
        removeAccents((r.data?.title ?? r.label ?? "").toLowerCase()).includes(query)
      );
    });
  }, [orgsWithCoords, query]);

  // Group related nodes by type for popup
  function groupRelated(related: MyGraphNode[]) {
    const groups: Record<string, MyGraphNode[]> = {};
    related.forEach((n) => {
      const type = n.data?.type ?? "unknown";
      if (!groups[type]) groups[type] = [];
      groups[type].push(n);
    });
    return groups;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progression géocodage */}
      {progress && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-info/10 border-b border-info/20 text-xs text-info flex-shrink-0">
          <span className="loading loading-spinner loading-xs" />
          Localisation en cours… {progress.done}/{progress.total} organisations
          <span className="text-info/60 ml-1">(mis en cache après la 1ʳᵉ visite)</span>
        </div>
      )}

      {/* Carte pleine hauteur */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <MapContainer
          center={[46.8, -71.2]}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
        >
          <MapInvalidator visible={visible} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
          />

          {visibleOrgs.map(({ node, lat, lng, related }) => {
            const isSelected = selectedNode?.id === node.id;
            // Rayon proportionnel au nombre d'entités reliées
            const radius = Math.min(7 + Math.sqrt(related.length) * 2.5, 22);
            const fill = node.fill ?? "#888";
            const groups = groupRelated(related);

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
                    {/* Titre org */}
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: fill, marginBottom: "0.15rem" }}>
                      {node.data?.title ?? node.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#718096", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {TYPE_LABELS[node.data?.type ?? ""] ?? node.data?.type}
                    </div>

                    {/* Entités reliées par type */}
                    {Object.entries(groups).map(([type, items]) => (
                      <div key={type} style={{ marginBottom: "0.4rem" }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a0aec0", marginBottom: "0.2rem" }}>
                          {TYPE_LABELS[type] ?? type} ({items.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          {items.slice(0, 7).map((r) => (
                            <div
                              key={r.id}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                              onClick={() => onSelectNode(r)}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: r.fill ?? "#888", flexShrink: 0, display: "inline-block" }} />
                              <span style={{ fontSize: "0.82rem" }}>{r.data?.title ?? r.label}</span>
                            </div>
                          ))}
                          {items.length > 7 && (
                            <div style={{ fontSize: "0.72rem", color: "#a0aec0" }}>
                              +{items.length - 7} autres
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {related.length === 0 && (
                      <div style={{ fontSize: "0.78rem", color: "#a0aec0", fontStyle: "italic" }}>
                        Aucun élément associé
                      </div>
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
