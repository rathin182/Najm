"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, GripVertical, ImagePlus, MapPin, Maximize, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { CITIES, TYPES, formatSAR, propertyDetails, type Property } from "@/data/properties";
import { newId, useAdmin, type AdminProperty, type Pair, type PropertyExtra } from "@/lib/admin-store";

export function blankProperty(): AdminProperty {
  return {
    id: newId(), title: "", city: "Riyadh", district: "", type: "Villa", price: 0, area: 0, beds: 0, baths: 0,
    short: "", description: "", images: [], status: "Ready", year: new Date().getFullYear(), amenities: [], views: 0, published: true,
  };
}

function extraFor(p: AdminProperty): PropertyExtra {
  if (p.details) return p.details;
  const d = propertyDetails(p);
  const empty = !p.title;
  return {
    plot: empty ? 0 : d.plot, floors: empty ? "" : d.floors, parking: empty ? 0 : d.parking, furnishing: empty ? "Unfurnished" : d.furnishing,
    facing: empty ? "North" : d.facing, developer: empty ? "" : d.developer, deed: empty ? "" : d.deed, lat: d.lat, lng: d.lng,
    serviceCharge: 0, handover: "", video: "",
    rooms: (empty ? [["", ""]] : d.rooms) as Pair[], nearby: (empty ? [["", ""]] : d.nearby) as Pair[], plan: d.plan as Pair[],
    features: [], agentName: "", agentPhone: "", seoTitle: "", seoDescription: "",
  };
}

function compress(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1400 / img.width);
      const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.72)); URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

const SECTIONS = ["Photos", "Basics", "Price & size", "Description", "Specifications", "Rooms", "Amenities", "Payment plan", "Location", "Agent & SEO", "Visibility"] as const;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");

