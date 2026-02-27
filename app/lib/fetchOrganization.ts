import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { OrganizationSchema } from "./schema";

export async function fetchOrganization() {
  const orgParams = new DrupalJsonApiParams()
    .addFields("node--organization", [
      "title",
      "alternate_name",
      "sub_organization",
      "parent_organization",
      "schema_organization_type",
      "description",
      "significant_link",
      "metatag",
      "image",
      "schema_logo",
      "attributes",
      "field_funder",
      "field_organization_geographical",
      "address",
      "field_couverture_geographique",
    ])
    //.addFilter("status", "1")
    // Add Page Limit.
    .addFields("media--image", ["image"])
    .addFields("file--file", ["uri"])
    .addFields("node--person", ["title", "description", "same_as"])
    .addPageLimit(10000)
    .addInclude([
      "sub_organization",
      "schema_logo.image",
      "field_funder",
      "field_organization_geographical",
      "field_couverture_geographique",
    ])
    .addSort("created", "DESC");

  const orgsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--organization",
    {
      params: orgParams.getQueryObject(),
      locale: "fr",
      defaultLocale: "fr",
    }
  );
  return OrganizationSchema.array().safeParse(orgsData);
}
