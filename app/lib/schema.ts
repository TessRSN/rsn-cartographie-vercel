/**
 * Zod validation schemas for graph-node representations.
 *
 * After the Notion migration the PascalCase "API response" schemas are gone.
 * Only the camelCase graph-node schemas remain — they are the contract
 * between the data-fetching layer and the frontend (DiagramRoot, DetailCards).
 */
import { z } from "zod"

// ─── Shared building blocks ──────────────────────────────────────────────────

const LinkSchema = z.object({
  uri: z.string(),
  title: z.string(),
  options: z.array(z.unknown()),
})

export const DescriptionSchema = z.object({
  value: z.string(),
  format: z.string(),
  processed: z.string(),
  summary: z.string(),
})

export const AddressSchema = z.object({
  langcode: z.string().nullable().optional(),
  country_code: z.string().optional(),
  administrative_area: z.string().optional(),
  locality: z.string().optional(),
  postal_code: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

/**
 * Generic reference to another entity (organisation, person, etc.).
 * In Notion, relations only give us { id }, so we resolve title post-fetch.
 */
const EntityReferenceSchema = z.object({
  type: z.string(),
  id: z.string(),
  title: z.string().optional(),
})

// Taxonomy term schemas — frontend reads .id (key) and .name (display).

const TaxonomyTermPersonSchema = z.object({
  type: z.literal("taxonomy_term--person"),
  id: z.string(),
  name: z.string(),
})

const TaxonomyTermHealthResearchCategorySchema = z.object({
  type: z.literal("taxonomy_term--health_research_category"),
  id: z.string(),
  name: z.string(),
})

const TaxonomyTermMethodesNumeriquesSchema = z.object({
  type: z.literal("taxonomy_term--methodes_numeriques"),
  id: z.string(),
  name: z.string(),
})

const TaxonomyTermAxeRsnSchema = z.object({
  type: z.literal("taxonomy_term--axe_rsn"),
  id: z.string(),
  name: z.string(),
})

const TaxonomyTermGeographicalSchema = z.object({
  type: z.literal("taxonomy_term--geographical"),
  id: z.string(),
  name: z.string(),
})

const TaxonomyCouvertureGeographiqueSchema = z.object({
  type: z.literal("taxonomy_term--couverture_geographique"),
  id: z.string(),
  name: z.string(),
})

const TaxonomyApplicationCategorySchema = z.object({
  type: z.literal("taxonomy_term--software_type"),
  id: z.string(),
  name: z.string(),
})

const TaxonomySoftwareLicenceSchema = z.object({
  type: z.literal("taxonomy_term--accessibility"),
  id: z.string(),
  name: z.string(),
})

const TaxonomySoftwareModeleAccesSchema = z.object({
  type: z.literal("taxonomy_term--modele_acces"),
  id: z.string(),
  name: z.string(),
})

const EmailSchema = z.object({
  schema_email: z.string().email(),
})

// Partial person schema for author references in datasets/catalogs/software
const PersonPartialSchema = z.object({
  type: z.literal("node--person").optional(),
  id: z.string().optional(),
  title: z.string().optional(),
  description: DescriptionSchema.nullish(),
  same_as: z.array(LinkSchema).optional(),
})

// ─── Graph node schemas (camelCase) — the frontend contract ──────────────────

const baseGraphNodeSchema = z.object({
  label: z.string(),
  hoverLabel: z.string(),
  title: z.string(),
  type: z.string(),
  description: DescriptionSchema.nullish(),
  link: z.string().array(),
  imageSrc: z.string().nullable().optional(),
  tag: z.string().array().default([]),
})

export const organizationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--organization"),
  schema_organization_type: z.string().nullish(),
  alternate_name: z.string().array().optional().nullable(),
  address: AddressSchema.optional().nullable(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_funder: z.array(EntityReferenceSchema).optional().nullish(),
  field_couverture_geographique: z
    .array(TaxonomyCouvertureGeographiqueSchema)
    .optional()
    .nullish(),
})

export const gouvOrganizationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--government_organization"),
  schema_organization_type: z.string().nullish(),
  alternate_name: z.string().array().optional().nullable(),
  address: AddressSchema.optional().nullable(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_funder: EntityReferenceSchema.array().optional().nullish(),
  field_couverture_geographique: z
    .array(TaxonomyCouvertureGeographiqueSchema)
    .optional()
    .nullish(),
})

export const personNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--person"),
  member_of: z.array(EntityReferenceSchema).optional(),
  field_person_type: TaxonomyTermPersonSchema.optional().nullish(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_digital_domain: z
    .array(TaxonomyTermMethodesNumeriquesSchema)
    .optional()
    .nullish(),
  field_axe_si_membre_rsn: TaxonomyTermAxeRsnSchema.optional().nullish(),
  significant_link: z.array(LinkSchema).nullish(),
  email: z.string().nullish(),
})

export const datasetNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--dataset"),
  alternate_name: z.string().array().optional().nullable(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonPartialSchema.array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  email: EmailSchema.nullish(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_funder: EntityReferenceSchema.array().optional().nullish(),
  parent_organization: EntityReferenceSchema.array().optional(),
})

export const dataCatalogNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--data_catalog"),
  alternate_name: z.string().array().optional().nullable(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonPartialSchema.array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  email: EmailSchema.nullish(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_funder: EntityReferenceSchema.array().optional().nullish(),
  parent_organization: EntityReferenceSchema.array().optional(),
  field_sub_dataset: z
    .array(z.object({ type: z.string().optional(), id: z.string().optional(), title: z.string().optional() }))
    .optional(),
})

export const softwareApplicationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--software_application"),
  field_funder: EntityReferenceSchema.array().optional().nullish(),
  alternate_name: z.string().array().optional().nullable(),
  application_category: z.array(TaxonomyApplicationCategorySchema).optional(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonPartialSchema.array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  schema_email: z.string().nullish(),
  parent_organization: EntityReferenceSchema.array().optional(),
})

// Discriminated union for all graph node types
export const graphNodeSchema = z.discriminatedUnion("type", [
  organizationNodeSchema,
  gouvOrganizationNodeSchema,
  personNodeSchema,
  datasetNodeSchema,
  dataCatalogNodeSchema,
  softwareApplicationNodeSchema,
])

// ─── Type exports ────────────────────────────────────────────────────────────

export type OrganizationNode = z.infer<typeof organizationNodeSchema>
export type GouvOrganizationNode = z.infer<typeof gouvOrganizationNodeSchema>
export type PersonNode = z.infer<typeof personNodeSchema>
export type DatasetNode = z.infer<typeof datasetNodeSchema>
export type DataCatalogNode = z.infer<typeof dataCatalogNodeSchema>
export type SoftwareApplicationNode = z.infer<
  typeof softwareApplicationNodeSchema
>
export type GraphNodeData = z.infer<typeof graphNodeSchema>
export type Address = z.infer<typeof AddressSchema>
