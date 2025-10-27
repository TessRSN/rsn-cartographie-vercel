import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { OrganizationSchema } from "./schema";
import z from "zod";

export async function fetchOrganization() {
  const orgParams = new DrupalJsonApiParams()
    .addFields("node--organization", [
      "title",
      "alternate_name",
      "sub_organization",
      "parent_organization",
      "additional_type",
      "description",
      "significant_link",
      "metatag",
      "image",
      "attributes",
    ])
    //.addFilter("status", "1")
    // Add Page Limit.
    .addFields("node--person", ["title", "description", "same_as"])
    .addPageLimit(10000)
    .addInclude(["sub_organization", "logo"])
    .addSort("created", "DESC");

  const orgsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--organization",
    {
      params: orgParams.getQueryObject(),
    }
  );
  return OrganizationSchema.array().safeParse(orgsData);
}
