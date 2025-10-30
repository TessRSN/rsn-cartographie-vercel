import { GraphElementBaseAttributes } from "reagraph";
import { GraphNodeData } from "./schema";

export type MyGraphElementBaseAttributes<T> = GraphElementBaseAttributes<T> & {
  data: T;
};

export interface MyGraphNode<T = GraphNodeData>
  extends GraphElementBaseAttributes<T> {
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
