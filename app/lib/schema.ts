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

const DescriptionSchema = z.object({
  value: z.string(),
  format: z.string(),
  processed: z.string(),
  summary: z.string(),
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
});

const OrganizationSchema = z.object({
  ...BaseOrganizationSchema.shape,
  sub_organization: BaseOrganizationSchema.partial().array().optional(),
  parent_organization: BaseOrganizationSchema.partial().array().optional(),
});

const PersonSchema = z.object({
  type: z.literal("node--person"),
  id: z.string().uuid(),
  title: z.string(),
  metatag: z.array(MetatagSchema),
  description: DescriptionSchema.nullable(),
  same_as: LinkSchema.array(),
  links: SelfLinkSchema,
  image: MediaImageSchema.partial().nullish(),
  field_membership_rsn: z.string().optional().nullable(),
  //member_of: z.array(OrganizationSchema),
  relationshipNames: z.array(z.string()),
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
  field_dataset_contributors: PersonSchema.partial().array().optional(),
});

const SoftwareApplicationSchema = z.object({
  type: z.literal("node--software_application"),
  id: z.uuid(),
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
});

// Base graph node schema with common fields
const baseGraphNodeSchema = z.object({
  label: z.string(),
  hoverLabel: z.string(),
  title: z.string(),
  type: z.string(),
  description: DescriptionSchema.nullish(),
  link: z.array(z.string()),
  imageSrc: z.string().nullable(),
});

// Discriminated union schemas for different node types
const organizationNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--organization"),
  additional_type: z.string(),
});

const personNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--person"),
});

const datasetNodeSchema = baseGraphNodeSchema.extend({
  type: z.literal("node--dataset"),
});

const softwareApplicationNodeSchema = baseGraphNodeSchema.extend({
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
