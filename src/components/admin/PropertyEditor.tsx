"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, Building2, CheckCircle2, GripVertical, Home, ImagePlus, MapPin, Maximize, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { CITIES, formatSAR, propertyDetails, type Property } from "@/data/properties";
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

const SECTIONS = ["Photos", "Basics", "Price & size", "Description", "Specifications", "Rooms", "Amenities", "Payment plan", "Location", "Agent & SEO", "Visibility"] as const;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");
const CATEGORY_TYPES = {
  Commercial: ["Office", "Shop", "Showroom", "Warehouse", "Industrial Building", "Business Center", "Commercial Land", "Restaurant / Cafe", "Co-working Space"],
  Residential: ["Apartment / Flat", "Villa", "Independent House", "Penthouse", "Duplex", "Studio Apartment", "Residential Plot", "Townhouse", "Farmhouse"],
} as const;

export function PropertyEditor({ initial }: { initial: AdminProperty }) {
  const { properties, saveProperty } = useAdmin();
  const router = useRouter();
  const [loadedFromApi, setLoadedFromApi] = useState(false);
  const isNew = !properties.some((p) => p.id === initial.id) && !loadedFromApi;
  const [p, setP] = useState<AdminProperty>(initial);
  const [category, setCategory] = useState<keyof typeof CATEGORY_TYPES>(p.type === "Commercial" ? "Commercial" : "Residential");
  const [x, setX] = useState<PropertyExtra>(() => extraFor(initial));
  const [busy, setBusy] = useState(false);
  const [bathrooms, setBathrooms] = useState<Pair[]>(() => (initial.details as (PropertyExtra & { bathrooms?: Pair[] }) | undefined)?.bathrooms ?? Array.from({ length: initial.baths || 0 }, () => ["Bathroom", ""] as Pair));
  useEffect(() => {
    if (properties.some((property) => property.id === initial.id) || !initial.title) return;
    let cancelled = false;
    fetch("/api/admin/listings", { credentials: "include" }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load listing details.");
      return response.json() as Promise<AdminProperty[]>;
    }).then((listings) => {
      const listing = listings.find((item) => item.id === initial.id);
      if (!cancelled && listing) { setP(listing); setX(extraFor(listing)); setBathrooms((listing.details as (PropertyExtra & { bathrooms?: Pair[] }) | undefined)?.bathrooms ?? []); setLoadedFromApi(true); }
    }).catch(() => toast.error("Could not load the saved property."));
    return () => { cancelled = true; };
  }, [initial.id, initial.title, properties]);
  const set = <K extends keyof AdminProperty>(k: K, v: AdminProperty[K]) => setP((c) => ({ ...c, [k]: v }));
  const setE = <K extends keyof PropertyExtra>(k: K, v: PropertyExtra[K]) => setX((c) => ({ ...c, [k]: v }));

  const save = async () => {
    const missing = [!p.title.trim() && "title", !p.district.trim() && "district", p.price <= 0 && "price", p.area <= 0 && "area", p.images.length === 0 && "a photo"].filter(Boolean);
    if (missing.length) { toast.error(`Please add ${missing.join(", ")}`); return; }
    const clean = (l: Pair[]) => l.filter(([a, b]) => a.trim() || b.trim());
    setBusy(true);
    try {
      const property = { ...p, description: p.description || p.short, details: { ...x, rooms: clean(x.rooms), nearby: clean(x.nearby), plan: clean(x.plan), bathrooms: clean(bathrooms) } };
      const response = await fetch("/api/admin/listings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(property) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save property.");
      saveProperty(result as AdminProperty);
      toast.success(isNew ? "Property added" : "Changes saved");
      router.push("/admin/properties");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save property."); }
    finally { setBusy(false); }
  };

  const uploadFiles = async (files: File[], expectedKind: "image" | "video") => {
    setBusy(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const form = new FormData(); form.set("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", credentials: "include", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? `Could not upload ${file.name}.`);
        if (result.kind !== expectedKind || typeof result.url !== "string") throw new Error(`Unexpected upload response for ${file.name}.`);
        return result.url as string;
      }));
      if (expectedKind === "image") setP((current) => ({ ...current, images: [...current.images, ...uploaded] }));
      else setE("video", uploaded[0] ?? "");
      toast.success(expectedKind === "image" ? "Photos uploaded" : "Video uploaded");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
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
        <button onClick={save} disabled={busy} className="rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-ink disabled:opacity-60">{busy ? "Saving…" : isNew ? "Publish property" : "Save changes"}</button>
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
                  await uploadFiles(files, "image");
                }} />
              </label>
            </div>
          </Section>

          <Section title="Basics">
            <F label="Title" wide><input className="field" value={p.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Al Noor Signature Villa" /></F>
            <div className="sm:col-span-2">
              <p className="mb-2 px-1 text-sm text-muted-foreground">Property Category</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["Residential", "Commercial"] as const).map((value) => {
                  const selected = category === value;
                    const CategoryIcon = value === "Residential" ? Home : Building2;
                    return <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "border-border bg-cream hover:border-primary/40"}`}>
                      <span className="mb-3 flex items-center justify-between"><CategoryIcon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />{selected && <CheckCircle2 className="h-4 w-4 text-primary" />}</span>
                      <span className="block font-medium">{value}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{value === "Residential" ? "Homes, apartments, villas and plots" : "Offices, shops and business spaces"}</span>
                  </button>;
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 px-1 text-sm text-muted-foreground">Property Type</p>
              <div className="rounded-2xl bg-cream p-4">
                <select className="w-full border-0 bg-transparent py-1 outline-none" value={CATEGORY_TYPES[category].includes(p.type as never) ? p.type : ""} onChange={(e) => set("type", e.target.value as Property["type"])}>
                  <option value="" disabled>Select property type</option>
                  {CATEGORY_TYPES[category].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="mt-3 grid grid-cols-1 gap-x-4 border-t border-border/60 pt-3 sm:grid-cols-2">
                  {CATEGORY_TYPES[category].map((t) => <button key={t} type="button" onClick={() => set("type", t as Property["type"])} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${p.type === t ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}><span className={`h-3 w-3 rounded-full ${p.type === t ? "bg-primary" : "bg-muted-foreground/50"}`} />{t}</button>)}
                </div>
              </div>
            </div>
            <F label="Status"><select className="field" value={p.status} onChange={(e) => set("status", e.target.value as Property["status"])}><option>Ready</option><option>Off-plan</option></select></F>
            <F label="City"><select className="field" value={p.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></F>
            <F label="District"><input className="field" value={p.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Al Malqa" /></F>
            <F label="Year built / completion"><input className="field" type="number" value={p.year} onChange={(e) => set("year", Number(e.target.value))} /></F>
            <F label="Developer"><input className="field" value={x.developer} onChange={(e) => setE("developer", e.target.value)} /></F>
            <F label="Property state"><select className="field" value="Sale" disabled><option value="Sale">For sale</option><option value="Buy">For buy</option></select></F>
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
            <F label="Video tour link (optional)" wide><input className="field" value={x.video.startsWith("/") ? "" : x.video} onChange={(e) => setE("video", e.target.value)} placeholder="https://youtube.com/…" /><span className="text-xs text-muted-foreground">Or upload an MP4, MOV, WebM or Ogg video (up to 100 MB).</span><input type="file" accept="video/mp4,video/quicktime,video/webm,video/ogg" disabled={busy} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await uploadFiles([file], "video"); }} /><button type="button" disabled={!x.video.startsWith("/")} onClick={() => setE("video", "")} className="w-fit text-sm text-destructive disabled:hidden">Remove uploaded video</button></F>
          </Section>

          <Section title="Specifications">
            <F label="Floors / level"><input className="field" value={x.floors} onChange={(e) => setE("floors", e.target.value)} placeholder="e.g. 2 levels or Floor 21" /></F>
            <F label="Parking spaces"><input className="field" type="number" min={0} value={x.parking} onChange={(e) => setE("parking", Number(e.target.value))} /></F>
            <F label="Furnishing"><select className="field" value={x.furnishing} onChange={(e) => setE("furnishing", e.target.value)}>{["Unfurnished", "Semi furnished", "Fully furnished"].map((o) => <option key={o}>{o}</option>)}</select></F>
            <F label="Facing"><select className="field" value={x.facing} onChange={(e) => setE("facing", e.target.value)}>{["North", "North-east", "East", "South-east", "South", "South-west", "West", "North-west"].map((o) => <option key={o}>{o}</option>)}</select></F>
            <F label="Title deed number"><input className="field" value={x.deed} onChange={(e) => setE("deed", e.target.value)} /></F>
            <F label="Handover date (off-plan)"><input className="field" type="month" value={x.handover} onChange={(e) => setE("handover", e.target.value)} /></F>
          </Section>

          <RoomsLivingSpaces list={x.rooms} onChange={(v) => setE("rooms", v)} bathrooms={bathrooms} onBathroomsChange={setBathrooms} />

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

function RoomsLivingSpaces({ list, onChange, bathrooms, onBathroomsChange }: { list: Pair[]; onChange: (v: Pair[]) => void; bathrooms: Pair[]; onBathroomsChange: (v: Pair[]) => void }) {
  const rooms = list.length ? list : [["Bedroom", ""]] as Pair[];
  const bedrooms = rooms.filter(([name]) => /bedroom/i.test(name)).length;
  const living = rooms.filter(([name]) => /living|lounge/i.test(name)).length;
  const kitchens = rooms.filter(([name]) => /kitchen/i.test(name)).length;
  const card = "rounded-xl border border-border bg-background p-3";
  const miniField = "mt-1 w-full rounded-lg bg-cream px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary";
  const addRoom = () => onChange([...rooms, ["Bedroom", ""]]);
  return <>
    <section id="rooms" className="scroll-mt-24 rounded-[1.75rem] bg-background p-5 md:p-6 sm:col-span-2">
      <div className="flex items-start justify-between"><div><h2 className="text-xl font-medium">Rooms &amp; Living Spaces</h2><p className="text-xs text-muted-foreground">Manage individual rooms and their details</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{rooms.length} Rooms</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-b border-border pb-4">
        {[[bedrooms, "Bedrooms"], [living, "Living areas"], [kitchens, "Kitchens"]].map(([n, label]) => <div key={label} className="rounded-lg bg-cream p-2"><strong className="block text-sm">{n}</strong><span className="text-xs text-muted-foreground">{label}</span></div>)}
      </div>
      <div className="mt-4 flex justify-between text-sm"><strong>Room details</strong><span className="text-xs text-muted-foreground">{rooms.length} entries</span></div>
      <div className="mt-2 space-y-2">
        {rooms.map(([name, size], i) => <div key={i} className={card}>
          <div className="mb-2 flex items-center justify-between"><strong className="text-sm">{name || `Room ${i + 1}`}</strong><button type="button" aria-label="Remove room" onClick={() => onChange(rooms.filter((_, j) => j !== i))} className="px-2 text-muted-foreground hover:text-destructive">×</button></div>
          <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Room type<input className={miniField} value={name} onChange={(e) => onChange(rooms.map((r, j) => j === i ? [e.target.value, r[1]] : r))} placeholder="e.g. Master Bedroom" /></label><label className="text-xs text-muted-foreground">Size (m²)<input className={miniField} value={size} onChange={(e) => onChange(rooms.map((r, j) => j === i ? [r[0], e.target.value] : r))} placeholder="25" /></label></div>
          {/bedroom/i.test(name) && <p className="mt-2 text-xs text-muted-foreground">Quantity: 1 <span className="ml-3">Ensuite bathroom: <select className="rounded bg-cream px-2 py-1 text-foreground"><option>No</option><option>Yes</option></select></span></p>}
        </div>)}
      </div>
      <button type="button" onClick={addRoom} className="mt-2 w-full rounded-md border-2 border-primary px-3 py-2.5 text-left text-base font-medium text-primary hover:bg-primary/5">＋ Add another room</button>
    </section>
    <section className="rounded-[1.75rem] bg-background p-5 md:p-6 sm:col-span-2">
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-medium">Bathrooms</h2><p className="text-xs text-muted-foreground">Configure bathroom details separately</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{bathrooms.length} Bathrooms</span></div>
      <div className="mt-3 space-y-2">{bathrooms.map(([type, size], i) => <div key={i} className={card}><div className="mb-2 flex justify-between text-sm font-medium"><span>Bathroom {String(i + 1).padStart(2, "0")}</span><button type="button" onClick={() => onBathroomsChange(bathrooms.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remove bathroom">×</button></div><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Bathroom type<input className={miniField} value={type} onChange={(e) => onBathroomsChange(bathrooms.map((r, j) => j === i ? [e.target.value, r[1]] : r))} placeholder="Ensuite" /></label><label className="text-xs text-muted-foreground">Area (m²)<input className={miniField} value={size} onChange={(e) => onBathroomsChange(bathrooms.map((r, j) => j === i ? [r[0], e.target.value] : r))} placeholder="8" /></label></div></div>)}</div>
      <button type="button" onClick={() => onBathroomsChange([...bathrooms, ["Common", ""]])} className="mt-2 w-full rounded-md border-2 border-primary px-3 py-2.5 text-left text-base font-medium text-primary hover:bg-primary/5">＋ Add another bathroom</button>
      <div className="mt-3 rounded-xl bg-cream p-3"><strong className="text-sm">Property room summary</strong><div className="mt-2 grid grid-cols-3 gap-2 text-center">{[[bedrooms, "Bedrooms"], [bathrooms.length, "Bathrooms"], [living, "Living areas"]].map(([n, label]) => <div key={label} className="rounded-lg bg-background p-2"><strong className="block text-sm">{n}</strong><span className="text-xs text-muted-foreground">{label}</span></div>)}</div></div>
    </section>
  </>;
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
