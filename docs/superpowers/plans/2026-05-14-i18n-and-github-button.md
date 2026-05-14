# i18n FR/EN + bouton GitHub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la bascule FR/EN (next-intl, routing `/` + `/en`) et un bouton lien GitHub dans la NavBar.

**Architecture:** next-intl avec `localePrefix: "as-needed"` (FR à `/`, EN à `/en`). Toutes les routes existantes (`/`, `/entite/[id]`) déplacées sous `app/[locale]/`. Chaînes UI externalisées dans `messages/{fr,en}.json`. Contenus venant de Notion non traduits. Logo NavBar swap selon locale.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, next-intl 3+, Tailwind 4.

**Reference spec:** `docs/superpowers/specs/2026-05-14-i18n-and-github-button-design.md`

**Test strategy:** Ce projet n'a pas de framework de tests unitaires installé. Pour chaque tâche, la vérification se fait par :
1. `pnpm tsc --noEmit` (type check) — équivalent du "test pass"
2. `pnpm build` (compile complète) — pour les tâches structurelles
3. Smoke test manuel dans le navigateur via `pnpm dev` — pour vérifier le rendu et l'interactivité

Les commits sont fréquents et chaque tâche se termine sur un état déployable.

---

## File Structure

**Nouveaux fichiers** :
- `i18n/routing.ts` — config locales, defaultLocale, pathnames
- `i18n/request.ts` — chargement serveur des messages
- `middleware.ts` — middleware next-intl (négociation locale)
- `messages/fr.json` — toutes les chaînes en français
- `messages/en.json` — toutes les traductions anglaises
- `app/[locale]/layout.tsx` — layout localisé (déplacé depuis `app/layout.tsx`)
- `app/[locale]/page.tsx` — accueil localisé (déplacé)
- `app/[locale]/entite/layout.tsx` — déplacé
- `app/[locale]/entite/[id]/page.tsx` — déplacé
- `app/[locale]/entite/[id]/not-found.tsx` — déplacé
- `components/LanguageSwitcher.tsx` — pill bouton FR/EN
- `components/GithubLink.tsx` — pill lien GitHub

**Fichiers modifiés** :
- `app/layout.tsx` — réduit à un root layout minimal (html/body)
- `app/sitemap.ts` — émission bilingue FR + EN
- `app/robots.ts` — ajustement si nécessaire
- `next.config.ts` — ajout du plugin next-intl
- `components/NavBar.tsx` — useTranslations + swap logo + nouveaux boutons
- `components/OnboardingModal.tsx` — useTranslations sur tout le contenu
- `components/DiagramRoot.tsx` — useTranslations sur les onglets
- `components/SearchBar.tsx` — useTranslations sur placeholder
- `components/Reagraph.tsx` — useTranslations sur filtres/légende
- `components/MapView.tsx` — useTranslations sur messages d'état
- `components/CardGridView.tsx` — useTranslations sur labels
- `components/DetailCard/*.tsx` — useTranslations sur libellés de sections

---

### Task 1: Installer next-intl et créer la configuration de base

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `middleware.ts`
- Modify: `next.config.ts`
- Modify: `package.json` (auto via pnpm)

- [ ] **Step 1: Installer next-intl**

Run:
```bash
pnpm add next-intl
```

Expected: ajout dans `package.json`, version 3.x ou 4.x compatible Next 16.

- [ ] **Step 2: Créer `i18n/routing.ts`**

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
```

- [ ] **Step 3: Créer `i18n/request.ts`**

```typescript
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Créer `middleware.ts` à la racine**

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 5: Ajouter le plugin dans `next.config.ts`**

Remplacer le contenu de `next.config.ts` par :

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Créer `messages/fr.json` et `messages/en.json` vides initiaux**

`messages/fr.json` :
```json
{}
```

`messages/en.json` :
```json
{}
```

- [ ] **Step 7: Vérifier le type-check**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS (aucune erreur).

À cette étape, l'app n'est PAS encore fonctionnelle (les routes ne sont pas déplacées). C'est normal — la tâche 2 corrige ça. Ne pas faire `pnpm build` ici.

- [ ] **Step 8: Commit**

```bash
git add i18n/ middleware.ts next.config.ts messages/ package.json pnpm-lock.yaml
git commit -m "feat(i18n): installer next-intl et créer la configuration de base"
```

---

### Task 2: Restructurer les routes sous `app/[locale]/`

**Files:**
- Move: `app/page.tsx` → `app/[locale]/page.tsx`
- Move: `app/entite/layout.tsx` → `app/[locale]/entite/layout.tsx`
- Move: `app/entite/[id]/page.tsx` → `app/[locale]/entite/[id]/page.tsx`
- Move: `app/entite/[id]/not-found.tsx` → `app/[locale]/entite/[id]/not-found.tsx`
- Create: `app/[locale]/layout.tsx` (depuis `app/layout.tsx`, adapté)
- Modify: `app/layout.tsx` (réduit à root layout minimal)

