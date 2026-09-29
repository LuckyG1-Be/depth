export type Prefs = {
  genders: string[];
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;

  intentFilter?: string | null;
  religionFilter?: string | null;
  valuesFilter?: string[];
  educationFilter?: string | null;
  drinkingFilter?: string | null;
  smokingFilter?: string | null;
  exerciseFilter?: string | null;
  lifestyleFiltersUntil?: string | null;
};

export type PreferencesVariant = "page" | "modal";
export type SaveStatus = "idle" | "saving" | "saved";

export const GENDER_VALUES = ["Vrouw", "Man"] as const;
export const BRAND_GREEN = "#66b96c";

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function isGenderValue(value: unknown): value is (typeof GENDER_VALUES)[number] {
  return typeof value === "string" && (GENDER_VALUES as readonly string[]).includes(value);
}

export function labelForGenderValue(v: string) {
  if (v === "Man") return "Mannen";
  if (v === "Vrouw") return "Vrouwen";
  return v;
}

export function ageLabel(age: number) {
  return age >= 65 ? "65+" : String(age);
}
