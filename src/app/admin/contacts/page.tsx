"use client";
import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, newId, useAdmin, type Contact } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";


const TYPES: Contact["type"][] = ["Buyer", "Investor", "Seller", "Tenant"];
const blank = (): Contact => ({ id: newId(), name: "", email: "", phone: "", type: "Buyer", city: "Riyadh", notes: "", date: new Date().toISOString() });

function Contacts() {
  const { contacts, saveContact, deleteContact, can } = useAdmin();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [edit, setEdit] = useState<Contact | null>(null);

  const list = useMemo(() => contacts.filter((c) => (!type || c.type === type) && `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q.toLowerCase())), [contacts, q, type]);

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "Type", "City", "Notes"], ...list.map((c) => [c.name, c.email, c.phone, c.type, c.city, c.notes])];
    const blob = new Blob([rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "najm-contacts.csv"; a.click();
  };

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
        <select value={type} onChange={(e) => setType(e.target.value)} className="field !w-auto !bg-background"><option value="">All types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <Panel className="overflow-x-auto !p-2">
        <table className="w-full min-w-[720px] text-left">
          <thead className="text-sm text-muted-foreground"><tr><th className="p-4 font-normal">Name</th><th className="p-4 font-normal">Phone</th><th className="p-4 font-normal">Type</th><th className="p-4 font-normal">City</th><th className="p-4 font-normal">Added</th><th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-cream/60">
                <td className="rounded-l-2xl p-4"><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.email}</p></td>
                <td className="p-4">{c.phone}</td>
                <td className="p-4">{c.type}</td>
                <td className="p-4">{c.city}</td>
                <td className="p-4 text-sm text-muted-foreground">{fmtDate(c.date)}</td>
                <td className="rounded-r-2xl p-4 text-right">
                  {can.edit && <button aria-label="Edit" onClick={() => setEdit(c)} className="rounded-full p-2 hover:bg-cream"><Pencil className="h-4 w-4" /></button>}
                  {can.delete && <button aria-label="Delete" onClick={() => { if (confirm(`Delete ${c.name}?`)) { deleteContact(c.id); toast.success("Contact deleted"); } }} className="rounded-full p-2 text-destructive hover:bg-cream"><Trash2 className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-muted-foreground">No contacts match.</p>}
      </Panel>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-[2rem] border-none">
          <DialogHeader><DialogTitle className="text-2xl font-medium">{contacts.some((c) => c.id === edit?.id) ? "Edit contact" : "New contact"}</DialogTitle></DialogHeader>
          {edit && (
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (!edit.name.trim() || !edit.email.includes("@")) { toast.error("Name and a valid email are required"); return; } saveContact(edit); setEdit(null); toast.success("Contact saved"); }}>
              {(["name", "email", "phone", "city"] as const).map((k) => (
                <input key={k} className="field" placeholder={k[0]!.toUpperCase() + k.slice(1)} value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
              ))}
              <select className="field" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Contact["type"] })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <textarea className="field resize-none rounded-[1.5rem]" rows={3} placeholder="Notes" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
              <button className="mt-2 rounded-full bg-primary py-3.5 text-primary-foreground">Save contact</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Contacts;
