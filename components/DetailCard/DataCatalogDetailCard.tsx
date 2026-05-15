import DOMPurify from "isomorphic-dompurify";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("detailCard");
  return (
    <DetailCard title={node.data.title} onClose={onClose} glass={glass}>
      {node.data.alternate_name && node.data.alternate_name.length > 0 ? (
        <div>
          <div className="font-medium">{t("sections.alias")}</div>
          <div> {node.data.alternate_name[0]}</div>
        </div>
      ) : null}

      {node.data.imageSrc && (
        <Logo imageSrc={node.data.imageSrc} alt={node.label ?? ""} />
      )}

      <div className="space-y-1 pt-2">
        <div>{t("sections.healthDomain")}</div>
        <div className="flex gap-2 flex-wrap">
          {node.data.field_applied_domain?.map((term) => (
            <div key={term.id} className="badge badge-soft badge-success">
              {term.name}
            </div>
          )) || <div className="badge badge-ghost">{t("empty.notAvailable")}</div>}
        </div>
      </div>

      <div className="space-y-1">
        <div>{t("sections.description")}</div>
        <Description data={node.data} />
      </div>

      {node.data.field_licence ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">{t("sections.license")}</div>
          <div className="badge badge-soft badge-accent h-fit">
            <div key={node.data.field_licence.id}>
              {node.data.field_licence.name}
            </div>
          </div>
        </div>
      ) : null}

      {node.data.field_modele_acces ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">{t("sections.accessModel")}</div>
          <div className="badge badge-soft badge-error h-fit">
            <div key={node.data.field_modele_acces.id}>
              {node.data.field_modele_acces.name}
            </div>
          </div>
        </div>
      ) : null}

      {node.data.author && node.data.author.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">{t("sections.responsiblePerson")}</div>
          {node.data.author.map((term) => (
            <div key={term.id}>{"title" in term ? term.title : term.id}</div>
          ))}
        </div>
      ) : null}

      {node.data.field_funder && node.data.field_funder.length > 0 ? (
        <div className="space-y-1 pt-2">
          <div className="font-medium">{t("sections.fundedBy")}</div>
          {node.data.field_funder.map((term) => (
            <div key={term.id}>{"title" in term ? term.title : term.id}</div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1 pt-2">
        <div className="font-medium">{t("sections.links")}</div>
        <div className="space-y-1">
          {node.data.link && node.data.link.length > 0 ? (
            node.data.link.map((link, index) => (
              <a
                key={index}
                className="link link-primary link-hover block truncate"
                href={link}
                target="_blank"
                title={link}
              >
                {link}
              </a>
            ))
          ) : (
            <div>{t("empty.links")}</div>
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
  const t = useTranslations("detailCard");
  return data.description?.value ? (
    <div
      className="max-h-84 overflow-y-auto list-decimal bg-base-100/40 backdrop-blur-sm rounded-lg px-2"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(data.description.value),
      }}
    ></div>
  ) : (
    <div>{t("empty.description")}</div>
  );
}
