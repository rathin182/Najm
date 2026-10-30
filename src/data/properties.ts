const p1 = '/images/p1.jpg';
const p2 = '/images/p2.jpg';
const p3 = '/images/p3.jpg';
const p4 = '/images/p4.jpg';
const p5 = '/images/p5.jpg';
const p6 = '/images/p6.jpg';
const hero = '/images/hero.jpg';
const g1 = '/images/g1.jpg';
const g2 = '/images/g2.jpg';
const g3 = '/images/g3.jpg';

export type Property = {
  id: string;
  title: string;
  city: string;
  district: string;
  type: "Villa" | "Apartment" | "Penthouse" | "Townhouse" | "Commercial";
  price: number;
  area: number;
  beds: number;
  baths: number;
  short: string;
  description: string;
  images: string[];
  featured?: boolean;
  investment?: { yield: number; label: string };
  status: "Ready" | "Off-plan";
  year: number;
  amenities: string[];
};

export const CITIES = ["Riyadh", "Jeddah", "Dammam", "Al Khobar", "AlUla"] as const;
export const TYPES = ["Villa", "Apartment", "Penthouse", "Townhouse", "Commercial"] as const;
export const BUDGETS = [
  { label: "Up to 2M SAR", value: "0-2000000" },
  { label: "2M – 5M SAR", value: "2000000-5000000" },
  { label: "5M – 10M SAR", value: "5000000-10000000" },
  { label: "10M+ SAR", value: "10000000-999999999" },
] as const;

export const formatSAR = (n: number) =>
  "SAR " + new Intl.NumberFormat("en-US").format(n);

const amen = ["Private pool", "Smart home", "Maid's room", "Covered parking", "24/7 security", "Gym", "Garden", "Majlis"];

