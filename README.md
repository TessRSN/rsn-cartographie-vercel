# RSN Cartographie

Application web de cartographie interactive des plateformes du **Réseau en santé numérique (RSN)**. Elle consomme les données d'un backend Drupal via JSON:API et les affiche dans trois vues complémentaires : graphe de relations, tableau filtrable et carte géographique.

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
cd rsn_cartographie

# Installer les dépendances
pnpm install
```

## Configuration

Le point d'entrée de l'API Drupal est défini dans `app/lib/drupal.ts` :

```ts
export const API_ENDPOINT = "https://catalog.paradim.science";
```

Si vous devez pointer vers un autre serveur Drupal, modifiez cette valeur.

Le projet ne requiert pas de fichier `.env` par défaut. La connexion à Drupal est en lecture seule (pas d'authentification nécessaire pour les requêtes JSON:API publiques).

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

## Synchronisation avec Drupal

Les données sont récupérées depuis Drupal à chaque chargement de page (côté serveur, via les Server Components de Next.js). Il n'y a pas de connexion persistante ni de synchronisation en temps réel.

Après une modification dans la base de données Drupal :

- **En développement** (`pnpm dev`) : il suffit de rafraîchir la page dans le navigateur. Next.js re-exécute les Server Components à chaque requête.
- **En production** : relancer le build puis le serveur :

```bash
pnpm build && pnpm start
```

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
| Connecteur Drupal | next-drupal | 2 |
| Validation de schéma | Zod | 4 |
| Géocodage | Nominatim (OpenStreetMap) | — |

## Architecture

```
app/
├── layout.tsx          # Layout racine (Navbar, ThemeProvider)
├── page.tsx            # Server Component — fetch Drupal, construit nodes/edges
├── globals.css         # Tailwind + DaisyUI config
└── lib/
    ├── drupal.ts               # Client NextDrupal + API_ENDPOINT
    ├── schema.ts               # Schémas Zod pour toutes les entités
    ├── types.ts                # Types partagés (MyGraphNode)
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
    ├── DetailCardRoot.tsx          # Dispatch vers le bon type de carte
    ├── OrganizationDetailCard.tsx  # Détail organisation
    └── PersonDetailCard.tsx        # Détail personne
```

## Types de nœuds

| Type | Couleur | Source Drupal |
|------|---------|---------------|
| Organisation | `#0061AF` (bleu) | `node--organization` |
| Org. gouvernementale | `#8C8C8C` (gris) | `node--government_organization` |
| Personne | `#00A759` (vert) | `node--person` |
| Jeu de données | `#FFCC4E` (jaune) | `node--dataset` |
| Catalogue de données | `#FFCC4E` (jaune) | `node--data_catalog` |
| Application | `#EE3124` (rouge) | `node--software_application` |

## Vues

### Vue en graphe

Graphe 2D interactif (reagraph) montrant les relations entre entités. Fonctionnalités : filtres par type, filtres avancés (couverture géo., axe RSN, domaine de santé, etc.), filtre de connexions, zoom/pan, highlight au survol avec couleur par type, recherche avec highlight violet.

### Vue tabulaire

Tableau filtrable et triable avec colonnes adaptées au type de nœud sélectionné. Recherche textuelle sur titre, alias et tags.

### Vue géographique

Carte OpenStreetMap (react-leaflet) avec géocodage automatique des adresses d'organisations via Nominatim. Popups détaillant les entités associées à chaque organisation. Les coordonnées sont mises en cache dans `sessionStorage` pour éviter de re-géocoder à chaque visite.

## Développement

### Ajouter un nouveau type de contenu Drupal

1. Créer le schéma Zod dans `app/lib/schema.ts`
2. Créer la fonction fetch dans `app/lib/fetch<Type>.ts`
3. Ajouter la conversion nodes/edges dans `app/page.tsx`
4. Ajouter l'entrée dans les constantes de `DiagramRoot.tsx` (`TYPE_LABELS`, `NODE_FILL`, `EDGE_FILTER_OPTIONS`)
5. Créer une DetailCard si nécessaire

### Modifier le point d'entrée Drupal

Éditer `app/lib/drupal.ts` et changer `API_ENDPOINT`.

### Champs d'adresse

Les organisations classiques utilisent le champ `address` dans Drupal. Les organisations gouvernementales utilisent `schema_address`. Cette différence est gérée dans `fetchGouvOrganization.ts` et `page.tsx`.
