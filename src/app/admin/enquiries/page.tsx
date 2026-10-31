"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, Mail, Phone, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, useAdmin } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { PROPERTIES } from "@/data/properties";

type EnquiryStatus = "NEW" | "CONTACTED" | "VISIT_SCHEDULED" | "CLOSED" | "NOT_INTERESTED";
type Cursor = { id: string; createdAt: string };
type ApiEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  investorType: string | null;
  status: EnquiryStatus;
  source: string | null;
  createdAt: string;
  propertyTitle: string | null;
  propertySlug: string | null;
};

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  VISIT_SCHEDULED: "Viewing",
  CLOSED: "Closed",
  NOT_INTERESTED: "Not interested",
};
const STATUS_CLASS: Record<EnquiryStatus, string> = {
  NEW: "bg-primary text-primary-foreground",
  CONTACTED: "bg-cream text-foreground",
  VISIT_SCHEDULED: "bg-ink text-ink-foreground",
  CLOSED: "bg-muted text-muted-foreground",
  NOT_INTERESTED: "bg-muted text-muted-foreground",
};
type Counts = Record<"All" | EnquiryStatus, number>;
const ZERO: Counts = { All: 0, NEW: 0, CONTACTED: 0, VISIT_SCHEDULED: 0, CLOSED: 0, NOT_INTERESTED: 0 };
const TABS: ("All" | EnquiryStatus)[] = ["All", "NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED", "NOT_INTERESTED"];

/** Lets the sidebar badge refresh after a status change or delete. */
const notifyChanged = () => window.dispatchEvent(new Event("enquiries:changed"));

