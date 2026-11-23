export type PropertyAmenity = { name: string; icon: string };

const PREFIX = "amenity:v1:";

export function normalizeAmenity(value: unknown): PropertyAmenity {
  if (typeof value === "string") {
    if (value.startsWith(PREFIX)) {
      try {
        const parsed = JSON.parse(value.slice(PREFIX.length)) as Partial<PropertyAmenity>;
        if (typeof parsed.name === "string" && typeof parsed.icon === "string") return { name: parsed.name, icon: parsed.icon };
      } catch { /* Treat malformed stored values as legacy plain text. */ }
    }
    return { name: value, icon: "sparkles" };
  }
  if (value && typeof value === "object") {
    const amenity = value as Partial<PropertyAmenity>;
    return { name: typeof amenity.name === "string" ? amenity.name : "", icon: typeof amenity.icon === "string" ? amenity.icon : "sparkles" };
  }
  return { name: "", icon: "sparkles" };
}

export function encodeAmenity(value: unknown): string {
  const amenity = normalizeAmenity(value);
  return `${PREFIX}${JSON.stringify(amenity)}`;
}
