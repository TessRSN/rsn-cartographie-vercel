import { MyGraphNode } from "@/app/lib/types";
import { OrganizationDetailCard } from "./OrganizationDetailCard";
import { DatasetDetailCard } from "./DatasetDetailCard";
import { PersonDetailCard } from "./PersonDetailCard";
import { SoftwareApplicationDetailCard } from "./SoftwareApplicationDetailCard";
import { type GraphNodeData } from "@/app/lib/schema";
import { DataCatalogDetailCard } from "./DataCatalogDetailCard";

interface DetailCardRootProps {
  node: MyGraphNode;
  onClose: () => void;
  /** When false, use opaque background instead of glassmorphism. Default true. */
  glass?: boolean;
}

export function DetailCardRoot({ node, onClose, glass }: DetailCardRootProps) {
  if (isNodeOfType(node, "node--dataset")) {
    return <DatasetDetailCard node={node} onClose={onClose} glass={glass} />;
  } else if (isNodeOfType(node, "node--data_catalog")) {
    return <DataCatalogDetailCard node={node} onClose={onClose} glass={glass} />;
  } else if (isNodeOfType(node, "node--organization")) {
    return <OrganizationDetailCard node={node} onClose={onClose} glass={glass} />;
  } else if (isNodeOfType(node, "node--government_organization")) {
    // Gov orgs share the same schema/fields as regular orgs
    return <OrganizationDetailCard node={node as any} onClose={onClose} glass={glass} />;
  } else if (isNodeOfType(node, "node--person")) {
    return <PersonDetailCard node={node} onClose={onClose} glass={glass} />;
  } else if (isNodeOfType(node, "node--software_application")) {
    return <SoftwareApplicationDetailCard node={node} onClose={onClose} glass={glass} />;
  }

  return null;
}

function isNodeOfType<T extends GraphNodeData["type"]>(
  node: MyGraphNode,
  type: T
): node is MyGraphNode & { data: Extract<GraphNodeData, { type: T }> } {
  return node.data?.type === type;
}
