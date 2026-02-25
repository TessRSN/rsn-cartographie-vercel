import { z } from "zod";

const MetatagSchema = z.object({
  tag: z.string(),
  attributes: z.record(z.string(), z.string()),
});

const LinkSchema = z.object({
  uri: z.string(),
  title: z.string(),
  options: z.array(z.unknown()),
});

const SelfLinkSchema = z.object({
  self: z.object({
    href: z.string(),
  }),
});

const ResourceIdObjMetaSchema = z.object({
  drupal_internal__target_id: z.number(),
});

const FileUriSchema = z.object({
  value: z.string(),
  url: z.string(),
});

const FileResourceIdObjMetaSchema = z.object({
  alt: z.string(),
  title: z.string(),
  width: z.number(),
  height: z.number(),
  drupal_internal__target_id: z.number(),
});

const FileSchema = z.object({
  type: z.literal("file--file"),
  id: z.string(),
  uri: FileUriSchema.nullish(),
  links: SelfLinkSchema.nullish(),
  resourceIdObjMeta: FileResourceIdObjMetaSchema,
});

const MediaImageSchema = z.object({
  type: z.literal("media--image"),
  id: z.string(),
  links: SelfLinkSchema,
  resourceIdObjMeta: ResourceIdObjMetaSchema,
  image: FileSchema,
  relationshipNames: z.string().array().optional(),
});

const MediaImageReferenceSchema = z.object({
  type: z.literal("media--image"),
  id: z.string(),
  resourceIdObjMeta: ResourceIdObjMetaSchema,
});

const DescriptionSchema = z.object({
  value: z.string(),
  format: z.string(),
  processed: z.string(),
  summary: z.string(),
});

const AddressSchema = z.object({
  langcode: z.string().nullable().optional(),
  country_code: z.string().optional(),
  administrative_area: z.string().optional(),
  locality: z.string().optional(),
  postal_code: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
});

const TaxonomyTermReferenceSchema = z.object({
  type: z.string(),
  id: z.string(),
  resourceIdObjMeta: ResourceIdObjMetaSchema,
});