- [ ] **Step 1: Déplacer les fichiers de routes**

Run:
```bash
mkdir -p 'app/[locale]/entite/[id]'
git mv app/page.tsx 'app/[locale]/page.tsx'
git mv app/entite/layout.tsx 'app/[locale]/entite/layout.tsx'
git mv 'app/entite/[id]/page.tsx' 'app/[locale]/entite/[id]/page.tsx'
git mv 'app/entite/[id]/not-found.tsx' 'app/[locale]/entite/[id]/not-found.tsx'
rmdir 'app/entite/[id]' app/entite
```

Note : guillemets simples pour les chemins entre crochets.

- [ ] **Step 2: Créer le nouveau `app/[locale]/layout.tsx` (localisé)**

Ce nouveau layout reprend le contenu de l'ancien `app/layout.tsx` (avant cette tâche), avec ces transformations :

1. Supprimer les imports de `Geist`, `Geist_Mono` et de `globals.css` (ils resteront dans le root layout minimal de l'étape 3).
2. Remplacer le `<html>...<body>...` actuel par une enveloppe `<NextIntlClientProvider>` (sans `<html>` ni `<body>`, qui sont posés par le root layout).
3. Convertir l'export `metadata` statique en `generateMetadata({ params })` async qui appelle `getTranslations` pour la locale courante.
4. Préserver le bloc script JSON-LD existant **tel quel** (même API React, mêmes propriétés), en passant les valeurs traduites via `getTranslations`.
5. Ajouter `generateStaticParams` qui retourne `routing.locales.map(locale => ({ locale }))`.
6. Appeler `setRequestLocale(locale)` après validation de la locale.
7. Si la locale n'est pas dans `routing.locales`, appeler `notFound()`.

Imports nécessaires :
```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/NavBar";
import { ThemeProvider } from "next-themes";
import { routing } from "@/i18n/routing";
```

Squelette de `generateMetadata` :
```typescript
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
    keywords: t("keywords").split(","),
    authors: [{ name: t("authorName") }],
    openGraph: {
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app",
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
  };
}
```

Squelette du composant :
```typescript
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
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app",
    applicationCategory: "DataVisualization",
    operatingSystem: "Web",
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    author: {
      "@type": "Organization",
      name: t("authorName"),
      url: "https://rsn.quebec/",
    },
  };

  return (
    <NextIntlClientProvider>
      {/* Conserver le script JSON-LD existant — même pattern React, mêmes attributs.
          Remplacer JSON.stringify(...) par JSON.stringify(jsonLd) avec l'objet ci-dessus. */}
      <ThemeProvider>
        <Navbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
```

**Note importante sur le JSON-LD** : le pattern React utilisé pour injecter le script (présent dans l'ancien `app/layout.tsx`) doit être préservé à l'identique — copier la balise script existante telle quelle, en remplaçant uniquement la source de l'objet par `jsonLd` ci-dessus.

- [ ] **Step 3: Réduire `app/layout.tsx` à un root layout minimal**

Remplacer entièrement `app/layout.tsx` par :

```tsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
```

Note : le `<html lang>` sera défini par next-intl via les `<meta>` (le client lit la locale via le contexte). Si Lighthouse réclame un `lang` au niveau `<html>`, faire passer la locale depuis le layout enfant — voir le pattern next-intl docs si nécessaire. Par défaut, omettre l'attribut suffit (les moteurs de recherche utilisent les `<link hreflang>` de toute façon).

- [ ] **Step 4: Remplir `messages/fr.json` et `messages/en.json` avec le namespace `meta`**

`messages/fr.json` :
```json
{
  "meta": {
    "siteTitle": "Cartographie RSN",
    "titleTemplate": "%s | Cartographie RSN",
    "siteDescription": "Cartographie interactive des plateformes, organismes, personnes et jeux de données du Réseau en santé numérique (RSN)",
    "keywords": "RSN,santé numérique,cartographie,données de santé,Québec,réseau,plateformes",
    "authorName": "Réseau en santé numérique"
  }
}
```

`messages/en.json` :
```json
{
  "meta": {
    "siteTitle": "RSN Cartography",
    "titleTemplate": "%s | RSN Cartography",
    "siteDescription": "Interactive cartography of platforms, organizations, people and datasets of the Quebec Digital Health Network (RSN)",
    "keywords": "RSN,digital health,cartography,health data,Quebec,network,platforms",
    "authorName": "Réseau en santé numérique"
  }
}
```

- [ ] **Step 5: Type-check + dev server**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run:
```bash
pnpm dev
```

Ouvrir `http://localhost:3000` — la page d'accueil doit s'afficher en français.
Ouvrir `http://localhost:3000/en` — même page, contenu inchangé pour l'instant (les composants ne sont pas encore traduits, seules les meta sont localisées).
Ouvrir `http://localhost:3000/entite/<un-id-existant>` puis `/en/entite/<même-id>` — vérifier que les deux fonctionnent.

Arrêter `pnpm dev`.

- [ ] **Step 6: Commit**

```bash
git add app/ messages/
git commit -m "feat(i18n): restructurer les routes sous [locale]/ avec FR par défaut"
```

---

### Task 3: Externaliser les chaînes de la NavBar + swap du logo

**Files:**
- Modify: `components/NavBar.tsx`
- Modify: `messages/fr.json` (ajouter namespace `nav`)
- Modify: `messages/en.json` (ajouter namespace `nav`)

- [ ] **Step 1: Ajouter le namespace `nav` dans `messages/fr.json`**

Ajouter dans `messages/fr.json` (en gardant le namespace `meta` existant) :

```json
"nav": {
  "logoAlt": "Logo RSN",
  "titleMobile": "Cartographie RSN",
  "titleDesktop": "Cartographie des plateformes du Réseau en santé numérique",
  "toggleThemeAriaLabel": "Changer le thème"
}
```

- [ ] **Step 2: Ajouter le namespace `nav` dans `messages/en.json`**

```json
"nav": {
  "logoAlt": "RSN Logo",
  "titleMobile": "RSN Cartography",
  "titleDesktop": "Cartography of the Quebec Digital Health Network platforms",
  "toggleThemeAriaLabel": "Toggle theme"
}
```

- [ ] **Step 3: Refactor `components/NavBar.tsx`**

Ajouter en haut :
```tsx
import { useLocale, useTranslations } from "next-intl";
```

Dans le composant, après `useTheme`, ajouter :
```tsx
const locale = useLocale();
const t = useTranslations("nav");
```

Calcul du logo selon la locale :
```tsx
const logoSrc =
  locale === "en"
    ? "/SVG_RSN/L_RSN_EN_RGB_W.svg"
    : "/SVG_RSN/L_RSN_FR_RGB_W.svg";
```

Remplacer dans le JSX :
- `src="/SVG_RSN/L_RSN_FR_RGB_W.svg"` → `src={logoSrc}`
- `alt="Logo RSN"` → `alt={t("logoAlt")}`
- `<span className="md:hidden">Cartographie RSN</span>` → `<span className="md:hidden">{t("titleMobile")}</span>`
- `<span className="hidden md:inline">Cartographie des plateformes du Réseau en santé numérique</span>` → `<span className="hidden md:inline">{t("titleDesktop")}</span>`
- `aria-label="Toggle theme"` → `aria-label={t("toggleThemeAriaLabel")}`

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` et vérifier :
- `/` : logo FR, titre en français
- `/en` : logo EN (le SVG `L_RSN_EN_RGB_W.svg`), titre en anglais

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/NavBar.tsx messages/
git commit -m "feat(i18n): externaliser les chaînes de la NavBar et swap du logo selon locale"
```

---

### Task 4: Composant `LanguageSwitcher`

**Files:**
- Create: `components/LanguageSwitcher.tsx`
- Modify: `components/NavBar.tsx`
- Modify: `messages/fr.json` (namespace `nav`)
- Modify: `messages/en.json` (namespace `nav`)

- [ ] **Step 1: Ajouter les clés aria-label**

Dans `messages/fr.json`, dans le namespace `nav`, ajouter :
```json
"switchLanguageAriaLabel": "Changer la langue"
```

Dans `messages/en.json`, dans le namespace `nav`, ajouter :
```json
"switchLanguageAriaLabel": "Change language"
```

- [ ] **Step 2: Créer `components/LanguageSwitcher.tsx`**

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const targetLocale = locale === "fr" ? "en" : "fr";

  function handleClick() {
    startTransition(() => {
      let newPath: string;
      if (locale === "en") {
        newPath = pathname.startsWith("/en")
          ? pathname.replace(/^\/en/, "") || "/"
          : pathname;
      } else {
        newPath = pathname === "/" ? "/en" : `/en${pathname}`;
      }
      router.replace(newPath);
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
```

- [ ] **Step 3: Wirer `LanguageSwitcher` dans `NavBar`**

Dans `components/NavBar.tsx`, ajouter l'import en haut :
```tsx
import { LanguageSwitcher } from "./LanguageSwitcher";
```

Et dans le bloc de droite (entre le bouton toggle thème et `<OnboardingModal />`), ajouter :
```tsx
<LanguageSwitcher />
```

Ordre final dans la NavBar (gauche → droite) : toggle thème → LanguageSwitcher → OnboardingModal (le bouton GitHub viendra à la tâche 5).

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` et vérifier :
- Sur `/`, le bouton affiche le globe + "EN"
- Cliquer → URL devient `/en`, contenu en anglais, bouton affiche "FR"
- Cliquer → URL revient à `/`, contenu en français, bouton "EN"
- Tester sur `/entite/<id>` : le switch doit conserver l'ID dans l'URL (`/en/entite/<id>` ↔ `/entite/<id>`)

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/LanguageSwitcher.tsx components/NavBar.tsx messages/
git commit -m "feat(i18n): ajouter LanguageSwitcher avec bascule FR/EN dans la NavBar"
```

---

### Task 5: Composant `GithubLink`

**Files:**
- Create: `components/GithubLink.tsx`
- Modify: `components/NavBar.tsx`
- Modify: `messages/fr.json` (namespace `nav`)
- Modify: `messages/en.json` (namespace `nav`)

- [ ] **Step 1: Ajouter la clé aria-label**

Dans `messages/fr.json`, namespace `nav` :
```json
"githubAriaLabel": "Code source sur GitHub"
```

Dans `messages/en.json`, namespace `nav` :
```json
"githubAriaLabel": "Source code on GitHub"
```

- [ ] **Step 2: Créer `components/GithubLink.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";

const GITHUB_URL = "https://github.com/TessRSN/rsn-cartographie-vercel";

export function GithubLink() {
  const t = useTranslations("nav");

  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all"
      style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        color: "#e2e8f0",
      }}
      aria-label={t("githubAriaLabel")}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5z"/>
      </svg>
    </a>
  );
}
```

- [ ] **Step 3: Wirer `GithubLink` dans `NavBar`**

Dans `components/NavBar.tsx`, ajouter l'import :
```tsx
import { GithubLink } from "./GithubLink";
```

Et dans le bloc de droite, après `<LanguageSwitcher />` et avant `<OnboardingModal />`, ajouter :
```tsx
<GithubLink />
```

Ordre final (gauche → droite) : toggle thème → LanguageSwitcher → GithubLink → OnboardingModal.

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` et vérifier :
- Le bouton GitHub apparaît avec l'icône Octocat
- Au clic, ouvre un nouvel onglet vers `https://github.com/TessRSN/rsn-cartographie-vercel`
- Sur `/en`, l'aria-label est en anglais (vérifier via l'inspecteur)

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/GithubLink.tsx components/NavBar.tsx messages/
git commit -m "feat(navbar): ajouter le lien GitHub avec icône Octocat"
```

---

### Task 6: Externaliser les chaînes de `OnboardingModal`

**Files:**
- Modify: `components/OnboardingModal.tsx`
- Modify: `messages/fr.json` (namespace `onboarding`)
- Modify: `messages/en.json` (namespace `onboarding`)

- [ ] **Step 1: Inventorier les chaînes en dur**

Lire `components/OnboardingModal.tsx`. Lister exhaustivement : titres d'étapes, descriptions, tips, libellés de boutons (Précédent, Suivant, Terminer), aria-labels (ouvrir, fermer).

- [ ] **Step 2: Créer le namespace `onboarding` dans les deux fichiers messages**

Structure (à compléter avec les libellés exacts du composant) :

`messages/fr.json` :
```json
"onboarding": {
  "openAriaLabel": "Aide / Onboarding",
  "closeAriaLabel": "Fermer",
  "previous": "Précédent",
  "next": "Suivant",
  "finish": "Terminer",
  "steps": {
    "welcome": {
      "title": "Bienvenue",
      "description": "...copier du composant...",
      "tip": "...copier du composant..."
    },
    "graph": { "title": "...", "description": "...", "tip": "..." },
    "gallery": { "title": "...", "description": "...", "tip": "..." },
    "table": { "title": "...", "description": "...", "tip": "..." },
    "map": { "title": "...", "description": "...", "tip": "..." }
  }
}
```

Adapter le nombre et les clés d'étapes au composant réel. Pour `messages/en.json`, traduire chaque champ en anglais.

- [ ] **Step 3: Refactor `components/OnboardingModal.tsx`**

Ajouter en haut :
```tsx
import { useTranslations } from "next-intl";
```

Dans le composant, ajouter :
```tsx
const t = useTranslations("onboarding");
```

Refactor du tableau `onboardingSteps` (qui contient actuellement title/description/tip en dur) en une construction qui prend les textes depuis `t()`, en conservant le mapping id → icône SVG :

```tsx
const stepIcons: Record<string, React.ReactNode> = {
  welcome: stepIcon(<><path d="..."/></>),
  graph: stepIcon(<>...</>),
  gallery: stepIcon(<>...</>),
  table: stepIcon(<>...</>),
  map: stepIcon(<>...</>),
};

const stepIds = ["welcome", "graph", "gallery", "table", "map"];

const onboardingSteps = stepIds.map((id, index) => ({
  id: index + 1,
  title: t(`steps.${id}.title`),
  description: t(`steps.${id}.description`),
  tip: t(`steps.${id}.tip`),
  icon: stepIcons[id],
}));
```

Pour les boutons et aria-labels : remplacer chaque chaîne en dur par `t("previous")`, `t("next")`, `t("finish")`, `t("openAriaLabel")`, `t("closeAriaLabel")`.

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev`, ouvrir l'onboarding :
- En FR : toutes les étapes affichent les textes existants
- Switcher vers EN, ré-ouvrir l'onboarding : textes en anglais
- Boutons Précédent / Suivant / Terminer dans la bonne langue

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/OnboardingModal.tsx messages/
git commit -m "feat(i18n): externaliser les chaînes de OnboardingModal"
```

---

### Task 7: Externaliser les onglets de `DiagramRoot` et `SearchBar`

**Files:**
- Modify: `components/DiagramRoot.tsx`
- Modify: `components/SearchBar.tsx`
- Modify: `messages/fr.json` (namespaces `tabs`, `search`)
- Modify: `messages/en.json`

- [ ] **Step 1: Inventorier les onglets et les chaînes de la SearchBar**

Lire `components/DiagramRoot.tsx` pour repérer les libellés des 4 onglets et tout autre texte UI.
Lire `components/SearchBar.tsx` pour repérer placeholder, aria-label, libellés de résultats.

- [ ] **Step 2: Ajouter les namespaces `tabs` et `search`**

`messages/fr.json` :
```json
"tabs": {
  "graph": "Graphe",
  "gallery": "Galerie",
  "table": "Tableau",
  "map": "Carte"
},
"search": {
  "placeholder": "Rechercher une organisation, personne, dataset…",
  "ariaLabel": "Rechercher",
  "noResults": "Aucun résultat",
  "clearAriaLabel": "Effacer la recherche"
}
```

`messages/en.json` :
```json
"tabs": {
  "graph": "Graph",
  "gallery": "Gallery",
  "table": "Table",
  "map": "Map"
},
"search": {
  "placeholder": "Search for an organization, person, dataset…",
  "ariaLabel": "Search",
  "noResults": "No results",
  "clearAriaLabel": "Clear search"
}
```

Ajuster les clés selon les chaînes effectivement présentes dans la SearchBar.

- [ ] **Step 3: Remplacer les libellés en dur**

Dans `DiagramRoot.tsx`, ajouter en haut :
```tsx
import { useTranslations } from "next-intl";
```

Dans le composant : `const tTabs = useTranslations("tabs");`
Remplacer "Graphe" → `tTabs("graph")`, idem pour les 3 autres onglets.

Dans `SearchBar.tsx`, pattern similaire : `const tSearch = useTranslations("search");`. Remplacer placeholder, aria-label, "Aucun résultat".

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` :
- FR : onglets et search en français
- EN : onglets et search en anglais

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/DiagramRoot.tsx components/SearchBar.tsx messages/
git commit -m "feat(i18n): externaliser onglets DiagramRoot et chaînes SearchBar"
```

---

### Task 8: Externaliser les filtres (Reagraph et FilterDropdown)

**Files:**
- Modify: `components/Reagraph.tsx`
- Modify: `components/FilterDropdown.tsx` (s'il existe — vérifier)
- Modify: `messages/fr.json` (namespace `filters`)
- Modify: `messages/en.json`

- [ ] **Step 1: Inventorier les chaînes des filtres**

Lire `components/Reagraph.tsx` pour identifier : labels de filtres (Type, Domaine, Couverture, etc.), options statiques ("Tous", "Aucun"), légende du graphe, compteurs de résultats, boutons de contrôle (Reset, Apply).
Vérifier si `components/FilterDropdown.tsx` existe ; si oui, l'inclure.

- [ ] **Step 2: Ajouter le namespace `filters`**

`messages/fr.json` :
```json
"filters": {
  "typeLabel": "Type",
  "domainLabel": "Domaine",
  "coverageLabel": "Couverture géographique",
  "allOption": "Tous",
  "noneOption": "Aucun",
  "resetButton": "Réinitialiser",
  "applyButton": "Appliquer",
  "resultsCount": "{count, plural, =0 {Aucun résultat} =1 {1 résultat} other {# résultats}}",
  "legend": {
    "organization": "Organisation",
    "person": "Personne",
    "dataset": "Jeu de données",
    "application": "Application",
    "catalog": "Catalogue"
  }
}
```

`messages/en.json` :
```json
"filters": {
  "typeLabel": "Type",
  "domainLabel": "Domain",
  "coverageLabel": "Geographic coverage",
  "allOption": "All",
  "noneOption": "None",
  "resetButton": "Reset",
  "applyButton": "Apply",
  "resultsCount": "{count, plural, =0 {No results} =1 {1 result} other {# results}}",
  "legend": {
    "organization": "Organization",
    "person": "Person",
    "dataset": "Dataset",
    "application": "Application",
    "catalog": "Catalog"
  }
}
```

Ajuster selon l'inventaire réel — ajouter clés manquantes après avoir vu le composant.

- [ ] **Step 3: Refactor les composants**

Pattern dans chaque composant filtre :
```tsx
import { useTranslations } from "next-intl";
const t = useTranslations("filters");
```
Puis remplacer chaque chaîne en dur par `t("clé")`. Pour le compteur :
```tsx
{t("resultsCount", { count: filteredItems.length })}
```

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` :
- FR / EN : ouvrir chaque filtre dans la vue Graphe, vérifier les labels
- Compteurs pluriel/singulier corrects dans les deux langues (0, 1, 2+ résultats)

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/Reagraph.tsx components/FilterDropdown.tsx messages/
git commit -m "feat(i18n): externaliser les labels des filtres et la légende"
```

---

### Task 9: Externaliser les vues `MapView`, `CardGridView`, et tableaux

**Files:**
- Modify: `components/MapView.tsx`
- Modify: `components/MapContent.tsx`
- Modify: `components/CardGridView.tsx`
- Modify: éventuels composants Table* sous `components/`
- Modify: `messages/fr.json` (namespaces `map`, `gallery`, `table`)
- Modify: `messages/en.json`

- [ ] **Step 1: Inventorier les chaînes par fichier**

Pour chaque fichier, lister les chaînes en dur :
- `MapView.tsx` / `MapContent.tsx` : messages d'état (par ex. "Aucune organisation localisée"), labels de popup, boutons
- `CardGridView.tsx` : tris, libellés, états vides
- Composants Table : en-têtes de colonnes (Nom, Type, Email, Financeur, Auteur, etc.)

- [ ] **Step 2: Ajouter les namespaces**

`messages/fr.json` (compléter selon inventaire) :
```json
"map": {
  "noLocatedOrganizations": "Aucune organisation localisée pour les filtres actuels.",
  "viewDetailsLink": "Voir la fiche complète"
},
"gallery": {
  "emptyState": "Aucun résultat",
  "sortBy": "Trier par",
  "sortName": "Nom",
  "sortType": "Type"
},
"table": {
  "columns": {
    "name": "Nom",
    "type": "Type",
    "email": "Courriel",
    "funder": "Financeur",
    "author": "Auteur",
    "domain": "Domaine"
  },
  "emptyState": "Aucune donnée"
}
```

Compléter `messages/en.json` avec traductions équivalentes.

- [ ] **Step 3: Refactor les composants**

Pattern habituel : `useTranslations("map")`, `useTranslations("gallery")`, `useTranslations("table")` selon le namespace, puis remplacer chaque chaîne en dur par l'appel correspondant.

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` :
- Tester les 4 vues en FR et EN
- Vérifier les messages d'état vide (filtre qui ne retourne rien)
- Vérifier les en-têtes de tableau

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/MapView.tsx components/MapContent.tsx components/CardGridView.tsx messages/
git commit -m "feat(i18n): externaliser les chaînes des vues Map, Gallery, Table"
```

---

### Task 10: Externaliser les `DetailCard*`

**Files:**
- Modify: `components/DetailCard/DetailCard.tsx`
- Modify: `components/DetailCard/DetailCardRoot.tsx`
- Modify: `components/DetailCard/OrganizationDetailCard.tsx`
- Modify: `components/DetailCard/PersonDetailCard.tsx`
- Modify: `components/DetailCard/DatasetDetailCard.tsx`
- Modify: `components/DetailCard/DataCatalogDetailCard.tsx`
- Modify: `components/DetailCard/SoftwareApplicationDetailCard.tsx`
- Modify: `components/DetailCard/Adresse.tsx`
- Modify: `components/DetailCard/Logo.tsx`
- Modify: `messages/fr.json` (namespace `detailCard`)
- Modify: `messages/en.json`

- [ ] **Step 1: Inventorier les sections et labels**

Pour chaque DetailCard, lister les sections et labels statiques (Description, Liens, Contacts, Sous-organisations, Membres, Auteur, Financeur, Adresse, Documents, Datasets, Applications, Catalogues, etc.).

- [ ] **Step 2: Ajouter le namespace `detailCard`**

`messages/fr.json` :
```json
"detailCard": {
  "sections": {
    "description": "Description",
    "links": "Liens",
    "contacts": "Contacts",
    "subOrganizations": "Sous-organisations",
    "members": "Membres",
    "author": "Auteur",
    "funder": "Financeur",
    "address": "Adresse",
    "documents": "Documents",
    "datasets": "Jeux de données",
    "applications": "Applications",
    "catalogs": "Catalogues",
    "relatedOrganizations": "Organisations liées"
  },
  "closeAriaLabel": "Fermer la carte"
}
```

`messages/en.json` :
```json
"detailCard": {
  "sections": {
    "description": "Description",
    "links": "Links",
    "contacts": "Contacts",
    "subOrganizations": "Sub-organizations",
    "members": "Members",
    "author": "Author",
    "funder": "Funder",
    "address": "Address",
    "documents": "Documents",
    "datasets": "Datasets",
    "applications": "Applications",
    "catalogs": "Catalogs",
    "relatedOrganizations": "Related organizations"
  },
  "closeAriaLabel": "Close card"
}
```

Compléter selon l'inventaire réel.

- [ ] **Step 3: Refactor chaque DetailCard**

Pattern :
```tsx
import { useTranslations } from "next-intl";
const t = useTranslations("detailCard");
// puis : t("sections.links"), t("sections.contacts"), etc.
```

Important : ne PAS passer les noms / descriptions venant de Notion par `t()`. Ces données restent brutes.

- [ ] **Step 4: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` :
- Ouvrir une DetailCard de chaque type d'entité en FR et en EN
- Vérifier que les labels de section sont traduits
- Le contenu Notion (noms, descriptions) reste dans sa langue d'origine — c'est attendu

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add components/DetailCard/ messages/
git commit -m "feat(i18n): externaliser les labels des DetailCards"
```

---

### Task 11: Localiser les metadata de la page entité + JSON-LD

**Files:**
- Modify: `app/[locale]/entite/[id]/page.tsx`
- Modify: `app/[locale]/entite/[id]/not-found.tsx`
- Modify: `messages/fr.json` (namespace `entityPage`)
- Modify: `messages/en.json`

- [ ] **Step 1: Inventorier le contenu localisable**

Lire `app/[locale]/entite/[id]/page.tsx`. Repérer :
- Le `generateMetadata` (titre, description)
- Le bloc JSON-LD (labels de champs)
- Tout texte de fallback / état d'erreur

Lire `not-found.tsx` pour les libellés.

- [ ] **Step 2: Ajouter le namespace `entityPage`**

`messages/fr.json` :
```json
"entityPage": {
  "metaDescription": "Fiche de {name} sur la cartographie du Réseau en santé numérique.",
  "notFoundTitle": "Entité introuvable",
  "notFoundDescription": "Cette entité n'existe pas ou a été supprimée.",
  "backToMap": "Retour à la cartographie"
}
```

`messages/en.json` :
```json
"entityPage": {
  "metaDescription": "Profile of {name} on the Quebec Digital Health Network cartography.",
  "notFoundTitle": "Entity not found",
  "notFoundDescription": "This entity does not exist or has been removed.",
  "backToMap": "Back to cartography"
}
```

- [ ] **Step 3: Refactor `generateMetadata`**

Adapter la signature pour récupérer la locale et appeler `getTranslations` :

```tsx
import { getTranslations } from "next-intl/server";
// ...
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const entity = await fetchEntityById(id); // utiliser le fetcher existant
  if (!entity) return {};

  const t = await getTranslations({ locale, namespace: "entityPage" });

  return {
    title: entity.name, // nom Notion, non traduit
    description: t("metaDescription", { name: entity.name }),
    alternates: {
      canonical: locale === "fr" ? `/entite/${id}` : `/${locale}/entite/${id}`,
      languages: {
        fr: `/entite/${id}`,
        en: `/en/entite/${id}`,
      },
    },
  };
}
```

Adapter le nom du fetcher au code réel (le fichier actuel utilise probablement une combinaison de fetchers — préserver la logique existante).

Pour le bloc JSON-LD : conserver le pattern d'injection React existant à l'identique, mais remplacer les labels statiques par les valeurs traduites (par ex. `t("labelName")` au lieu de `"name"` en dur si applicable). Les valeurs venant de Notion (nom, description de l'entité) restent brutes.

- [ ] **Step 4: Refactor `not-found.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("entityPage");

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h2 className="text-xl font-semibold">{t("notFoundTitle")}</h2>
      <p>{t("notFoundDescription")}</p>
      <Link href="/" className="underline">
        {t("backToMap")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Type-check + vérification visuelle**

Run:
```bash
pnpm tsc --noEmit
```

Expected: PASS.

Run `pnpm dev` :
- Ouvrir `/entite/<id-valide>` puis `/en/entite/<même-id>` : meta title contient le nom Notion, description traduite (vérifier via inspecteur > head)
- Présence des `<link rel="alternate" hreflang>` sur les deux versions
- Ouvrir `/entite/<id-invalide>` puis `/en/entite/<id-invalide>` : page not-found dans la bonne langue

Arrêter `pnpm dev`.

- [ ] **Step 6: Commit**

```bash
git add 'app/[locale]/entite/' messages/
git commit -m "feat(i18n): localiser metadata, JSON-LD et 404 des pages entité"
```

---

### Task 12: Sitemap bilingue + robots

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts` (vérifier, ajuster si besoin)

- [ ] **Step 1: Lire `app/sitemap.ts`**

Comprendre la structure actuelle : combien d'entrées, quelles routes émises, quelles sources de données.

- [ ] **Step 2: Modifier `app/sitemap.ts` pour émettre les 2 langues**

Pour chaque URL existante, émettre une entrée avec `alternates.languages` listant les deux versions :

```typescript
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsn-cartographie.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Récupérer les IDs depuis la même source que le sitemap actuel
  const ids: string[] = []; // remplacer par l'appel existant

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    lastModified: new Date(),
    alternates: {
      languages: {
        fr: SITE_URL,
        en: `${SITE_URL}/en`,
      },
    },
  };

  const entityEntries: MetadataRoute.Sitemap = ids.map((id) => ({
    url: `${SITE_URL}/entite/${id}`,
    lastModified: new Date(),
    alternates: {
      languages: {
        fr: `${SITE_URL}/entite/${id}`,
        en: `${SITE_URL}/en/entite/${id}`,
      },
    },
  }));

  return [homeEntry, ...entityEntries];
}
```

Adapter au contenu réel — préserver les `lastModified`, `changeFrequency`, `priority` existants s'ils sont définis.

- [ ] **Step 3: Lire `app/robots.ts` et vérifier**

Si `robots.ts` référence l'URL du sitemap, aucune modification probablement nécessaire (l'URL `/sitemap.xml` reste la même). Confirmer en lisant le fichier.

- [ ] **Step 4: Vérification**

Run:
```bash
pnpm tsc --noEmit
pnpm dev
```

Ouvrir `http://localhost:3000/sitemap.xml` : vérifier que chaque entrée contient des balises `<xhtml:link rel="alternate" hreflang="...">` pour FR et EN.

