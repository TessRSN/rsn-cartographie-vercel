import type { ReactNode } from "react";

interface DetailCardProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** When false, use opaque background instead of glassmorphism (e.g. geomap dark mode). Default true. */
  glass?: boolean;
}

export function DetailCard({ title, children, onClose, glass }: DetailCardProps) {
  const bodyBg =
    glass === false
      ? "bg-base-200 border border-base-300"
      : "bg-base-200/65 dark:bg-base-200/55 backdrop-blur-xl border border-base-300/30";

  const headerBg =
    glass === false
      ? "bg-base-200"
      : "bg-base-200/80 dark:bg-base-200/70 backdrop-blur-xl";

  return (
    <div className="card text-base-content w-full">
      <div
        className={`card-body p-0 w-full md:w-96 max-h-[calc(60vh-1rem)] md:max-h-[calc(100vh-2rem)] rounded-xl shadow-lg flex flex-col overflow-hidden ${bodyBg}`}
      >
        {/* Fixed header — stays visible while content scrolls */}
        <div
          className={`shrink-0 flex items-start justify-between gap-2 p-3 md:p-4 pb-2 rounded-t-xl ${headerBg}`}
        >
          <div className="text-lg md:text-2xl flex-1 min-w-0">{title}</div>
          <button
            className="shrink-0 p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto min-h-0 p-3 md:p-4 w-full flex flex-col gap-3 md:gap-4 pt-0 pb-6 md:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
