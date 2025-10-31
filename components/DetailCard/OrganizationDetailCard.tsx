import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import { OrganizationNode } from "@/app/lib/schema";
import { DetailCard } from "./DetailCard";
import { Logo } from "./Logo";
import { Adresse } from "./Adresse";

const additionalTypeToLabel: Record<string, string> = {
  consortium: "Regroupement de recherche",
  college_or_university: "Collège ou université",
  funding_scheme: "Programme de financement",
  government_organization: "Organisation gouvernementale",
  hospital: "Hôpital",
  autre: "Autre",
};

interface OrganizationDetailCardProps {
  node: MyGraphNode & { data: OrganizationNode };
  onClose: () => void;
}

export function OrganizationDetailCard({
  node,
  onClose,
}: OrganizationDetailCardProps) {
  return (
    <DetailCard title={node.data.title} onClose={onClose}>
      {node.data.alternate_name.length > 0 ? (
        <div>
          <div className="font-medium">Alias</div>
          <div> {node.data.alternate_name[0]}</div>
        </div>
      ) : null}
      <Logo imageSrc={node.data.imageSrc} alt={node.label ?? ""} />

      {node.data.schema_organization_type &&
      additionalTypeToLabel[node.data.schema_organization_type] ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Type</div>
          <div className="badge badge-soft badge-secondary">
            {additionalTypeToLabel[node.data.schema_organization_type]}
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        <div className="font-medium">Description</div>
        <Description data={node.data} />
      </div>

      <div className="space-y-1 pt-2">
        {node.data.field_organization_geographical?.length ? (
          <div className="space-y-1">
            <div className="font-medium">Localisation administrative</div>
            {node.data.field_organization_geographical.map((term) => (
              <div key={term.id}>{term.name}</div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-1">
        <div className="font-medium">Adresse</div>
        <Adresse address={node.data.address} />
      </div>

      <div className="space-y-1 pt-2">
        {node.data.field_couverture_geographique?.length ? (
          <div className="space-y-1">
            <div className="font-medium">Couverture géographique</div>
            {node.data.field_couverture_geographique.map((term) => (
              <div key={term.id}>{term.name}</div>
            ))}
          </div>
        ) : null}
      </div>

      {node.data.field_funder && node.data.field_funder.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Subventionné par</div>
          {node.data.field_funder.map((term) => (
            <div key={term.id}>{term.title}</div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1 pt-2">
        <div>Lien(s)</div>
        <div className="line-clamp-2">
          {node.data.link && node.data.link.length > 0 ? (
            node.data.link.map((link) => {
              return (
                <a
                  className="link link-primary link-hover"
                  href={link}
                  target="_blank"
                >
                  {link}
                </a>
              );
            })
          ) : (
            <div>Aucun lien</div>
          )}
        </div>
      </div>
    </DetailCard>
  );
}

interface DescriptionProps {
  data: NonNullable<MyGraphNode["data"]>;
}

function Description({ data }: DescriptionProps) {
  return data.description?.value ? (
    <div
      className="max-h-84 overflow-y-auto list-decimal bg-base-100 px-2"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(data.description.value),
      }}
    ></div>
  ) : (
    <div>Aucune description</div>
  );
}
