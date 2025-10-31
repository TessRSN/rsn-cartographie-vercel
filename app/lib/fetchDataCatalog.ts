import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { DatasetSchema } from "./schema";
import util from "util";

export async function fetchDataset() {
  // Information Dataset
  const datasetParams = new DrupalJsonApiParams()
    .addFields("node--data_catalog", [
      "title",
      "description",
      "alternate_name",
      "significant_link",
      "metatag",
      "schema_logo",
      "field_dataset_contributors",
    ])
    .addFields("node--person", ["title", "description", "same_as"])
    .addFields("media--image", ["image"])
    .addFields("file--file", ["uri"])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude(["author", "schema_logo.image", "field_dataset_contributors"])
    .addSort("created", "DESC");

  const dataCatalogData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--data_catalog",
    {
      params: datasetParams.getQueryObject(),
    }
  );
  //  console.log(util.inspect(datasetsData, { depth: null }));
  return DatasetSchema.array().safeParse(dataCatalogData);
}
