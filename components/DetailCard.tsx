import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
interface DetailCardProps {
  node: MyGraphNode;
  onClose: () => void;
}

export function DetailCard({ node, onClose }: DetailCardProps) {
  if (!node.data) {
    return null;
  }

  return (
    <div className="card text-base-content w-full h-full">
      <button
        className="btn btn-circle btn-soft absolute right-[-0.5rem] z-10 top-[-0.5rem]"
        onClick={onClose}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
      <div className="card-body p-4  w-96 h-full rounded-xl bg-base-200 shadow-sm flex flex-col gap-4">
        <figure>
          {node.data.imageSrc ? (
            <img
              src={node.data.imageSrc}
              alt={node.label}
              width={200}
              height={200}
            />
          ) : (
            <div className="w-96  flex items-center justify-center"></div>
          )}
        </figure>

        <div className="text-2xl">{node.data.title}</div>

        <div className="space-y-1">
          <div>Description</div>
          <Description data={node.data} />
        </div>

        <div className="space-y-1 pt-6">
          <div>Catégorie(s)</div>
          <div>
            {node.data.category && node.data.category.length > 0 ? (
              node.data.category.map((cat, index) => (
                <span key={index}>
                  {cat}
                  {index < node.data.category.length - 1 && ", "}
                </span>
              ))
            ) : (
              <div>Non disponible</div>
            )}
          </div>
        </div>

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
              <div>Aucun lien</div>
            )}
          </div>
        </div>

        <div className="space-y-1 pt-6">
          <div>
            {node.data.operatingSystem &&
            node.data.operatingSystem.length > 0 ? (
              <div>
                <div className="font-semibold">Operating System</div>
                <div>{node.data.operatingSystem}</div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Logo badge at bottom right - only shows if membre_rsn exists */}
        {node.data.membre_rsn && node.data.membre_rsn.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <div className="badge badge-primary badge-lg gap-2">
              {/* You can use an icon or text here */}
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
        )}
      </div>
    </div>
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
