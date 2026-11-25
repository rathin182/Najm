"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { BadgeCheck, ImagePlus, Pencil, Plus, Trash2, Upload, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { SavingOverlay } from "@/components/admin/EditorParts";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/lib/admin-store";

type Agent = {
  id: string; name: string; role: string; age: number; experienceYears: number; review: number | null; verified: boolean;
  phone: string; whatsapp: string | null; email: string; address: string; description: string | null; image: string | null;
};
type Draft = Omit<Agent, "id"> & { id?: string };
const blank = (): Draft => ({ name: "", role: "Property Advisor", age: 18, experienceYears: 0, review: null, verified: false, phone: "", whatsapp: null, email: "", address: "", description: null, image: null });

async function readResponse<T>(response: Response, message: string): Promise<T> {
  const text = await response.text();
  let body: (T & { error?: string }) | null = null;
  try { body = text ? JSON.parse(text) as T & { error?: string } : null; } catch { /* Show a clear fallback for non-JSON errors. */ }
  if (!response.ok) throw new Error(body?.error ?? `${message} (HTTP ${response.status}).`);
  if (body === null) throw new Error(`${message} The server returned an empty or invalid response.`);
  return body;
}

export default function AgentsAdminPage() {
  const { can } = useAdmin();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/agents", { cache: "no-store", credentials: "include" })
      .then((response) => readResponse<Agent[]>(response, "Could not load agents."))
      .then((data) => { if (active) setAgents(data); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load agents."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", credentials: "include", body: form });
      const result = await readResponse<{ url?: string; kind?: string }>(response, "Could not upload this image.");
      if (result.kind !== "image" || !result.url) throw new Error("Could not upload this image.");
      setDraft((current) => current ? { ...current, image: result.url! } : current);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not upload this image."); }
    finally { setUploading(false); }
  }

  async function save() {
    if (!draft || !draft.name.trim() || !draft.phone.trim() || !draft.email.trim() || !draft.address.trim()) {
      toast.error("Enter the agent’s name, phone, email and address."); return;
    }
    setSaving(true);
    const payload = { ...draft, name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim(), address: draft.address.trim(), whatsapp: draft.whatsapp?.trim() || null, description: draft.description?.trim() || null, review: draft.review ?? null, image: draft.image || null };
    try {
      const response = await fetch("/api/admin/agents", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await readResponse<Agent>(response, "Could not save this agent.");
      setAgents((current) => [...current.filter((agent) => agent.id !== result.id), result].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(null); toast.success(draft.id ? "Agent updated" : "Agent added");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save this agent."); }
    finally { setSaving(false); }
  }

  async function remove(agent: Agent) {
    if (!confirm(`Delete agent “${agent.name}”?`)) return;
    try {
      const response = await fetch(`/api/admin/agents?id=${encodeURIComponent(agent.id)}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) await readResponse<never>(response, "Could not delete this agent.");
      setAgents((current) => current.filter((item) => item.id !== agent.id)); toast.success("Agent deleted");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete this agent."); }
  }

  if (!can.edit) return <p className="p-8 text-muted-foreground">You do not have permission to manage agents.</p>;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader title="Agents" sub="Manage agent profiles and contact details." action={<button type="button" onClick={() => setDraft(blank())} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground"><Plus className="h-4 w-4" />Add agent</button>} />
      {draft && <Panel className="relative space-y-5">
        {(saving || uploading) && <SavingOverlay label={uploading ? "Uploading agent photo…" : "Saving agent…"} />}
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-medium">{draft.id ? "Edit agent" : "Add agent"}</h2><p className="mt-1 text-sm text-muted-foreground">WhatsApp, description, review and photo are optional.</p></div><button type="button" onClick={() => setDraft(null)} disabled={saving || uploading} aria-label="Close editor" className="rounded-full p-2 hover:bg-cream"><X className="h-5 w-5" /></button></div>
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-muted-foreground">Agent name<input className="field mt-1" maxLength={120} autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label className="block text-sm text-muted-foreground">Role<input className="field mt-1" maxLength={120} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Property Advisor" /></label>
            <label className="block text-sm text-muted-foreground">Email<input className="field mt-1" type="email" maxLength={254} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label className="block text-sm text-muted-foreground">Phone number<input className="field mt-1" type="tel" maxLength={40} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label className="block text-sm text-muted-foreground">WhatsApp number (optional)<input className="field mt-1" type="tel" maxLength={40} value={draft.whatsapp ?? ""} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value || null })} /></label>
            <label className="block text-sm text-muted-foreground">Address<input className="field mt-1" maxLength={300} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
            <label className="block text-sm text-muted-foreground">Description (optional)<textarea className="field mt-1 resize-none rounded-2xl" rows={2} maxLength={1000} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value || null })} /></label>
            <label className="block text-sm text-muted-foreground">Age<input className="field mt-1" type="number" min={18} max={100} step={1} value={draft.age} onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })} /></label>
            <label className="block text-sm text-muted-foreground">Years of experience<input className="field mt-1" type="number" min={0} max={80} step={1} value={draft.experienceYears} onChange={(e) => setDraft({ ...draft, experienceYears: Number(e.target.value) })} /></label>
            <label className="block text-sm text-muted-foreground">Review rating (optional, 0–5)<input className="field mt-1" type="number" min={0} max={5} step={0.1} value={draft.review ?? ""} onChange={(e) => setDraft({ ...draft, review: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 4.8" /></label>
            <div className="flex items-center justify-between rounded-2xl bg-cream p-4"><span><span className="block font-medium">Verified agent</span><span className="text-sm text-muted-foreground">Defaults to not verified.</span></span><Switch checked={draft.verified} onCheckedChange={(verified) => setDraft({ ...draft, verified })} /></div>
          </div>
          <div><p className="mb-2 text-sm text-muted-foreground">Agent photo (optional)</p>{draft.image ? <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream"><img src={draft.image} alt={draft.name || "Agent preview"} className="h-full w-full object-cover" /><button type="button" onClick={() => setDraft({ ...draft, image: null })} aria-label="Remove photo" className="absolute right-3 top-3 rounded-full bg-background p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div> : <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-cream text-muted-foreground hover:bg-muted"><ImagePlus className="h-8 w-8" /><span className="text-sm">Upload agent photo</span><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} /></label>}{draft.image && <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />Replace photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} /></label>}</div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" onClick={() => setDraft(null)} disabled={saving || uploading} className="rounded-full bg-cream px-5 py-3">Cancel</button><button type="button" onClick={() => void save()} disabled={saving || uploading} className="rounded-full bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save agent"}</button></div>
      </Panel>}
      {loading ? <Panel>Loading agents…</Panel> : agents.length === 0 ? <Panel className="flex flex-col items-center gap-3 py-12 text-center"><UserRound className="h-8 w-8 text-primary" /><p>No agents yet. Add an agent profile to get started.</p></Panel> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => <Panel key={agent.id} className="!p-3"><div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-cream">{agent.image ? <img src={agent.image} alt={agent.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><UserRound className="h-10 w-10" /></div>}{agent.verified && <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary" title="Verified"><BadgeCheck className="h-5 w-5" /></span>}</div><div className="flex items-center gap-2 p-3"><h2 className="flex-1 truncate font-medium">{agent.name}</h2><button type="button" onClick={() => setDraft(agent)} aria-label={`Edit ${agent.name}`} className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"><Pencil className="h-4 w-4" /></button>{can.delete && <button type="button" onClick={() => void remove(agent)} aria-label={`Delete ${agent.name}`} className="rounded-full bg-cream p-2.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>}</div><div className="space-y-1 px-3 pb-3 text-sm text-muted-foreground"><p className="font-medium text-foreground">{agent.role}</p><p>{agent.age} years old · {agent.experienceYears} years experience</p><p>{agent.phone} · {agent.email}</p>{agent.review != null && <p>Review: {agent.review.toFixed(1)} / 5</p>}{agent.description && <p className="line-clamp-2">{agent.description}</p>}</div></Panel>)}</div>}
    </main>
  );
}
