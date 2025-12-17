"use client";

import { SearchBar } from "./SearchBar";
import { Moon, Sun } from "lucide-react";
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

  const hoverClass =
    theme === "dark" ? "hover:bg-slate-700" : "hover:bg-[#FAFAFA]";

  return (
    <nav>
      <div>
        <div className="flex px-4 justify-between items-center h-16">
          {theme === "dark" ? (
            <img src="/SVG_RSN/L_RSN_FR_RGB_W.svg" width={120} alt="Logo" />
          ) : (
            <img src="/SVG_RSN/L_RSN_FR_RGB_K.svg" width={120} alt="Logo" />
          )}

          <SearchBar />
          <div className="flex items-center space-x-6">
            <button
              onClick={() => {
                if (theme === "light") {
                  setTheme("dark");
                } else {
                  setTheme("light");
                }
              }}
              className={`btn btn-ghost p-2 rounded-lg transition-colors ${hoverClass}`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
            <OnboardingModal />
          </div>
        </div>
      </div>
    </nav>
  );
}
