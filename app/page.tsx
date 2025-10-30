import { NextDrupal } from "next-drupal";
import { DiagramRoot } from "@/components/DiagramRoot";
import { fetchOrganization } from "./lib/fetchOrganization";
import { fetchPerson } from "./lib/fetchPerson";
import { fetchDataset } from "./lib/fetchDataset";
import { fetchSoftwareApplication } from "./lib/fetchSoftwareApplication";
import { GraphEdge, GraphNode } from "reagraph";
import { API_ENDPOINT } from "./lib/drupal";
import util from "util";
import { error } from "console";
import { PersonNode, personNodeSchema } from "./lib/schema";

export default async function Home() {
  const [
    organizationResults,
    personResults,
    datasetResults,
    softwareApplicationResults,
  ] = await Promise.all([
    fetchOrganization(),
    fetchPerson(),
    fetchDataset(),
    fetchSoftwareApplication(),
  ]);

  //console.log({ softwareApplicationError });
  /*for (const org of orgs) {
    console.log(util.inspect(org, { depth: null }));
    console.log("===================");
    console.log("===================");
    console.log("===================");
    break;
  }*/

  /*for (const person of personResults) {
    console.log(util.inspect(person, { depth: null }));
    console.log("===================");
    console.log("===================");
    console.log("===================");
  }*/

  /* if (datasets) {
    for (const dataset of datasets) {
      console.log(util.inspect(dataset, { depth: null }));
      console.log("===================");
      console.log("===================");
      console.log("===================");
      break;
    }
  }*/

  /*if (softwareApplication) {
    for (const softapp of softwareApplication) {
      console.log(util.inspect(softapp, { depth: null }));
      console.log("===================");
      console.log("===================");
      console.log("===================");
    }
  }*/

  // Conversion des organisations vers des noeuds du graph
  let nodes: GraphNode[] = [];
  if (organizationResults.data) {
    //1. extraire la creation des nodes (plus facile a lire)
    const organizationNodes = organizationResults.data.map((org) => ({
      id: org.id,
      label: org.alternate_name.length > 0 ? org.alternate_name[0] : org.title,
      data: {
        type: org.type,
        label:
          org.alternate_name.length > 0 ? org.alternate_name[0] : org.title,
        hoverLabel: org.title,
        title: org.title,
        additional_type: org.additional_type,
        funder: org.field_funder,
        geo_location: org.field_organization_geographical,
        description: org.description,
        link: org.significant_link.map((link) => {
          return link.uri;
        }),
        imageSrc:
          org.metatag.find(
            (tag) => tag.tag === "link" && tag.attributes.rel === "image_src"
          )?.attributes.href || null,
      },
      fill: "#0061AF",
    }));

    nodes = nodes.concat(organizationNodes);
  } else {
    console.log(organizationResults.error);
  }

  if (personResults.data) {
    const personNodes = personResults.data.map((person) => {
      const data: PersonNode = {
        type: person.type,
        label: person.title,
        hoverLabel: person.title,
        title: person.title,
        description: person.description,
        link: person.same_as.map((link) => {
          return link.uri;
        }),
        field_applied_domain: person.field_applied_domain,
        field_digital_domain: person.field_digital_domain,
        field_person_type: person.field_person_type,
        field_axe_si_membre_rsn: person.field_axe_si_membre_rsn,
      };

      return {
        id: person.id,
        data: personNodeSchema.parse(data),
        label: person.title,
        fill: "#00A759",
      };
    });

    nodes = nodes.concat(personNodes);
  } else {
    console.log(personResults.error);
  }

  // Conversion des dataset en noeuds du graph
  /*if (datasetResults.data) {
    nodes = nodes.concat(
      datasetResults.data.map((dataset) => ({
        id: dataset.id,
        data: datasetNodeSchema.parse({
          type: dataset.type,
          label: dataset.title,
          hoverLabel: dataset.title,
          title: dataset.title,
          description: dataset.description,
          link: dataset.significant_link.map((link) => {
            return link.uri;
          }),
          imageSrc:
            dataset.metatag.find(
              (tag) => tag.tag === "link" && tag.attributes.rel === "image_src"
            )?.attributes.href || null,
        }),
        label: dataset.title,
        fill: "#FFCC4E",
      }))
    );
  } else {
    console.log(datasetResults.error);
  }*/

  //Conversion des Software Application en noeuds du graph
  if (softwareApplicationResults.data) {
    nodes = nodes.concat(
      softwareApplicationResults.data.map((softapp) => {
        //nouvelle methode
        let imageSrc = softapp.schema_logo?.image.uri.url;
        if (!imageSrc) {
          imageSrc = softapp.metatag.find(
            (tag) => tag.tag === "link" && tag.attributes.rel === "image_src"
          )?.attributes.href;
        } else {
          imageSrc = `${API_ENDPOINT}/${imageSrc}`;
        }
        return {
          id: softapp.id,
          label:
            softapp.alternate_name.length > 0
              ? softapp.alternate_name[0]
              : softapp.title,
          data: {
            type: softapp.type,
            label:
              softapp.alternate_name.length > 0
                ? softapp.alternate_name[0]
                : softapp.title,
            hoverLabel: softapp.title,
            link: "",
            title: softapp.title,

            description: softapp.description,
            funder: softapp.field_funder,
            imageSrc,
          },
          fill: "#EE3124",
        };
      })
    );
  } else {
    console.log(softwareApplicationResults.error);
  }

  const createEdges = <T extends { id: string | number }>(
    items: T[],
    relationKey: keyof T,
    color: string
  ) =>
    items.flatMap((item) => {
      const related = item[relationKey];

      // If it doesn't exist, return empty array
      if (!related) return [];

      // If it's a single object, wrap it in an array
      const relatedArray = Array.isArray(related) ? related : [related];

      return relatedArray
        .filter((rel): rel is { id: string | number } => rel && "id" in rel)
        .map((rel) => ({
          id: `${item.id}-${rel.id}`,
          source: String(item.id),
          target: String(rel.id),
          fill: color,
        })) as GraphEdge[];
    });

  let edges: GraphEdge[] = [];

  edges = edges.concat(
    createEdges(organizationResults?.data ?? [], "sub_organization", "#64748B")
  );

  edges = edges.concat(
    createEdges(
      organizationResults?.data ?? [],
      "parent_organization",
      "#64748B"
    )
  );

  edges = edges.concat(
    createEdges(organizationResults?.data ?? [], "field_funder", "#64748B")
  );

  edges = edges.concat(
    createEdges(
      organizationResults?.data ?? [],
      "parent_organization",
      "#64748B"
    )
  );
  /*edges = edges.concat(
    createEdges(personResults?.data ?? [], "member_of", "#64748B")
  );*/
  //edges.concat(createEdges(personResults?.data ?? [], "subject_of", "#64748B"));
  edges = edges.concat(
    createEdges(
      datasetResults?.data ?? [],
      "field_dataset_contributors",
      "#64748B"
    )
  );
  edges = edges.concat(
    createEdges(softwareApplicationResults?.data ?? [], "author", "#64748B")
  );
  edges = edges.concat(
    createEdges(
      softwareApplicationResults?.data ?? [],
      "field_funder",
      "#64748B"
    )
  );

  //deduplicate edges
  edges = edges.filter(
    (edge, index, self) =>
      index ===
      self.findIndex(
        (e) => e.source === edge.source && e.target === edge.target
      )
  );

  return (
    <div>
      <DiagramRoot nodes={nodes} edges={edges}></DiagramRoot>
    </div>
  );
}
