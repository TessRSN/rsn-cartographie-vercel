# Spec — i18n FR/EN + bouton GitHub dans la NavBar

**Date** : 2026-05-14
**Auteur** : Tess + Claude
**Statut** : En relecture

## Contexte

La cartographie RSN est aujourd'hui exclusivement en français (libellés UI, métadonnées, contenus venant de Notion). Tess veut :
1. Permettre aux visiteurs anglophones d'utiliser l'application en lisant l'**interface** en anglais. Les contenus venant de Notion (noms d'organisations, descriptions, etc.) **restent dans leur langue d'origine** — la cartographie reste un objet québécois.
2. Ajouter un **lien visible vers le dépôt GitHub** dans la NavBar pour ouvrir la transparence du projet et inviter à contribuer.

Contrainte SEO : Tess veut être trouvée en anglais aussi → les deux versions doivent être indexables par Google séparément.

## Objectifs

- Bascule FR ↔ EN via un bouton dans la NavBar, persistante entre visites (cookie).
- Toutes les chaînes statiques de l'UI sont traduites (NavBar, onglets, filtres, DetailCard, états vides, OnboardingModal, metadata, JSON-LD labels).
- URLs anglaises distinctes (`/en/...`) avec `hreflang` correct → Google indexe les 2 versions.
- Lien GitHub avec icône, `target="_blank"`, dans la NavBar.
- Aucune URL FR existante ne casse.

## Non-objectifs