function Enquiries() {
  const { can } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [contactEmails, setContactEmails] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ApiEnquiry[]>([]);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [counts, setCounts] = useState<Counts>(ZERO);
  const reqId = useRef(0);
  const [tab, setTab] = useState<"All" | EnquiryStatus>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async (from: Cursor | null) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: "property" });
      if (tab !== "All") params.set("status", tab);
      if (debouncedQ) params.set("q", debouncedQ);
      if (from) {
        params.set("cursorId", from.id);
        params.set("cursorDate", from.createdAt);
      }
      const res = await fetch(`/api/admin/requests?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load enquiries.");
      const data = (await res.json()) as { items: ApiEnquiry[]; hasMore: boolean; nextCursor: Cursor | null; counts?: Counts };
      if (id !== reqId.current) return; // a newer request replaced this one
      setItems((prev) => (from ? [...prev, ...data.items] : data.items));
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
      if (data.counts) setCounts(data.counts);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : "Unable to load enquiries.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [tab, debouncedQ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    void load(null);
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/contacts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items: { email: string }[] } | null) => d && setContactEmails(new Set(d.items.map((c) => c.email.toLowerCase()))))
      .catch(() => {});
  }, []);

  async function saveAsContact(e: ApiEnquiry) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: e.name, email: e.email, phone: e.phone ?? "", type: "BUYER", notes: e.message }),
      });
      if (res.ok || res.status === 409) {
        setContactEmails((prev) => new Set(prev).add(e.email.toLowerCase()));
        toast.success(res.ok ? "Saved to contacts" : "Already a contact");
        return;
      }
      throw new Error((await res.json().catch(() => null))?.error ?? "Could not save contact.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save contact.");
    } finally {
      setBusy(false);
    }
  }

  const list = items;
  const open = items.find((e) => e.id === openId) ?? list[0];

  async function changeStatus(id: string, status: EnquiryStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not update status.");
      const before = items.find((e) => e.id === id)?.status;
      if (before && before !== status) {
        setCounts((c) => ({ ...c, [before]: Math.max(0, c[before] - 1), [status]: c[status] + 1 }));
        notifyChanged();
      }
      // Inside a status tab, an enquiry that no longer matches leaves the list.
      setItems((prev) => (tab !== "All" && status !== tab ? prev.filter((e) => e.id !== id) : prev.map((e) => (e.id === id ? { ...e, status } : e))));
      toast.success(`Marked as ${STATUS_LABEL[status]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEnquiry(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not delete enquiry.");
      const gone = items.find((e) => e.id === id);
      if (gone) {
        setCounts((c) => ({ ...c, All: Math.max(0, c.All - 1), [gone.status]: Math.max(0, c[gone.status] - 1) }));
        notifyChanged();
      }
      setItems((prev) => prev.filter((e) => e.id !== id));
      setOpenId(null);
      toast.success("Enquiry deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete enquiry.");
    } finally {
      setBusy(false);
    }
  }

  const count = (t: "All" | EnquiryStatus) => counts[t];

  return (
    <div>
      <PageHeader title="Enquiries" sub={`${count("NEW")} new waiting for a reply`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-cream"}`}>
            {t === "All" ? "All" : STATUS_LABEL[t]} <span className="opacity-60">{count(t)}</span>
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search enquiries" className="field !bg-background pl-10" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel className="!p-2">
          {error && (
            <div className="p-6">
              <p className="text-destructive">{error}</p>
              <button onClick={() => void load(null)} className="mt-3 rounded-full bg-cream px-4 py-2 text-sm">Retry</button>
            </div>
          )}
          {!error && !loading && list.length === 0 && <p className="p-6 text-muted-foreground">No enquiries found.</p>}
          <ul className="max-h-[45vh] overflow-y-auto lg:max-h-[70vh]">
            {list.map((e) => (
              <li key={e.id}>
                <button onClick={() => setOpenId(e.id)} className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors ${open?.id === e.id ? "bg-cream" : "hover:bg-cream/60"}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background font-medium">{e.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="truncate font-medium">{e.name}</p>{e.status === "NEW" && <span className="h-2 w-2 rounded-full bg-primary" />}</div>
                    <p className="truncate text-sm text-muted-foreground">{e.propertyTitle ?? e.source ?? "General enquiry"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{fmtDate(e.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {hasMore && !loading && (
            <button onClick={() => void load(cursor)} className="m-2 rounded-full bg-cream px-4 py-2 text-sm">Load more</button>
          )}
        </Panel>

        {open && (
          <Panel className="self-start">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-medium">{open.name}</p>
                <p className="text-sm text-muted-foreground">{fmtDate(open.createdAt)} · via {open.source ?? "website"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm ${STATUS_CLASS[open.status]}`}>{STATUS_LABEL[open.status]}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`mailto:${open.email}`} className="flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm"><Mail className="h-4 w-4" />{open.email}</a>
              {open.phone && <a href={`tel:${open.phone}`} className="flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm"><Phone className="h-4 w-4" />{open.phone}</a>}
            </div>
            {open.propertyTitle && (() => {
              const listed = PROPERTIES.find((x) => x.id === open.propertySlug);
              const href = open.propertySlug && open.propertySlug !== "general-enquiry" ? `/properties/${open.propertySlug}` : null;
              const card = (
                <>
                  {listed?.images[0] ? (
                    <img src={listed.images[0]} alt={open.propertyTitle ?? ""} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-background"><Building2 className="h-6 w-6" /></span>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Interested in</p>
                    <p className="font-medium">{open.propertyTitle}</p>
                  </div>
                </>
              );
              return href ? (
                <Link href={href} target="_blank" className="mt-6 flex items-center gap-3 rounded-2xl bg-cream p-3 transition-colors hover:bg-muted">{card}</Link>
              ) : (
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream p-3">{card}</div>
              );
            })()}
            <p className="mt-6 whitespace-pre-wrap text-lg">{open.message || "No message."}</p>

            {can.edit && (
              <>
                <p className="mt-8 text-sm text-muted-foreground">Update status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(STATUS_LABEL) as EnquiryStatus[]).map((st) => (
                    <button key={st} disabled={busy} onClick={() => void changeStatus(open.id, st)} className={`rounded-full px-4 py-2 text-sm disabled:opacity-60 ${open.status === st ? "bg-primary text-primary-foreground" : "bg-cream hover:bg-muted"}`}>{STATUS_LABEL[st]}</button>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  <button
                    disabled={busy || contactEmails.has(open.email.toLowerCase())}
                    onClick={() => void saveAsContact(open)}
                    className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-ink-foreground disabled:opacity-40"
                  ><UserPlus className="h-4 w-4" />{contactEmails.has(open.email.toLowerCase()) ? "Already a contact" : "Save as contact"}</button>
                  {can.delete && (
                    <button disabled={busy} onClick={() => void removeEnquiry(open.id)} className="flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm text-destructive disabled:opacity-60"><Trash2 className="h-4 w-4" />Delete</button>
                  )}
                </div>
              </>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

export default Enquiries;