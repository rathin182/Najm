"use client";

import { useEffect, useRef, useState } from "react";
import type { Property } from "@/data/properties";
import { ArrowLeft, BadgeCheck, Bath, BedDouble, Building2, Calendar, Car, Compass, Download, FileCheck2, Home, Layers, Mail, MapPin, Maximize, MessageCircle, Phone, Sofa, Star, Trees } from "lucide-react";
import { formatSAR, propertyDetails } from "@/data/properties";
import { buildBrochureHtml } from "@/lib/brochure-template";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PropertyCard } from "@/components/site/PropertyCard";
import { PropertyCardLink } from "@/components/site/PropertyCardLink";
import { useLiquidGlass, useReveal } from "@/components/site/motion";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { normalizeAmenity } from "@/lib/property-amenities";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DEFAULT_AGENT = { name: "Lama Al-Qahtani", phone: "+966110000000" };

/** WhatsApp-style avatar colour, stable per name. */
const avatarColor = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return `hsl(${h} 45% 42%)`;
};

/** Shows the assigned agent profile, with legacy listing details as a compatibility fallback. */
function AgentCard({ p, onSubmitEnquiry, onRequestCallback }: { p: Property; onSubmitEnquiry: () => void; onRequestCallback: () => void }) {
  const details = (p as { details?: { agentName?: string; agentPhone?: string } }).details;
  const agent = p.assignedAgent;
  const name = agent?.name || details?.agentName?.trim() || DEFAULT_AGENT.name;
  const phone = agent?.phone || details?.agentPhone?.trim() || (details?.agentName?.trim() ? "" : DEFAULT_AGENT.phone);
  const initial = ([...name][0] ?? "?").toUpperCase();
  return (
    <section className="mt-4 rounded-[2rem] border border-border/70 bg-background p-5 shadow-soft" aria-label="Listing agent">
      <div className="flex items-center gap-4">
        {agent?.image ? <img src={agent.image} alt={name} className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full text-2xl font-medium text-white" style={{ backgroundColor: avatarColor(name) }}>{initial}</span>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold underline decoration-foreground/30 underline-offset-2">{name}</h2>
          <p className="text-sm text-muted-foreground">{agent?.role || "Listing agent"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {agent?.review != null && <span className="inline-flex items-center gap-1 font-medium text-foreground"><Star className="h-4 w-4 fill-current text-amber-500" />{agent.review.toFixed(1)}</span>}
            <span className={`inline-flex items-center gap-1 ${agent?.verified ? "text-primary" : "text-muted-foreground"}`}>
              {agent?.verified && <BadgeCheck className="h-4 w-4" />}{agent?.verified ? "Verified agent" : "Not verified"}
            </span>
          </div>
        </div>
      </div>
      {agent?.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{agent.description}</p>}
      <div className={`mt-4 grid gap-2 ${agent?.whatsapp ? "grid-cols-3" : "grid-cols-2"}`}>
        {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-2 text-sm font-medium hover:bg-cream"><Phone className="h-4 w-4" />Call</a>}
        {agent?.whatsapp && <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-2 text-sm font-medium hover:bg-cream"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
        {agent?.email && <a href={`mailto:${agent.email}`} aria-label="Email agent" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-2 text-sm font-medium hover:bg-cream"><Mail className="h-4 w-4" /><span>Email</span></a>}
      </div>
      <div className="mt-4 grid gap-3">
        {/* {phone && <button type="button" onClick={onRequestCallback} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-ink-foreground hover:bg-primary"><Phone className="h-4 w-4" />Request a callback</button>} */}
        <button type="button" onClick={onSubmitEnquiry} className="min-h-12 rounded-md border border-border px-4 text-sm font-medium hover:bg-cream">Submit enquiry</button>
      </div>
    </section>
  );
}

export default function PropertyDetailClient({ initialProperty }: { initialProperty: Property }) {  const p = initialProperty.images.length > 0 ? initialProperty : { ...initialProperty, images: ["/images/hero.jpg"] };
  const d = propertyDetails(p);
  const savedFeatures = (p as Property & { details?: { features?: unknown } }).details?.features;
  const featureGroups = Array.isArray(savedFeatures)
    ? savedFeatures.filter((group): group is { heading: string; items: { label: string; value: string }[] } =>
        Boolean(
          group &&
          typeof group === "object" &&
          "heading" in group &&
          typeof group.heading === "string" &&
          "items" in group &&
          Array.isArray(group.items),
        ),
      ).map((group) => ({
        heading: group.heading,
        items: group.items.filter((item): item is { label: string; value: string } =>
          Boolean(
            item &&
            typeof item === "object" &&
            "label" in item &&
            typeof item.label === "string" &&
            "value" in item &&
            typeof item.value === "string" &&
            (item.label.trim() || item.value.trim()),
          ),
        ),
      })).filter((group) => group.heading.trim() && group.items.length > 0)
    : [];
  const inv = (p as { details?: { annualRent?: number; priceGrowth5yr?: number; serviceCharge?: number } }).details;
  const savedRent = inv?.annualRent;
  const annualRent = savedRent && savedRent > 0 ? savedRent : Math.round(p.price * ((p.investment?.yield ?? 0) / 100));
  const [active, setActive] = useState(0);
  const thumbnailStrip = useRef<HTMLDivElement>(null);
  const previousActive = useRef(0);
  const [related, setRelated] = useState<Property[]>([]);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMode, setEnquiryMode] = useState<"enquiry" | "callback">("enquiry");
  const countedSlug = useRef("");
  useReveal([p.id]);
  useEffect(() => {
    const strip = thumbnailStrip.current;
    const thumbnail = strip?.querySelector<HTMLButtonElement>(`[data-thumbnail-index="${active}"]`);
    if (!strip || !thumbnail) return;
    const stripRect = strip.getBoundingClientRect();
    const thumbnailRect = thumbnail.getBoundingClientRect();
    const scrollingBackward = active < previousActive.current;
    const nextScrollLeft = scrollingBackward
      ? strip.scrollLeft + thumbnailRect.right - stripRect.right
      : strip.scrollLeft + thumbnailRect.left - stripRect.left;
    strip.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
    previousActive.current = active;
  }, [active]);
  useEffect(() => {
    if (countedSlug.current === p.id) return;
    countedSlug.current = p.id;
    void fetch(`/api/listing-views?propertySlug=${encodeURIComponent(p.id)}`, { cache: "no-store" })
      .then((response) => { if (!response.ok && countedSlug.current === p.id) countedSlug.current = ""; })
      .catch(() => { if (countedSlug.current === p.id) countedSlug.current = ""; });
  }, [p.id]);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/listings?paginated=1&page=1&pageSize=3")
      .then(async (response) => response.ok ? response.json() as Promise<{ items: Property[] }> : { items: [] })
      .then((data) => { if (!cancelled) setRelated(data.items); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [p.id]);
  useLiquidGlass(".lg-detail", { frost: 1.5, refraction: 0.006, bevelDepth: 0.06, bevelWidth: 0.1 });

  const downloadBrochure = () => {
    const html = buildBrochureHtml(p, d, window.location.origin);
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${p.id}-brochure.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    void fetch("/api/brochure-downloads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertySlug: p.id }), keepalive: true }).catch(() => { });
  };

  const facts = [
    { icon: Maximize, label: "Built-up area", value: `${p.area} m²` },
    { icon: Trees, label: "Plot size", value: `${d.plot} m²` },
    { icon: BedDouble, label: "Bedrooms", value: p.beds || "—" },
    { icon: Bath, label: "Bathrooms", value: p.baths },
    { icon: Car, label: "Parking", value: d.parking },
    { icon: Layers, label: "Levels", value: d.floors },
    { icon: Home, label: "Type", value: p.type },
    { icon: Calendar, label: "Completion", value: `${p.year} · ${p.status}` },
    { icon: Sofa, label: "Furnishing", value: d.furnishing },
    { icon: Compass, label: "Facing", value: d.facing },
    { icon: Building2, label: "Developer", value: d.developer },
    { icon: FileCheck2, label: "Title deed", value: d.deed },
  ];
  const costs = [
    ["Asking price", formatSAR(p.price)],
    ["Price per m²", formatSAR(d.pricePerM2)],
    ["Real estate transaction tax (5%)", formatSAR(d.tax)],
    ["Brokerage fee (2.5%)", formatSAR(d.fee)],
    ["Est. monthly mortgage*", formatSAR(d.mortgage)],
  ];

  return (
    <main className="px-4 pb-28 pt-28 md:px-6">
      <div className="mx-auto w-full max-w-[1680px]">
        <PropertyCardLink href="/properties" className="inline-flex items-center gap-2 text-lg text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" /> All properties
        </PropertyCardLink>

        {/* Gallery and enquiry panel */}
        <div className="mt-1 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <div className="relative aspect-[16/10] min-h-0 overflow-hidden rounded-[2rem] bg-cream lg:aspect-[16/9]">
              <img key={active} src={p.images[active]} alt={p.title} className="h-full w-full object-cover animate-in fade-in duration-700" />
            </div>
            <div ref={thumbnailStrip} className="mt-3 flex gap-3 overflow-x-auto scrollbar-hidden pb-2">
              {p.images.map((img, imageIndex) => {
                return (
                  <button key={`${img}-${imageIndex}`} data-thumbnail-index={imageIndex} onClick={() => setActive(imageIndex)} aria-label={`View photo ${imageIndex + 1}`} aria-current={imageIndex === active ? "true" : undefined} className={`group relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-[1.25rem] bg-cream sm:w-40 lg:w-48 ${imageIndex === active ? "outline outline-2 outline-primary outline-offset-[-2px]" : ""}`}>
                    <img src={img} alt={`${p.title} view ${imageIndex + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-[2rem] bg-cream p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asking price</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight">{formatSAR(p.price)}</p>
                </div>
                <button onClick={downloadBrochure} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  <Download className="h-4 w-4" /> Download brochure
                </button>
              </div>
              <p className="mt-4 flex items-start gap-2 border-t border-foreground/10 pt-4 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{[p.district, p.city].filter(Boolean).join(", ") || "Location not provided"}</span>
              </p>
            </div>
          </div>
          <aside className="w-full lg:sticky lg:top-28 lg:self-start">
            <AgentCard
              p={p}
              onSubmitEnquiry={() => { setEnquiryMode("enquiry"); setEnquiryOpen(true); }}
              onRequestCallback={() => { setEnquiryMode("callback"); setEnquiryOpen(true); }}
            />
            <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
              <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overflow-x-hidden rounded-[1.75rem] border-none bg-white p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white/15 [&>button]:p-2 [&>button]:text-white [&>button]:opacity-100 [&>button]:ring-offset-0 [&>button]:hover:bg-white/25 [&>button]:focus:ring-white">
                <div className="bg-primary px-7 pb-7 pt-8 text-primary-foreground sm:px-8">
                  <DialogHeader className="space-y-0 text-left">
                    <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground/65">
                      {enquiryMode === "callback" ? "Callback request" : "Property enquiry"}
                    </p>
                    <DialogTitle className="max-w-[85%] text-2xl font-semibold leading-tight tracking-tight text-primary-foreground sm:text-3xl">
                      {enquiryMode === "callback" ? "Request a callback" : "Enquire about this property"}
                    </DialogTitle>
                    <DialogDescription className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/80 sm:text-base">
                      Arrange a private viewing or request information about <span className="font-medium text-white">{p.title}</span>.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="px-6 py-6 sm:px-8 sm:py-8">
                  <EnquiryForm
                    cta={enquiryMode === "callback" ? "Request callback" : "Submit enquiry"}
                    defaultMessage={enquiryMode === "callback" ? `Please call me back regarding ${p.title}.` : `I'm interested in ${p.title}.`}
                    propertyId={p.id}
                    propertyTitle={p.title}
                    onSuccess={() => setEnquiryOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </aside>

        <div className="mt-10 lg:col-start-1">
          <div className="min-w-0">
            <h1 className="display-lg"><span className="fancy">{p.title.split(" ")[0]}</span> {p.title.split(" ").slice(1).join(" ")}</h1>
            <p className="mt-4 text-xl text-muted-foreground">{p.short}</p>
            {/* <button onClick={downloadBrochure} className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Download className="h-5 w-5" /> Download brochure
            </button> */}
            {/* {p.investment && (
              <div className="mt-8 flex flex-wrap items-center gap-6 rounded-[2rem] bg-primary p-6 text-primary-foreground md:p-8">
                <p className="display-md">{p.investment.yield}%</p>
                <div>
                  <p className="text-lg">Estimated annual rental yield</p>
                  <p className="opacity-75">{p.investment.label}</p>
                </div>
              </div>
            )} */}

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="rounded-[1.5rem] bg-primary/[0.06] p-5" data-reveal>
                  <f.icon className="h-6 w-6 text-primary" />
                  <p className="mt-5 text-lg font-medium">{f.value}</p>
                  <p className="text-sm text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>

            <Block title="About" rest=" this home">
              <p className="text-lg leading-relaxed text-muted-foreground">{p.description}</p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Built by {d.developer} and completed to {p.status === "Ready" ? "move-in condition" : `handover in ${p.year}`}, the home faces {d.facing.toLowerCase()} for balanced daylight through the day. It comes {d.furnishing.toLowerCase()}, with {d.parking} covered parking spaces and a verified title deed ({d.deed}).
              </p>
            </Block>

            <Block title="Space" rest=" & layout">
              <table className="w-full border-collapse text-left text-sm sm:text-base">
                <tbody>
                  {d.rooms.map(([r, v], i) => (
                    <tr key={`${r}-${i}`} className="border-b border-border last:border-b-0">
                      <th scope="row" className="w-1/2 py-4 pr-4 font-normal text-muted-foreground">{r}</th>
                      <td className="py-4 pl-4 font-medium text-foreground">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Block>

            {featureGroups.length > 0 && (
              <Block title="Property" rest=" Info" accentLast>
                <div className="space-y-7">
                  {featureGroups.map((group, groupIndex) => (
                    <div key={`${group.heading}-${groupIndex}`}>
                      <h3 className="border-b border-border pb-3 text-xl font-medium">{group.heading}</h3>
                      <table className="w-full border-collapse text-left text-sm sm:text-base">
                        <tbody>
                          {group.items.map((item, itemIndex) => (
                            <tr key={`${item.label}-${itemIndex}`} className="border-b border-border last:border-b-0">
                              <th scope="row" className="w-1/2 py-4 pr-4 font-normal text-muted-foreground">{item.label}</th>
                              <td className="py-4 pl-4 font-medium text-foreground">{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {p.investment && (
              <Block title="Investment" rest=" snapshot">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    ["Est. annual rent", formatSAR(annualRent)],
                    ["Gross yield", `${p.investment!.yield}%`],
                    typeof inv?.priceGrowth5yr === "number" ? ["5-yr price growth", `${inv.priceGrowth5yr > 0 ? "+" : ""}${inv.priceGrowth5yr}%`] : null,
                    inv?.serviceCharge && inv.serviceCharge > 0 ? ["Service charge", `${formatSAR(inv.serviceCharge)}/yr`] : null,
                  ].filter((c): c is string[] => c !== null).map(([k, v]) => (
                    <div key={k} className="rounded-[1.75rem] bg-ink p-6 text-ink-foreground">
                      <p className="text-2xl font-medium tracking-tight">{v}</p>
                      <p className="mt-2 text-sm opacity-70">{k}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[2rem] bg-cream p-6">
                  <p className="text-lg font-medium">{p.district} price trend (SAR/m²)</p>
                  <div className="mt-6 flex h-40 items-end gap-3">
                    {[0.72, 0.76, 0.81, 0.85, 0.9, 0.95, 1].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-xl bg-primary" style={{ height: `${h * 100}%`, opacity: 0.45 + h * 0.55 }} />
                        <span className="text-xs text-muted-foreground">{2020 + i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Block>
            )}

            <Block title="Documents" rest=" & compliance">
              <div className="grid gap-3 sm:grid-cols-2">
                {[["Title deed", d.deed], ["REGA advertising licence", `AD-${7100 + p.id.length * 37}`], ["Building permit", `BP-${p.year}-${400 + p.id.length}`], ["Escrow account", p.status === "Off-plan" ? "Wafi-registered" : "Not required"]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 rounded-2xl bg-primary/[0.06] px-5 py-4">
                    <span className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-primary" />{k}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Amenities">
              <ul className="grid gap-3 sm:grid-cols-2">
                {p.amenities.map((value, index) => {
                  const amenity = normalizeAmenity(value);
                  return <li key={`${amenity.name}-${index}`} className="flex items-center gap-3 rounded-2xl bg-cream px-5 py-4 text-lg"><DynamicIcon name={amenity.icon as IconName} className="h-5 w-5 shrink-0 text-primary" />{amenity.name}</li>;
                })}
              </ul>
            </Block>

            {/* Cost and Payment */}
            {/* <Block title="Costs" rest=" & payment">
              <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                <div className="rounded-[2rem] bg-cream p-6">
                  {costs.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 py-3 text-base md:text-lg">
                      <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
                    </div>
                  ))}
                  <p className="mt-2 text-sm text-muted-foreground">*80% financing over 25 years at 5.5%. Indicative only.</p>
                </div>
                <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
                  <p className="text-lg opacity-80">{p.status === "Off-plan" ? "Developer payment plan" : "Typical purchase structure"}</p>
                  <div className="mt-4 space-y-3">
                    {d.plan.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-2xl bg-primary-foreground/10 px-5 py-4">
                        <span>{k}</span><span className="text-2xl font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Block> */}

            <Block title="Location">
              <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                <div className="relative h-[380px] overflow-hidden rounded-[2rem] bg-cream">
                  <iframe
                    title={`Map of ${p.district}, ${p.city}`}
                    src={`https://maps.google.com/maps?q=${d.lat},${d.lng}&z=14&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full grayscale-[35%]"
                  />
                </div>
                <div className="rounded-[2rem] bg-primary/[0.06] p-6">
                  <p className="flex items-center gap-2 text-lg font-medium"><MapPin className="h-5 w-5 text-primary" />{p.district}, {p.city}</p>
                  <ul className="mt-4">
                    {d.nearby.map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between py-2.5 text-base">
                        <span className="text-muted-foreground">{k}</span><span className="font-medium text-primary">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Block>

          </div>

        </div>

        <section className="mt-28 lg:col-start-1">
          <h2 className="display-lg"><span className="fancy">Similar</span> homes</h2>
          <div className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {related.filter((x) => x.id !== p.id).slice(0, 3).map((x) => <PropertyCard key={x.id} p={x} />)}
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}

function Block({ title, rest = "", accentLast = false, children }: { title: string; rest?: string; accentLast?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-16" data-reveal>
      <h2 className="display-md mb-6">{accentLast ? <>{title}<span className="fancy">{rest}</span></> : <><span className="fancy">{title}</span>{rest}</>}</h2>
      {children}
    </section>
  );
}

