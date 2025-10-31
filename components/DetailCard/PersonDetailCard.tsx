import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import { PersonNode, personNodeSchema } from "@/app/lib/schema";
import { DetailCard } from "./DetailCard";
import { Logo } from "./Logo";

interface PersonDetailCardProps {
  node: MyGraphNode & { data: PersonNode };
  onClose: () => void;
}

export function PersonDetailCard({ node, onClose }: PersonDetailCardProps) {
  return (
    <DetailCard title={node.data.title} onClose={onClose}>
      {/*<Logo imageSrc={node.data.imageSrc} alt={node.label ?? ""} />*/}

      <div className="space-y-1 pt-2">
        <div>Type</div>
        <div> {node.data.field_person_type?.name || "N/A"}</div>
      </div>

      <div className="space-y-1 pt-2">
        <div>Domaine de santé</div>
        <div className="flex gap-2 flex-wrap">
          {node.data.field_applied_domain?.map((term) => (
            <div key={term.id} className="badge badge-soft badge-success">
              {term.name}
            </div>
          )) || <div className="badge badge-ghost">N/A</div>}
        </div>
      </div>

      <div className="space-y-1 pt-2">
        <div>Méthodes numériques</div>
        <div className="flex gap-2 flex-wrap">
          {node.data.field_digital_domain?.map((term) => (
            <div key={term.id} className="badge badge-soft badge-info">
              {term.name}
            </div>
          )) || <div className="badge badge-ghost">N/A</div>}
        </div>
      </div>

      <div className="space-y-1 pt-2">
        <div>Axe RSN</div>
        <div className="flex gap-2 flex-wrap">
          {node.data.field_axe_si_membre_rsn?.name ? (
            <div className="badge badge-soft badge-warning">
              {node.data.field_axe_si_membre_rsn.name}
            </div>
          ) : (
            <div className="badge badge-ghost">N/A</div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div>Description</div>
        <Description data={node.data} />
      </div>

      <div className="space-y-1 pt-6">
        <div>Courriel</div>
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

      <div className="space-y-1 pt-6">
        <div>Lien(s)</div>
        <div className="space-y-1">
          {node.data.significant_link &&
          node.data.significant_link.length > 0 ? (
            node.data.significant_link.map((link, index) => {
              return (
                <a
                  key={index}
                  className="link link-primary link-hover block"
                  href={link.uri}
                  target="_blank"
                >
                  {link.uri}
                </a>
              );
            })
          ) : (
            <div></div>
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
