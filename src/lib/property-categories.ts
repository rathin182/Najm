/** Property types per category - same lists as the admin "Add property" form. */
export const CATEGORY_TYPES = {
  residential: ["Apartment / Flat", "Villa", "Independent House", "Penthouse", "Duplex", "Studio Apartment", "Residential Plot", "Townhouse", "Farmhouse"],
  commercial: ["Office", "Shop", "Showroom", "Warehouse", "Industrial Building", "Business Center", "Commercial Land", "Restaurant / Cafe", "Co-working Space"],
} as const;

export type PropertyCategoryKey = keyof typeof CATEGORY_TYPES;

export const CATEGORY_LABELS: Record<PropertyCategoryKey, string> = {
  residential: "Residential",
  commercial: "Commercial",
};