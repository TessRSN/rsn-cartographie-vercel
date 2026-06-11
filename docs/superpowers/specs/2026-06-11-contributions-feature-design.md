# Spec — Système de contributions pour la cartographie RSN

**Date** : 2026-06-11
**Auteure** : Tess + Claude
**Statut** : En relecture

## Contexte

Actuellement, l'ajout et la modification d'entités sur la cartographie RSN (organisations, plateformes, datasets, etc.) se fait **manuellement dans Notion par l'équipe RSN**. Tess veut ouvrir aux utilisateurs externes la possibilité de **proposer de nouvelles entités** et (plus tard) de **suggérer des modifications**, sans donner accès direct à Notion.

Le sujet avait été esquissé lors d'une session précédente (mai 2026) — voir mémoire [`project_contribution_strategy.md`](../../../.claude/projects/-Users-tessberthier-Documents-GitHub-rsn-cartographie-vercel/memory/project_contribution_strategy.md). Cette spec concrétise la décision et définit le MVP.

Référence technique : un repo séparé `/Users/tessberthier/Documents/RSN/carto_membres` implémente déjà le pattern magic link + Resend pour le bottin des membres. Le présent projet **réutilisera** ces composants en les portant en Next.js.

## Objectifs

### MVP (V1, ce spec)
- **Tout visiteur peut proposer une nouvelle entité** (formulaire web multi-étapes, magic link pour vérifier l'email).
- Les soumissions atterrissent dans une **file d'attente Notion dédiée** ("Suggestions") avec statut `pending`.
- **Tess (et autres admins whitelistés) accèdent à un dashboard web** sécurisé pour valider, modifier le payload avant approbation, ou refuser.
- À l'approbation, la nouvelle entité est créée dans la **base Notion principale correspondante** (Organisations, Personnes, etc.) — la cartographie publique l'affiche au prochain refresh ISR.

### V2 (hors MVP, designé mais pas implémenté)
- **Modification d'une entité existante** : bouton "Suggérer une modification" sur la fiche entité + URL directe `/contribuer?edit=<id>`. Diff visuel dans le dashboard admin.

## Non-objectifs

- **Pas de fiches chercheurs (Personnes) en MVP** : tout ce qui est ajout/édition de personnes est explicitement hors scope pour la V1. La V2 ouvrira ce flow séparément avec ses propres règles (probablement self-edit par magic link sur l'email du chercheur).
- **Pas de suppression d'entité** par les contributeurs.
- **Pas d'audit trail public** : qui a édité quoi reste privé à Tess (champ `Submitter email` dans la base Suggestions).
- **Pas de sauvegarde de brouillon** : la soumission se fait en une session. Quitter la page perd le formulaire.
- **Pas d'auto-détection de doublon avancée** : on fait une détection naïve (matching sur le nom), mais c'est Tess qui rejette en cas de duplicate non capté.

## Architecture

### Vue d'ensemble

```
                ┌─────────────────────────────┐
                │  Notion (existant)          │
                │  6 bases entités principales│  ← lu par cartographie.rsn.quebec
                │  (Org, Personnes, Plateforms│     (server components, ISR 60s,
                │   Datasets, Catalogs, etc.) │      inchangé)
                └─────────────────────────────┘
                            ▲
                            │ écrit à l'approbation
                            │
                ┌─────────────────────────────┐
                │  Dashboard admin            │
                │  /admin/suggestions         │ ← magic link admin + whitelist
                │                             │
                │  - Liste suggestions        │
                │  - Détail + diff (V2)       │
                │  - Modifier payload         │
                │  - Approve / Reject         │
                └─────────────────────────────┘
                            ▲
                            │ pioche les pending
                            │
                ┌─────────────────────────────┐
                │  Base Notion "Suggestions"  │ ← NOUVELLE base à créer
                │  (générique, payload JSON)  │
                │  11 champs                  │
                └─────────────────────────────┘
                            ▲
                            │ crée des entrées
                            │
                ┌─────────────────────────────┐
                │  Formulaire public          │
                │  /contribuer                │ ← magic link contributeur
                │  (assistant multi-étapes)   │
                └─────────────────────────────┘
```

### Stack

- **Next.js App Router** (existant)
- **next-intl** pour FR/EN (existant — le formulaire et le dashboard seront localisés)
- **`@notionhq/client`** pour API Notion (existant)
- **Zod** pour validation server-side (existant)
- **`resend`** pour emails transactionnels (à ajouter — réutilise la lib `email.js` du carto_membres)
- **`jsonwebtoken`** pour magic links (à ajouter — réutilise la lib `token.js` du carto_membres)
- **DaisyUI + Tailwind** pour l'UI (existant)

### Routes

| Route | Type | Description |
|---|---|---|
| `/contribuer` (FR) / `/en/contribute` (EN) | Page publique | Formulaire multi-étapes (V1 : create only) |
| `/admin/suggestions` | Page admin | Liste des suggestions pending (auth required) |
| `/admin/suggestions/[id]` | Page admin | Détail d'une suggestion + actions (auth required) |
| `/api/contribuer/magic-link` | API | Envoyer un magic link contributeur |
| `/api/contribuer/submit` | API | Submit une nouvelle entité (token requis) |
| `/api/admin/magic-link` | API | Envoyer un magic link admin (whitelist) |
| `/api/admin/suggestions` | API | Liste pending (GET) |
| `/api/admin/suggestions/[id]/approve` | API | Approuver et écrire dans Notion principal |
| `/api/admin/suggestions/[id]/reject` | API | Refuser avec note |
| `/api/admin/suggestions/[id]/update` | API | Modifier le payload avant approbation |

## Modèle de données

### Base Notion "Suggestions" (à créer)

| Champ Notion | Type | Description |
|---|---|---|
| `Title` | Title | Auto-généré : `"Création OPAL"` ou `"Modif CHUM"` (selon Action type) |
| `Action type` | Select | `create` / `edit` (V1 : seulement `create`) |
| `Entity type` | Select | `organization` / `gov_organization` / `dataset` / `data_catalog` / `software_application` (pas `person` en MVP) |
| `Target entity ID` | Text | Optionnel — uniquement pour `edit` (V2) |
| `Payload` | Long text | JSON stringifié avec les valeurs proposées |
| `Submitter email` | Email | Vérifié par magic link |
| `Status` | Select | `pending` / `approved` / `rejected` / `needs_revision` |
| `Submitted at` | Date | Auto à la création |
| `Reviewed by` | Email | Optionnel — admin qui a validé |
| `Reviewed at` | Date | Optionnel — auto à l'action admin |
| `Admin notes` | Long text | Optionnel — commentaires admin (raison rejet, etc.) |

### Format du Payload JSON

Le payload contient **toutes les valeurs proposées** pour la nouvelle entité, dans un format **plat** structurellement proche de `ParsedEntity` (cf. `app/lib/parseEntity.ts`).

Exemple pour `Action type = create` et `Entity type = software_application` :

```json
{
  "title": "OPAL",
  "alternateNames": ["Open Patient Access Layer"],
  "description": "Opal est une plateforme de données qui implique le patient...",
  "links": ["https://opal-project.org", "https://opal-project.org/docs"],
  "email": "contact@opal-project.org",
  "licence": "MIT",
  "accessModel": "Open source",
  "categories": ["plateforme de données", "santé numérique"],
  "imageSrc": null,
  "axeRsn": null,
  "geographicCoverage": [],
  "digitalMethods": ["IA", "apprentissage fédéré"]
}
```

Pour V2 `Action type = edit`, le payload contient **seulement les champs modifiés** (et `Target entity ID` est rempli pour identifier l'entité existante).

### Champs proposés par type d'entité

Le formulaire montre dynamiquement les champs pertinents selon l'`Entity type`. Liste exhaustive à confirmer avec Tess (elle enverra le texte d'aide pour chaque champ plus tard). Vue indicative :

| Champ | Org | Gov Org | Dataset | Data Catalog | Software App |
|---|---|---|---|---|---|
| `title` (nom) | ✅ req | ✅ req | ✅ req | ✅ req | ✅ req |
| `description` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `alternateNames` (alias) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `links` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `email` | ✅ | ✅ | — | — | ✅ |
| `address` (adresse postale) | ✅ | ✅ | — | — | — |
| `organizationType` | ✅ | — | — | — | — |
| `licence` | — | — | ✅ | ✅ | ✅ |
| `accessModel` | — | — | ✅ | ✅ | ✅ |
| `categories` | — | — | — | — | ✅ |
| `geographicCoverage` | ✅ | ✅ | — | — | — |
| `axeRsn` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `digitalMethods` | — | — | ✅ | ✅ | ✅ |
| `imageSrc` (logo URL) | ✅ | ✅ | — | — | ✅ |

(req) = obligatoire. À affiner avec Tess.

## Flow utilisateur — V1

### Côté contributeur

1. **Découverte** : visiteur clique sur un lien "Proposer une entité" dans la NavBar ou le footer (à ajouter).
2. **Étape 0 — magic link** : `/contribuer` lui demande son email. Submit → email envoyé via Resend ("Confirme ton email pour soumettre une entité au RSN").
3. **Confirmation** : il clique le lien dans son email → arrive sur `/contribuer?token=<JWT>` (token JWT 1h, contient l'email).
4. **Étape 1 — choix du type d'entité** : 5 cartes cliquables (Organisation, Org. gouvernementale, Jeu de données, Catalogue, Application/plateforme), chacune avec une courte description ("Choisis Organisation si l'entité est un institut, université ou centre de recherche…"). Texte d'aide à fournir par Tess.
5. **Étape 2 — formulaire de l'entité** : champs pertinents pour le type choisi (voir tableau ci-dessus). Validation côté client basique (email format, URL format, champs requis).
6. **Étape 3 — récapitulatif** : montre tout ce qui sera soumis. Le contributeur peut revenir en arrière modifier. Bouton "Soumettre".
7. **Confirmation** : la soumission est enregistrée dans la base Notion "Suggestions" avec status `pending`. Affichage d'un écran de remerciement. Email de confirmation au contributeur ("Ta proposition est en file de validation, on revient vers toi sous 5 jours ouvrés").

### Côté admin

1. **Accès** : Tess va sur `/admin/suggestions`. Si pas authentifiée → redirige vers `/admin/login` (formulaire email).
2. **Auth admin** : Tess entre son email. Si l'email est dans la **whitelist d'emails admin** (env var `ADMIN_EMAILS=tess@...,sarah@...`), elle reçoit un magic link admin (token JWT 4h, scope `admin`). Sinon, l'API répond toujours 200 mais n'envoie rien (anti-énumération).
3. **Liste pending** : page avec table des suggestions `pending`. Colonnes : titre auto, type d'entité, action type, email contributeur, date soumission. Triable, filtrable.
4. **Détail** : clic sur une ligne → page de détail. Affichage parsé du Payload sous forme de formulaire (lecture seule par défaut, bouton "Modifier" pour éditer le JSON avant approbation). Boutons Approuver, Refuser, Demander précisions.
5. **Approuver** :
   - Le dashboard valide le payload contre le schéma Zod du type d'entité
   - Si valide : crée une nouvelle page dans la base Notion principale (Organisations, Datasets, etc.) avec les valeurs du Payload
   - Marque la suggestion comme `approved`, remplit `Reviewed by` + `Reviewed at`
   - Envoie un email au contributeur : "Ta proposition a été acceptée et est désormais visible sur la cartographie."
6. **Refuser** : Tess écrit une raison dans `Admin notes`. Status → `rejected`. Email au contributeur avec la raison.
7. **Demander précisions** : Status → `needs_revision`. Email au contributeur avec un commentaire ("Pourrais-tu préciser X ?"). Pas implémenté en MVP — V2.

## Sécurité

- **JWT tokens** : signés avec `JWT_SECRET` (env var), expiration explicite (1h contributeur, 4h admin), scope contenu dans le payload (`kind: 'contribute' | 'admin'`).
- **Rate limiting** : par IP, 3 magic links/h pour contributeur et 5/h pour admin. Implémentation : Map en mémoire (suffisant pour MVP), ou Vercel KV plus tard.
- **Anti-énumération** : `/api/admin/magic-link` retourne toujours 200 — n'expose jamais si un email est dans la whitelist ou non.
- **Validation server-side avec Zod** : tous les endpoints reçoivent du payload, le valident strictement. Refus si invalide.
- **Admin whitelist** : env var `ADMIN_EMAILS` (liste séparée par virgules). Vérification dans `/api/admin/magic-link` ET dans `/api/admin/suggestions/*` (le token JWT contient l'email mais on revérifie qu'il est encore dans la whitelist au moment de l'action).
- **Pas de stockage de session** : tout dans JWT (stateless). Si fuite de token, expiration courte limite les dégâts. Pour révocation immédiate : changer `JWT_SECRET`.
- **Notion API token** : reste server-side uniquement (`NOTION_TOKEN` env var, jamais exposé au client).
- **CSP / Headers** : standards Next.js, rien de spécial à ajouter.

## Composants réutilisés depuis carto_membres

Trois fichiers seront **portés tels quels (avec adaptations mineures)** depuis `/Users/tessberthier/Documents/RSN/carto_membres` :

- **`/lib/token.js`** → `/app/lib/contribution-token.ts` : magic link JWT, sign/verify, expiration.
- **`/lib/email.js`** → `/app/lib/email.ts` : Resend client, templates bilingues FR/EN pour les emails (confirmation envoi, approbation, refus). Adapter le from/replyTo pour la cartographie.
- **Pattern de `/api/magic-link.js`** → `/app/api/contribuer/magic-link/route.ts` et `/app/api/admin/magic-link/route.ts` : rate limit, normalize email, sign token, send email.

## Dépendances à ajouter

```json
{
  "resend": "^4.x",
  "jsonwebtoken": "^9.x",
  "@types/jsonwebtoken": "^9.x"
}
```

## Variables d'environnement à ajouter

```
RESEND_API_KEY=re_xxx           # clé Resend
JWT_SECRET=<random 32+ bytes>   # signature JWT
ADMIN_EMAILS=tess@...,sarah@... # whitelist admin (liste virgules)
NOTION_DB_SUGGESTIONS=<id>      # ID de la nouvelle base Notion Suggestions
CONTRIBUTION_FROM_EMAIL=cartographie@rsn.quebec  # expéditeur des emails
CONTRIBUTION_REPLY_TO=tess@...                   # reply-to (Tess)
```

## Tests / Vérification

Comme le reste du projet, pas de framework de tests unitaires. Vérification par :
- `pnpm tsc --noEmit` à chaque étape
- Smoke tests manuels :
  - Soumettre une fausse organisation, vérifier qu'elle arrive bien dans Notion "Suggestions"
  - Recevoir le magic link contributeur dans une vraie inbox
  - Accéder au dashboard admin avec un email whitelisté, vérifier qu'un email non-whitelisté est rejeté
  - Approuver une suggestion, vérifier qu'elle apparaît dans la base principale puis sur la cartographie publique (après refresh ISR 60s)
  - Refuser une suggestion, vérifier l'email reçu par le contributeur

## Cas d'erreur

| Cas | Comportement attendu |
|---|---|
| Email contributeur invalide | Form bloque côté client. Si bypass : API refuse en 400. |
| Token expiré | Page `/contribuer?token=...` affiche "Ton lien a expiré, redemande-en un." |
| Rate limit dépassé | API répond 429, frontend affiche un message clair. |
| Payload Notion invalide (champ manquant) | Approbation côté admin échoue, log l'erreur, le status reste `pending` pour réessai. |
| Resend down | Magic link signal échoue. Pour MVP : afficher "Erreur d'envoi, réessaie." Pour V2 : retry queue. |
| Notion API down | Affiche "Service temporairement indisponible." Status reste `pending`. |
| Suggestion approuvée mais écriture Notion échoue partiellement | Atomicité limitée. On loggue l'erreur. Tess peut re-déclencher l'approbation. |

## Roadmap d'implémentation (à raffiner en plan)

| Phase | Contenu | Livrable |
|---|---|---|
| **0 — Prep** | Créer base Notion "Suggestions". Ajouter env vars. Installer deps. | Setup utilisable |
| **1 — Backend formulaire** | Portage `token.js` + `email.js` + endpoint `/api/contribuer/magic-link` + endpoint `/api/contribuer/submit`. Validation Zod par type d'entité. | API testable via curl |
| **2 — Formulaire public** | Page `/contribuer` (FR + EN), assistant multi-étapes, validation client basique. | Soumission end-to-end fonctionnelle |
| **3 — Dashboard admin** | `/admin/login` + magic link admin. Liste suggestions pending, vue détail, boutons Approve/Reject. | Workflow admin complet |
| **4 — Polish + i18n** | Affiner UX du formulaire, emails localisés, états d'erreur, message de remerciement. | Production-ready V1 |
| **5 — V2 (post-MVP)** | Edit flow : bouton sur fiche entité, diff visuel, support `Action type = edit`. | Modification possible |

## Décisions à demander à Tess avant l'implémentation

(rien à ce stade — tout a été décidé pendant la discussion)

**Plus tard, Tess fournira** :
- Le texte d'aide pour chaque type d'entité (étape 1 du formulaire)
- Le texte des emails (confirmation, approbation, rejet)
- La liste exacte des champs requis vs optionnels pour chaque type d'entité (le tableau ci-dessus est indicatif)
- La/les valeurs initiales du whitelist `ADMIN_EMAILS`

## Notes pour le plan d'implémentation

Le plan détaillé (créé via `superpowers:writing-plans` après validation du spec) découpera :
- Phase 0 : 1 PR (créer base Notion documentée + env vars + deps installées)
- Phase 1 : 1-2 PRs (token.ts, email.ts, validation Zod par type, API endpoints)
- Phase 2 : 2-3 PRs (page contribuer wizard FR, then EN, then polish UX)
- Phase 3 : 2-3 PRs (auth admin, liste, détail+actions)
- Phase 4 : 1 PR de polish
- Phase 5 (V2, hors MVP) : 2 PRs (bouton fiche entité, diff + edit)

Chaque PR doit pouvoir être mergée séparément sans casser la prod (pattern : feature flags / pages cachées jusqu'à ce que tout le flow soit en place).
