import DOMPurify from "isomorphic-dompurify";
import { MyGraphNode } from "@/app/lib/types";
import type { ReactNode } from "react";

interface DetailCardProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

//Look de base pour les cartes
export function DetailCard({ title, children, onClose }: DetailCardProps) {
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

      <div className="card-body p-0 w-96 max-h-[80vh] rounded-xl bg-base-200 shadow-sm flex flex-col gap-4 overflow-y-auto">
        <div className="text-2xl sticky top-0 bg-base-200 flex justify-center p-4">
          {title}
        </div>
        <div className="p-4 w-full flex flex-col gap-4 ">{children}</div>
      </div>
    </div>
  );
}