export const PROPERTIES: Property[] = [
  {
    id: "al-noor-villa", title: "Al Noor Signature Villa", city: "Riyadh", district: "Al Malqa",
    type: "Villa", price: 8900000, area: 820, beds: 6, baths: 7,
    short: "A sculpted family villa with infinity pool and private majlis.",
    description: "Set within the quiet avenues of Al Malqa, Al Noor is a contemporary interpretation of Najdi living. Double-height reception halls open onto a cascading infinity pool, while carved mashrabiya screens filter the desert light across cream limestone interiors. A private majlis, guest wing and rooftop terrace complete a home designed for generations.",
    images: [hero, p2, p4], featured: true, status: "Ready", year: 2025, amenities: amen,
  },
  {
    id: "emerald-tower-penthouse", title: "Emerald Tower Penthouse", city: "Riyadh", district: "KAFD",
    type: "Penthouse", price: 12500000, area: 610, beds: 4, baths: 5,
    short: "Sky residence above the financial district with 360° views.",
    description: "Crowning the Emerald Tower, this penthouse offers panoramic views over the King Abdullah Financial District. Floor-to-ceiling glazing, private elevator access and a wraparound terrace define a residence of rare stature.",
    images: [p1, p4, hero], featured: true, investment: { yield: 7.2, label: "Prime rental demand" }, status: "Ready", year: 2024, amenities: amen.slice(1),
  },
  {
    id: "red-sea-shore-villa", title: "Red Sea Shore Villa", city: "Jeddah", district: "Obhur",
    type: "Villa", price: 15800000, area: 940, beds: 5, baths: 6,
    short: "Beachfront living with a private jetty on Obhur creek.",
    description: "A whitewashed coastal retreat with direct beach access, a private jetty and terraces that step down to the water. Every room frames the Red Sea.",
    images: [p3, p2, p4], featured: true, investment: { yield: 6.4, label: "Holiday-let ready" }, status: "Ready", year: 2023, amenities: amen,
  },
  {
    id: "diriyah-courtyard-house", title: "Diriyah Courtyard House", city: "Riyadh", district: "Diriyah",
    type: "Villa", price: 6400000, area: 560, beds: 5, baths: 5,
    short: "Heritage-inspired courtyard home steps from At-Turaif.",
    description: "Built around a shaded central courtyard and pool, this residence reinterprets traditional mud-brick architecture with modern comfort.",
    images: [p2, hero, p4], investment: { yield: 8.1, label: "Tourism growth zone" }, status: "Ready", year: 2024, amenities: amen.slice(0, 6),
  },
  {
    id: "corniche-residence", title: "Corniche Sky Residence", city: "Al Khobar", district: "Corniche",
    type: "Apartment", price: 2350000, area: 210, beds: 3, baths: 3,
    short: "Serene sea-view apartment in a full-service tower.",
    description: "A calm, light-filled apartment overlooking the Arabian Gulf with hotel-grade services, residents' lounge and spa.",
    images: [p4, p1, p3], featured: true, investment: { yield: 7.8, label: "Fully furnished" }, status: "Ready", year: 2025, amenities: amen.slice(1, 7),
  },
  {
    id: "garden-townhouses", title: "Al Rawdah Garden Townhouse", city: "Dammam", district: "Al Rawdah",
    type: "Townhouse", price: 1850000, area: 280, beds: 4, baths: 4,
    short: "Family townhouse in a green, gated community.",
    description: "Part of a landscaped community with schools and parks nearby, these townhouses balance privacy and neighbourhood living.",
    images: [p5, p4, p2], featured: true, investment: { yield: 6.9, label: "Family rental demand" }, status: "Off-plan", year: 2026, amenities: amen.slice(2, 8),
  },
  {
    id: "olaya-business-hub", title: "Olaya Business Hub", city: "Riyadh", district: "Olaya",
    type: "Commercial", price: 21000000, area: 2400, beds: 0, baths: 8,
    short: "Grade-A office building leased to blue-chip tenants.",
    description: "A fully leased Grade-A office building on Olaya Street, offering stable long-term income in Riyadh's commercial heart.",
    images: [p6, p1, p4], investment: { yield: 9.2, label: "Fully leased" }, status: "Ready", year: 2022, amenities: ["Covered parking", "24/7 security", "Smart access", "Rooftop terrace"],
  },
  {
    id: "alula-desert-retreat", title: "AlUla Desert Retreat", city: "AlUla", district: "Ashar Valley",
    type: "Villa", price: 9700000, area: 700, beds: 4, baths: 5,
    short: "Secluded sandstone villa among AlUla's ancient canyons.",
    description: "Carved into the dramatic landscape of Ashar Valley, this retreat offers absolute privacy, a plunge pool and star-gazing terraces.",
    images: [p2, p3, hero], investment: { yield: 8.6, label: "Luxury tourism" }, status: "Off-plan", year: 2026, amenities: amen.slice(0, 5),
  },
  {
    id: "jeddah-marina-apartment", title: "Marina Bay Apartment", city: "Jeddah", district: "Al Shati",
    type: "Apartment", price: 3100000, area: 240, beds: 3, baths: 3,
    short: "Contemporary apartment with marina and sea views.",
    description: "A refined apartment in a boutique marina development with private beach club access.",
    images: [p4, p3, p1], status: "Ready", year: 2024, amenities: amen.slice(1, 6),
  },
  {
    id: "hittin-modern-villa", title: "Hittin Modern Villa", city: "Riyadh", district: "Hittin",
    type: "Villa", price: 7350000, area: 690, beds: 5, baths: 6,
    short: "Light-filled family villa with a shaded courtyard pool.",
    description: "A calm, contemporary villa in one of north Riyadh's most sought-after neighbourhoods, arranged around a shaded courtyard pool with generous family and guest wings.",
    images: [hero, p4, p2], featured: true, status: "Ready", year: 2025, amenities: amen,
  },
  {
    id: "jeddah-waterfront-penthouse", title: "Waterfront Sky Penthouse", city: "Jeddah", district: "Al Hamra",
    type: "Penthouse", price: 11200000, area: 520, beds: 4, baths: 5,
    short: "Double-height penthouse above the Jeddah Corniche.",
    description: "A double-height penthouse with a private plunge pool and uninterrupted views over the Corniche and the Red Sea.",
    images: [p1, p3, p4], featured: true, investment: { yield: 6.8, label: "Short-let premium" }, status: "Off-plan", year: 2027, amenities: amen.slice(0, 7),
  },
  {
    id: "khobar-family-townhouse", title: "Al Aziziyah Townhouse", city: "Al Khobar", district: "Al Aziziyah",
    type: "Townhouse", price: 2650000, area: 320, beds: 4, baths: 4,
    short: "Corner townhouse near the beach and international schools.",
    description: "A bright corner townhouse with private garden and rooftop, minutes from Half Moon Bay and Al Khobar's international schools.",
    images: [p5, p2, p4], status: "Ready", year: 2024, amenities: amen.slice(2, 8),
  },
];

