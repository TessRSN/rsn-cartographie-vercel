import { DrupalNode, NextDrupal } from "next-drupal";
import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import util from "util";
import { DiagramRoot } from "@/components/DiagramRoot";

const drupal = new NextDrupal("https://catalog.paradim.science/");

export default async function Home() {
  // Information Organisation
  const orgParams = new DrupalJsonApiParams()
    .addFields("node--organization", [
      "title",
      "alternate_name",
      "sub_organization",
      "parent_organization",
      "additional_type",
      "description",
      "significant_link",
      "metatag",
    ])
    //.addFilter("status", "1")
    // Add Page Limit.
    .addPageLimit(10000)
    .addInclude(["sub_organization"])
    .addSort("created", "DESC");

  const orgs = await drupal.getResourceCollection<DrupalNode[]>(
    "node--organization",
    {
      params: orgParams.getQueryObject(),
    }
  );

  // Information personnes
  const personParams = new DrupalJsonApiParams()
    .addFields("node--person", [
      "title",
      "description",
      "member_of",
      "subject_of",
      "works_for",
      "same_as",
      "metatag",
    ])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude(["member_of", "subject_of", "works_for"])
    .addSort("created", "DESC");

  const persons = await drupal.getResourceCollection<DrupalNode[]>(
    "node--person",
    {
      params: personParams.getQueryObject(),
    }
  );

  // Information Dataset
  const datasetParams = new DrupalJsonApiParams()
    .addFields("node--dataset", [
      "title",
      "description",
      "alternate_name",
      "member_of",
      "subject_of",
      "works_for",
      "significant_link",
      "metatag",
    ])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude(["author"])
    .addSort("created", "DESC");

  const datasets = await drupal.getResourceCollection<DrupalNode[]>(
    "node--dataset",
    {
      params: datasetParams.getQueryObject(),
    }
  );

  // Software application

  const softappParams = new DrupalJsonApiParams()
    .addFields("node--dataset", [
      "title",
      "description",
      "member_of",
      "subject_of",
      "works_for",
      "significant_link",
      "metatag",
      "operating_system",
    ])
    .addFilter("status", "1")
    .addPageLimit(10000)
    .addInclude(["sponsor", "author"])
    .addSort("created", "DESC");

  const softapps = await drupal.getResourceCollection<DrupalNode[]>(
    "node--software_application",
    {
      params: softappParams.getQueryObject(),
    }
  );

  for (const org of orgs) {
    console.log(util.inspect(org, { depth: null }));
    console.log("===================");
    console.log("===================");
    console.log("===================");
  }

  /*
  for (const person of persons) {
    console.log(util.inspect(person, { depth: null }));
    console.log("===================");
    console.log("===================");
    console.log("===================");
  }
  */

  /* for (const softapp of softapps) {
    console.log(util.inspect(softapp, { depth: null }));
    console.log("===================");
    console.log("===================");
    console.log("===================");
  } */

  // Conversion des organisations vers des noeuds du graph
  let nodes = orgs.map((org) => ({
    id: org.id,
    label: org.alternate_name.length > 0 ? org.alternate_name[0] : org.title,
    data: {
      label: org.alternate_name.length > 0 ? org.alternate_name[0] : org.title,
      hoverLabel: org.title,
      title: org.title,
      type: org.additional_type,
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
  console.log(orgs.length);

  // Conversion des personnes en noeuds du graph
  nodes = [
    ...nodes,
    ...persons.map((person) => ({
      id: person.id,
      data: {
        label: person.title,
        hoverLabel: person.title,
        link: "",
        title: person.title,
        type: person.type,
        description: person.description,
        link: person.same_as.map((link) => {
          return link.uri;
        }),
      },
      label: person.title,
      fill: "#00A759",
    })),
  ];
  console.log(persons.length);

  // Conversion des dataset en noeuds du graph
  nodes = [
    ...nodes,
    ...datasets.map((dataset) => ({
      id: dataset.id,
      data: {
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
      },
      label: dataset.title,
      fill: "#FFCC4E",
    })),
  ];
  console.log(datasets.length);

  //Conversion des Software Application en noeuds du graph
  nodes = [
    ...nodes,
    ...softapps.map((softapp) => ({
      id: softapp.id,
      data: {
        label: softapp.title,
        hoverLabel: softapp.title,
        link: "",
        title: softapp.title,
        description: softapp.description,
        operatingSystem: softapp.operating_system,
        link: softapp.significant_link.map((link) => {
          return link.uri;
        }),
        imageSrc:
          softapp.metatag.find(
            (tag) => tag.tag === "link" && tag.attributes.rel === "image_src"
          )?.attributes.href || null,
      },
      label: softapp.title,
      fill: "#EE3124",
    })),
  ];
  console.log(softapps.length);

  const createEdges = (items, relationKey, color) =>
    items.flatMap((item) =>
      (item[relationKey] || []).map((related) => ({
        id: `${item.id}-${related.id}`,
        source: item.id,
        target: related.id,
        fill: color,
      }))
    );

  let edges = []
    .concat(createEdges(orgs, "sub_organization", "#0061AF"))
    .concat(createEdges(orgs, "parent_organization", "#0061AF"))
    .concat(createEdges(persons, "works_for", "#00A759"))
    .concat(createEdges(persons, "member_of", "#00A759"))
    .concat(createEdges(datasets, "author", "#00A759"))
    .concat(createEdges(softapps, "author", "#EE3124"))
    .concat(createEdges(softapps, "sponsor", "#EE3124"));

  //deduplicate edges
  edges = edges.filter(
    (edge, index, self) =>
      index ===
      self.findIndex(
        (e) => e.source === edge.source && e.target === edge.target
      )
  );

  return (
    <div className="h-[50vh] w-screen">
      <div className="absolute top-2 z-10 p-4 flex justify-center w-full">
        <div className="bg-black  rounded-xl w-2/3 xl:max-w-[800px] h-16 outline-gray-300 outline-2 max-w- items-center justify-between flex p-4 py-6">
          <img className="" src="/L_RSN_FR_RGB.png" width={120} />
          <div className="rounded-full outline-gray-300/50 outline-2 p-4 w-28 h-8 flex items-center justify-between hover:cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              className="-ml-0.5 size-4 fill-gray-600 dark:fill-gray-500"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              ></path>
            </svg>
            <kbd className="font-sans text-xs/4 text-gray-500 dark:text-gray-400">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
      <DiagramRoot nodes={nodes} edges={edges}></DiagramRoot>
    </div>
  );
}
