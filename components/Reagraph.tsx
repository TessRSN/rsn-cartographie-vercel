"use client";
import { MyGraphNode } from "@/app/lib/types";
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

// Couleurs plus claires pour le survol — une par type de noeud
const NODE_HIGHLIGHT: Record<string, string> = {
  "node--organization":            "#5BADE8", // bleu clair
  "node--government_organization": "#A0B4C4", // gris-bleu clair
  "node--person":                  "#4DD98A", // vert clair
  "node--dataset":                 "#FFE082", // jaune clair
  "node--data_catalog":            "#FFE082", // jaune clair
  "node--software_application":    "#F47B6C", // rouge clair
};

// Couleur de sélection/recherche — orange ambre (non utilisé ailleurs)
const SEARCH_HIGHLIGHT = "#FF9F1C";

export function getTheme(mode: string, activeFillOverride?: string): Theme {
  if (mode === "dark") {
    return {
      canvas: {
        background: "#000",
        fog: "#fff",
      },
      node: {
        fill: "#7CA0AB",
        activeFill: activeFillOverride ?? SEARCH_HIGHLIGHT,
        opacity: 1,
        selectedOpacity: 1,
        inactiveOpacity: 0.2,
        label: {
          color: "#FFF",
          stroke: "#000",
          activeColor: "#1DE9AC",
        },
        subLabel: {
          color: "#2A6475",
          stroke: "#eee",
          activeColor: "#1DE9AC",
        },
      },
      lasso: {
        border: "1px solid #55aaff",
        background: "rgba(75, 160, 255, 0.1)",
      },
      ring: {
        fill: "#D8E6EA",
        activeFill: SEARCH_HIGHLIGHT,
      },
      edge: {
        fill: "#D8E6EA",
        activeFill: "#1DE9AC",
        opacity: 1,
        selectedOpacity: 1,
        inactiveOpacity: 0.1,
        label: {
          stroke: "#fff",
          color: "#2A6475",
          activeColor: "#1DE9AC",
        },
      },
      arrow: {
        fill: "#D8E6EA",
        activeFill: "#1DE9AC",
      },
      cluster: {
        stroke: "#D8E6EA",
        opacity: 1,
        selectedOpacity: 1,
        inactiveOpacity: 0.1,
        label: {
          stroke: "#fff",
          color: "#2A6475",
        },
      },
    };
  }

  // Light theme
  return {
    canvas: {
      background: "#FAFAFA",
      fog: "#000",
    },
    node: {
      fill: "#4A90A4",
      activeFill: activeFillOverride ?? SEARCH_HIGHLIGHT,
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.3,
      label: {
        color: "#1A1A1A",
        stroke: "#FFF",
        activeColor: "#1A1A1A",
      },
      subLabel: {
        color: "#6B9EB0",
        stroke: "#333",
        activeColor: "#6B9EB0",
      },
    },
    lasso: {
      border: "1px solid #0066CC",
      background: "rgba(0, 102, 204, 0.1)",
    },
    ring: {
      fill: "#2C5F6F",
      activeFill: SEARCH_HIGHLIGHT,
    },
    edge: {
      fill: "#334E58",
      activeFill: "#0066CC",
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.2,
      label: {
        stroke: "#000",
        color: "#5A8695",
        activeColor: "#0066CC",
      },
    },
    arrow: {
      fill: "#334E58",
      activeFill: "#0066CC",
    },
    cluster: {
      stroke: "#334E58",
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.2,
      label: {
        stroke: "#000",
        color: "#5A8695",
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
    setSelections(filteredNodes.map((node) => node.id));
  }, [query, initialNodes]);

  const fitView = () => {
    graphRef.current?.fitNodesInView();
  };

  const [mounted, setMounted] = useState(false);
  const [hoverNodeType, setHoverNodeType] = useState<string | null>(null);
  const { theme } = useTheme();
  const graphTheme = useMemo(
    () => getTheme(theme ?? "dark", hoverNodeType ? NODE_HIGHLIGHT[hoverNodeType] : undefined),
    [theme, hoverNodeType]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-[calc(100vh-var(--spacing)*16)] w-full relative">
      <GraphCanvas
        ref={graphRef}
        selections={selections}
        theme={graphTheme}
        cameraMode="pan"
        layoutType="forceDirected2d"
        edgeArrowPosition="none"
        draggable
        nodes={nodes}
        edges={initialEdges}
        onNodePointerOver={(node, event) => {
          node.label = node.data.hoverLabel;
          setHoverNodeType(node.data?.type ?? null);
        }}
        onNodePointerOut={(node, event) => {
          node.label = node.data.label;
          setHoverNodeType(null);
        }}
        onNodeClick={(node) => {
          onNodeClick(node);
        }}
      />
      <button onClick={fitView}>Fit View</button>
    </div>
  );
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
