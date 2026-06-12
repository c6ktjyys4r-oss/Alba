import type { Language } from "@/contexts/LanguageContext";

// Pick the field matching the active language, falling back to the other
// language so a value is always shown (avoids empty cells) while keeping a
// page visually consistent in one language wherever data exists.
export function pickLang(lang: Language, en?: string | null, ar?: string | null): string {
  const e = en?.trim() ?? "";
  const a = ar?.trim() ?? "";
  return lang === "ar" ? a || e : e || a;
}

type NameParts = {
  firstName?: string | null;
  lastName?: string | null;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
};

export function employeeName(lang: Language, emp?: NameParts | null): string {
  if (!emp) return "";
  const en = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
  const ar = `${emp.firstNameAr ?? ""} ${emp.lastNameAr ?? ""}`.trim();
  return pickLang(lang, en, ar);
}

export function jobTitle(lang: Language, emp?: { jobTitle?: string | null; jobTitleAr?: string | null } | null): string {
  if (!emp) return "";
  return pickLang(lang, emp.jobTitle, emp.jobTitleAr);
}

export function localizedName(lang: Language, item?: { name?: string | null; nameAr?: string | null } | null): string {
  if (!item) return "";
  return pickLang(lang, item.name, item.nameAr);
}
