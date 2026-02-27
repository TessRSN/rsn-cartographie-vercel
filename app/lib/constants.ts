/**
 * Shared constants for node type labels, colors, and organization sub-types.
 * Used across DiagramRoot (graph/table), MapContent (map popups), and DetailCards.
 */

/** Human-readable labels for each Drupal node type. */
export const TYPE_LABELS: Record<string, string> = {
  "node--organization": "Organisation",
  "node--government_organization": "Org. gouvernementale",
  "node--person": "Personne",
  "node--dataset": "Jeu de données",
  "node--data_catalog": "Catalogue de données",
  "node--software_application": "Application",
};

/** Fill colors associated with each Drupal node type. */
export const NODE_FILL: Record<string, string> = {
  "node--organization": "#0061AF",
  "node--government_organization": "#8C8C8C",
  "node--person": "#00A759",
  "node--dataset": "#FFCC4E",
  "node--data_catalog": "#FFCC4E",
  "node--software_application": "#EE3124",
};

/** Human-readable labels for organization sub-types (from Drupal schema_organization_type). */
export const ORG_TYPE_LABELS: Record<string, string> = {
  consortium: "Regroupement de recherche",
  college_or_university: "Collège ou université",
  funding_scheme: "Programme de financement",
  government_organization: "Organisation gouvernementale",
  hospital: "Hôpital",
  autre: "Autre",
};
