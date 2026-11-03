export const ABOUT_SECTION_TYPES = [
  { value: "HERO_IMAGE", label: "Hero image section" },
  { value: "VALUE_CARDS", label: "Values cards" },
  { value: "JOURNEY_TIMELINE", label: "Journey timeline" },
  { value: "TEAM", label: "Team" },
  { value: "CTA_BANNER", label: "Advisor call to action" },
] as const;

export const ADDABLE_ABOUT_SECTION_TYPES = [
  ABOUT_SECTION_TYPES[0],
  ABOUT_SECTION_TYPES[1],
  ABOUT_SECTION_TYPES[2],
  ABOUT_SECTION_TYPES[4],
] as const;

export const ABOUT_HERO_DESTINATIONS = [
  { value: "", label: "No button", buttonLabel: "" },
  { value: "/contact", label: "Contact page", buttonLabel: "Talk to an advisor" },
  { value: "/properties", label: "Properties page", buttonLabel: "Browse properties" },
  { value: "/about#values", label: "Our values", buttonLabel: "Our values" },
  { value: "/about#journey", label: "Our journey", buttonLabel: "Explore our journey" },
  { value: "/about#team", label: "Meet the team", buttonLabel: "Meet the team" },
] as const;

export type AboutSectionType = (typeof ABOUT_SECTION_TYPES)[number]["value"];
export type AddableAboutSectionType = (typeof ADDABLE_ABOUT_SECTION_TYPES)[number]["value"];

export type AboutSectionItem = { title: string; description: string };

export type AboutSection = {
  id: string;
  type: AboutSectionType;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  buttonLabel: string;
  buttonDestination: string;
  items: AboutSectionItem[];
  order: number;
};

export type AboutSectionDraft = Omit<AboutSection, "id"> & { id?: string };
