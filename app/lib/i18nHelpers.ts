import type { useTranslations } from "next-intl";
import { ORG_TYPE_LABELS, TYPE_LABELS } from "./constants";

type Translator = ReturnType<typeof useTranslations>;

/** Looks up a raw value (French) in a next-intl namespace; falls back to the raw value when no translation exists. */
export function translateValue(t: Translator, value: string): string {
  return t.has(value) ? t(value) : value;
}

/** Looks up an organization sub-type slug in the "orgTypeValues" namespace; falls back to its French label. */
export function translateOrgType(t: Translator, slug: string): string {
  return t.has(slug) ? t(slug) : (ORG_TYPE_LABELS[slug] ?? slug);
}

/** Looks up a node type key (e.g. "node--organization") in the "typeLabels" namespace; falls back to its French label. */
export function translateType(t: Translator, type: string): string {
  return t.has(type) ? t(type) : (TYPE_LABELS[type] ?? type);
}
