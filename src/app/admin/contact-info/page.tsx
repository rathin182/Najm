"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { DEFAULT_CONTACT_SETTINGS, getMapUrl, type ContactSettingsData } from "@/lib/contact-settings";
import { COUNTRIES, flagEmoji, joinPhone, splitPhone } from "@/lib/country-codes";
type Form = Omit<ContactSettingsData, "mapLatitude" | "mapLongitude"> & { mapLatitude: string; mapLongitude: string; phoneCountry: string; phoneNumber: string; };
const toForm = (s: ContactSettingsData): Form => ({
  ...s,
  ...splitPhone(s.phone),
  mapLatitude: s.mapLatitude?.toString() ?? "",
  mapLongitude: s.mapLongitude?.toString() ?? "",
});
const toData = (f: Form): ContactSettingsData => {
  const { phoneCountry, phoneNumber, ...rest } = f;
  return {
    ...rest,
    phone: joinPhone(phoneCountry, phoneNumber),
    mapLatitude: f.mapLatitude.trim() === "" ? null : Number(f.mapLatitude),
    mapLongitude: f.mapLongitude.trim() === "" ? null : Number(f.mapLongitude),
  };
};
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
function ContactInfoEditor() {
  const { can } = useAdmin();
  const [form, setForm] = useState<Form>(toForm(DEFAULT_CONTACT_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/admin/contact-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Unable to load settings."))))
      .then((d: ContactSettingsData) => setForm(toForm(d)))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Unable to load settings."))
      .finally(() => setLoading(false));
  }, []);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setOffice = (i: number, k: "city" | "address", v: string) =>
    setForm((f) => ({ ...f, offices: f.offices.map((o, idx) => (idx === i ? { ...o, [k]: v } : o)) }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contact-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toData(form)),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not save.");
      setForm(toForm(body as ContactSettingsData));
      toast.success("Contact info updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const preview = getMapUrl(toData(form));

  return (
    <div>
      <PageHeader
        title="Contact info"
        sub="Edit the call, email, hours, office cards and map shown on the public Contact page."
        action={<a href="/contact" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-background px-5 py-3"><ExternalLink className="h-4 w-4" />View page</a>}
      />
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-6">
          <Panel className="grid gap-4">
            <h2 className="text-xl font-medium">Contact details</h2>
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Call (phone)</span>
              <div className="grid grid-cols-[minmax(0,13rem)_1fr] gap-2">
                <div className="relative">
                  <select
                    aria-label="Country code"
                    className="field truncate !pr-10"
                    value={form.phoneCountry}
                    onChange={(e) => set("phoneCountry", e.target.value)}
                  >
                    {form.phoneCountry === "" && <option value="">No code</option>}
                    {COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {flagEmoji(c.iso)} {c.name} ({c.dial})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  aria-label="Phone number"
                  className="field"
                  value={form.phoneNumber}
                  onChange={(e) => set("phoneNumber", e.target.value.replace(/[^\d\s\-()+]/g, ""))}
                  placeholder="11 000 0000"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {joinPhone(form.phoneCountry, form.phoneNumber)
                  ? `Shown on the site as ${joinPhone(form.phoneCountry, form.phoneNumber)}`
                  : "Enter the number without the country code."}
              </span>
            </div>
            <Field label="Email"><input type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@najmestate.sa" /></Field>
            <Field label="Hours"><input className="field" value={form.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
          </Panel>

          <Panel className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Office cards</h2>
              {form.offices.length < 6 && (
                <button type="button" onClick={() => set("offices", [{ city: "", address: "" }, ...form.offices])} className="flex items-center gap-1 rounded-full bg-cream px-4 py-2 text-sm"><Plus className="h-4 w-4" />Add office</button>
              )}
            </div>
            {form.offices.length === 0 && <p className="text-sm text-muted-foreground">No offices — the cards will be hidden.</p>}
            {form.offices.map((o, i) => (
              <div key={i} className="grid gap-3 rounded-2xl bg-cream/60 p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                <Field label="City"><input className="field !bg-background" value={o.city} onChange={(e) => setOffice(i, "city", e.target.value)} placeholder="Riyadh (HQ)" /></Field>
                <Field label="Address"><input className="field !bg-background" value={o.address} onChange={(e) => setOffice(i, "address", e.target.value)} placeholder="King Fahd Rd, Al Olaya" /></Field>
                <button type="button" aria-label="Remove office" onClick={() => set("offices", form.offices.filter((_, idx) => idx !== i))} className="rounded-full p-3 text-destructive hover:bg-background"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel className="grid gap-4">
            <h2 className="text-xl font-medium">Map</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitude" hint="e.g. 24.694"><input className="field" inputMode="decimal" value={form.mapLatitude} onChange={(e) => set("mapLatitude", e.target.value)} /></Field>
              <Field label="Longitude" hint="e.g. 46.685"><input className="field" inputMode="decimal" value={form.mapLongitude} onChange={(e) => set("mapLongitude", e.target.value)} /></Field>
            </div>
            <Field label="Or address / place name" hint="Used only when latitude and longitude are empty."><input className="field" value={form.mapAddress} onChange={(e) => set("mapAddress", e.target.value)} placeholder="King Fahd Rd, Al Olaya, Riyadh" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Zoom (1–21)"><input type="number" min={1} max={21} className="field" value={form.mapZoom} onChange={(e) => set("mapZoom", Number(e.target.value) || 13)} /></Field>
              <Field label="Map title (accessibility)"><input className="field" value={form.mapTitle} onChange={(e) => set("mapTitle", e.target.value)} /></Field>
            </div>
            <div className="h-64 overflow-hidden rounded-2xl bg-cream">
              {preview ? <iframe key={preview} title="Map preview" src={preview} loading="lazy" className="h-full w-full border-0" /> : <p className="p-6 text-sm text-muted-foreground">Enter coordinates or an address to preview the map. With neither, the map is hidden.</p>}
            </div>
          </Panel>

          {can.edit && (
            <button type="submit" disabled={saving || loading} className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-primary-foreground disabled:opacity-60">
              <Save className="h-4 w-4" />{saving ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ContactInfoEditor;