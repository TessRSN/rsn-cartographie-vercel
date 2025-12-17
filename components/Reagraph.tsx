"use client";
import { MyGraphNode } from "@/app/lib/types";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GraphCanvas = dynamic(
  () => import("reagraph").then((mod) => mod.GraphCanvas),
  { ssr: false }
);

import type { GraphNode, GraphEdge, GraphCanvasRef } from "reagraph";
import { Theme, useSelection } from "reagraph";

export function getTheme(mode: string): Theme {
  if (mode === "dark") {
    return {
      canvas: {
        background: "#000",
        fog: "#fff",
      },
      node: {
        fill: "#7CA0AB",
        activeFill: "#1DE9AC",
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
        activeFill: "#1DE9AC",
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
      activeFill: "#0066CC",
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.3,
      label: {
        color: "#1A1A1A",
        stroke: "#FFF",
        activeColor: "#0066CC",
      },
      subLabel: {
        color: "#6B9EB0",
        stroke: "#333",
        activeColor: "#0066CC",
      },
    },
    lasso: {
      border: "1px solid #0066CC",
      background: "rgba(0, 102, 204, 0.1)",
    },
    ring: {
      fill: "#2C5F6F",
      activeFill: "#0066CC",
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
  onContextMenuOpen: (data: GraphNode) => void;
}

export function MyDiagram({
  nodes: initialNodes,
  edges: initialEdges,
  onContextMenuOpen,
}: MyDiagramProps) {
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const { selections, setSelections } = useSelection({
    ref: graphRef,
    nodes: nodes,
    edges: edges,
  });

  const fitView = () => {
    graphRef.current?.fitNodesInView();
  };

  useEffect(() => {
    let filteredNodes =
      query.length > 0
        ? initialNodes.filter((node) => {
            if (!node.data) {
              return false;
            }

            return (
              node.data.title.toLowerCase().includes(query.toLowerCase()) ||
              node.data.label?.toLowerCase().includes(query.toLowerCase())
            );
          })
        : [];
    setSelections(filteredNodes?.map((node) => node.id));
  }, [query]);

  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const graphTheme = getTheme(theme ?? "dark");

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
        //layoutType="forceDirected3d" // - vision 3d
        layoutType="forceDirected2d"
        edgeArrowPosition="none"
        draggable
        nodes={nodes}
        edges={edges}
        onNodePointerOver={(node, event) => {
          node.label = node.data.hoverLabel;
        }}
        onNodePointerOut={(node, event) => {
          node.label = node.data.label;
        }}
        onNodeContextMenu={(data) => {
          onContextMenuOpen(data);
        }}
      />
      <button onClick={fitView}>Fit View</button>
    </div>
  );
}
