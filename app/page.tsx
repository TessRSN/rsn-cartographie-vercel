/**
 * Home page — Server Component.
 *
 * Fetches all entity types from the Notion API in parallel,
 * converts them into reagraph-compatible GraphNode/GraphEdge structures,
 * deduplicates edges, and passes everything to the client-side DiagramRoot.
 */
import { Suspense } from "react"
import { DiagramRoot } from "@/components/DiagramRoot"
import { fetchOrganization } from "./lib/fetchOrganization"
import { fetchGouvOrganization } from "./lib/fetchGouvOrganization"
import { fetchPerson } from "./lib/fetchPerson"
import { fetchDataset } from "./lib/fetchDataset"
import { fetchSoftwareApplication } from "./lib/fetchSoftwareApplication"
import { fetchDataCatalog } from "./lib/fetchDataCatalog"
import { GraphEdge, GraphNode } from "reagraph"
import {
  OrganizationNode,
  organizationNodeSchema,
  GouvOrganizationNode,
  PersonNode,
  personNodeSchema,
  SoftwareApplicationNode,
  softwareApplicationNodeSchema,
  DatasetNode,
  datasetNodeSchema,
  DataCatalogNode,
  dataCatalogNodeSchema,
  gouvOrganizationNodeSchema,
} from "./lib/schema"

export const revalidate = 3600 // ISR: revalidate every hour

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert Notion multi_select items to taxonomy-term-like objects. */
function toTaxonomy<T extends string>(
  items: Array<{ id: string; name: string }>,
  typeLiteral: T,
) {
  return items.map((item) => ({
    type: typeLiteral,
    id: item.id,
    name: item.name,
  }))
}

/** Convert Notion select item to taxonomy-term-like object. */
function selectToTaxonomy<T extends string>(
  item: { id: string; name: string } | null,
  typeLiteral: T,
) {
  if (!item) return null
  return { type: typeLiteral, id: item.id, name: item.name }
}

/** Resolve relation IDs to entity references using the global lookup. */
function resolveRelations(
  ids: string[],
  idToTitle: Map<string, string>,
  idToType: Map<string, string>,
  fallbackType: string,
) {
  return ids
    .filter((id) => idToTitle.has(id))
    .map((id) => ({
      type: idToType.get(id) ?? fallbackType,
      id,
      title: idToTitle.get(id) ?? id,
    }))
}

/** Resolve relation IDs to partial person-like objects. */
function resolveAuthors(
  ids: string[],
  idToTitle: Map<string, string>,
) {
  return ids
    .filter((id) => idToTitle.has(id))
    .map((id) => ({
      type: "node--person" as const,
      id,
      title: idToTitle.get(id) ?? id,
    }))
}

