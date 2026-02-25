import { NextDrupal } from "next-drupal";
import { DiagramRoot } from "@/components/DiagramRoot";
import { fetchOrganization } from "./lib/fetchOrganization";
import { fetchGouvOrganization } from "./lib/fetchGouvOrganization";
import { fetchPerson } from "./lib/fetchPerson";
import { fetchDataset } from "./lib/fetchDataset";
import { fetchSoftwareApplication } from "./lib/fetchSoftwareApplication";
import { GraphEdge, GraphNode } from "reagraph";
import { API_ENDPOINT } from "./lib/drupal";
import util from "util";
import { error } from "console";
import {
  OrganizationNode,
  organizationNodeSchema,
  GouvOrganizationSchema,
  GouvOrganizationNode,
  PersonNode,
  personNodeSchema,
  SoftwareApplicationNode,
  softwareApplicationNodeSchema,
  DatasetNode,
  datasetNodeSchema,
  DataCatalogNode,
  DataCatalogSchema,
  dataCatalogNodeSchema,
  gouvOrganizationNodeSchema,
} from "./lib/schema";
import { fetchDataCatalog } from "./lib/fetchDataCatalog";

export default async function Home() {
  const [
    organizationResults,
    gouvOrganizationResults,
    personResults,
    datasetResults,
    softwareApplicationResults,
    dataCatalogResults,
  ] = await Promise.all([
    fetchOrganization(),
    fetchGouvOrganization(),
    fetchPerson(),
    fetchDataset(),
    fetchSoftwareApplication(),
    fetchDataCatalog(),
  ]);

  // Conversion des organisations vers des noeuds du graph
  let nodes: GraphNode[] = [];

  if (organizationResults.data) {
    //1. extraire la creation des nodes (plus facile a lire)
    const organizationNodes = organizationResults.data.map((org) => {
      // S'assurer que dans Drupal, configuration JSON:API, que logo est bien ecrit schema_logo
      let imageSrc = org.schema_logo?.image.uri?.url;
      if (!imageSrc) {
        imageSrc = org.metatag.find(
          (tag) => tag.tag === "link" && tag.attributes.rel === "image_src",
        )?.attributes.href;
      } else {
        imageSrc = `${API_ENDPOINT}/${imageSrc}`;
      }
      const data: OrganizationNode = {
        type: org.type,
        label: org.alternate_name?.length ? org.alternate_name[0] : org.title,
        hoverLabel: org.title,
        alternate_name: org.alternate_name,
        title: org.title,
        address: org.address,
        schema_organization_type: org.schema_organization_type,
        field_funder: org.field_funder,
        field_organization_geographical: org.field_organization_geographical,
        field_couverture_geographique: org.field_couverture_geographique,
        description: org.description,
        link: org.significant_link.map((link) => {
          return link.uri;
        }),
        imageSrc,
        tag: [
          org.alternate_name?.length ? org.alternate_name[0] : org.title,
          org.title,
          ...(org.field_couverture_geographique ?? []).map((i) => i.name),
          ...(org.field_organization_geographical ?? []).map((i) => i.name),
        ],
      };

      return {
        id: org.id,
        label: org.alternate_name?.length ? org.alternate_name[0] : org.title,
        data: organizationNodeSchema.parse(data),
        fill: "#0061AF",
      };
    });

    nodes = nodes.concat(organizationNodes);
  } else {
    console.log(organizationResults.error.issues);
  }

  if (gouvOrganizationResults.data) {
    //1. extraire la creation des nodes (plus facile a lire)
    const gouvOrganizationNodes = gouvOrganizationResults.data.map(
      (gouvOrg) => {
        // S'assurer que dans Drupal, configuration JSON:API, que logo est bien ecrit schema_logo
        let imageSrc = gouvOrg.schema_logo?.image.uri?.url;
        if (!imageSrc) {
          imageSrc = gouvOrg.metatag.find(
            (tag) => tag.tag === "link" && tag.attributes.rel === "image_src",
          )?.attributes.href;
        } else {
          imageSrc = `${API_ENDPOINT}/${imageSrc}`;
        }
        const data: GouvOrganizationNode = {
          type: gouvOrg.type,
          label: gouvOrg.alternate_name?.length
            ? gouvOrg.alternate_name[0]
            : gouvOrg.title,
          hoverLabel: gouvOrg.title,
          alternate_name: gouvOrg.alternate_name,
          title: gouvOrg.title,
          address: gouvOrg.schema_address,
          schema_organization_type: gouvOrg.schema_organization_type,
          field_organization_geographical:
            gouvOrg.field_organization_geographical,
          field_couverture_geographique: gouvOrg.field_couverture_geographique,
          description: gouvOrg.description,
          link: gouvOrg.significant_link.map((link) => {
            return link.uri;
          }),
          imageSrc,
          tag: [
            gouvOrg.alternate_name?.length
              ? gouvOrg.alternate_name[0]
              : gouvOrg.title,
            gouvOrg.title,
            ...(gouvOrg.field_couverture_geographique ?? []).map((i) => i.name),
            ...(gouvOrg.field_organization_geographical ?? []).map(
              (i) => i.name,
            ),
          ],
        };

        return {
          id: gouvOrg.id,
          label: gouvOrg.alternate_name?.length
            ? gouvOrg.alternate_name[0]
            : gouvOrg.title,
          data: gouvOrganizationNodeSchema.parse(data),
          fill: "#64748b",
        };
      },
    );

    nodes = nodes.concat(gouvOrganizationNodes);
  } //else {
  //console.log(gouvOrganizationResults.error.issues);
  //}

  if (personResults.data) {
    // console.log("Person results count:", personResults.data.length);
    // console.log("Sample person:", personResults.data[0]);

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
        member_of: person.member_of,
        significant_link: person.significant_link,
        field_applied_domain: person.field_applied_domain,
        field_digital_domain: person.field_digital_domain,
        field_person_type: person.field_person_type,
        field_axe_si_membre_rsn: person.field_axe_si_membre_rsn,
        tag: [person.title],
      };

      return {
        id: person.id,
        data: personNodeSchema.parse(data),
        label: person.title,
        fill: "#00A759",
      };
    });
    //console.log("Person nodes created: ", personNodes.length);
    nodes = nodes.concat(personNodes);
  } else {
    console.log(personResults.error);
  }

  // Conversion des dataset en noeuds du graph
  if (datasetResults.data) {
    const datasetNodes = datasetResults.data.map((dataset) => {
      let imageSrc = dataset.schema_logo?.image.uri?.url;
      if (!imageSrc) {
        imageSrc = dataset.metatag.find(
          (tag) => tag.tag === "link" && tag.attributes.rel === "image_src",
        )?.attributes.href;
      } else {
        imageSrc = `${API_ENDPOINT}/${imageSrc}`;
      }
      const data: DatasetNode = {
        type: dataset.type,
        label: dataset.title,
        alternate_name: dataset.alternate_name,
        hoverLabel: dataset.title,
        title: dataset.title,
        description: dataset.description,
        link: dataset.significant_link.map((link) => {
          return link.uri;
        }),
        imageSrc,
        parent_organization: dataset.parent_organization,
        field_applied_domain: dataset.field_applied_domain,
        field_licence: dataset.field_licence,
        field_modele_acces: dataset.field_modele_acces,
        author: dataset.author,
        field_funder: dataset.field_funder,
        tag: [
          dataset.alternate_name?.length
            ? dataset.alternate_name[0]
            : dataset.title,
          dataset.title,
        ],
      };

      return {
        id: dataset.id,
        label: dataset.alternate_name?.length
          ? dataset.alternate_name[0]
          : dataset.title,
        data: datasetNodeSchema.parse(data),
        fill: "#FFCC4E",
      };
    });

    nodes = nodes.concat(datasetNodes);
  } //else {
  //console.log(datasetResults.error.issues);
  // }

  // Conversion des dataCatalog en noeuds du graph
  if (dataCatalogResults.data) {
  //  console.log("DataCatalog results count:", dataCatalogResults.data.length);
  //  console.log("Sample DataCatalog:", dataCatalogResults.data[0]);

    const dataCatalogNodes = dataCatalogResults.data.map((dataCatalog) => {
      let imageSrc = dataCatalog.schema_logo?.image.uri?.url;
      if (!imageSrc) {
        imageSrc = dataCatalog.metatag.find(
          (tag) => tag.tag === "link" && tag.attributes.rel === "image_src",
        )?.attributes.href;
      } else {
        imageSrc = `${API_ENDPOINT}/${imageSrc}`;
      }
      const data: DataCatalogNode = {
        type: dataCatalog.type,
        label: dataCatalog.title,
        alternate_name: dataCatalog.alternate_name,
        hoverLabel: dataCatalog.title,
        title: dataCatalog.title,
        description: dataCatalog.description,
        link: dataCatalog.significant_link.map((link) => {
          return link.uri;
        }),
        imageSrc,
        parent_organization: dataCatalog.parent_organization,
        field_sub_dataset: dataCatalog.field_sub_dataset,
        field_applied_domain: dataCatalog.field_applied_domain,
        field_licence: dataCatalog.field_licence,
        field_modele_acces: dataCatalog.field_modele_acces,
        author: dataCatalog.author,
        field_funder: dataCatalog.field_funder,
        tag: [
          dataCatalog.alternate_name?.length
            ? dataCatalog.alternate_name[0]
            : dataCatalog.title,
          dataCatalog.title,
        ],
      };

      return {
        id: dataCatalog.id,
        label: dataCatalog.alternate_name?.length
          ? dataCatalog.alternate_name[0]
          : dataCatalog.title,
        data: dataCatalogNodeSchema.parse(data),
        fill: "#FFCC4E",
      };
    });
    //console.log("DataCatalog nodes created:", dataCatalogNodes.length);
    nodes = nodes.concat(dataCatalogNodes);
  } else {
    console.log(dataCatalogResults.error.issues);
  }

  //Conversion des Software Application en noeuds du graph
  if (softwareApplicationResults.data) {
    //console.log(
    //  "SoftApp results count:",
    //  softwareApplicationResults.data.length,
    //);
    //console.log("SoftApp DataCatalog:", softwareApplicationResults.data[0]);

    const softwareApplicationNodes = softwareApplicationResults.data.map(
      (softapp) => {
        let imageSrc = softapp.schema_logo?.image.uri?.url;
        if (!imageSrc) {
          imageSrc = softapp.metatag.find(
            (tag) => tag.tag === "link" && tag.attributes.rel === "image_src",
          )?.attributes.href;
        } else {
          imageSrc = `${API_ENDPOINT}/${imageSrc}`;
        }

        const data: SoftwareApplicationNode = {
          type: softapp.type,
          alternate_name: softapp.alternate_name,
          label: softapp.alternate_name?.length
            ? softapp.alternate_name[0]
            : softapp.title,
          hoverLabel: softapp.title,
          link: softapp.significant_link.map((link) => {
            return link.uri;
          }),
          title: softapp.title,
          description: softapp.description,
          parent_organization: softapp.parent_organization,
          field_funder: softapp.field_funder,
          application_category: softapp.application_category,
          field_licence: softapp.field_licence,
          author: softapp.author,
          field_modele_acces: softapp.field_modele_acces,
          imageSrc,
          schema_email: softapp.schema_email,
          tag: [
            softapp.alternate_name?.length
              ? softapp.alternate_name[0]
              : softapp.title,
            softapp.title,
          ],
        };

        return {
          id: softapp.id,
          label: softapp.alternate_name?.length
            ? softapp.alternate_name[0]
            : softapp.title,
          data: softwareApplicationNodeSchema.parse(data),
          fill: "#EE3124",
        };
      },
    );
    console.log(
      "Software Application nodes created: ",
      softwareApplicationNodes.length,
    );
    nodes = nodes.concat(softwareApplicationNodes);
  } else {
    console.log(softwareApplicationResults.error);
  }

  console.log("Total nodes:", nodes.length);
  console.log("Nodes by type:", {
    organizations: nodes.filter((n) => n.data.type === "node--organization")
      .length,
    gouvOrganizations: nodes.filter(
      (n) => n.data.type === "node--government_organization",
    ).length,
    persons: nodes.filter((n) => n.data.type === "node--person").length,
    datasets: nodes.filter((n) => n.data.type === "node--dataset").length,
    dataCatalog: nodes.filter((n) => n.data.type === "node--data_catalog")
      .length,
    softapp: nodes.filter((n) => n.data.type === "node--software_application")
      .length,
  });

  const createEdges = <T extends { id: string | number }>(
    items: T[],
    relationKey: keyof T,
    color: string,
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
    createEdges(organizationResults?.data ?? [], "sub_organization", "#64748B"),
  );

  edges = edges.concat(
    createEdges(
      gouvOrganizationResults?.data ?? [],
      "sub_organization",
      "#64748B",
    ),
  );

  edges = edges.concat(
    createEdges(
      organizationResults?.data ?? [],
      "parent_organization",
      "#64748B",
    ),
  );

  edges = edges.concat(
    createEdges(
      gouvOrganizationResults?.data ?? [],
      "sub_organization",
      "#64748B",
    ),
  );
  edges = edges.concat(
    createEdges(personResults?.data ?? [], "member_of", "#64748B"),
  );

  //edges = edges.concat(
  //  createEdges(datasetResults?.data ?? [], "author", "#64748B")
  //);

  edges = edges.concat(
    createEdges(datasetResults?.data ?? [], "parent_organization", "#64748B"),
  );

  //  edges = edges.concat(
  //    createEdges(dataCatalogResults?.data ?? [], "author", "#64748B")
  //  );

  edges = edges.concat(
    createEdges(
      dataCatalogResults?.data ?? [],
      "parent_organization",
      "#64748B",
    ),
  );

  edges = edges.concat(
    createEdges(dataCatalogResults?.data ?? [], "field_sub_dataset", "#64748B"),
  );

  //edges = edges.concat(
  //  createEdges(softwareApplicationResults?.data ?? [], "author", "#64748B")
  // );

  edges = edges.concat(
    createEdges(
      softwareApplicationResults?.data ?? [],
      "parent_organization",
      "#64748B",
    ),
  );

  //deduplicate edges
  edges = edges.filter(
    (edge, index, self) =>
      index ===
      self.findIndex(
        (e) => e.source === edge.source && e.target === edge.target,
      ),
  );

  return (
    <div className="h-full">
      <DiagramRoot nodes={nodes} edges={edges}></DiagramRoot>
    </div>
  );
}
