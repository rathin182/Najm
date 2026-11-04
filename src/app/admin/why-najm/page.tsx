"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { Field, RowTools, SectionHeading, move } from "@/components/admin/EditorParts";
import {
  DEFAULT_WHY_NAJM, WHY_NAJM_LIMITS,
  type WhyNajmSettingsData, type WhyNajmStat,
} from "@/lib/why-najm";

/** Promises are edited on their own page, so they are never sent from here. */
function withoutPromises({ pillarsTitle: _t, pillarsAccent: _a, pillars: _p, ...rest }: WhyNajmSettingsData) {
  return rest;
}

function WhyNajmEditor() {
  const { can } = useAdmin();
  const [form, setForm] = useState<WhyNajmSettingsData>(DEFAULT_WHY_NAJM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/why-najm", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Unable to load settings."))))
      .then((d: WhyNajmSettingsData) => setForm(d))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Unable to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof WhyNajmSettingsData>(k: K, v: WhyNajmSettingsData[K]) => setForm((f) => ({ ...f, [k]: v }));
  const patch = <T,>(list: T[], i: number, p: Partial<T>) => list.map((item, idx) => (idx === i ? { ...item, ...p } : item));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/why-najm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withoutPromises(form)),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not save.");
      setForm(body as WhyNajmSettingsData);
      toast.success("Why Najm updated");
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
        title="Why Najm"
        sub="Edit the “Why Najm” section on the homepage: intro and stats. Promises are edited under Promises."
        action={<a href="/#why-najm" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-background px-5 py-3"><ExternalLink className="h-4 w-4" />View homepage</a>}
      />
      <form onSubmit={save} className="grid gap-6">
        <Panel className="grid gap-4">
          <SectionHeading step={1} title="Intro" where="Green banner at the top, right under the “Why Najm?” heading." />
          <Field label="Intro paragraph"><textarea className="field min-h-28" value={form.intro} onChange={(e) => set("intro", e.target.value)} maxLength={600} /></Field>
        </Panel>

        <Panel className="grid gap-4">
          <SectionHeading
            step={2}
            title="Stats"
            where="Green banner, the row of big numbers below the intro."
            action={form.stats.length < WHY_NAJM_LIMITS.stats && (
              <button type="button" onClick={() => set("stats", [...form.stats, { value: "", label: "" }])} className="flex items-center gap-1 rounded-full bg-cream px-4 py-2 text-sm"><Plus className="h-4 w-4" />Add stat</button>
            )}
          />
          {form.stats.length === 0 && <p className="text-sm text-muted-foreground">No stats — the stats row will be hidden.</p>}
          {form.stats.map((st: WhyNajmStat, i) => (
            <div key={i} className={`${card} sm:grid-cols-[1fr_2fr_auto] sm:items-end`}>
              <Field label="Number"><input className={inner} required value={st.value} onChange={(e) => set("stats", patch(form.stats, i, { value: e.target.value }))} placeholder="18+" maxLength={24} /></Field>
              <Field label="Label"><input className={inner} required value={st.label} onChange={(e) => set("stats", patch(form.stats, i, { label: e.target.value }))} placeholder="Years of local expertise" maxLength={80} /></Field>
              <RowTools i={i} count={form.stats.length} onMove={(d) => set("stats", move(form.stats, i, d))} onRemove={() => set("stats", form.stats.filter((_, idx) => idx !== i))} />
            </div>
          ))}
        </Panel>

        {can.edit && (
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving || loading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-primary-foreground disabled:opacity-60">
              <Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" disabled={saving || loading} onClick={() => { setForm(DEFAULT_WHY_NAJM); toast("Defaults loaded — press Save to apply them."); }} className="flex items-center justify-center gap-2 rounded-full bg-background px-6 py-4 disabled:opacity-60">
              <RotateCcw className="h-4 w-4" />Reset to defaults
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default WhyNajmEditor;