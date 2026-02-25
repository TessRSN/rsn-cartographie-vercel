"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue) {
        window.history.pushState(
          {},
          "",
          `${pathname}?q=${encodeURIComponent(inputValue)}`
        );
      } else {
        window.history.pushState({}, "", pathname);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: "rgba(255,255,255,0.4)" }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className="bg-transparent border-none outline-none text-sm flex-1 min-w-0"
        style={{ color: "#e2e8f0" }}
        placeholder="Rechercher…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {inputValue && (
        <button
          onClick={() => setInputValue("")}
          className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full transition-opacity"
          style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}
          aria-label="Effacer la recherche"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {!inputValue && (
        <div className="flex items-center gap-0.5 flex-shrink-0" style={{ opacity: 0.35 }}>
          <kbd
            className="text-[10px] font-mono px-1 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
          >⌘</kbd>
          <kbd
            className="text-[10px] font-mono px-1 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
          >K</kbd>
        </div>
      )}
    </div>
  );
}
