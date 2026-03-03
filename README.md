# RSN Cartographie

Application web de cartographie interactive des plateformes du **Réseau en santé numérique (RSN)**. Elle consomme les données de bases Notion via l'API Notion et les affiche dans quatre vues complémentaires : graphe de relations, galerie de cartes, tableau filtrable et carte géographique.

Déployée sur **Vercel** avec revalidation incrémentale (ISR) toutes les 60 secondes.

<!-- Pour ajouter un screenshot : placer l'image dans docs/screenshot.png puis décommenter la ligne ci-dessous -->
<!-- ![Aperçu de l'application](docs/screenshot.png) -->

## Prérequis

- **Node.js** >= 18
- **pnpm** >= 10 (gestionnaire de paquets utilisé par le projet)

Pour installer pnpm si vous ne l'avez pas :

```bash
npm install -g pnpm
```

## Installation

```bash
# Cloner le dépôt
git clone <url-du-depot>
cd rsn-cartographie-vercel

# Installer les dépendances
pnpm install
```

## Configuration

L'application nécessite un jeton d'intégration Notion. Créer un fichier `.env.local` à la racine du projet :

```env
NOTION_TOKEN=ntn_votre_jeton_ici
```

> L'intégration Notion doit avoir accès aux 6 bases de données du projet (Organisations, Org. gouvernementales, Personnes, Plateformes, Catalogues de données, Jeux de données). Les IDs des bases sont définis dans `app/lib/notion.ts`.

## Lancement

```bash
# Mode développement (rechargement à chaud)
pnpm dev

# Build de production
pnpm build

# Lancer le serveur de production
pnpm start
```

L'application sera accessible sur `http://localhost:3000`.

## Synchronisation avec Notion

Les données sont récupérées depuis Notion via l'API et mises en cache avec **ISR (Incremental Static Regeneration)** :

- Les pages sont régénérées automatiquement toutes les **60 secondes**
- Seules les entités avec le statut **« Approuvé »** dans Notion sont affichées
- Aucune action manuelle n'est nécessaire après une modification dans Notion

**En développement** (`pnpm dev`) : rafraîchir la page suffit, Next.js re-exécute les Server Components à chaque requête.

**En production (Vercel)** : après modification dans Notion, attendre ~1 minute puis recharger la page deux fois (la première déclenche la revalidation, la seconde affiche les nouvelles données).

Pour invalider le cache de géocodage (coordonnées GPS des organisations), ouvrez la console du navigateur et exécutez :

```js
sessionStorage.removeItem("rsn_geocode_cache");
```

## Stack technique

| Catégorie | Technologie | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16 |
| UI | React | 19 |
| Langage | TypeScript | 5 |
| CSS | Tailwind CSS | 4 |
| Composants UI | DaisyUI | 5 |
| Thème clair/sombre | next-themes | 0.4 |
| Graphe de relations | reagraph | 4.30 |
| Carte géographique | react-leaflet + Leaflet | 5 / 1.9 |
| Backend | API Notion (raw fetch) | 2022-06-28 |
| Validation de schéma | Zod | 4 |
| Géocodage | Nominatim (OpenStreetMap) | — |
| Déploiement | Vercel | — |

## Architecture

```
app/
├── layout.tsx          # Layout racine (Navbar, ThemeProvider, SEO, JSON-LD)
├── page.tsx            # Server Component — fetch Notion, construit nodes/edges (ISR 60s)
├── sitemap.ts          # Génère /sitemap.xml
├── robots.ts           # Génère /robots.txt
├── globals.css         # Tailwind + DaisyUI config
└── lib/
    ├── notion.ts               # Client API Notion, helpers d'extraction de propriétés
    ├── schema.ts               # Schémas Zod pour toutes les entités
    ├── types.ts                # Types partagés (MyGraphNode)
    ├── constants.ts            # Constantes partagées (TYPE_LABELS, NODE_FILL, ORG_TYPE_LABELS)
    ├── utils.ts                # Utilitaires partagés (removeAccents)
    ├── cn.ts                   # Utilitaire CSS (clsx + twMerge)
    ├── fetchOrganization.ts    # Fetch organisations
    ├── fetchGouvOrganization.ts # Fetch org. gouvernementales
    ├── fetchPerson.ts          # Fetch personnes
    ├── fetchDataset.ts         # Fetch jeux de données
    ├── fetchDataCatalog.ts     # Fetch catalogues de données
    └── fetchSoftwareApplication.ts # Fetch applications

components/
├── DiagramRoot.tsx     # Composant principal — onglets, filtres, état partagé
├── Reagraph.tsx        # Vue graphe (reagraph + GraphCanvas)
├── MapView.tsx         # Wrapper SSR-safe pour la carte (dynamic import)
├── MapContent.tsx      # Carte Leaflet — géocodage, markers, popups
├── NavBar.tsx          # Barre de navigation avec logo, titre, recherche
├── SearchBar.tsx       # Barre de recherche (⌘K)
├── OnboardingModal.tsx # Modal d'aide au premier lancement
└── DetailCard/
    ├── DetailCardRoot.tsx                # Dispatch vers le bon type de carte
    ├── DetailCard.tsx                    # Conteneur partagé (layout, bouton fermer)
    ├── OrganizationDetailCard.tsx        # Détail organisation
    ├── PersonDetailCard.tsx              # Détail personne
    ├── DataCatalogDetailCard.tsx         # Détail catalogue de données
    ├── DatasetDetailCard.tsx             # Détail jeu de données
    ├── SoftwareApplicationDetailCard.tsx # Détail application
    ├── Logo.tsx                          # Composant logo réutilisable
    └── Adresse.tsx                       # Composant adresse formatée
```

## Types de nœuds

| Type | Couleur | Base Notion |
|------|---------|-------------|
| Organisation | `#0061AF` (bleu) | Organisations |
| Org. gouvernementale | `#8C8C8C` (gris) | Org. gouvernementales |
| Personne | `#00A759` (vert) | Personnes |
| Jeu de données | `#FFCC4E` (jaune) | Jeux de données |
| Catalogue de données | `#FFCC4E` (jaune) | Catalogues de données |
| Application | `#EE3124` (rouge) | Plateformes |

## Vues

### Vue en graphe

Graphe 2D interactif (reagraph) montrant les relations entre entités. Fonctionnalités : filtres par type, filtres avancés (couverture géo., axe RSN, domaine de santé, etc.), filtre de connexions, zoom/pan, highlight au survol avec couleur par type, recherche avec highlight violet.

### Vue galerie

Cartes détaillées pour chaque entité avec image, badges, description et liens. Recherche textuelle et filtres par type.

### Vue tabulaire

Tableau filtrable et triable avec colonnes adaptées au type de nœud sélectionné. Recherche textuelle sur titre, alias et tags.

### Vue géographique

Carte OpenStreetMap (react-leaflet) avec coordonnées provenant directement des propriétés `place` de Notion. Fallback sur le géocodage Nominatim si les coordonnées ne sont pas disponibles. Popups détaillant les entités associées à chaque organisation. Les coordonnées Nominatim sont mises en cache dans `sessionStorage`.

## Développement

### Ajouter un nouveau type de contenu

1. Créer la base de données dans Notion avec une propriété `Statut` (select avec « Approuvé »)
2. Ajouter l'ID de la base dans `NOTION_DB` dans `app/lib/notion.ts`
3. Créer la fonction fetch dans `app/lib/fetch<Type>.ts`
4. Ajouter le schéma Zod dans `app/lib/schema.ts`
5. Ajouter la conversion nodes/edges dans `app/page.tsx`
6. Ajouter l'entrée dans `app/lib/constants.ts` (`TYPE_LABELS`, `NODE_FILL`) et dans `DiagramRoot.tsx` (`EDGE_FILTER_OPTIONS`)
7. Créer une DetailCard si nécessaire

## Déploiement

L'application est déployée sur **Vercel**. Le déploiement se fait automatiquement à chaque push sur la branche `main`.

### Variables d'environnement (Vercel)

| Variable | Description |
|----------|-------------|
| `NOTION_TOKEN` | Jeton d'intégration Notion (obligatoire) |
| `NEXT_PUBLIC_SITE_URL` | URL du site (optionnel, pour SEO) |

### Étapes

1. Connecter le dépôt GitHub à Vercel
2. Configurer `NOTION_TOKEN` dans Settings > Environment Variables
3. Déployer — Vercel détecte automatiquement Next.js

Chaque push sur `main` déclenche un nouveau déploiement. Les données Notion se revalident automatiquement toutes les 60 secondes via ISR.

## Dépannage

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| Les données ne se mettent pas à jour | Le cache ISR n'a pas encore expiré | Attendre ~1 minute, recharger deux fois |
| Entité absente malgré l'ajout dans Notion | Le statut n'est pas « Approuvé » | Vérifier le champ Statut dans Notion |
| La carte met du temps à charger | Le géocodage Nominatim impose un délai de ~1 s par requête | Patienter ; les visites suivantes utilisent le cache |
| Le graphe ne s'affiche pas | reagraph nécessite WebGL | Vérifier que WebGL est activé dans le navigateur |
| Erreur `DOMPurify` côté serveur | `isomorphic-dompurify` importé dans un Server Component | S'assurer que le composant a la directive `"use client"` |
| Build échoue sur Vercel | Variable `NOTION_TOKEN` manquante | Configurer la variable dans Vercel Settings |

## Navigateurs supportés

L'application requiert un navigateur moderne supportant **ES2020** et **WebGL** :

- Chrome / Edge >= 90
- Firefox >= 90
- Safari >= 15
