"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const GraphCanvas = dynamic(
  () => import("reagraph").then((mod) => mod.GraphCanvas),
  { ssr: false }
);

import type { GraphNode, GraphEdge } from "reagraph";
import { Theme } from "reagraph";

export const darkTheme: Theme = {
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

interface MyDiagramProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onContextMenuOpen: (data: GraphNode) => void;
}

export function MyDiagram({ nodes, edges, onContextMenuOpen }: MyDiagramProps) {
  return (
    <div className="h-[calc(100vh-var(--spacing)*16)] w-full relative">
      <GraphCanvas
        theme={darkTheme}
        cameraMode="rotate"
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
    </div>
  );
}
