import type { ReactNode } from "react";

interface DetailCardProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** When false, use opaque background instead of glassmorphism (e.g. geomap dark mode). Default true. */
  glass?: boolean;
}

//Look de base pour les cartes
export function DetailCard({ title, children, onClose, glass = true }: DetailCardProps) {
  const bodyBg = glass
    ? "bg-base-200/65 dark:bg-base-200/55 backdrop-blur-xl border border-base-300/30"
    : "bg-base-200 border border-base-300";
  const titleBg = glass
    ? "bg-base-200/70 dark:bg-base-200/60 backdrop-blur-lg"
    : "bg-base-200";

  return (
    <div className="card text-base-content w-full h-full">
      <button
        className="absolute right-2 top-2 z-20 p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        onClick={onClose}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </button>

      <div className={`card-body p-0 w-96 max-h-[80vh] rounded-xl shadow-lg flex flex-col gap-4 overflow-y-auto ${bodyBg}`}>
        <div className={`text-2xl z-10 sticky top-0 p-4 pb-0 ${titleBg}`}>
          {title}
        </div>
        <div className="p-4 w-full flex flex-col gap-4 pt-0 pb-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