export const GIGA_PROJECTS = [
  { name: "NEOM — The Line", region: "Tabuk Province", status: "Under construction", deadline: "2030 (phase one)", budget: "SAR 1.9 trillion", text: "A 170 km linear city redefining urban living — zero cars, zero streets, powered entirely by renewable energy.", image: g1 },
  { name: "Red Sea Global", region: "West Coast", status: "Phased opening", deadline: "2030 (full completion)", budget: "SAR 75 billion", text: "A regenerative tourism destination across 90 pristine islands, with ultra-luxury resorts and residences.", image: g2 },
  { name: "Diriyah Gate", region: "Riyadh", status: "Building now", deadline: "2030", budget: "SAR 236 billion", text: "The birthplace of the Kingdom reborn as a world-class cultural, living and hospitality district.", image: g3 },
];

/** Approximate map coordinates per district (demo data). */
const COORDS: Record<string, [number, number]> = {
  "Al Malqa": [24.808, 46.613], KAFD: [24.764, 46.640], Obhur: [21.739, 39.104], Diriyah: [24.734, 46.575],
  Corniche: [26.298, 50.218], "Al Rawdah": [26.392, 50.140], Olaya: [24.694, 46.685], "Ashar Valley": [26.497, 37.947],
  "Al Shati": [21.597, 39.110], Hittin: [24.761, 46.600], "Al Hamra": [21.537, 39.161], "Al Aziziyah": [26.205, 50.199],
};

/** Derived in-depth details for the property page (sample values, deterministic per property). */
export function propertyDetails(p: Property) {
  const seed = p.id.length;
  const [lat, lng] = COORDS[p.district] ?? [24.7136, 46.6753];
  return {
    lat, lng,
    pricePerM2: Math.round(p.price / p.area),
    plot: Math.round(p.area * (p.type === "Villa" ? 1.45 : p.type === "Townhouse" ? 1.2 : 1)),
    floors: p.type === "Apartment" || p.type === "Penthouse" ? `Floor ${18 + seed}` : p.type === "Commercial" ? "12 floors" : `${2 + (seed % 2)} levels`,
    parking: p.type === "Commercial" ? 140 : Math.max(2, Math.ceil(p.beds / 2)),
    furnishing: seed % 3 === 0 ? "Fully furnished" : seed % 3 === 1 ? "Semi furnished" : "Unfurnished",
    facing: ["North", "East", "South-east", "West"][seed % 4] ?? "North",
    developer: ["Roshn", "Dar Al Arkan", "Retal", "Najm Developments"][seed % 4] ?? "Roshn",
    deed: `SA-${(p.price % 9973).toString().padStart(4, "0")}-${p.year}`,
    tax: Math.round(p.price * 0.05),
    fee: Math.round(p.price * 0.025),
    mortgage: Math.round((p.price * 0.8 * (0.055 / 12)) / (1 - Math.pow(1 + 0.055 / 12, -300))),
    rooms: p.type === "Commercial"
      ? [["Office floors", "11 × 200 m²"], ["Lobby", "180 m²"], ["Retail podium", "320 m²"], ["Rooftop", "260 m²"]]
      : [["Living & majlis", `${Math.round(p.area * 0.18)} m²`], ["Kitchen & dining", `${Math.round(p.area * 0.11)} m²`], ["Primary suite", `${Math.round(p.area * 0.09)} m²`], ["Bedrooms", `${Math.max(p.beds - 1, 0)} × ${Math.round(p.area * 0.04)} m²`], ["Outdoor & terraces", `${Math.round(p.area * 0.15)} m²`]],
    nearby: [["International school", `${(seed % 5) + 1} min`], ["Hospital", `${(seed % 7) + 5} min`], ["Mall", `${(seed % 4) + 4} min`], ["Airport", `${(seed % 15) + 18} min`], ["Mosque", "2 min"]],
    plan: p.status === "Off-plan" ? [["On booking", "10%"], ["During construction", "50%"], ["On handover", "40%"]] : [["Down payment", "20%"], ["Bank financing", "80%"]],
  };
}
