import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { OrganizationSchema, SoftwareApplicationSchema } from "./schema";
import z from "zod";
import util from "util";

export async function fetchSoftwareApplication() {
  const softappParams = new DrupalJsonApiParams()
    .addFields("node--software_application", [
      "title",
      "alternate_name",
      "additional_type",
      "description",
      "author",
      "significant_link",
      "metatag",
      "operating_system",
      "schema_logo",
      "field_funder",
    ])
    .addFields("taxonomy_term--software_type", ["name", "drupal_internal__tid"])
    .addFields("node--person", ["title", "description", "same_as"])
    .addFields("node--organization", [
      "title",
      "alternate_name",
      //"sub_organization",
      //"parent_organization",
      "additional_type",
      "description",
      "significant_link",
      "metatag",
      "image",
      "attributes",
      "field_funder",
    ])
    .addFields("media--image", ["image"])
    .addFields("file--file", ["uri"])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude([
      "author",
      "application_category",
      "schema_logo.image",
      "author",
      "field_funder",
    ])
    .addSort("created", "DESC");

  const softwareApplicationData = await drupal.getResourceCollection<
    DrupalNode[]
  >("node--software_application", {
    params: softappParams.getQueryObject(),
  });

  // console.log(util.inspect(softwareApplicationData, { depth: null }));
  return SoftwareApplicationSchema.array().safeParse(softwareApplicationData);
}
