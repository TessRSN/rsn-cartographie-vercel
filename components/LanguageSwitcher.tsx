"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const targetLocale = locale === "fr" ? "en" : "fr";

  function handleClick() {
    const query = searchParams?.toString();
    const pathWithQuery = query ? `${pathname}?${query}` : pathname;
    // Build the URL directly instead of relying on next-intl's client router,
    // which always forces a locale prefix (even for the unprefixed default
    // locale) and depends on a middleware redirect to strip it back off —
    // a redirect that Next.js's soft client-side navigation can silently drop.
    const href =
      targetLocale === routing.defaultLocale
        ? pathWithQuery
        : `/${targetLocale}${pathWithQuery}`;
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;
    window.location.href = href;
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 h-7 md:h-8 px-2 md:px-3 rounded-lg transition-all text-xs md:text-sm font-medium"
      style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        color: "#e2e8f0",
      }}
      aria-label={t("switchLanguageAriaLabel")}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span className="uppercase">{targetLocale}</span>
    </button>
  );
}
