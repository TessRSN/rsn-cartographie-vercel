/**
 * Reagraph wrapper — renders the 2D force-directed graph using GraphCanvas.
 *
 * Handles theme synchronization (light/dark), search highlighting via
 * the selection API, and per-type hover color changes.
 * Dynamically imported (no SSR) because reagraph requires canvas/WebGL.
 */
"use client";
import { MyGraphNode } from "@/app/lib/types";
import { removeAccents } from "@/app/lib/utils";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";

const GraphCanvas = dynamic(
  () => import("reagraph").then((mod) => mod.GraphCanvas),
  { ssr: false }
);

import type { GraphNode, GraphEdge, GraphCanvasRef } from "reagraph";
import { Theme, useSelection } from "reagraph";

// Couleur de sélection/recherche — violet
const SEARCH_HIGHLIGHT = "#A855F7";

/**
 * Builds a reagraph Theme for the given color mode, harmonized with the DaisyUI palette.
 * @param activeFillOverride - Optional override for the node active/hover fill (type-specific highlight).
 */
export function getTheme(mode: string, activeFillOverride?: string): Theme {
  if (mode === "dark") {
    return {
      canvas: {
        background: "#141e30",   // navy profond — raccord avec base-100 dark
        fog: "#c9d4e0",
      },
      node: {
        fill: "#7CA0AB",
        activeFill: activeFillOverride ?? SEARCH_HIGHLIGHT,
        opacity: 1,
        selectedOpacity: 1,
        inactiveOpacity: 0.2,
        label: {
          color: "#c9d4e0",       // gris bleuté clair (pas blanc pur)
          stroke: "#141e30",
          activeColor: "#63b3ed",
        },
        subLabel: {
          color: "#5a7a8a",
          stroke: "#1c2940",
          activeColor: "#63b3ed",
        },
      },
      lasso: {
        border: "1px solid #63b3ed",
        background: "rgba(99, 179, 237, 0.1)",
      },
      ring: {
        fill: "#2a3a52",
        activeFill: SEARCH_HIGHLIGHT,
      },
      edge: {
        fill: "#3a5068",          // bleu-gris moyen (pas blanc)
        activeFill: "#63b3ed",
        opacity: 1,
        selectedOpacity: 1,
        inactiveOpacity: 0.1,
        label: {
          stroke: "#1c2940",
          color: "#5a7a8a",
          activeColor: "#63b3ed",
        },
      },
      arrow: {
        fill: "#3a5068",
        activeFill: "#63b3ed",
      },
      cluster: {
        stroke: "#3a5068",
        opacity: 1,
        selectedOpacity: 1,
        inactiveOpacity: 0.1,
        label: {
          stroke: "#1c2940",
          color: "#5a7a8a",
        },
      },
    };
  }

  // Light theme
  return {
    canvas: {
      background: "#f5f7fa",     // gris bleuté doux — raccord avec base-100 light
      fog: "#2d3a4a",
    },
    node: {
      fill: "#4A90A4",
      activeFill: activeFillOverride ?? SEARCH_HIGHLIGHT,
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.3,
      label: {
        color: "#2d3a4a",         // bleu-gris foncé (pas noir pur)
        stroke: "#f5f7fa",
        activeColor: "#1a365d",
      },
      subLabel: {
        color: "#6B9EB0",
        stroke: "#e8ecf1",
        activeColor: "#2b6cb0",
      },
    },
    lasso: {
      border: "1px solid #2b6cb0",
      background: "rgba(43, 108, 176, 0.1)",
    },
    ring: {
      fill: "#8fa8b8",
      activeFill: SEARCH_HIGHLIGHT,
    },
    edge: {
      fill: "#8fa8b8",            // bleu-gris moyen (pas noir)
      activeFill: "#2b6cb0",
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.15,
      label: {
        stroke: "#f5f7fa",
        color: "#6B9EB0",
        activeColor: "#2b6cb0",
      },
    },
    arrow: {
      fill: "#8fa8b8",
      activeFill: "#2b6cb0",
    },
    cluster: {
      stroke: "#8fa8b8",
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.15,
      label: {
        stroke: "#f5f7fa",
        color: "#6B9EB0",
      },
    },
  };
}

interface MyDiagramProps {
  nodes: MyGraphNode[];
  edges: GraphEdge[];
  onNodeClick: (data: GraphNode) => void;
}

export function MyDiagram({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
}: MyDiagramProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [nodes, setNodes] = useState(initialNodes);

  // Synchronise le state interne quand les props changent (filtre de type, filtre d'aretes)
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const { selections, setSelections } = useSelection({
    ref: graphRef,
    nodes: nodes,
    edges: initialEdges,
  });

  // Recherche : highlight les noeuds matchés via selections (couleur orange uniforme)
  useEffect(() => {
    const q = removeAccents(query.toLowerCase());
    const filteredNodes =
      query.length > 0
        ? initialNodes.filter((node) => {
            if (!node.data) return false;
            // Recherche par tags
            if (node.data.tag.some((i) => removeAccents(i.toLowerCase()).includes(q))) return true;
            // Recherche par alias
            const aliases = (node.data as any)?.alternate_name;
            if (aliases?.some?.((a: string) => removeAccents(a.toLowerCase()).includes(q))) return true;
            return false;
          })
        : [];
    const ids = filteredNodes.map((node) => node.id);
    setSelections(ids);

    // Centrer le graphe sur les nœuds trouvés (avec animation)
    if (ids.length > 0) {
      graphRef.current?.fitNodesInView(ids, { animated: true });
    }
  }, [query, initialNodes]);

  const fitView = () => {
    graphRef.current?.fitNodesInView();
  };

  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const graphTheme = useMemo(
    () => getTheme(theme ?? "dark"),
    [theme]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-full w-full relative">
      <GraphCanvas
        ref={graphRef}
        selections={selections}
        theme={graphTheme}
        cameraMode="pan"
        layoutType="forceDirected2d"
        labelType="nodes"
        edgeArrowPosition="none"
        draggable
        nodes={nodes}
        edges={initialEdges}
        onNodePointerOver={(node) => {
          node.label = node.data.hoverLabel;
        }}
        onNodePointerOut={(node) => {
          node.label = node.data.label;
        }}
        onNodeClick={(node) => {
          onNodeClick(node);
        }}
      />
      <button
        onClick={fitView}
        className="absolute bottom-4 left-4 btn btn-sm btn-ghost border border-base-300 opacity-70 hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
        Recentrer
      </button>
    </div>
  );
}
