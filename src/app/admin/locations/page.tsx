"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, MapPin, Pencil, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { SavingOverlay } from "@/components/admin/EditorParts";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/lib/admin-store";

type LocationRecord = { id: string; name: string; featured: boolean; image: string | null; sortOrder: number };
type LocationDraft = Omit<LocationRecord, "id"> & { id?: string };

const blankLocation = (): LocationDraft => ({ name: "", featured: false, image: null, sortOrder: 0 });

export default function LocationsAdminPage() {
  const { can } = useAdmin();
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/locations", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load locations.");
        return body as LocationRecord[];
      })
      .then((rows) => { if (!cancelled) setLocations(rows); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load locations."))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", credentials: "include", body: form });
      const result = await response.json() as { url?: string; kind?: string; error?: string };
      if (!response.ok || result.kind !== "image" || !result.url) throw new Error(result.error ?? "Could not upload this image.");
      setDraft((current) => current ? { ...current, image: result.url! } : current);
      toast.success("Location image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload this image.");
    } finally {
      setUploading(false);
    }
  }

  async function saveLocation() {
    if (!draft?.name.trim()) {
      toast.error("Enter a location name.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, name: draft.name.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this location.");
      setLocations((current) => [...current.filter((location) => location.id !== result.id), result].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setDraft(null);
      toast.success(draft.id ? "Location updated" : "Location added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this location.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation(location: LocationRecord) {
    if (!confirm(`Delete “${location.name}”?`)) return;
    try {
      const response = await fetch(`/api/admin/locations?id=${encodeURIComponent(location.id)}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Could not delete this location.");
      }
      setLocations((current) => current.filter((item) => item.id !== location.id));
      toast.success("Location deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this location.");
    }
  }

  if (!can.edit) return <p className="p-8 text-muted-foreground">You do not have permission to manage locations.</p>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Locations"
        sub="Manage the locations shown in search filters. Add an image and mark locations as featured for homepage use."
        action={<button type="button" onClick={() => setDraft(blankLocation())} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground"><Plus className="h-4 w-4" />Add location</button>}
      />

      {draft && (
        <Panel className="relative space-y-5">
          {(saving || uploading) && <SavingOverlay label={uploading ? "Uploading location image…" : "Saving location…"} />}
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-xl font-medium">{draft.id ? "Edit location" : "Add location"}</h2><p className="mt-1 text-sm text-muted-foreground">Location names stay in sync with matching listing cities.</p></div>
            <button type="button" onClick={() => setDraft(null)} disabled={saving || uploading} aria-label="Close editor" className="rounded-full p-2 hover:bg-cream"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <label className="block text-sm text-muted-foreground">Location name
                <input className="field mt-1" maxLength={120} autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Riyadh" />
              </label>
              <div className="flex items-center justify-between rounded-2xl bg-cream p-4">
                <span><span className="block font-medium">Featured location</span><span className="text-sm text-muted-foreground">Mark this location for featured displays.</span></span>
                <Switch checked={draft.featured} onCheckedChange={(featured) => setDraft({ ...draft, featured })} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Location image</p>
              {draft.image ? (
                <div className="relative aspect-[16/8] overflow-hidden rounded-2xl bg-cream">
                  <img src={draft.image} alt={draft.name || "Location preview"} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setDraft({ ...draft, image: null })} aria-label="Remove location image" className="absolute right-3 top-3 rounded-full bg-background p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="flex aspect-[16/8] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-cream text-muted-foreground hover:bg-muted">
                  <ImagePlus className="h-8 w-8" /><span className="text-sm">Upload location image</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} />
                </label>
              )}
              {draft.image && <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />Replace image<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} /></label>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDraft(null)} disabled={saving || uploading} className="rounded-full bg-cream px-5 py-3">Cancel</button>
            <button type="button" onClick={() => void saveLocation()} disabled={saving || uploading} className="rounded-full bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save location"}</button>
          </div>
        </Panel>
      )}

      {loading ? <Panel>Loading locations…</Panel> : locations.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 py-12 text-center"><MapPin className="h-8 w-8 text-primary" /><p>No locations yet. Add a location to manage it here.</p></Panel>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <Panel key={location.id} className="!p-3">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-cream">
                {location.image ? <img src={location.image} alt={location.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}
                {location.featured && <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary"><Star className="h-4 w-4 fill-current" /></span>}
              </div>
              <div className="flex items-center gap-2 p-3"><MapPin className="h-4 w-4 text-primary" /><h2 className="flex-1 truncate font-medium">{location.name}</h2>
                <button type="button" onClick={() => setDraft(location)} aria-label={`Edit ${location.name}`} className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"><Pencil className="h-4 w-4" /></button>
                {can.delete && <button type="button" onClick={() => void deleteLocation(location)} aria-label={`Delete ${location.name}`} className="rounded-full bg-cream p-2.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </main>
  );
}