/** Create graph edges from ID arrays. */
function createEdgesFromIds<T extends { id: string }>(
  items: T[],
  getRelatedIds: (item: T) => string[],
  validIds: Set<string>,
  color: string,
): GraphEdge[] {
  return items.flatMap((item) =>
    getRelatedIds(item)
      .filter((relId) => validIds.has(relId))
      .map((relId) => ({
        id: `${item.id}-${relId}`,
        source: item.id,
        target: relId,
        fill: color,
      })),
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function Home() {
  const [
    allOrgs,
    allGouvOrgs,
    allPersons,
    allDatasets,
    allSoftwareApps,
    allDataCatalogs,
  ] = await Promise.all([
    fetchOrganization(),
    fetchGouvOrganization(),
    fetchPerson(),
    fetchDataset(),
    fetchSoftwareApplication(),
    fetchDataCatalog(),
  ])

  // ── Build global ID → title / type lookups ──────────────────────────────

  const idToTitle = new Map<string, string>()
  const idToType = new Map<string, string>()

  for (const o of allOrgs) {
    idToTitle.set(o.id, o.title)
    idToType.set(o.id, o.type)
  }
  for (const o of allGouvOrgs) {
    idToTitle.set(o.id, o.title)
    idToType.set(o.id, o.type)
  }
  for (const p of allPersons) {
    idToTitle.set(p.id, p.title)
    idToType.set(p.id, p.type)
  }
  for (const d of allDatasets) {
    idToTitle.set(d.id, d.title)
    idToType.set(d.id, d.type)
  }
  for (const s of allSoftwareApps) {
    idToTitle.set(s.id, s.title)
    idToType.set(s.id, s.type)
  }
  for (const c of allDataCatalogs) {
    idToTitle.set(c.id, c.title)
    idToType.set(c.id, c.type)
  }

  const validIds = new Set(idToTitle.keys())

  // ── Build graph nodes ───────────────────────────────────────────────────

  let nodes: GraphNode[] = []

  // Organizations
  const organizationNodes: GraphNode[] = allOrgs.map((org) => {
    const data: OrganizationNode = {
      type: org.type,
      label: org.alternate_name.length ? org.alternate_name[0] : org.title,
      hoverLabel: org.title,
      alternate_name: org.alternate_name.length ? org.alternate_name : null,
      title: org.title,
      address: org.address,
      schema_organization_type: org.schema_organization_type,
      field_funder: resolveRelations(
        org.funder_ids,
        idToTitle,
        idToType,
        "node--organization",
      ),
      field_organization_geographical: toTaxonomy(
        org.field_organization_geographical,
        "taxonomy_term--geographical",
      ),
      field_couverture_geographique: toTaxonomy(
        org.field_couverture_geographique,
        "taxonomy_term--couverture_geographique",
      ),
      description: org.description,
      link: org.significant_link,
      imageSrc: org.imageSrc,
      tag: [
        org.alternate_name.length ? org.alternate_name[0] : org.title,
        org.title,
        ...org.field_couverture_geographique.map((i) => i.name),
        ...org.field_organization_geographical.map((i) => i.name),
      ],
    }

    return {
      id: org.id,
      label: org.alternate_name.length ? org.alternate_name[0] : org.title,
      data: organizationNodeSchema.parse(data),
      fill: "#0061AF",
    }
  })
  nodes = nodes.concat(organizationNodes)

  // Government Organizations
  const gouvOrganizationNodes: GraphNode[] = allGouvOrgs.map((gouvOrg) => {
    const data: GouvOrganizationNode = {
      type: gouvOrg.type,
      label: gouvOrg.alternate_name.length
        ? gouvOrg.alternate_name[0]
        : gouvOrg.title,
      hoverLabel: gouvOrg.title,
      alternate_name: gouvOrg.alternate_name.length
        ? gouvOrg.alternate_name
        : null,
      title: gouvOrg.title,
      address: gouvOrg.address,
      schema_organization_type: gouvOrg.schema_organization_type,
      field_organization_geographical: toTaxonomy(
        gouvOrg.field_organization_geographical,
        "taxonomy_term--geographical",
      ),
      field_couverture_geographique: toTaxonomy(
        gouvOrg.field_couverture_geographique,
        "taxonomy_term--couverture_geographique",
      ),
      description: gouvOrg.description,
      link: gouvOrg.significant_link,
      imageSrc: gouvOrg.imageSrc,
      tag: [
        gouvOrg.alternate_name.length
          ? gouvOrg.alternate_name[0]
          : gouvOrg.title,
        gouvOrg.title,
        ...gouvOrg.field_couverture_geographique.map((i) => i.name),
        ...gouvOrg.field_organization_geographical.map((i) => i.name),
      ],
    }

    return {
      id: gouvOrg.id,
      label: gouvOrg.alternate_name.length
        ? gouvOrg.alternate_name[0]
        : gouvOrg.title,
      data: gouvOrganizationNodeSchema.parse(data),
      fill: "#8C8C8C",
    }
  })
  nodes = nodes.concat(gouvOrganizationNodes)

  // Persons
  const personNodes: GraphNode[] = allPersons.map((person) => {
    const data: PersonNode = {
      type: person.type,
      label: person.title,
      hoverLabel: person.title,
      title: person.title,
      description: person.description,
      link: person.same_as,
      member_of: resolveRelations(
        person.member_of_ids,
        idToTitle,
        idToType,
        "node--organization",
      ),
      significant_link: person.significant_link.map((uri) => ({
        uri,
        title: "",
        options: [],
      })),
      field_applied_domain: toTaxonomy(
        person.field_applied_domain,
        "taxonomy_term--health_research_category",
      ),
      field_digital_domain: toTaxonomy(
        person.field_digital_domain,
        "taxonomy_term--methodes_numeriques",
      ),
      field_person_type: selectToTaxonomy(
        person.field_person_type,
        "taxonomy_term--person",
      ),
      field_axe_si_membre_rsn: selectToTaxonomy(
        person.field_axe_si_membre_rsn,
        "taxonomy_term--axe_rsn",
      ),
      imageSrc: person.imageSrc,
      tag: [person.title],
    }

    return {
      id: person.id,
      data: personNodeSchema.parse(data),
      label: person.title,
      fill: "#00A759",
    }
  })
  nodes = nodes.concat(personNodes)

  // Datasets
  const datasetNodes: GraphNode[] = allDatasets.map((dataset) => {
    const data: DatasetNode = {
      type: dataset.type,
      label: dataset.title,
      alternate_name: dataset.alternate_name.length
        ? dataset.alternate_name
        : null,
      hoverLabel: dataset.title,
      title: dataset.title,
      description: dataset.description,
      link: dataset.significant_link,
      imageSrc: dataset.imageSrc,
      parent_organization: resolveRelations(
        dataset.parent_organization_ids,
        idToTitle,
        idToType,
        "node--organization",
      ),
      field_applied_domain: toTaxonomy(
        dataset.field_applied_domain,
        "taxonomy_term--health_research_category",
      ),
      field_licence: selectToTaxonomy(
        dataset.field_licence,
        "taxonomy_term--accessibility",
      ),
      field_modele_acces: selectToTaxonomy(
        dataset.field_modele_acces,
        "taxonomy_term--modele_acces",
      ),
      author: resolveAuthors(dataset.author_ids, idToTitle),
      field_funder: resolveRelations(
        dataset.funder_ids,
        idToTitle,
        idToType,
        "node--organization",
      ),
      email: dataset.email ? { schema_email: dataset.email } : null,
      tag: [
        dataset.alternate_name.length
          ? dataset.alternate_name[0]
          : dataset.title,
        dataset.title,
      ],
    }

    return {
      id: dataset.id,
      label: dataset.alternate_name.length
        ? dataset.alternate_name[0]
        : dataset.title,
      data: datasetNodeSchema.parse(data),
      fill: "#FFCC4E",
    }
  })
  nodes = nodes.concat(datasetNodes)

  // Data Catalogs
  const dataCatalogNodes: GraphNode[] = allDataCatalogs.map((dataCatalog) => {
    // Find datasets that reference this catalog via catalog_parent_ids
    const subDatasets = allDatasets
      .filter((d) => d.catalog_parent_ids.includes(dataCatalog.id))
      .map((d) => ({ type: d.type, id: d.id, title: d.title }))

    const data: DataCatalogNode = {
      type: dataCatalog.type,
      label: dataCatalog.title,
      alternate_name: dataCatalog.alternate_name.length
        ? dataCatalog.alternate_name
        : null,
      hoverLabel: dataCatalog.title,
      title: dataCatalog.title,
      description: dataCatalog.description,
      link: dataCatalog.significant_link,
      imageSrc: dataCatalog.imageSrc,
      parent_organization: resolveRelations(
        dataCatalog.parent_organization_ids,
        idToTitle,
        idToType,
        "node--organization",
      ),
      field_sub_dataset: subDatasets,
      field_applied_domain: toTaxonomy(
        dataCatalog.field_applied_domain,
        "taxonomy_term--health_research_category",
      ),
      field_licence: selectToTaxonomy(
        dataCatalog.field_licence,
        "taxonomy_term--accessibility",
      ),
      field_modele_acces: selectToTaxonomy(
        dataCatalog.field_modele_acces,
        "taxonomy_term--modele_acces",
      ),
      author: resolveAuthors(dataCatalog.author_ids, idToTitle),
      field_funder: resolveRelations(
        dataCatalog.funder_ids,
        idToTitle,
        idToType,
        "node--organization",
      ),
      email: dataCatalog.email
        ? { schema_email: dataCatalog.email }
        : null,
      tag: [
        dataCatalog.alternate_name.length
          ? dataCatalog.alternate_name[0]
          : dataCatalog.title,
        dataCatalog.title,
      ],
    }

    return {
      id: dataCatalog.id,
      label: dataCatalog.alternate_name.length
        ? dataCatalog.alternate_name[0]
        : dataCatalog.title,
      data: dataCatalogNodeSchema.parse(data),
      fill: "#FFCC4E",
    }
  })
  nodes = nodes.concat(dataCatalogNodes)

  // Software Applications
  const softwareApplicationNodes: GraphNode[] = allSoftwareApps.map(
    (softapp) => {
      const data: SoftwareApplicationNode = {
        type: softapp.type,
        alternate_name: softapp.alternate_name.length
          ? softapp.alternate_name
          : null,
        label: softapp.alternate_name.length
          ? softapp.alternate_name[0]
          : softapp.title,
        hoverLabel: softapp.title,
        link: softapp.significant_link,
        title: softapp.title,
        description: softapp.description,
        parent_organization: resolveRelations(
          softapp.parent_organization_ids,
          idToTitle,
          idToType,
          "node--organization",
        ),
        field_funder: resolveRelations(
          softapp.funder_ids,
          idToTitle,
          idToType,
          "node--organization",
        ),
        application_category: toTaxonomy(
          softapp.application_category,
          "taxonomy_term--software_type",
        ),
        field_licence: selectToTaxonomy(
          softapp.field_licence,
          "taxonomy_term--accessibility",
        ),
        author: resolveAuthors(softapp.author_ids, idToTitle),
        field_modele_acces: selectToTaxonomy(
          softapp.field_modele_acces,
          "taxonomy_term--modele_acces",
        ),
        imageSrc: softapp.imageSrc,
        schema_email: softapp.email,
        tag: [
          softapp.alternate_name.length
            ? softapp.alternate_name[0]
            : softapp.title,
          softapp.title,
        ],
      }

      return {
        id: softapp.id,
        label: softapp.alternate_name.length
          ? softapp.alternate_name[0]
          : softapp.title,
        data: softwareApplicationNodeSchema.parse(data),
        fill: "#EE3124",
      }
    },
  )
  nodes = nodes.concat(softwareApplicationNodes)

  // ── Build edges ─────────────────────────────────────────────────────────

  const EDGE_COLOR = "#64748B"
  let edges: GraphEdge[] = []

  // Org sub-organizations
  edges = edges.concat(
    createEdgesFromIds(allOrgs, (o) => o.sub_organization_ids, validIds, EDGE_COLOR),
  )
  edges = edges.concat(
    createEdgesFromIds(allOrgs, (o) => o.parent_organization_ids, validIds, EDGE_COLOR),
  )

  // Gov org sub-organizations
  edges = edges.concat(
    createEdgesFromIds(allGouvOrgs, (o) => o.sub_organization_ids, validIds, EDGE_COLOR),
  )
  edges = edges.concat(
    createEdgesFromIds(allGouvOrgs, (o) => o.parent_organization_ids, validIds, EDGE_COLOR),
  )

  // Person member_of
  edges = edges.concat(
    createEdgesFromIds(allPersons, (p) => p.member_of_ids, validIds, EDGE_COLOR),
  )

  // Dataset parent_organization
  edges = edges.concat(
    createEdgesFromIds(
      allDatasets,
      (d) => d.parent_organization_ids,
      validIds,
      EDGE_COLOR,
    ),
  )

  // DataCatalog parent_organization
  edges = edges.concat(
    createEdgesFromIds(
      allDataCatalogs,
      (c) => c.parent_organization_ids,
      validIds,
      EDGE_COLOR,
    ),
  )

  // DataCatalog → sub-datasets (reverse: datasets that reference this catalog)
  edges = edges.concat(
    allDataCatalogs.flatMap((catalog) =>
      allDatasets
        .filter((d) => d.catalog_parent_ids.includes(catalog.id))
        .map((d) => ({
          id: `${catalog.id}-${d.id}`,
          source: catalog.id,
          target: d.id,
          fill: EDGE_COLOR,
        })),
    ),
  )

  // Software application parent_organization
  edges = edges.concat(
    createEdgesFromIds(
      allSoftwareApps,
      (s) => s.parent_organization_ids,
      validIds,
      EDGE_COLOR,
    ),
  )

  // Deduplicate edges
  edges = edges.filter(
    (edge, index, self) =>
      index ===
      self.findIndex(
        (e) => e.source === edge.source && e.target === edge.target,
      ),
  )

  return (
    <div className="h-full">
      <Suspense>
        <DiagramRoot nodes={nodes} edges={edges}></DiagramRoot>
      </Suspense>
    </div>
  )
}
