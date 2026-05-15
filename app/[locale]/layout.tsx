import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/NavBar";
import { ThemeProvider } from "next-themes";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie-vercel.vercel.app";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: { default: t("siteTitle"), template: t("titleTemplate") },
    description: t("siteDescription"),
    keywords: t("keywords").split(",").map((k) => k.trim()).filter(Boolean),
    authors: [{ name: t("authorName") }],
    openGraph: {
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: SITE_URL,
      siteName: t("siteTitle"),
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("siteTitle"),
      description: t("siteDescription"),
    },
    alternates: {
      canonical: locale === "fr" ? "/" : `/${locale}`,
      languages: { fr: "/", en: "/en" },
    },
    robots: { index: true, follow: true },
    verification: {
      google: "HRRCXRoPZ9wNwlIlBZEYOR-qnbGFAekhlaKC1Z5HJPk",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "meta" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("siteTitle"),
    description: t("siteDescription"),
    url: SITE_URL,
    applicationCategory: "DataVisualization",
    operatingSystem: "Web",
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    author: {
      "@type": "Organization",
      name: t("authorName"),
      url: "https://rsn.quebec/",
    },
  };

  // JSON-LD structured data — content is fully controlled by us
  // (translated strings + static schema), so JSON.stringify output is safe.
  const jsonLdHtml = JSON.stringify(jsonLd);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <NextIntlClientProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
          />
          <ThemeProvider>
            <Navbar />
            <main className="flex-1 overflow-hidden">{children}</main>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
