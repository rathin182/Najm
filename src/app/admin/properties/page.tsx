"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { CITIES, TYPES, formatSAR } from "@/data/properties";
import { useAdmin } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";


function PropertiesAdmin() {
  const { properties, saveProperty, deleteProperty, can } = useAdmin();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");

  const list = useMemo(() => properties.filter((p) => (!city || p.city === city) && (!type || p.type === type) && `${p.title} ${p.district} ${p.type}`.toLowerCase().includes(q.toLowerCase())), [properties, q, city, type]);

  return (
    <div>
      <PageHeader title="Properties" sub={`${properties.length} listings · ${properties.filter((p) => p.published).length} live on the site`} action={
        can.edit && <Link href="/admin/properties/new" className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground hover:bg-ink"><Plus className="h-4 w-4" />Add property</Link>
      } />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings" className="field !bg-background pl-10" />
        </label>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="field !w-auto !bg-background"><option value="">All cities</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="field !w-auto !bg-background"><option value="">All types</option>{TYPES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <Panel key={p.id} className="!p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem]">
              <img src={p.images[0]} alt={p.title} className={`h-full w-full object-cover ${p.published ? "" : "opacity-40 grayscale"}`} />
              {p.featured && <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary"><Star className="h-4 w-4 fill-current" /></span>}
            </div>
            <div className="p-3">
              <p className="text-xl font-medium">{formatSAR(p.price)}</p>
              <p className="mt-1 truncate font-medium">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.district}, {p.city} · {p.type} · {p.status}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Eye className="h-4 w-4" />{p.views.toLocaleString("en")}</span>
                <label className="ml-auto flex items-center gap-2 text-sm">{p.published ? "Live" : "Hidden"}
                  <Switch checked={p.published} disabled={!can.edit} onCheckedChange={(v) => saveProperty({ ...p, published: v })} />
                </label>
                {can.edit && <Link href={`/admin/properties/${p.id}`} aria-label="Edit" className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"><Pencil className="h-4 w-4" /></Link>}
                {can.delete && <button aria-label="Delete" onClick={() => { if (confirm(`Delete "${p.title}"?`)) { deleteProperty(p.id); toast.success("Property deleted"); } }} className="rounded-full bg-cream p-2.5 text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
          </Panel>
        ))}
      </div>
      {list.length === 0 && <Panel>No properties match.</Panel>}
    </div>
  );
}

export default PropertiesAdmin;
