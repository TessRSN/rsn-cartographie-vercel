import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { PersonSchema } from "./schema";
import z from "zod";
import util from "util";

export async function fetchPerson() {
  const personParams = new DrupalJsonApiParams()
    .addFields("node--person", [
      "title",
      "description",
      //"member_of",
      "same_as",
      "image",
      "metatag",
      "field_membership_rsn",
    ])
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
      "logo",
    ])
    .addFields("media--image", ["image"])
    .addFields("file--file", ["uri"])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude([
      /*"member_of"*/
    ])
    .addSort("created", "DESC");

  const personsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--person",
    {
      params: personParams.getQueryObject(),
    }
  );
  console.log(util.inspect(personsData, { depth: null }));
  return PersonSchema.array().safeParse(personsData);
}
