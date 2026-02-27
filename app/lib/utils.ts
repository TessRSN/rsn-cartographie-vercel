/**
 * Strips Unicode combining diacritical marks from a string.
 * Used for accent-insensitive search matching (e.g., "Montréal" matches "Montreal").
 */
export function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
