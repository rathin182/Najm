"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, useAdmin } from "@/lib/admin-store";
import { CONTACT_LABEL, CONTACT_TYPES, type ApiContact, type ContactType } from "@/lib/contacts-client";
import { PageHeader, Panel } from "@/components/admin/AdminShell";

type Draft = { id?: string; name: string; email: string; phone: string; type: ContactType; city: string; notes: string };
const blank = (): Draft => ({ name: "", email: "", phone: "", type: "BUYER", city: "Riyadh", notes: "" });

function Contacts() {
  const { can } = useAdmin();
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | ContactType>("");
  const [edit, setEdit] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contacts", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load contacts.");
      setContacts(((await res.json()) as { items: ApiContact[] }).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const list = useMemo(
    () => contacts.filter((c) => (!type || c.type === type) && `${c.name} ${c.email} ${c.phone ?? ""} ${c.city}`.toLowerCase().includes(q.toLowerCase())),
    [contacts, q, type],
  );

  const exportCsv = () => {
  const qs = type ? `?type=${type}` : "";
  window.location.href = `/api/admin/contacts/export${qs}`;
};

  async function save(draft: Draft) {
    if (!draft.name.trim() || !draft.email.includes("@")) {
      toast.error("Name and a valid email are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(draft.id ? `/api/admin/contacts/${draft.id}` : "/api/admin/contacts", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, email: draft.email, phone: draft.phone, type: draft.type, city: draft.city, notes: draft.notes }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not save contact.");
      const saved = body as ApiContact;
      setContacts((prev) => (draft.id ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]));
      setEdit(null);
      toast.success("Contact saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: ApiContact) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/contacts/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Could not delete contact.");
      setContacts((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Contact deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete contact.");
    }
  }

  return (
    <div>
      <PageHeader title="Contacts" sub={`${contacts.length} people in your address book`} action={
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-full bg-background px-5 py-3"><Download className="h-4 w-4" />Export CSV</button>
          {can.edit && <button onClick={() => setEdit(blank())} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground"><Plus className="h-4 w-4" />Add contact</button>}
        </div>
      } />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" className="field !bg-background pl-10" />
        </label>
        <select value={type} onChange={(e) => setType(e.target.value as "" | ContactType)} className="field !w-auto !bg-background">
          <option value="">All types</option>
          {CONTACT_TYPES.map((t) => <option key={t} value={t}>{CONTACT_LABEL[t]}</option>)}
        </select>
      </div>
      <Panel className="overflow-x-auto !p-2">
        <table className="w-full min-w-[720px] text-left">
          <thead className="text-sm text-muted-foreground"><tr><th className="p-4 font-normal">Name</th><th className="p-4 font-normal">Phone</th><th className="p-4 font-normal">Type</th><th className="p-4 font-normal">City</th><th className="p-4 font-normal">Added</th><th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-cream/60">
                <td className="rounded-l-2xl p-4"><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.email}</p></td>
                <td className="p-4">{c.phone ?? "—"}</td>
                <td className="p-4">{CONTACT_LABEL[c.type]}</td>
                <td className="p-4">{c.city}</td>
                <td className="p-4 text-sm text-muted-foreground">{fmtDate(c.createdAt)}</td>
                <td className="rounded-r-2xl p-4 text-right">
                  {can.edit && <button aria-label="Edit" onClick={() => setEdit({ id: c.id, name: c.name, email: c.email, phone: c.phone ?? "", type: c.type, city: c.city, notes: c.notes })} className="rounded-full p-2 hover:bg-cream"><Pencil className="h-4 w-4" /></button>}
                  {can.delete && <button aria-label="Delete" onClick={() => void remove(c)} className="rounded-full p-2 text-destructive hover:bg-cream"><Trash2 className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-muted-foreground">Loading…</p>}
        {error && (
          <div className="p-6">
            <p className="text-destructive">{error}</p>
            <button onClick={() => void load()} className="mt-3 rounded-full bg-cream px-4 py-2 text-sm">Retry</button>
          </div>
        )}
        {!loading && !error && list.length === 0 && <p className="p-6 text-muted-foreground">No contacts match.</p>}
      </Panel>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-[2rem] border-none">
          <DialogHeader><DialogTitle className="text-2xl font-medium">{edit?.id ? "Edit contact" : "New contact"}</DialogTitle></DialogHeader>
          {edit && (
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void save(edit); }}>
              {(["name", "email", "phone", "city"] as const).map((k) => (
                <input key={k} className="field" placeholder={k[0]!.toUpperCase() + k.slice(1)} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
              ))}
              <select className="field" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as ContactType })}>
                {CONTACT_TYPES.map((t) => <option key={t} value={t}>{CONTACT_LABEL[t]}</option>)}
              </select>
              <textarea className="field resize-none rounded-[1.5rem]" rows={3} placeholder="Notes" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
              <button disabled={saving} className="mt-2 rounded-full bg-primary py-3.5 text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save contact"}</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Contacts;