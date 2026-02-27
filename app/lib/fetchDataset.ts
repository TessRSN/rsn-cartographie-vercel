import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { DatasetSchema } from "./schema";

export async function fetchDataset() {
  // Information Dataset
  const datasetParams = new DrupalJsonApiParams()
    .addFields("node--dataset", [
      "title",
      "description",
      "alternate_name",
      "significant_link",
      "metatag",
      "schema_logo",
      "parent_organization",
      "field_dataset_contributors",
      "field_applied_domain",
      "author",
      "field_funder",
      "field_licence",
      "field_modele_acces",
      "schema_email",
    ])
    .addFields("node--person", ["title", "description", "same_as"])
    .addFields("media--image", ["image"])
    .addFields("node--organization", ["title"])
    .addFields("file--file", ["uri"])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude([
      "author",
      "schema_logo.image",
      "field_funder",
      "field_licence",
      "field_applied_domain",
      "field_modele_acces",
    ])
    .addSort("created", "DESC");

  const datasetsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--dataset",
    {
      params: datasetParams.getQueryObject(),
    }
  );
  return DatasetSchema.array().safeParse(datasetsData);
}
