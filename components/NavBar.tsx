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

  const isDark = theme === "dark";

  return (
    <nav
      className="sticky top-0 z-50 flex-shrink-0"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0f1724 0%, #1a365d 100%)"
          : "linear-gradient(135deg, #1a365d 0%, #2b6cb0 60%, #3182ce 100%)",
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2 md:gap-5 md:px-5 md:py-4">
        {/* Logo */}
        <a href="https://rsn.quebec/" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <img
            src="/SVG_RSN/L_RSN_FR_RGB_W.svg"
            alt="Logo RSN"
            className="w-20 md:w-[110px]"
          />
        </a>

        {/* Separator — hidden on mobile */}
        <div
          className="hidden md:block w-px h-8 flex-shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        />

        {/* Title + Search */}
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <h1
            className="text-xs md:text-base font-semibold tracking-tight leading-tight truncate"
            style={{ color: "#e2e8f0" }}
          >
            <span className="md:hidden">Cartographie RSN</span>
            <span className="hidden md:inline">Cartographie des plateformes du Réseau en santé numérique</span>
          </h1>
          <div className="max-w-md">
            <SearchBar />
          </div>
        </div>

        {/* Theme toggle + Onboarding */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#e2e8f0",
            }}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
