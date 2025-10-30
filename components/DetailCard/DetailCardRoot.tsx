import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import { OrganizationDetailCard } from "./OrganizationDetailCard";
import { DatasetDetailCard } from "./DatasetDetailCard";
import { PersonDetailCard } from "./PersonDetailCard";
import { SoftwareApplicationDetailCard } from "./SoftwareApplicationDetailCard";
import { type GraphNodeData } from "@/app/lib/schema";

interface DetailCardRootProps {
  node: MyGraphNode;
  onClose: () => void;
}

export function DetailCardRoot({ node, onClose }: DetailCardRootProps) {
  if (isNodeOfType(node, "node--dataset")) {
    return <DatasetDetailCard node={node} onClose={onClose} />;
  } else if (isNodeOfType(node, "node--organization")) {
    return <OrganizationDetailCard node={node} onClose={onClose} />;
  } else if (isNodeOfType(node, "node--person")) {
    return <PersonDetailCard node={node} onClose={onClose} />;
  } else if (isNodeOfType(node, "node--software_application")) {
    return <SoftwareApplicationDetailCard node={node} onClose={onClose} />;
  }

  return null;
}

function isNodeOfType<T extends GraphNodeData["type"]>(
  node: MyGraphNode,
  type: T
): node is MyGraphNode & { data: Extract<GraphNodeData, { type: T }> } {
  return node.data?.type === type;
}
