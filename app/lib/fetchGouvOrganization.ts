import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { GouvOrganizationSchema } from "./schema";

export async function fetchGouvOrganization() {
  const gouvOrgParams = new DrupalJsonApiParams()
    .addFields("node--government_organization", [
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
      "field_organization_geographical",
      "schema_address",
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
      "field_organization_geographical",
      "field_couverture_geographique",
    ])
    .addSort("created", "DESC");

  const gouvOrgsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--government_organization",
    {
      params: gouvOrgParams.getQueryObject(),
      locale: "fr",
      defaultLocale: "fr",
    },
  );
  return GouvOrganizationSchema.array().safeParse(gouvOrgsData);
}
