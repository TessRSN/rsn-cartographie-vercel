import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { PersonSchema } from "./schema";

export async function fetchPerson() {
  const personParams = new DrupalJsonApiParams()
    .addFields("node--person", [
      "title",
      "description",
      "member_of",
      "same_as",
      "image",
      "metatag",
      "field_applied_domain",
      "field_digital_domain",
      "field_axe_si_membre_rsn",
      "field_person_type",
      "significant_link",
    ])
    .addFields("node--organization", [
      "id",
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
    .addFields("node--government_organization", [
      "id",
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
    .addInclude([
      "field_person_type",
      "field_applied_domain",
      "field_digital_domain",
      "field_axe_si_membre_rsn",
      "member_of",
      "image.image",
    ])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addSort("created", "DESC");

  const personsData = await drupal.getResourceCollection<DrupalNode[]>(
    "node--person",
    {
      params: personParams.getQueryObject(),
      locale: "fr",
      defaultLocale: "fr",
    },
  );
  // Validate that the data matches the expected schema
  return PersonSchema.array().safeParse(personsData);
}
