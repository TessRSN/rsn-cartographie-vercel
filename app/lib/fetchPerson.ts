import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { drupal } from "./drupal";
import { DrupalNode } from "next-drupal";
import { PersonSchema } from "./schema";
import z from "zod";
import util from "util";

export async function fetchPerson() {
  //etape 1, on demande les datas a drupal
  const personParams = new DrupalJsonApiParams()
    .addFields("node--person", [
      "title",
      "description",
      //"member_of",
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
    ])
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
      locale: "fr",
      defaultLocale: "fr",
    }
  );
  //console.log("field_axe_si_membre_rsn:", JSON.stringify(personsData[5]?.field_axe_si_membre_rsn, null, 2));
  //console.log(util.inspect(personsData, { depth: null }));

  //etape 2 on s'assure que les data sont dans la forme attendu!
  return PersonSchema.array().safeParse(personsData);
}
