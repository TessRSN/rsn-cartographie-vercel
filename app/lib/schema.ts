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
  id: z.string().uuid(),
  uri: FileUriSchema,
  links: SelfLinkSchema,
  resourceIdObjMeta: FileResourceIdObjMetaSchema,
});

const MediaImageSchema = z.object({
  type: z.literal("media--image"),
  id: z.string().uuid(),
  links: SelfLinkSchema,
  resourceIdObjMeta: ResourceIdObjMetaSchema,
  image: FileSchema,
  relationshipNames: z.array(z.string()).optional(),
});

const MediaImageReferenceSchema = z.object({
  type: z.literal("media--image"),
  id: z.string().uuid(),
  resourceIdObjMeta: ResourceIdObjMetaSchema,
});

const DescriptionSchema = z.object({
  value: z.string(),
  format: z.string(),
  processed: z.string(),
  summary: z.string(),
});

const TaxonomyTermReferenceSchema = z.object({
  type: z.string(),
  id: z.string().uuid(),
  resourceIdObjMeta: ResourceIdObjMetaSchema,
});

const TaxonomyTermPersonSchema = z.object({
  type: z.literal("taxonomy_term--person"),
  id: z.string().uuid(),
  drupal_internal__tid: z.number(),
  name: z.string(),
});

const TaxonomyTermHealthResearchCategorySchema = z
  .object({
    type: z.literal("taxonomy_term--health_research_category"),
    id: z.string().uuid(),
    drupal_internal__tid: z.number(),
    name: z.string(),
  })
  .passthrough();

const TaxonomyTermMethodesNumeriquesSchema = z
  .object({
    type: z.literal("taxonomy_term--methodes_numeriques"),
    id: z.string().uuid(),
    drupal_internal__tid: z.number(),
    name: z.string(),
  })
  .passthrough();

const TaxonomyTermAxeRsnSchema = z
  .object({
    type: z.literal("taxonomy_term--axe_rsn"),
    id: z.string().uuid(),
    drupal_internal__tid: z.number(),
    name: z.string(),
  })
  .passthrough();

const TaxonomyTermGeographicalSchema = z.object({
  type: z.literal("taxonomy_term--geographical"),
  id: z.string().uuid(),
  resourceIdObjMeta: ResourceIdObjMetaSchema,
});

const BaseOrganizationSchema = z.object({
  type: z.literal("node--organization"),
  id: z.string().uuid(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  description: DescriptionSchema.nullable(),
  alternate_name: z.array(z.string()),
  additional_type: z.string().catch(""),
  significant_link: z.array(LinkSchema),
  links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  logo: MediaImageSchema.nullish(),
  relationshipNames: z.array(z.string()),
  field_applied_domain: z.array(TaxonomyTermReferenceSchema).optional(),
  field_digital_domain: z.array(TaxonomyTermReferenceSchema).optional(),
});

const OrganizationSchema = z.object({
  ...BaseOrganizationSchema.shape,
  sub_organization: BaseOrganizationSchema.partial().array().optional(),
  parent_organization: BaseOrganizationSchema.partial().array().optional(),
  field_funder: BaseOrganizationSchema.partial().array().optional().nullish(),
  field_organization_geographical: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
  field_couverture_geographique: z
    .array(TaxonomyTermGeographicalSchema)
    .optional()
    .nullish(),
});

const PersonSchema = z.object({
  type: z.literal("node--person"),
  id: z.string().uuid(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  description: DescriptionSchema.nullable(),
  same_as: LinkSchema.array(),
  links: SelfLinkSchema,
  image: MediaImageSchema.partial().nullish().optional(),
  relationshipNames: z.array(z.string()),
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
});

const DatasetSchema = z.object({
  type: z.literal("node--dataset"),
  id: z.string().uuid(),
  title: z.string(),
  description: DescriptionSchema.nullish(),
  alternate_name: z.array(z.string()),
  significant_link: z.array(LinkSchema),
  metatag: z.array(MetatagSchema),
  member_of: OrganizationSchema.partial().array().optional(),
  links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  schema_logo: MediaImageSchema.nullable(),
  relationshipNames: z.array(z.string()),
  field_applied_domain: z.array(TaxonomyTermReferenceSchema).optional(),
  field_digital_domain: z.array(TaxonomyTermReferenceSchema).optional(),
  field_dataset_contributors: PersonSchema.partial().array().optional(),
  field_funder: BaseOrganizationSchema.partial().array().optional().nullish(),
});

const SoftwareApplicationSchema = z.object({
  type: z.literal("node--software_application"),
  id: z.uuid(),
  description: DescriptionSchema.nullish(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  significant_link: z.array(LinkSchema),
  alternate_name: z.array(z.string()),
  links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  author: PersonSchema.partial().array().optional(),
  schema_logo: MediaImageSchema.nullable(),
  relationshipNames: z.array(z.string()),
  field_applied_domain: z
    .array(TaxonomyTermReferenceSchema)
    .optional()
    .nullish(),
  field_digital_domain: z
    .array(TaxonomyTermReferenceSchema)
    .optional()
    .nullish(),
  field_axe_si_membre_rsn: TaxonomyTermAxeRsnSchema.optional().nullish(),
  field_funder: BaseOrganizationSchema.partial().array().optional().nullish(),
});

// Base graph node schema with common fields
const baseGraphNodeSchema = z.object({
  label: z.string(),
  hoverLabel: z.string(),
  title: z.string(),
  type: z.string(),
  description: DescriptionSchema.nullish(),
  link: z.array(z.string()),
  imageSrc: z.string().nullable().optional(),
});

// Discriminated union schemas for different node types
export const organizationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--organization"),
  additional_type: z.string(),
});

export const personNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--person"),
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
});

export const datasetNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--dataset"),
});

export const softwareApplicationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--software_application"),
});

// Discriminated union for all graph node types
export const graphNodeSchema = z.discriminatedUnion("type", [
  organizationNodeSchema,
  personNodeSchema,
  datasetNodeSchema,
  softwareApplicationNodeSchema,
]);

// Export the main schema
export {
  SoftwareApplicationSchema,
  OrganizationSchema,
  PersonSchema,
  DatasetSchema,
};

// Type exports
export type OrganizationNode = z.infer<typeof organizationNodeSchema>;
export type PersonNode = z.infer<typeof personNodeSchema>;
export type DatasetNode = z.infer<typeof datasetNodeSchema>;
export type SoftwareApplicationNode = z.infer<
  typeof softwareApplicationNodeSchema
>;
export type GraphNodeData = z.infer<typeof graphNodeSchema>;

// Type inference
export type SoftwareApplication = z.infer<typeof SoftwareApplicationSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
