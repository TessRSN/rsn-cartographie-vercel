"use client";

import { SearchBar } from "./SearchBar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { OnboardingModal } from "./OnboardingModal";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 bg-base-100">
      <div className="flex px-4 justify-between items-center h-16">
        {theme === "dark" ? (
          <img src="/SVG_RSN/L_RSN_FR_RGB_W.svg" width={120} alt="Logo" />
        ) : (
          <img src="/SVG_RSN/L_RSN_FR_RGB_K.svg" width={120} alt="Logo" />
        )}

        <SearchBar />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-base-300 hover:border-base-content/40 text-base-content/60 hover:text-base-content transition-all"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              /* Sun */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <OnboardingModal />
        </div>
      </div>
    </nav>
  );
}