const TaxonomyTermPersonSchema = z.object({
  type: z.literal("taxonomy_term--person"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyTermHealthResearchCategorySchema = z.object({
  type: z.literal("taxonomy_term--health_research_category"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyTermMethodesNumeriquesSchema = z.object({
  type: z.literal("taxonomy_term--methodes_numeriques"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyTermAxeRsnSchema = z.object({
  type: z.literal("taxonomy_term--axe_rsn"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyTermGeographicalSchema = z.object({
  type: z.literal("taxonomy_term--geographical"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyCouvertureGeographiqueSchema = z.object({
  type: z.literal("taxonomy_term--couverture_geographique"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyApplicationCategorySchema = z.object({
  type: z.literal("taxonomy_term--software_type"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomySoftwareLicenceSchema = z.object({
  type: z.literal("taxonomy_term--accessibility"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomySoftwareModeleAccesSchema = z.object({
  type: z.literal("taxonomy_term--modele_acces"),
  id: z.string(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const EmailSchema = z.object({
  schema_email: z.string().email(),
});

const BaseOrganizationSchema = z.object({
  type: z.literal("node--organization"),
  id: z.string(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  description: DescriptionSchema.nullable(),
  address: AddressSchema.optional().nullable(),
  alternate_name: z.string().array().optional().nullable(),
  schema_organization_type: z.string().catch(""),
  significant_link: z.array(LinkSchema),
  links: z
    .object({
      self: z.object({
        href: z.string(),
      }),
    })
    .optional(),
  schema_logo: MediaImageSchema.nullish(),
  relationshipNames: z.string().array(),
});

const BaseGouvOrganizationSchema = z.object({
  type: z.literal("node--government_organization"),
  id: z.string(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  description: DescriptionSchema.nullable(),
  schema_address: AddressSchema.optional().nullable(),
  alternate_name: z.string().array().optional().nullable(),
  schema_organization_type: z.string().catch(""),
  significant_link: z.array(LinkSchema),
  links: z
    .object({
      self: z.object({
        href: z.string(),
      }),
    })
    .optional(),
  schema_logo: MediaImageSchema.nullish(),
  relationshipNames: z.string().array(),
});

const NodeReferenceSchema = z.object({
  type: z.string(),
  id: z.string(),
  resourceIdObjMeta: ResourceIdObjMetaSchema.optional(),
});

const MissingReferenceSchema = z.object({
  type: z.literal("unknown"),
  id: z.literal("missing"),
  resourceIdObjMeta: z.any(),
});

// Create a union type for organization references
const OrganizationReferenceSchema = z.union([
  BaseOrganizationSchema.partial().required({ type: true, id: true }),
  BaseGouvOrganizationSchema.partial().required({ type: true, id: true }),
  NodeReferenceSchema, // Fallback for any other reference format
  MissingReferenceSchema,
]);

const OrganizationSchema = z.object({
  ...BaseOrganizationSchema.shape,
  sub_organization: z.array(OrganizationReferenceSchema).optional(),
  parent_organization: z.array(OrganizationReferenceSchema).optional(),
  field_funder: z.array(OrganizationReferenceSchema).optional().nullish(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_couverture_geographique: z
    .array(TaxonomyCouvertureGeographiqueSchema)
    .optional()
    .nullish(),
});

const GouvOrganizationSchema = z.object({
  ...BaseGouvOrganizationSchema.shape,
  sub_organization: z.array(OrganizationReferenceSchema).optional(),
  parent_organization: z.array(OrganizationReferenceSchema).optional(),
  field_funder: z.array(OrganizationReferenceSchema).optional().nullish(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_couverture_geographique: z
    .array(TaxonomyCouvertureGeographiqueSchema)
    .optional()
    .nullish(),
});

const PersonSchema = z.object({
  type: z.literal("node--person"),
  id: z.string(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  description: DescriptionSchema.nullable(),
  member_of: z.array(OrganizationReferenceSchema).optional(),
  same_as: LinkSchema.array(),
  links: SelfLinkSchema,
  significant_link: z.array(LinkSchema).nullish(),
  image: MediaImageSchema.partial().nullish().optional(),
  relationshipNames: z.string().array(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_digital_domain: z
    .array(TaxonomyTermMethodesNumeriquesSchema)
    .optional()
    .nullish(),
  field_axe_si_membre_rsn: TaxonomyTermAxeRsnSchema.optional().nullish(),
  field_person_type: TaxonomyTermPersonSchema.optional().nullish(),
  email: EmailSchema.nullish(),
});

const DatasetSchema = z.object({
  type: z.literal("node--dataset"),
  id: z.string(),
  title: z.string(),
  description: DescriptionSchema.nullish(),
  alternate_name: z.string().array().optional().nullable(),
  significant_link: z.array(LinkSchema),
  metatag: z.array(MetatagSchema),
  member_of: z.array(OrganizationReferenceSchema).optional(),
  links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  parent_organization: z.array(OrganizationReferenceSchema).optional(),
  schema_logo: MediaImageSchema.nullable(),
  relationshipNames: z.string().array(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_dataset_contributors: PersonSchema.partial().array().optional(),
  field_funder: z.array(OrganizationReferenceSchema).optional().nullish(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonSchema.partial().array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  email: EmailSchema.nullish(),
});

const DataCatalogSchema = z.object({
  type: z.literal("node--data_catalog"),
  id: z.string(),
  title: z.string(),
  description: DescriptionSchema.nullish(),
  alternate_name: z.string().array().optional().nullable(),
  significant_link: z.array(LinkSchema),
  metatag: z.array(MetatagSchema),
  member_of: z.array(OrganizationReferenceSchema).optional(),
  links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  parent_organization: z.array(OrganizationReferenceSchema).optional(),
  field_sub_dataset: DatasetSchema.partial().array().optional(),
  schema_logo: MediaImageSchema.nullable(),
  relationshipNames: z.string().array(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_dataset_contributors: PersonSchema.partial().array().optional(),
  field_funder: z.array(OrganizationReferenceSchema).optional().nullish(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonSchema.partial().array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  email: EmailSchema.nullish(),
});

const SoftwareApplicationSchema = z.object({
  type: z.literal("node--software_application"),
  id: z.string(),
  description: DescriptionSchema.nullish(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  significant_link: z.array(LinkSchema),
  alternate_name: z.string().array().nullable().optional(),
  links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  parent_organization: z.array(OrganizationReferenceSchema).optional(),
  author: PersonSchema.partial().array().optional(),
  schema_logo: MediaImageSchema.optional().nullable(),
  relationshipNames: z.string().array(),
  field_funder: z.array(OrganizationReferenceSchema).optional(),
  application_category: z.array(TaxonomyApplicationCategorySchema).optional(),
  field_licence: TaxonomySoftwareLicenceSchema.optional().nullable(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  schema_email: z.string().nullish(),
});

// Base graph node schema with common fields
const baseGraphNodeSchema = z.object({
  label: z.string(),
  hoverLabel: z.string(),
  title: z.string(),
  type: z.string(),
  description: DescriptionSchema.nullish(),
  link: z.string().array(),
  imageSrc: z.string().nullable().optional(),
  tag: z.string().array().default([]),
});

// Discriminated union schemas for different node types
export const organizationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--organization"),
  schema_organization_type: z.string().nullish(),
  alternate_name: z.string().array().optional().nullable(),
  address: AddressSchema.optional().nullable(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_funder: z.array(OrganizationReferenceSchema).optional().nullish(),
  field_couverture_geographique: z
    .array(TaxonomyCouvertureGeographiqueSchema)
    .optional()
    .nullish(),
});

export const gouvOrganizationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--government_organization"),
  schema_organization_type: z.string().nullish(),
  alternate_name: z.string().array().optional().nullable(),
  address: AddressSchema.optional().nullable(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_funder: OrganizationReferenceSchema.array().optional().nullish(),
  field_couverture_geographique: z
    .array(TaxonomyCouvertureGeographiqueSchema)
    .optional()
    .nullish(),
});

export const personNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--person"),
  member_of: z.array(OrganizationReferenceSchema).optional(),
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
});

export const datasetNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--dataset"),
  alternate_name: z.string().array().optional().nullable(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonSchema.partial().array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  email: EmailSchema.nullish(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_funder: OrganizationReferenceSchema.array().optional().nullish(),
  parent_organization: OrganizationReferenceSchema.array().optional(),
});

export const dataCatalogNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--data_catalog"),
  alternate_name: z.string().array().optional().nullable(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonSchema.partial().array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  email: EmailSchema.nullish(),
  field_applied_domain: z
    .array(TaxonomyTermHealthResearchCategorySchema)
    .optional()
    .nullish(),
  field_funder: OrganizationReferenceSchema.array().optional().nullish(),
  parent_organization: OrganizationReferenceSchema.array().optional(),
  field_sub_dataset: DatasetSchema.partial().array().optional(),
});

export const softwareApplicationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--software_application"),
  field_funder: OrganizationReferenceSchema.array().optional().nullish(),
  alternate_name: z.string().array().optional().nullable(),
  application_category: z.array(TaxonomyApplicationCategorySchema).optional(),
  field_licence: TaxonomySoftwareLicenceSchema.nullish(),
  author: PersonSchema.partial().array().optional(),
  field_modele_acces: TaxonomySoftwareModeleAccesSchema.optional().nullable(),
  schema_email: z.string().nullish(),
  parent_organization: OrganizationReferenceSchema.array().optional(),
});

// Discriminated union for all graph node types
export const graphNodeSchema = z.discriminatedUnion("type", [
  organizationNodeSchema,
  gouvOrganizationNodeSchema,
  personNodeSchema,
  datasetNodeSchema,
  dataCatalogNodeSchema,
  softwareApplicationNodeSchema,
]);

// Export the main schema
export {
  SoftwareApplicationSchema,
  OrganizationSchema,
  GouvOrganizationSchema,
  PersonSchema,
  DatasetSchema,
  DataCatalogSchema,
};

// Type exports
export type OrganizationNode = z.infer<typeof organizationNodeSchema>;
export type GouvOrganizationNode = z.infer<typeof gouvOrganizationNodeSchema>;
export type PersonNode = z.infer<typeof personNodeSchema>;
export type DatasetNode = z.infer<typeof datasetNodeSchema>;
export type DataCatalogNode = z.infer<typeof dataCatalogNodeSchema>;
export type SoftwareApplicationNode = z.infer<
  typeof softwareApplicationNodeSchema
>;
export type GraphNodeData = z.infer<typeof graphNodeSchema>;

// Type inference
export type SoftwareApplication = z.infer<typeof SoftwareApplicationSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type GouvOrganization = z.infer<typeof GouvOrganizationSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type DataCatalog = z.infer<typeof DataCatalogSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
export type Address = z.infer<typeof AddressSchema>;
