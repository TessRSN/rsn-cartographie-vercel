"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const targetLocale = locale === "fr" ? "en" : "fr";

  function handleClick() {
    startTransition(() => {
      const query = searchParams?.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { locale: targetLocale });
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
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
