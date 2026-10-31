export type ContactOffice = { city: string; address: string };

export type ContactSettingsData = {
  heading: string;
  headingAccent: string;
  subheading: string;
  phone: string;
  email: string;
  hours: string;
  offices: ContactOffice[];
  mapTitle: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapAddress: string;
  mapZoom: number;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettingsData = {
  heading: "Talk",
  headingAccent: "to us",
  subheading: "A private advisor will reply within 24 hours — or call us directly.",
  phone: "+966 11 000 0000",
  email: "hello@najmestate.sa",
  hours: "Sun–Thu 9:00–21:00 · Fri–Sat by appointment",
  offices: [
    { city: "Riyadh (HQ)", address: "King Fahd Rd, Al Olaya" },
    { city: "Jeddah", address: "Corniche Rd, Al Shati" },
    { city: "Dammam", address: "Prince Turki St, Corniche" },
  ],
  mapTitle: "Najm Estate Riyadh office map",
  mapLatitude: 24.694,
  mapLongitude: 46.685,
  mapAddress: "",
  mapZoom: 13,
};

export function getMapQuery(s: Pick<ContactSettingsData, "mapLatitude" | "mapLongitude" | "mapAddress">) {
  if (s.mapLatitude != null && s.mapLongitude != null) return `${s.mapLatitude},${s.mapLongitude}`;
  return s.mapAddress.trim();
}

export function getMapUrl(s: ContactSettingsData) {
  const q = getMapQuery(s);
  if (!q) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${s.mapZoom}&output=embed`;
}

export function getMapLink(s: ContactSettingsData) {
  const q = getMapQuery(s);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export function toContactSettings(row: Partial<Record<keyof ContactSettingsData, unknown>> | null): ContactSettingsData {
  const d = DEFAULT_CONTACT_SETTINGS;
  if (!row) return d;
  const offices = Array.isArray(row.offices)
    ? (row.offices as unknown[])
        .filter((o): o is ContactOffice => !!o && typeof (o as ContactOffice).city === "string")
        .map((o) => ({ city: o.city, address: typeof o.address === "string" ? o.address : "" }))
    : d.offices;
  const str = (v: unknown, fb: string) => (typeof v === "string" ? v : fb);
  return {
    heading: str(row.heading, d.heading),
    headingAccent: str(row.headingAccent, d.headingAccent),
    subheading: str(row.subheading, d.subheading),
    phone: str(row.phone, d.phone),
    email: str(row.email, d.email),
    hours: str(row.hours, d.hours),
    offices,
    mapTitle: str(row.mapTitle, d.mapTitle),
    mapLatitude: typeof row.mapLatitude === "number" ? row.mapLatitude : null,
    mapLongitude: typeof row.mapLongitude === "number" ? row.mapLongitude : null,
    mapAddress: str(row.mapAddress, d.mapAddress),
    mapZoom: typeof row.mapZoom === "number" ? row.mapZoom : d.mapZoom,
  };
}