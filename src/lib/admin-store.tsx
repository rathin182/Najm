import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROPERTIES, type Property } from "@/data/properties";

/** Demo admin data, kept in this browser's localStorage only (no server). */

export type Role = "Admin" | "Agent" | "Viewer";
export type EnquiryStatus = "New" | "Contacted" | "Viewing" | "Closed";
export type Enquiry = { id: string; name: string; email: string; phone: string; message: string; propertyId?: string; source: string; status: EnquiryStatus; date: string };
export type Contact = { id: string; name: string; email: string; phone: string; type: "Buyer" | "Investor" | "Seller" | "Tenant"; city: string; notes: string; date: string };
export type Staff = { id: string; name: string; email: string; role: Role; active: boolean };
export type Pair = [string, string];
export type PropertyExtra = {
  plot: number; floors: string; parking: number; furnishing: string; facing: string; developer: string; deed: string;
  lat: number; lng: number; serviceCharge: number; handover: string; video: string;
  rooms: Pair[]; nearby: Pair[]; plan: Pair[]; features: string[];
  agentName: string; agentPhone: string; seoTitle: string; seoDescription: string;
};
export type AdminProperty = Property & { views: number; published: boolean; details?: PropertyExtra };

type Data = { properties: AdminProperty[]; enquiries: Enquiry[]; contacts: Contact[]; staff: Staff[] };

const KEY = "najm-admin-v1";
const INBOX = "najm-inbox-v1";
const SESSION = "najm-admin-session";
export const DEMO_PASSWORD = "najm2026";

const uid = () => Math.random().toString(36).slice(2, 10);
const daysAgo = (d: number, h = 10) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, 0, 0, 0); return t.toISOString(); };

const NAMES = ["Faisal Al-Harbi", "Noura Al-Otaibi", "James Whitaker", "Sara Al-Dossary", "Khalid Bin Saeed", "Aisha Rahman", "Mohammed Al-Zahrani", "Reem Al-Shehri", "Daniel Moreau", "Hind Al-Mutairi", "Yousef Qureshi", "Lina Haddad"];
const MSGS = ["Is this still available? I'd like a viewing this weekend.", "Can you share the payment plan and service charges?", "Interested as an investment — what is the expected rental yield?", "Do you accept mortgage buyers from Al Rajhi?", "Please send the brochure and floor plans.", "Looking for something similar with a private pool."];
const SOURCES = ["Property page", "Home contact form", "Contact page", "Brochure download", "Phone call"];

export function seed(): Data {
  const properties = PROPERTIES.map((p, i) => ({ ...p, views: 4200 - i * 310 + ((i * 977) % 600), published: true }));
  const statuses: EnquiryStatus[] = ["New", "New", "Contacted", "Viewing", "New", "Closed"];
  const enquiries: Enquiry[] = Array.from({ length: 18 }, (_, i) => {
    const n = NAMES[i % NAMES.length]!;
    return { id: uid(), name: n, email: n.toLowerCase().replace(/[^a-z]+/g, ".") + "@mail.com", phone: `+966 5${(10000000 + i * 7345121) % 99999999}`.slice(0, 15), message: MSGS[i % MSGS.length]!, propertyId: properties[i % properties.length]!.id, source: SOURCES[i % SOURCES.length]!, status: statuses[i % statuses.length]!, date: daysAgo(Math.floor(i * 1.6), 9 + (i % 8)) };
  });
  const types: Contact["type"][] = ["Buyer", "Investor", "Seller", "Tenant"];
  const contacts: Contact[] = NAMES.map((n, i) => ({ id: uid(), name: n, email: n.toLowerCase().replace(/[^a-z]+/g, ".") + "@mail.com", phone: `+966 55 ${String(1000000 + i * 834211).slice(0, 7)}`, type: types[i % 4]!, city: ["Riyadh", "Jeddah", "Al Khobar", "Dammam"][i % 4]!, notes: i % 3 === 0 ? "Prefers WhatsApp. Budget around SAR 5M." : "", date: daysAgo(i * 4) }));
  const staff: Staff[] = [
    { id: "s1", name: "Abdulrahman Al-Saud", email: "admin@najm.sa", role: "Admin", active: true },
    { id: "s2", name: "Lama Al-Qahtani", email: "lama@najm.sa", role: "Agent", active: true },
    { id: "s3", name: "Omar Haddad", email: "omar@najm.sa", role: "Viewer", active: true },
  ];
  return { properties, enquiries, contacts, staff };
}

