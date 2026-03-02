import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/NavBar";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Cartographie RSN",
    template: "%s | Cartographie RSN",
  },
  description:
    "Cartographie interactive des plateformes, organismes, personnes et jeux de données du Réseau en santé numérique (RSN)",
  keywords: [
    "RSN",
    "santé numérique",
    "cartographie",
    "données de santé",
    "Québec",
    "réseau",
    "plateformes",
  ],
  authors: [{ name: "Réseau en santé numérique" }],
  openGraph: {
    title: "Cartographie RSN",
    description:
      "Cartographie interactive des plateformes du Réseau en santé numérique",
    url: SITE_URL,
    siteName: "Cartographie RSN",
    locale: "fr_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartographie RSN",
    description:
      "Cartographie interactive des plateformes du Réseau en santé numérique",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Cartographie RSN",
              description:
                "Cartographie interactive des plateformes du Réseau en santé numérique",
              url: SITE_URL,
              applicationCategory: "DataVisualization",
              operatingSystem: "Web",
              inLanguage: "fr-CA",
              author: {
                "@type": "Organization",
                name: "Réseau en santé numérique",
                url: "https://rsn.quebec/",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
