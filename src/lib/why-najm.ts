export const WHY_NAJM_ICON_KEYS = [
  "BadgeCheck", "Landmark", "LineChart", "Handshake", "ShieldCheck", "Building2",
  "Home", "Key", "Star", "Globe", "Users", "Wallet", "TrendingUp", "Award", "Heart", "Clock", "MapPin",
] as const;
export type WhyNajmIconKey = (typeof WHY_NAJM_ICON_KEYS)[number];

export const WHY_NAJM_LIMITS = { stats: 8, pillars: 12 } as const;

export type WhyNajmStat = { value: string; label: string };
export type WhyNajmPillar = { icon: WhyNajmIconKey; title: string; description: string };

export type WhyNajmSettingsData = {
  headingAccent: string;
  heading: string;
  intro: string;
  stats: WhyNajmStat[];
  pillarsTitle: string;
  pillarsAccent: string;
  pillars: WhyNajmPillar[];
};

export const DEFAULT_WHY_NAJM: WhyNajmSettingsData = {
  headingAccent: "Why",
  heading: "Najm?",
  intro: "We are a Riyadh-born advisory built for one thing: helping families and investors own the right Saudi address with total confidence — from first viewing to long after handover.",
  stats: [
    { value: "18+", label: "Years of local expertise" },
    { value: "SAR 6B", label: "In property transacted" },
    { value: "2,400+", label: "Families and investors housed" },
    { value: "4.9/5", label: "Average client rating" },
  ],
  pillarsTitle: "Six promises behind every deal",
  pillarsAccent: "promises",
  pillars: [
    { icon: "BadgeCheck", title: "100% verified listings", description: "Every title deed, building permit and developer licence is checked against Ejar and REGA records before a home reaches you." },
    { icon: "Landmark", title: "Off-market access", description: "Around a third of our sales never appear online — private releases from developers and families who trust our discretion." },
    { icon: "LineChart", title: "Investment intelligence", description: "Yield forecasts, rental comparables and Vision 2030 pipeline data for every property, so decisions rest on numbers." },
    { icon: "Handshake", title: "Financing made simple", description: "Sharia-compliant mortgages arranged with leading Saudi banks, including options for eligible non-residents." },
    { icon: "ShieldCheck", title: "Legal & handover", description: "REGA-compliant contracts, escrow-protected payments, snagging inspections and utility setup — all handled." },
    { icon: "Building2", title: "After-sale care", description: "Property management, leasing and resale support, so your home keeps performing long after the keys change hands." },
  ],
};

/** Split `title` around the first occurrence of `accent` so the accent can be styled. */
export function splitAccent(title: string, accent: string): [string, string, string] {
  const a = accent.trim();
  const i = a ? title.indexOf(a) : -1;
  if (i < 0) return [title, "", ""];
  return [title.slice(0, i), a, title.slice(i + a.length)];
}

type Item = Partial<Record<"value" | "label" | "icon" | "title" | "description", unknown>>;

const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
const isItem = (v: unknown): v is Item => !!v && typeof v === "object" && !Array.isArray(v);

/** Turns a DB row (or null) into safe, fully-populated settings. A missing row gives the defaults. */
export function toWhyNajmSettings(row: Partial<Record<keyof WhyNajmSettingsData, unknown>> | null): WhyNajmSettingsData {
  const d = DEFAULT_WHY_NAJM;
  if (!row) return d;
  const list = <T,>(v: unknown, fallback: T[], map: (x: Item) => T | null): T[] =>
    Array.isArray(v) ? v.filter(isItem).map(map).filter((x): x is T => x !== null) : fallback;
  return {
    headingAccent: str(row.headingAccent, d.headingAccent),
    heading: str(row.heading, d.heading),
    intro: str(row.intro, d.intro),
    stats: list(row.stats, d.stats, (x) =>
      typeof x.value === "string" && typeof x.label === "string" ? { value: x.value, label: x.label } : null),
    pillarsTitle: str(row.pillarsTitle, d.pillarsTitle),
    pillarsAccent: str(row.pillarsAccent, d.pillarsAccent),
    pillars: list(row.pillars, d.pillars, (x) =>
      typeof x.title === "string"
        ? {
            icon: (WHY_NAJM_ICON_KEYS as readonly unknown[]).includes(x.icon) ? (x.icon as WhyNajmIconKey) : "BadgeCheck",
            title: x.title,
            description: str(x.description, ""),
          }
        : null),
  };
}