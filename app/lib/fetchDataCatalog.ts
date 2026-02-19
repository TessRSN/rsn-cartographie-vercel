import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { DataCatalogSchema, DatasetSchema } from "./schema";
import util from "util";

export async function fetchDataCatalog() {
  // Information Dataset
  const dataCatalogParams = new DrupalJsonApiParams()
    .addFields("node--data_catalog", [
      "title",
      "description",
      "alternate_name",
      "additional_type",
      "significant_link",
      "metatag",
      "schema_logo",
      "parent_organization",
      "field_dataset_contributors",
      "field_sub_dataset",
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
    .addFields("node--dataset", ["title"])
    .addFields("file--file", ["uri"])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude([
      "author",
      "schema_logo.image",
      "field_funder",
      "field_sub_dataset",
      "field_modele_acces",
    ])
    .addSort("created", "DESC");

  const dataCatalogsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--data_catalog",
    {
      params: dataCatalogParams.getQueryObject(),
    },
  );
  //  console.log(util.inspect(dataCatalogsData, { depth: null }));
  return DataCatalogSchema.array().safeParse(dataCatalogsData);
}
