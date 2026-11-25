"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, MapPin, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { SavingOverlay } from "@/components/admin/EditorParts";
import { useAdmin } from "@/lib/admin-store";

type Destination = { id: string; name: string; image: string; description: string };
type Draft = Omit<Destination, "id"> & { id?: string };
const blank = (): Draft => ({ name: "", image: "", description: "" });

async function readApiResponse<T>(response: Response, message: string): Promise<T> {
  const text = await response.text();
  let body: (T & { error?: string }) | null = null;
  try { body = text ? JSON.parse(text) as T & { error?: string } : null; } catch { /* Use a readable fallback for empty or non-JSON responses. */ }
  if (!response.ok) throw new Error(body?.error ?? `${message} (HTTP ${response.status}).`);
  if (body === null) throw new Error(`${message} The server returned an empty or invalid response.`);
  return body;
}

export default function DestinationsAdminPage() {
  const { can } = useAdmin();
  const [rows, setRows] = useState<Destination[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/destinations", { cache: "no-store", credentials: "include" })
      .then((response) => readApiResponse<Destination[]>(response, "Could not load destinations."))
      .then((data) => { if (active) setRows(data); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load destinations."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", credentials: "include", body: form });
      const result = await readApiResponse<{ url?: string; kind?: string }>(response, "Could not upload this image.");
      if (result.kind !== "image" || !result.url) throw new Error("Could not upload this image.");
      setDraft((current) => current ? { ...current, image: result.url! } : current);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not upload this image."); }
    finally { setUploading(false); }
  }

  async function save() {
    if (!draft?.name.trim() || !draft.image || !draft.description.trim()) { toast.error("Enter a destination name and description, and upload an image."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/destinations", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, name: draft.name.trim(), description: draft.description.trim() }) });
      const result = await readApiResponse<Destination>(response, "Could not save this destination.");
      setRows((current) => [...current.filter((item) => item.id !== result.id), result].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(null); toast.success(draft.id ? "Destination updated" : "Destination added");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save this destination."); }
    finally { setSaving(false); }
  }

  async function remove(destination: Destination) {
    if (!confirm(`Delete “${destination.name}”? Properties linked to it will have no destination.`)) return;
    try {
      const response = await fetch(`/api/admin/destinations?id=${encodeURIComponent(destination.id)}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) { await readApiResponse<never>(response, "Could not delete this destination."); return; }
      setRows((current) => current.filter((item) => item.id !== destination.id)); toast.success("Destination deleted");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete this destination."); }
  }

  if (!can.edit) return <p className="p-8 text-muted-foreground">You do not have permission to manage destinations.</p>;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader title="Destinations" sub="Manage destination pages and their images. Assign destinations to properties; homepage ranking sums views across their live properties." action={<button type="button" onClick={() => setDraft(blank())} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground"><Plus className="h-4 w-4" />Add destination</button>} />
      {draft && <Panel className="relative space-y-5">
        {(saving || uploading) && <SavingOverlay label={uploading ? "Uploading destination image…" : "Saving destination…"} />}
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-medium">{draft.id ? "Edit destination" : "Add destination"}</h2><p className="mt-1 text-sm text-muted-foreground">Name, image and a short description appear on destination cards.</p></div><button type="button" onClick={() => setDraft(null)} disabled={saving || uploading} aria-label="Close editor" className="rounded-full p-2 hover:bg-cream"><X className="h-5 w-5" /></button></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm text-muted-foreground">Destination name<input className="field mt-1" maxLength={120} autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Diriyah" /></label>
            <label className="block text-sm text-muted-foreground">Short description<textarea className="field mt-1 resize-none rounded-2xl" rows={4} maxLength={500} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="A short introduction to this destination" /></label>
          </div>
          <div><p className="mb-2 text-sm text-muted-foreground">Destination image</p>{draft.image ? <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-cream"><img src={draft.image} alt={draft.name || "Destination preview"} className="h-full w-full object-cover" /><button type="button" onClick={() => setDraft({ ...draft, image: "" })} aria-label="Remove image" className="absolute right-3 top-3 rounded-full bg-background p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div> : <label className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-cream text-muted-foreground hover:bg-muted"><ImagePlus className="h-8 w-8" /><span className="text-sm">Upload destination image</span><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} /></label>}{draft.image && <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />Replace image<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} /></label>}</div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" onClick={() => setDraft(null)} disabled={saving || uploading} className="rounded-full bg-cream px-5 py-3">Cancel</button><button type="button" onClick={() => void save()} disabled={saving || uploading} className="rounded-full bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save destination"}</button></div>
      </Panel>}
      {loading ? <Panel>Loading destinations…</Panel> : rows.length === 0 ? <Panel className="flex flex-col items-center gap-3 py-12 text-center"><MapPin className="h-8 w-8 text-primary" /><p>No destinations yet. Add one to assign it to properties.</p></Panel> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map((destination) => <Panel key={destination.id} className="!p-3"><div className="relative aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-cream">{destination.image ? <img src={destination.image} alt={destination.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}</div><div className="flex items-center gap-2 p-3"><MapPin className="h-4 w-4 text-primary" /><h2 className="flex-1 truncate font-medium">{destination.name}</h2><button type="button" onClick={() => setDraft(destination)} aria-label={`Edit ${destination.name}`} className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"><Pencil className="h-4 w-4" /></button>{can.delete && <button type="button" onClick={() => void remove(destination)} aria-label={`Delete ${destination.name}`} className="rounded-full bg-cream p-2.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>}</div>{destination.description && <p className="px-3 pb-3 text-sm text-muted-foreground">{destination.description}</p>}</Panel>)}</div>}
    </main>
  );
}