/** Called by public site forms so new enquiries appear in the admin inbox. */
export function pushEnquiry(e: { name: string; email: string; phone: string; message?: string | undefined; source: string; propertyId?: string | undefined }) {
  try {
    const list = JSON.parse(localStorage.getItem(INBOX) || "[]");
    list.push({ id: uid(), message: "", ...e, status: "New", date: new Date().toISOString() });
    localStorage.setItem(INBOX, JSON.stringify(list));
  } catch { /* storage unavailable */ }
}

export const PERMS: Record<Role, { edit: boolean; delete: boolean; staff: boolean }> = {
  Admin: { edit: true, delete: true, staff: true },
  Agent: { edit: true, delete: false, staff: false },
  Viewer: { edit: false, delete: false, staff: false },
};

type Ctx = Data & {
  ready: boolean;
  user: Staff | null;
  can: (typeof PERMS)[Role];
  login: (email: string, password: string) => string | null;
  logout: () => void;
  saveProperty: (p: AdminProperty) => void;
  deleteProperty: (id: string) => void;
  updateEnquiry: (id: string, patch: Partial<Enquiry>) => void;
  deleteEnquiry: (id: string) => void;
  saveContact: (c: Contact) => void;
  deleteContact: (id: string) => void;
  saveStaff: (s: Staff) => void;
  deleteStaff: (id: string) => void;
  reset: () => void;
};

const AdminCtx = createContext<Ctx | null>(null);
export const newId = uid;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(() => seed());
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let d = seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) d = JSON.parse(raw);
      const inbox = JSON.parse(localStorage.getItem(INBOX) || "[]");
      if (inbox.length) { d.enquiries = [...inbox.reverse(), ...d.enquiries]; localStorage.removeItem(INBOX); }
      setUserId(localStorage.getItem(SESSION));
    } catch { /* ignore */ }
    setData(d);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota: large photos */ }
  }, [data, ready]);

  const user = data.staff.find((s) => s.id === userId && s.active) ?? null;
  const upsert = <T extends { id: string }>(list: T[], item: T) => list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

  const login = useCallback((email: string, password: string) => {
    const s = data.staff.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!s || password !== DEMO_PASSWORD) return "Wrong email or password.";
    if (!s.active) return "This account is disabled.";
    localStorage.setItem(SESSION, s.id); setUserId(s.id); return null;
  }, [data.staff]);

  const value = useMemo<Ctx>(() => ({
    ...data, ready, user, can: PERMS[user?.role ?? "Viewer"], login,
    logout: () => { localStorage.removeItem(SESSION); setUserId(null); },
    saveProperty: (p) => setData((d) => ({ ...d, properties: upsert(d.properties, p) })),
    deleteProperty: (id) => setData((d) => ({ ...d, properties: d.properties.filter((p) => p.id !== id) })),
    updateEnquiry: (id, patch) => setData((d) => ({ ...d, enquiries: d.enquiries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
    deleteEnquiry: (id) => setData((d) => ({ ...d, enquiries: d.enquiries.filter((e) => e.id !== id) })),
    saveContact: (c) => setData((d) => ({ ...d, contacts: upsert(d.contacts, c) })),
    deleteContact: (id) => setData((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) })),
    saveStaff: (s) => setData((d) => ({ ...d, staff: upsert(d.staff, s) })),
    deleteStaff: (id) => setData((d) => ({ ...d, staff: d.staff.filter((s) => s.id !== id) })),
    reset: () => setData(seed()),
  }), [data, ready, user, login]);

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin must be used inside AdminProvider");
  return c;
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
