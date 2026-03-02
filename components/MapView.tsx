"use client";

import dynamic from "next/dynamic";
import { MyGraphNode } from "@/app/lib/types";
import { GraphEdge } from "reagraph";

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
  edges: GraphEdge[];
  onSelectNode: (node: MyGraphNode) => void;
  selectedNode: MyGraphNode | undefined;
  visible: boolean;
  fOrgType:          Set<string>;
  fCouverture:       Set<string>;
  fAxeRsn:           Set<string>;
  fDomain:           Set<string>;
  fDigital:          Set<string>;
  fPersonType:       Set<string>;
}

export function MapView({ nodes, edges, onSelectNode, selectedNode, visible, fOrgType, fCouverture, fAxeRsn, fDomain, fDigital, fPersonType }: MapViewProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <MapContent
        nodes={nodes}
        edges={edges}
        onSelectNode={onSelectNode}
        selectedNode={selectedNode}
        visible={visible}
        fOrgType={fOrgType}
        fCouverture={fCouverture}
        fAxeRsn={fAxeRsn}
        fDomain={fDomain}
        fDigital={fDigital}
        fPersonType={fPersonType}
      />
    </div>
  );
}