Arrêter `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat(seo): sitemap bilingue avec hreflang FR/EN"
```

---

### Task 13: Build, smoke test global, finalisation

**Files:** aucun nouveau fichier, vérification globale.

- [ ] **Step 1: Build complet**

Run:
```bash
pnpm build
```

Expected: build réussit sans erreur TypeScript. Les warnings ESLint sur les règles d'accessibilité ou autres peuvent persister, mais aucune erreur de compilation.

- [ ] **Step 2: Smoke test FR**

Lancer `pnpm start` puis ouvrir `http://localhost:3000` :
- Logo FR
- 4 onglets en français
- Filtres en français
- DetailCard de chaque type ouverte : labels en français, contenu Notion intact
- OnboardingModal complet en français, navigation Précédent/Suivant/Terminer
- Clic sur GithubLink : ouvre un nouvel onglet vers le repo GitHub
- `/entite/<id-réel>` : meta title + description en français

- [ ] **Step 3: Smoke test EN**

Clic sur LanguageSwitcher → URL devient `/en`. Vérifier :
- Logo EN swappé
- 4 onglets en anglais
- Filtres en anglais, compteurs corrects (singulier/pluriel)
- DetailCards : labels en anglais, contenu Notion intact (en français comme avant)
- OnboardingModal en anglais
- `/en/entite/<id>` : meta + JSON-LD en anglais

