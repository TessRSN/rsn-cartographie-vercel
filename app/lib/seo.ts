/**
 * Nettoie un texte destiné aux meta tags (description, og:description, etc.) :
 * - Décode les entités HTML (gère le double encodage type `&amp;#039;` → `'`)
 * - Normalise les espaces
 * - Tronque à la coupe d'un mot pour éviter de couper en plein milieu
 *
 * Important : on travaille en plain text uniquement. Aucun rendu HTML — c'est
 * juste pour assainir une chaîne qui sera réinsérée par React comme attribut.
 */
export function cleanMetaText(text: string, maxLength = 160): string {
  if (!text) return ""

  // Étape 1 : décodage HTML. On fait deux passes pour gérer le double encodage
  // (le source contient parfois `&amp;#039;` au lieu de `&#039;` ou `'`).
  let cleaned = text
  for (let i = 0; i < 2; i++) {
    cleaned = cleaned
      .replace(/&amp;/g, "&")
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
  }

  // Étape 2 : normalisation des espaces (retours ligne, tabulations multiples)
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  if (cleaned.length <= maxLength) return cleaned

  // Étape 3 : troncature à la coupe d'un mot. On cherche le dernier espace
  // avant la limite — si trop court (perdrait trop de texte), on coupe net.
  const slice = cleaned.slice(0, maxLength - 1)
  const lastSpace = slice.lastIndexOf(" ")
  const truncated = lastSpace > maxLength - 30 ? slice.slice(0, lastSpace) : slice
  return truncated + "…"
}
