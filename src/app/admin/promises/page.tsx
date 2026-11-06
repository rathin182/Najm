"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { Field, RowTools, SectionHeading, move } from "@/components/admin/EditorParts";
import { DEFAULT_WHY_NAJM, WHY_NAJM_ICON_KEYS, WHY_NAJM_LIMITS, type WhyNajmPillar, type WhyNajmSettingsData } from "@/lib/why-najm";
import { WHY_NAJM_ICONS } from "@/lib/why-najm-icons";
type PromisesForm = Pick<WhyNajmSettingsData, "pillarsTitle" | "pillarsAccent" | "pillars">;

const DEFAULTS: PromisesForm = {
  pillarsTitle: DEFAULT_WHY_NAJM.pillarsTitle,
  pillarsAccent: DEFAULT_WHY_NAJM.pillarsAccent,
  pillars: DEFAULT_WHY_NAJM.pillars,
};

function PromisesEditor() {
  const { can } = useAdmin();
  const [form, setForm] = useState<PromisesForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pick = (d: WhyNajmSettingsData): PromisesForm => ({ pillarsTitle: d.pillarsTitle, pillarsAccent: d.pillarsAccent, pillars: d.pillars });

  useEffect(() => {
    fetch("/api/admin/why-najm", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Unable to load promises."))))
      .then((d: WhyNajmSettingsData) => setForm(pick(d)))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Unable to load promises."))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof PromisesForm>(k: K, v: PromisesForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const patchPillar = (i: number, p: Partial<WhyNajmPillar>) => set("pillars", form.pillars.map((item, idx) => (idx === i ? { ...item, ...p } : item)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Only the promise fields are sent, so this page never overwrites what the Why Najm page manages.
      const res = await fetch("/api/admin/why-najm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not save.");
      setForm(pick(body as WhyNajmSettingsData));
      toast.success("Promises updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const card = "grid gap-3 rounded-2xl bg-cream/60 p-4";
  const inner = "field !bg-background";

  return (
    <div>
      <PageHeader
        title="Promises"
        sub="Edit the promise cards shown in the “Why Najm” section on the homepage."
        action={<a href="/#why-najm" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-background px-5 py-3"><ExternalLink className="h-4 w-4" />View homepage</a>}
      />
      <form onSubmit={save} className="grid gap-6">
        <Panel className="grid gap-4">
          <SectionHeading
            title="Promises"
            where="Cream section with the icon cards, including its own title."
            action={form.pillars.length < WHY_NAJM_LIMITS.pillars && (
              <button type="button" onClick={() => set("pillars", [{ icon: "BadgeCheck", title: "", description: "" }, ...form.pillars])} className="flex items-center gap-1 rounded-full bg-cream px-4 py-2 text-sm"><Plus className="h-4 w-4" />Add promise</button>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Section title"><input className="field" value={form.pillarsTitle} onChange={(e) => set("pillarsTitle", e.target.value)} placeholder="Six promises behind every deal" maxLength={120} /></Field>
            <Field label="Highlighted word" hint="Must appear in the title exactly."><input className="field" value={form.pillarsAccent} onChange={(e) => set("pillarsAccent", e.target.value)} placeholder="promises" maxLength={60} /></Field>
          </div>
          {form.pillars.length === 0 && <p className="text-sm text-muted-foreground">No promises — this whole block will be hidden on the homepage.</p>}
          {form.pillars.map((p, i) => (
            <div key={i} className={card}>
              <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
                {/* <Field label="Icon">
                  <select className={inner} value={p.icon} onChange={(e) => patchPillar(i, { icon: e.target.value as WhyNajmPillar["icon"] })}>
                    {WHY_NAJM_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field> */}
                <Field label="Icon">
                  <div className="flex items-center gap-2">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {(() => { const Icon = WHY_NAJM_ICONS[p.icon] ?? WHY_NAJM_ICONS.BadgeCheck; return <Icon className="h-5 w-5" />; })()}
                    </span>
                    <select className={inner} value={p.icon} onChange={(e) => patchPillar(i, { icon: e.target.value as WhyNajmPillar["icon"] })}>
                      {WHY_NAJM_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Title"><input className={inner} required value={p.title} onChange={(e) => patchPillar(i, { title: e.target.value })} maxLength={80} /></Field>
                <RowTools i={i} count={form.pillars.length} onMove={(d) => set("pillars", move(form.pillars, i, d))} onRemove={() => set("pillars", form.pillars.filter((_, idx) => idx !== i))} />
              </div>
              <Field label="Description"><textarea className={`${inner} min-h-20`} value={p.description} onChange={(e) => patchPillar(i, { description: e.target.value })} maxLength={400} /></Field>
            </div>
          ))}
        </Panel>

        {can.edit && (
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving || loading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-primary-foreground disabled:opacity-60">
              <Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" disabled={saving || loading} onClick={() => { setForm(DEFAULTS); toast("Defaults loaded — press Save to apply them."); }} className="flex items-center justify-center gap-2 rounded-full bg-background px-6 py-4 disabled:opacity-60">
              <RotateCcw className="h-4 w-4" />Reset to defaults
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default PromisesEditor;