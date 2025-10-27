"use client";

import { GraphEdge } from "reagraph";
import { MyDiagram } from "./Reagraph";
import { DetailCard } from "./DetailCard";
import { useState } from "react";
import { MyGraphNode } from "@/app/lib/types";

interface DiagramRootProps {
  nodes: MyGraphNode[];
  edges: GraphEdge[];
}

export function DiagramRoot({ nodes, edges }: DiagramRootProps) {
  const [contextMenuData, setContextMenuData] = useState<
    MyGraphNode | undefined
  >(undefined);

  return (
    <>
      <div className="absolute z-10 right-12 top-24 max-h-[80vh]">
        {contextMenuData && (
          <DetailCard
            node={contextMenuData}
            onClose={() => {
              setContextMenuData(undefined);
            }}
          ></DetailCard>
        )}
      </div>
      <MyDiagram
        nodes={nodes}
        edges={edges}
        onContextMenuOpen={(data) => {
          console.log(data);
          setContextMenuData(data);
        }}
      />
    </>
  );
}
