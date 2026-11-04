import type { HomeSearchOption } from "@/generated/prisma/client";
import { CATEGORY_LABELS, CATEGORY_TYPES, type PropertyCategoryKey } from "@/lib/property-categories";

export const HOME_SEARCH_GROUPS = [
  "locations",
  "residentialTypes",
  "commercialTypes",
  "bedrooms",
  "budgets",
  "statuses",
] as const;
export type HomeSearchGroup = (typeof HOME_SEARCH_GROUPS)[number];
export type SearchOption = { id?: string; value: string; label: string };
export type HomeSearchOptions = Record<HomeSearchGroup, SearchOption[]>;
export const CATEGORY_GROUPS = {
  residential: "residentialTypes",
  commercial: "commercialTypes",
} as const satisfies Record<PropertyCategoryKey, HomeSearchGroup>;
export const PROPERTY_CATEGORIES = ["residential", "commercial"] as const satisfies readonly PropertyCategoryKey[];

export const HOME_SEARCH_GROUP_LABELS: Record<HomeSearchGroup, { title: string; hint: string }> = {
  // locations: { title: "Location", hint: "Shown in the homepage location dropdown." },
  // residentialTypes: { title: "Residential property types", hint: "Shown when visitors choose Residential. Values feed directly into listing searches." },
  // commercialTypes: { title: "Commercial property types", hint: "Shown when visitors choose Commercial. Values feed directly into listing searches." },
  locations: { title: "Location", hint: "Shown in the homepage and Properties location dropdowns. Use the exact city name used in your listings." },
  residentialTypes: { title: "Residential property types", hint: "Shown on the homepage, Properties filters and the Add Property form. Renaming a type also renames it on existing listings." },
  commercialTypes: { title: "Commercial property types", hint: "Shown on the homepage, Properties filters and the Add Property form. Renaming a type also renames it on existing listings." },
  bedrooms: { title: "Bedrooms", hint: "Use 0 for studios and a number for minimum bedrooms." },
  budgets: {
    title: "Price range (SAR)",
    hint: "Values use minimum-maximum SAR, for example 1000000-2000000.",
  },
  statuses: { title: "Property status", hint: "Values should be Ready or Off-plan." },
};

const DEFAULT_FILTER_OPTIONS: Partial<Record<HomeSearchGroup, SearchOption[]>> = {
  bedrooms: ["1", "2", "3", "4", "5"].map((value) => ({ value, label: `${value}+` })),
  budgets: [
    { label: "Up to 2M SAR", value: "0-2000000" },
    { label: "2M – 5M SAR", value: "2000000-5000000" },
    { label: "5M – 10M SAR", value: "5000000-10000000" },
    { label: "10M+ SAR", value: "10000000-999999999" },
  ],
  statuses: [
    { label: "Ready", value: "Ready" },
    { label: "Off-plan", value: "Off-plan" },
  ],
};

export function groupHomeSearchOptions(rows: HomeSearchOption[]): HomeSearchOptions {
  const options = Object.fromEntries(
    HOME_SEARCH_GROUPS.map((group) => [
      group,
      rows
        .filter((row) => row.group === group && row.enabled)
        .map(({ value, label }) => ({ value, label })),
    ]),
  ) as HomeSearchOptions;
  // Groups the admin has not configured yet fall back to sensible defaults.
  for (const [group, defaults] of Object.entries(DEFAULT_FILTER_OPTIONS) as [HomeSearchGroup, SearchOption[]][]) {
    if (options[group].length === 0) options[group] = defaults.map((option) => ({ ...option }));
  }
  for (const category of PROPERTY_CATEGORIES) {
    const group = CATEGORY_GROUPS[category];
    if (options[group].length === 0) {
      options[group] = CATEGORY_TYPES[category].map((value) => ({ value, label: value }));
    }
  }
  return options;
}

export function validateHomeSearchOptions(value: unknown): value is HomeSearchOptions {
  if (!value || typeof value !== "object") return false;
  const options = value as Record<string, unknown>;
  return HOME_SEARCH_GROUPS.every(
    (group) =>
      Array.isArray(options[group]) &&
      options[group].length <= 100 &&
      options[group].every(
        (option) =>
          !!option &&
          typeof option === "object" &&
          typeof (option as SearchOption).value === "string" &&
          (option as SearchOption).value.length <= 120 &&
          typeof (option as SearchOption).label === "string" &&
          (option as SearchOption).label.trim().length > 0 &&
          (option as SearchOption).label.length <= 120,
      ),
  );
}