- Traduction des contenus Notion (noms d'orgs, descriptions, etc.). Ils restent tels que saisis.
- Traduction des données géocodées (Nominatim).
- Support d'une 3e langue (extensible mais pas dans ce scope).
- Workflow de contribution / édition (sujet séparé, cf. memory/project_contribution_strategy.md).

## Architecture

### Librairie : `next-intl`

Choix : `next-intl` v3+, standard de facto pour Next.js 16 App Router. Fournit :
- Routing localisé avec préfixes de chemin
- Server Components natifs (pas de "use client" forcé)
- Détection automatique de la locale (`Accept-Language`)
- Hreflang tags automatiques
- API de traduction simple (`useTranslations()` côté client, `getTranslations()` côté serveur)

### Routing

Stratégie : **`as-needed` prefix** (préfixe uniquement pour les locales non-défaut).

| URL | Locale | Notes |
|---|---|---|
| `/` | FR (default) | Pas de préfixe — n'invalide aucune URL existante |
| `/en` | EN | Page d'accueil anglaise |
| `/entite/abc` | FR | Page entité française |
| `/en/entite/abc` | EN | Même page, libellés UI en anglais, contenu Notion identique |

### Structure de fichiers

```
app/
  [locale]/                     ← nouveau wrapper (le segment dynamique)
    layout.tsx                   ← déplacé depuis app/layout.tsx, lit la locale
    page.tsx                     ← déplacé depuis app/page.tsx
    entite/[id]/
      page.tsx                   ← déplacé
  layout.tsx                     ← root layout minimal (html/body, fonts)
i18n/
  routing.ts                     ← config next-intl (locales, defaultLocale, pathnames)
  request.ts                     ← config server (chargement des messages)
messages/
  fr.json                        ← toutes les chaînes en français
  en.json                        ← toutes les chaînes en anglais
middleware.ts                    ← middleware next-intl (négociation locale, redirects)
```

Note sur `[locale]` avec `localePrefix: "as-needed"` : next-intl gère la non-existence du préfixe pour la default locale. Les routes restent `/`, `/entite/[id]` pour FR ; `/en`, `/en/entite/[id]` pour EN.

### Inventaire des chaînes à traduire

Ces fichiers contiennent des chaînes en dur à externaliser. Liste indicative (l'exhaustif sera fait à l'impl) :

- `components/NavBar.tsx` : titres mobile/desktop, aria-labels
- `components/OnboardingModal.tsx` : tout le texte
- `components/DiagramRoot.tsx` : noms d'onglets (Graphe, Galerie, Tableau, Carte)
- `components/SearchBar.tsx` : placeholder
- `components/Reagraph.tsx` + ses contrôles : labels de filtres, légende
- `components/MapView.tsx` : message d'état vide, popups labels
- `components/CardGridView.tsx` : tri, labels
- `components/Table*.tsx` : en-têtes de colonnes, libellés
- `components/DetailCard/*` : titres de sections (Liens, Contacts, Sous-organisations, etc.)
- `components/FilterDropdown.tsx` : labels génériques
- `app/[locale]/layout.tsx` : title template, description, keywords (via `generateMetadata`)
- `app/[locale]/entite/[id]/page.tsx` : metadata + JSON-LD labels
- `app/sitemap.ts` : ajouter les URLs `/en/...`
- `app/robots.ts` : éventuel ajustement

Convention de clés : namespaces par feature (`nav.title`, `tabs.graph`, `filters.type`, `detailCard.links`, `meta.siteTitle`...).

### Composants NavBar — nouveaux boutons

Placement (de gauche à droite, **après le toggle thème, avant OnboardingModal**) :

1. **`LanguageSwitcher`** (nouveau composant client)
   - Pill arrondi, même style que le toggle thème actuel (`rgba(255,255,255,0.1)` background, `#e2e8f0` text)
   - Contenu : icône globe (SVG inline) + libellé de la **langue cible** ("EN" si actuel = FR, "FR" si actuel = EN)
   - Au clic : `router.replace(pathname, { locale: nextLocale })` via `useRouter` de next-intl
   - aria-label : "Changer la langue" / "Change language" (traduit)

2. **`GithubLink`** (nouveau composant)
   - Pill arrondi, même style
   - Contenu : icône GitHub officielle (logo SVG inline)
   - `<a href="https://github.com/TessRSN/rsn-cartographie-vercel" target="_blank" rel="noopener noreferrer">`
   - aria-label : "Code source sur GitHub" / "Source code on GitHub" (traduit)

### Logo selon la langue

Le projet a déjà `public/SVG_RSN/L_RSN_EN_RGB_W.svg`. La NavBar charge déjà `L_RSN_FR_RGB_W.svg`. **On swap selon la locale** :
- FR → `L_RSN_FR_RGB_W.svg`
- EN → `L_RSN_EN_RGB_W.svg`

### Détection initiale + persistance

- 1er visit : middleware next-intl détecte `Accept-Language` → redirige vers `/` (FR) ou `/en/...` (EN) selon préférence.
- Après 1er switch manuel : cookie `NEXT_LOCALE` posé, override la détection navigateur.

### SEO

- `<html lang="...">` dynamique selon la locale (déjà géré par next-intl).
- `<link rel="alternate" hreflang="fr" href="..." />` et `hreflang="en"` ajoutés sur chaque page (utiliser le helper `generateMetadata` + `alternates.languages`).
- `app/sitemap.ts` : émet 2 entrées par page (FR + EN).
- Metadata `title`, `description`, `openGraph`, `keywords` localisés via `getTranslations`.

## Flux de données

```
Request /en/entite/xyz
  → middleware next-intl
  → app/[locale]/layout.tsx (locale="en")
    → NextIntlClientProvider (messages chargés depuis messages/en.json)
    → fetch entité depuis Notion (contenu non traduit, identique FR/EN)
  → app/[locale]/entite/[id]/page.tsx
    → generateMetadata utilise getTranslations pour title/description
    → rendu avec libellés EN + données Notion brutes
```

## Cas d'erreur

- **Clé de traduction manquante** : `next-intl` log un warning en dev et affiche la clé. Stratégie : strict mode en dev, fallback FR en prod (configurable).
- **URL avec locale inconnue** (`/de/...`) : 404 via la config `locales` restrictive.
- **Switch de langue sur page entité supprimée** : next-intl reste sur le même path, donc redirige vers `/en/entite/xyz` même si l'ID n'existe plus → la page entité gère son propre 404 (déjà en place).

## Tests

- **Manuel** : checklist de navigation FR → EN sur chaque vue (graphe, galerie, tableau, carte), entité, modal d'onboarding.
- **Vérif SEO** : inspecter le HTML rendu pour les pages `/` et `/en` :
  - `<html lang>` correct
  - `<link rel="alternate" hreflang>` présent
  - Sitemap contient les 2 versions
- **Vérif lighthouse** sur `/` et `/en/...` pour confirmer pas de régression perf.

## Impact sur l'existant

- **Risque routing** : tous les composants qui font `<Link href="/...">` doivent passer par le `Link` de next-intl (auto-locale-aware) pour préserver la locale lors de la navigation. À auditer.
- **Risque ISR** : avec `[locale]` ajouté, les routes ISR existantes deviennent paramétrées. Le cache ISR de 60s reste valide mais s'applique séparément à FR et EN.
- **Aucune URL FR existante ne casse** car FR reste à `/` sans préfixe (`localePrefix: "as-needed"`).

## Décisions ouvertes

Aucune au moment de l'écriture du spec. Toutes les questions stratégiques ont été tranchées dans la discussion préalable :
- Routing : `as-needed` (FR à `/`, EN à `/en`).
- Librairie : `next-intl`.
- Scope traduction : UI statique + metadata, pas le contenu Notion.
- Logo : swap selon locale.
- Boutons : placement entre toggle thème et OnboardingModal.

## Notes pour le plan d'implémentation

Le plan d'implémentation (créé via `superpowers:writing-plans` après validation de ce spec) découpera en étapes :
1. Installer next-intl, créer la config + middleware
2. Déplacer les routes sous `[locale]/`
3. Externaliser les chaînes (un composant à la fois, ou par batches)
4. Ajouter `LanguageSwitcher` et `GithubLink` dans la NavBar
5. Swap du logo selon la locale
6. Mettre à jour sitemap, robots, metadata
7. Tests manuels FR + EN sur toutes les vues
