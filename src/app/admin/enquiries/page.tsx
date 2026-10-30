"use client";
import { useMemo, useState } from "react";
import { Mail, Phone, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, newId, useAdmin, type EnquiryStatus } from "@/lib/admin-store";
import { PageHeader, Panel, STATUS_STYLE } from "@/components/admin/AdminShell";


const STATUSES: EnquiryStatus[] = ["New", "Contacted", "Viewing", "Closed"];

function Enquiries() {
  const { enquiries, properties, updateEnquiry, deleteEnquiry, saveContact, contacts, can } = useAdmin();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"All" | EnquiryStatus>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => enquiries
    .filter((e) => tab === "All" || e.status === tab)
    .filter((e) => `${e.name} ${e.email} ${e.message}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [enquiries, tab, q]);
  const open = enquiries.find((e) => e.id === openId) ?? list[0];
  const prop = (id?: string) => properties.find((p) => p.id === id);

  return (
    <div>
      <PageHeader title="Enquiries" sub={`${enquiries.filter((e) => e.status === "New").length} new waiting for a reply`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["All", ...STATUSES] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-cream"}`}>
            {t} <span className="opacity-60">{t === "All" ? enquiries.length : enquiries.filter((e) => e.status === t).length}</span>
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search enquiries" className="field !bg-background pl-10" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel className="!p-2">
          {list.length === 0 && <p className="p-6 text-muted-foreground">No enquiries match.</p>}
          <ul className="max-h-[45vh] overflow-y-auto lg:max-h-[70vh]">
            {list.map((e) => (
              <li key={e.id}>
                <button onClick={() => { setOpenId(e.id); }} className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors ${open?.id === e.id ? "bg-cream" : "hover:bg-cream/60"}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background font-medium">{e.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="truncate font-medium">{e.name}</p>{e.status === "New" && <span className="h-2 w-2 rounded-full bg-primary" />}</div>
                    <p className="truncate text-sm text-muted-foreground">{prop(e.propertyId)?.title ?? e.source}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{fmtDate(e.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {open && (
          <Panel className="self-start">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-medium">{open.name}</p>
                <p className="text-sm text-muted-foreground">{fmtDate(open.date)} · via {open.source}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm ${STATUS_STYLE[open.status]}`}>{open.status}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`mailto:${open.email}`} className="flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm"><Mail className="h-4 w-4" />{open.email}</a>
              <a href={`tel:${open.phone}`} className="flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm"><Phone className="h-4 w-4" />{open.phone}</a>
            </div>
            {prop(open.propertyId) && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream p-3">
                <img src={prop(open.propertyId)!.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div><p className="text-sm text-muted-foreground">Interested in</p><p className="font-medium">{prop(open.propertyId)!.title}</p></div>
              </div>
            )}
            <p className="mt-6 whitespace-pre-wrap text-lg">{open.message || "No message."}</p>

            {can.edit && (
              <>
                <p className="mt-8 text-sm text-muted-foreground">Update status</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => { updateEnquiry(open.id, { status: s }); toast.success(`Marked as ${s}`); }} className={`rounded-full px-4 py-2 text-sm ${open.status === s ? "bg-primary text-primary-foreground" : "bg-cream hover:bg-muted"}`}>{s}</button>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  <button
                    disabled={contacts.some((c) => c.email === open.email)}
                    onClick={() => { saveContact({ id: newId(), name: open.name, email: open.email, phone: open.phone, type: "Buyer", city: prop(open.propertyId)?.city ?? "Riyadh", notes: open.message, date: new Date().toISOString() }); toast.success("Saved to contacts"); }}
                    className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-ink-foreground disabled:opacity-40"
                  ><UserPlus className="h-4 w-4" />{contacts.some((c) => c.email === open.email) ? "Already a contact" : "Save as contact"}</button>
                  {can.delete && (
                    <button onClick={() => { if (confirm("Delete this enquiry?")) { deleteEnquiry(open.id); setOpenId(null); toast.success("Enquiry deleted"); } }} className="flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm text-destructive"><Trash2 className="h-4 w-4" />Delete</button>
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