export function PropertyEditor({ initial }: { initial: AdminProperty }) {
  const { properties, saveProperty } = useAdmin();
  const router = useRouter();
  const isNew = !properties.some((p) => p.id === initial.id);
  const [p, setP] = useState<AdminProperty>(initial);
  const [x, setX] = useState<PropertyExtra>(() => extraFor(initial));
  const set = <K extends keyof AdminProperty>(k: K, v: AdminProperty[K]) => setP((c) => ({ ...c, [k]: v }));
  const setE = <K extends keyof PropertyExtra>(k: K, v: PropertyExtra[K]) => setX((c) => ({ ...c, [k]: v }));

  const save = () => {
    const missing = [!p.title.trim() && "title", !p.district.trim() && "district", p.price <= 0 && "price", p.area <= 0 && "area", p.images.length === 0 && "a photo"].filter(Boolean);
    if (missing.length) { toast.error(`Please add ${missing.join(", ")}`); return; }
    const clean = (l: Pair[]) => l.filter(([a, b]) => a.trim() || b.trim());
    saveProperty({ ...p, description: p.description || p.short, details: { ...x, rooms: clean(x.rooms), nearby: clean(x.nearby), plan: clean(x.plan) } });
    toast.success(isNew ? "Property added" : "Changes saved");
    router.push("/admin/properties");
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Link href="/admin/properties" className="flex h-11 w-11 items-center justify-center rounded-full bg-background hover:bg-cream" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="mr-auto">
          <h1 className="text-4xl font-medium tracking-tight">{isNew ? "Add property" : "Edit property"}</h1>
          <p className="text-muted-foreground">{isNew ? "Fill in every detail buyers see on the listing page." : p.title}</p>
        </div>
        <Link href="/admin/properties" className="rounded-full bg-background px-6 py-3">Cancel</Link>
        <button onClick={save} className="rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-ink">{isNew ? "Publish property" : "Save changes"}</button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[200px_1fr_340px]">
        <nav className="hidden xl:block">
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => <li key={s}><a href={`#${slug(s)}`} className="block rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground">{s}</a></li>)}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Photos" hint="Upload from your computer. The first photo is the cover; use the arrows to reorder.">
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
              {p.images.map((src, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-background px-3 py-1 text-xs">Cover</span>}
                  <div className="absolute inset-x-2 bottom-2 flex justify-between transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                    <button type="button" disabled={i === 0} onClick={() => { const a = [...p.images]; [a[i - 1], a[i]] = [a[i]!, a[i - 1]!]; set("images", a); }} className="rounded-full bg-background p-1.5 disabled:opacity-30" aria-label="Move left"><GripVertical className="h-4 w-4" /></button>
                    <button type="button" onClick={() => set("images", p.images.filter((_, j) => j !== i))} className="rounded-full bg-background p-1.5 text-destructive" aria-label="Remove photo"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-cream text-muted-foreground hover:bg-muted">
                <ImagePlus className="h-7 w-7" /><span className="text-sm">Upload photos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []); e.target.value = "";
                  try { const urls = await Promise.all(files.map(compress)); setP((c) => ({ ...c, images: [...c.images, ...urls] })); } catch { toast.error("One of the photos couldn't be read"); }
                }} />
              </label>
            </div>
          </Section>

          <Section title="Basics">
            <F label="Title" wide><input className="field" value={p.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Al Noor Signature Villa" /></F>
            <F label="Property type"><select className="field" value={p.type} onChange={(e) => set("type", e.target.value as Property["type"])}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></F>
            <F label="Status"><select className="field" value={p.status} onChange={(e) => set("status", e.target.value as Property["status"])}><option>Ready</option><option>Off-plan</option></select></F>
            <F label="City"><select className="field" value={p.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></F>
            <F label="District"><input className="field" value={p.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Al Malqa" /></F>
            <F label="Year built / completion"><input className="field" type="number" value={p.year} onChange={(e) => set("year", Number(e.target.value))} /></F>
            <F label="Developer"><input className="field" value={x.developer} onChange={(e) => setE("developer", e.target.value)} /></F>
          </Section>

          <Section title="Price & size">
            <F label="Price (SAR)"><input className="field" type="number" min={0} value={p.price || ""} onChange={(e) => set("price", Number(e.target.value))} /></F>
            <F label="Service charge (SAR / year)"><input className="field" type="number" min={0} value={x.serviceCharge || ""} onChange={(e) => setE("serviceCharge", Number(e.target.value))} /></F>
            <F label="Built-up area (m²)"><input className="field" type="number" min={0} value={p.area || ""} onChange={(e) => set("area", Number(e.target.value))} /></F>
            <F label="Plot size (m²)"><input className="field" type="number" min={0} value={x.plot || ""} onChange={(e) => setE("plot", Number(e.target.value))} /></F>
            <F label="Bedrooms"><input className="field" type="number" min={0} value={p.beds} onChange={(e) => set("beds", Number(e.target.value))} /></F>
            <F label="Bathrooms"><input className="field" type="number" min={0} value={p.baths} onChange={(e) => set("baths", Number(e.target.value))} /></F>
            <F label="Rental yield % (makes it an Investment Vault listing)"><input className="field" type="number" step="0.1" min={0} value={p.investment?.yield ?? ""} onChange={(e) => set("investment", e.target.value ? { yield: Number(e.target.value), label: p.investment?.label ?? "Investment ready" } : undefined)} /></F>
            <F label="Price per m²"><div className="field text-muted-foreground">{p.price && p.area ? formatSAR(Math.round(p.price / p.area)) : "Calculated automatically"}</div></F>
          </Section>

          <Section title="Description">
            <F label="Short description (shown on cards)" wide><input className="field" maxLength={140} value={p.short} onChange={(e) => set("short", e.target.value)} /></F>
            <F label="Full description" wide><textarea className="field resize-none rounded-[1.5rem]" rows={7} value={p.description} onChange={(e) => set("description", e.target.value)} /></F>
            <F label="Video tour link (optional)" wide><input className="field" value={x.video} onChange={(e) => setE("video", e.target.value)} placeholder="https://youtube.com/…" /></F>
          </Section>

          <Section title="Specifications">
            <F label="Floors / level"><input className="field" value={x.floors} onChange={(e) => setE("floors", e.target.value)} placeholder="e.g. 2 levels or Floor 21" /></F>
            <F label="Parking spaces"><input className="field" type="number" min={0} value={x.parking} onChange={(e) => setE("parking", Number(e.target.value))} /></F>
            <F label="Furnishing"><select className="field" value={x.furnishing} onChange={(e) => setE("furnishing", e.target.value)}>{["Unfurnished", "Semi furnished", "Fully furnished"].map((o) => <option key={o}>{o}</option>)}</select></F>
            <F label="Facing"><select className="field" value={x.facing} onChange={(e) => setE("facing", e.target.value)}>{["North", "North-east", "East", "South-east", "South", "South-west", "West", "North-west"].map((o) => <option key={o}>{o}</option>)}</select></F>
            <F label="Title deed number"><input className="field" value={x.deed} onChange={(e) => setE("deed", e.target.value)} /></F>
            <F label="Handover date (off-plan)"><input className="field" type="month" value={x.handover} onChange={(e) => setE("handover", e.target.value)} /></F>
          </Section>

          <Section title="Rooms" hint="Room-by-room layout shown on the listing page.">
            <Pairs list={x.rooms} onChange={(v) => setE("rooms", v)} a="Room" b="Size" />
          </Section>

          <Section title="Amenities" hint="Press Enter to add each one.">
            <Tags label="Amenities" list={p.amenities} onChange={(v) => set("amenities", v)} placeholder="Private pool, smart home…" />
            <Tags label="Features & finishes" list={x.features} onChange={(v) => setE("features", v)} placeholder="Italian marble, Miele kitchen…" />
          </Section>

          <Section title="Payment plan">
            <Pairs list={x.plan} onChange={(v) => setE("plan", v)} a="Milestone" b="Share" />
          </Section>

          <Section title="Location">
            <F label="Latitude"><input className="field" type="number" step="0.0001" value={x.lat} onChange={(e) => setE("lat", Number(e.target.value))} /></F>
            <F label="Longitude"><input className="field" type="number" step="0.0001" value={x.lng} onChange={(e) => setE("lng", Number(e.target.value))} /></F>
            <div className="sm:col-span-2 overflow-hidden rounded-2xl">
              <iframe title="Map preview" className="h-64 w-full" loading="lazy" src={`https://maps.google.com/maps?q=${x.lat},${x.lng}&z=14&output=embed`} />
            </div>
            <div className="sm:col-span-2"><p className="mb-2 px-1 text-sm text-muted-foreground">Nearby places</p><Pairs list={x.nearby} onChange={(v) => setE("nearby", v)} a="Place" b="Distance" /></div>
          </Section>

          <Section title="Agent & SEO">
            <F label="Listing agent"><input className="field" value={x.agentName} onChange={(e) => setE("agentName", e.target.value)} /></F>
            <F label="Agent phone"><input className="field" value={x.agentPhone} onChange={(e) => setE("agentPhone", e.target.value)} placeholder="+966" /></F>
            <F label="Search title" wide><input className="field" value={x.seoTitle} onChange={(e) => setE("seoTitle", e.target.value)} placeholder={p.title || "Shown in Google results"} /></F>
            <F label="Search description" wide><textarea className="field resize-none rounded-[1.5rem]" rows={2} value={x.seoDescription} onChange={(e) => setE("seoDescription", e.target.value)} placeholder={p.short} /></F>
          </Section>

          <Section title="Visibility">
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-5 sm:col-span-2"><span><span className="block font-medium">Live on website</span><span className="text-sm text-muted-foreground">Hidden listings stay in the admin only.</span></span><Switch checked={p.published} onCheckedChange={(v) => set("published", v)} /></label>
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-cream p-5 sm:col-span-2"><span><span className="block font-medium">Featured on home page</span><span className="text-sm text-muted-foreground">Appears in the Featured homes grid.</span></span><Switch checked={!!p.featured} onCheckedChange={(v) => set("featured", v)} /></label>
          </Section>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-[1.75rem] bg-background p-3">
            <p className="px-2 pb-3 text-sm text-muted-foreground">Card preview</p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-cream">
              {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}
              {p.featured && <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary"><Star className="h-4 w-4 fill-current" /></span>}
            </div>
            <div className="p-3">
              <p className="text-2xl font-medium tracking-tight">{p.price ? formatSAR(p.price) : "SAR —"}</p>
              <p className="mt-1 font-medium">{p.title || "Property title"}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{p.district || "District"}, {p.city}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.short || "Short description appears here."}</p>
              <div className="mt-4 flex gap-4 text-sm">
                <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4 text-primary" />{p.area || 0} m²</span>
                <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-primary" />{p.beds}</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-primary" />{p.baths}</span>
              </div>
            </div>
            <button onClick={save} className="mt-2 w-full rounded-full bg-primary py-3.5 text-primary-foreground hover:bg-ink">{isNew ? "Publish property" : "Save changes"}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={slug(title)} className="scroll-mt-24 rounded-[1.75rem] bg-background p-6 md:p-8">
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function F({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}><span className="px-1 text-sm text-muted-foreground">{label}</span>{children}</label>;
}

function Pairs({ list, onChange, a, b }: { list: Pair[]; onChange: (v: Pair[]) => void; a: string; b: string }) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      {list.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <input className="field" placeholder={a} value={k} onChange={(e) => onChange(list.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
          <input className="field !w-28 shrink-0 sm:!w-40" placeholder={b} value={v} onChange={(e) => onChange(list.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
          <button type="button" aria-label="Remove row" onClick={() => onChange(list.filter((_, j) => j !== i))} className="shrink-0 rounded-full bg-cream px-3 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, ["", ""]])} className="flex w-fit items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" />Add row</button>
    </div>
  );
}

function Tags({ label, list, onChange, placeholder }: { label: string; list: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <div className="sm:col-span-2">
      <p className="mb-2 px-1 text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2 rounded-[1.5rem] bg-cream p-2">
        {list.map((t) => (
          <span key={t} className="flex items-center gap-1.5 rounded-full bg-background py-1.5 pl-4 pr-2 text-sm">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(list.filter((x) => x !== t))}><X className="h-3.5 w-3.5" /></button></span>
        ))}
        <input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); const t = v.trim(); if (t && !list.includes(t)) onChange([...list, t]); setV(""); }
        }} className="min-w-40 flex-1 bg-transparent px-3 py-1.5 text-sm outline-none" />
      </div>
    </div>
  );
}
