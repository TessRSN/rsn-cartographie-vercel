import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import { DataCatalogNode } from "@/app/lib/schema";
import { DetailCard } from "./DetailCard";
import { Logo } from "./Logo";

interface DataCatalogDetailCardProps {
  node: MyGraphNode & { data: DataCatalogNode };
  onClose: () => void;
  glass?: boolean;
}

export function DataCatalogDetailCard({
  node,
  onClose,
  glass,
}: DataCatalogDetailCardProps) {
  return (
    <DetailCard title={node.data.title} onClose={onClose} glass={glass}>
      {node.data.alternate_name && node.data.alternate_name.length > 0 ? (
        <div>
          <div className="font-medium">Alias</div>
          <div> {node.data.alternate_name[0]}</div>
        </div>
      ) : null}

      {node.data.imageSrc && (
        <Logo imageSrc={node.data.imageSrc} alt={node.label ?? ""} />
      )}

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

      <div className="space-y-1">
        <div>Description</div>
        <Description data={node.data} />
      </div>

      {node.data.field_licence ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Licence</div>
          <div className="badge badge-soft badge-accent h-fit">
            <div key={node.data.field_licence.id}>
              {node.data.field_licence.name}
            </div>
          </div>
        </div>
      ) : null}

      {node.data.field_modele_acces ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Modèle d'accès</div>
          <div className="badge badge-soft badge-error h-fit">
            <div key={node.data.field_modele_acces.id}>
              {node.data.field_modele_acces.name}
            </div>
          </div>
        </div>
      ) : null}

      {node.data.author && node.data.author.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Personne responsable</div>
          {node.data.author.map((term) => (
            <div key={term.id}>{"title" in term ? term.title : term.id}</div>
          ))}
        </div>
      ) : null}

      {node.data.field_funder && node.data.field_funder.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Subventionné par</div>
          {node.data.field_funder.map((term) => (
            <div key={term.id}>{"title" in term ? term.title : term.id}</div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1 pt-2">
        <div>Lien(s)</div>
        <div className="space-y-1 pt-2">
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
      className="max-h-84 overflow-y-auto list-decimal bg-base-100/40 backdrop-blur-sm rounded-lg px-2"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(data.description.value),
      }}
    ></div>
  ) : (
    <div>Aucune description</div>
  );
}
