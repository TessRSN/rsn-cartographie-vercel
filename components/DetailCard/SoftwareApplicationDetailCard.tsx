import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import { SoftwareApplicationNode } from "@/app/lib/schema";
import { DetailCard } from "./DetailCard";
import { Logo } from "./Logo";

interface SoftwareApplicationDetailCardProps {
  node: MyGraphNode & { data: SoftwareApplicationNode };
  onClose: () => void;
}

export function SoftwareApplicationDetailCard({
  node,
  onClose,
}: SoftwareApplicationDetailCardProps) {
  return (
    <DetailCard title={node.data.title} onClose={onClose}>
      {node.data.alternate_name.length > 0 ? (
        <div>
          <div className="font-medium">Alias</div>
          <div> {node.data.alternate_name[0]}</div>
        </div>
      ) : null}

      <Logo imageSrc={node.data.imageSrc} alt={node.label ?? ""} />

      {node.data.application_category &&
      node.data.application_category.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Type</div>
          <div className="badge badge-soft badge-primary h-fit">
            {node.data.application_category.map((term) => (
              <div key={term.id}>{term.name}</div>
            ))}
          </div>
        </div>
      ) : null}

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
          <div className="badge badge-soft badge-accent h-fit">
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
            <div key={term.id}>{term.title}</div>
          ))}
        </div>
      ) : null}

      {node.data.field_funder && node.data.field_funder.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">Subventionné par</div>
          {node.data.field_funder.map((term) => (
            <div key={term.id}>{term.title}</div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1 pt-6">
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
            <div>N/A</div>
          )}
        </div>
      </div>

      <div className="space-y-1 pt-6">
        <div>
          {/*node.data.operatingSystem && node.data.operatingSystem.length > 0 ? (
            <div>
              <div className="font-semibold">Operating System</div>
              <div>{node.data.operatingSystem}</div>
            </div>
          ) : (
            <div></div>
          )*/}
        </div>
      </div>

      {/* Logo badge at bottom right - only shows if membre_rsn exists */}
      {/*node.data.field_axe_si_membre_rsn &&
        node.data.field_axe_si_membre_rsn.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <div className="badge badge-primary badge-lg gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              RSN
            </div>
          </div>
        )*/}
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
