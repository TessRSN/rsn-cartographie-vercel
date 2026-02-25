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
  "node--government_organization": "#B8B8B8", // gris clair
  "node--person":                  "#4DD98A", // vert clair
  "node--dataset":                 "#FFE082", // jaune clair
  "node--data_catalog":            "#FFE082", // jaune clair
  "node--software_application":    "#F47B6C", // rouge clair
};

// Couleur de sélection/recherche — orange ambre (non utilisé ailleurs)
const SEARCH_HIGHLIGHT = "#A855F7";

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