- [ ] **Step 4: Vérification SEO**

Sur `/` (inspecteur > head) :
- `<link rel="alternate" hreflang="fr" href="..." />` présent
- `<link rel="alternate" hreflang="en" href="..." />` présent

Sur `/en` : mêmes liens alternate présents.

Ouvrir `http://localhost:3000/sitemap.xml` : confirmer les alternates dans chaque entrée.

- [ ] **Step 5: Arrêter `pnpm start`**

Aucun commit supplémentaire nécessaire si toutes les vérifications passent.

- [ ] **Step 6: Push et ouvrir la PR**

```bash
git push -u origin feat/i18n-and-github-link
```

Puis créer la PR (utiliser `gh pr create` avec un titre concis et un body listant le résumé + la checklist de test). Voir la convention dans CLAUDE.md / la mémoire du projet.

Ne pas pousser ni créer la PR sans validation préalable de Tess.

---

## Notes pour l'exécution

- **Ordre strict** : les tâches 1-2 sont fondatrices, ne pas en sauter. Les tâches 3-12 peuvent être exécutées dans l'ordre ou regroupées si pertinent (mais commit après chaque pour rollback facile).
- **Inventaire des chaînes** : les tâches 6, 8, 9, 10, 11 demandent une lecture attentive du fichier concerné avant de produire le JSON. Si une chaîne a été oubliée, l'ajouter dans une tâche ultérieure plutôt que revenir en arrière.
- **Convention de clés** : camelCase, namespace par feature (`nav`, `tabs`, `filters`, `detailCard`, `entityPage`, etc.). Ne pas mélanger.
- **Notion content** : ne JAMAIS passer un nom d'organisation ou une description Notion par `t()`. Ces données restent brutes et inchangées entre FR et EN.
- **Pas de framework de tests** : à chaque étape, le seul critère "vert" est `pnpm tsc --noEmit` + smoke test manuel. Si une régression visuelle apparaît, ne pas commiter avant de l'avoir réglée.
- **JSON-LD** : préserver le pattern d'injection React existant dans `app/layout.tsx` et dans `entite/[id]/page.tsx`. Ne pas changer la méthode d'injection — seulement la source des valeurs (passer par `getTranslations` au lieu de littéraux).
