import { GraphElementBaseAttributes } from "reagraph";
import { GraphNodeData } from "./schema";

export interface MyGraphNode extends GraphElementBaseAttributes<GraphNodeData> {
  /**
   * ID of the parent node.
   */
  parents?: string[];
  /**
   * Icon URL for the node.
   */
  icon?: string;
  /**
   * Fill color for the node.
   */
  fill?: string;
  /**
   * Cluster ID for the node.
   */
  cluster?: string;
  /**
   * Fixed X position for force-directed layouts.
   */
  fx?: number;
  /**
   * Fixed Y position for force-directed layouts.
   */
  fy?: number;
  /**
   * Fixed Z position for force-directed layouts.
   */
  fz?: number;
}
