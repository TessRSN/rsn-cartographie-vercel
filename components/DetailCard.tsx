import { GraphNode } from "reagraph";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
interface DetailCardProps {
  node: GraphNode;
  onClose: () => void;
}

export function DetailCard({ node, onClose }: DetailCardProps) {
  if (!node) {
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
          {node.data.description?.value ? (
            <div
              className="max-h-84 overflow-y-auto list-decimal bg-base-100 px-2"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(node.data.description.value),
              }}
            ></div>
          ) : (
            <div>Aucune description</div>
          )}
        </div>

        <div className="space-y-1 pt-6">
          <div>Lien(s)</div>
          <div>
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
      </div>
    </div>
  );
}
