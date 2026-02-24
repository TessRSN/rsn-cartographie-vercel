"use client";

import dynamic from "next/dynamic";
import { MyGraphNode } from "@/app/lib/types";

const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-base-content/50">
      <span className="loading loading-spinner loading-md mr-2" />
      Chargement de la carte…
    </div>
  ),
});

interface MapViewProps {
  nodes: MyGraphNode[];
  onSelectNode: (node: MyGraphNode) => void;
  selectedNode: MyGraphNode | undefined;
  visible: boolean;
}

export function MapView({ nodes, onSelectNode, selectedNode, visible }: MapViewProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <MapContent
        nodes={nodes}
        onSelectNode={onSelectNode}
        selectedNode={selectedNode}
        visible={visible}
      />
    </div>
  );
}
