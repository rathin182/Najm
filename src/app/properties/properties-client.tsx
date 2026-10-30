"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { BUDGETS, CITIES, PROPERTIES, TYPES } from "@/data/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useReveal } from "@/components/site/motion";

type Search = { city?: string | undefined; type?: string | undefined; budget?: string | undefined; beds?: string | undefined; status?: string | undefined; sort?: string | undefined };

function filterProperties(search: Search) {
  let r = PROPERTIES.filter((p) => {
    if (search.city && p.city !== search.city) return false;
    if (search.type && p.type !== search.type) return false;
    if (search.status && p.status !== search.status) return false;
    if (search.beds && p.beds < Number(search.beds)) return false;
    if (search.budget) {
      const [min = 0, max = Infinity] = search.budget.split("-").map(Number);
      if (p.price < min || p.price > max) return false;
    }
    return true;
  });
  if (search.sort === "low") r = [...r].sort((a, b) => a.price - b.price);
  if (search.sort === "high") r = [...r].sort((a, b) => b.price - a.price);
  if (search.sort === "area") r = [...r].sort((a, b) => b.area - a.area);
  return r;
}

function PropertiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search: Search = Object.fromEntries(["city", "type", "budget", "beds", "status", "sort"].map((key) => [key, searchParams.get(key) || undefined]));
  const [mobileOpen, setMobileOpen] = useState(false);
  const set = (k: keyof Search, v: string) =>
    { const params = new URLSearchParams(searchParams.toString()); if (search[k] === v || !v) params.delete(k); else params.set(k, v); router.replace(`/properties${params.size ? `?${params}` : ""}`); }

  const list = useMemo(() => filterProperties(search), [search]);
  useReveal([list.length, JSON.stringify(search)]);
  const hasFilters = Object.values(search).some(Boolean);

  return (
    <main className="px-4 pb-20 pt-28 md:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="display-xl"><span className="fancy">Properties</span></h1>
            <p className="mt-3 text-base text-muted-foreground">
              {list.length} curated {list.length === 1 ? "residence" : "residences"} across the Kingdom
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 rounded-full bg-cream px-5 py-3 text-sm lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <select aria-label="Sort" value={search.sort ?? ""} onChange={(e) => set("sort", e.target.value)} className="field w-auto bg-cream pr-10 text-sm">
              <option value="">Recommended</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="area">Largest first</option>
            </select>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[264px_1fr] lg:gap-10">
          <aside className={`${mobileOpen ? "fixed inset-0 z-[60] overflow-y-auto bg-background p-4" : "hidden"} lg:sticky lg:top-28 lg:block lg:self-start`}>
            <div className="rounded-[1.75rem] bg-cream p-2.5 text-foreground">
              <div className="flex items-center justify-between px-3 pb-1 pt-3">
                <p className="text-xl font-medium tracking-tight"><span className="fancy">Filters</span></p>
                <div className="flex items-center gap-3">
                  {hasFilters ? (
                    <button onClick={() => router.replace("/properties")} className="text-xs text-primary hover:underline">Clear all</button>
                  ) : null}
                  <button onClick={() => setMobileOpen(false)} className="lg:hidden" aria-label="Close filters"><X className="h-5 w-5" /></button>
                </div>
              </div>

              <Panel title="Location">
                <div className="flex flex-col">
                  {CITIES.map((c) => (
                    <button key={c} onClick={() => set("city", c)} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${search.city === c ? "bg-primary text-primary-foreground" : "hover:bg-cream"}`}>
                      {c}
                      <span className={search.city === c ? "opacity-80" : "text-muted-foreground"}>{PROPERTIES.filter((p) => p.city === c).length}</span>
                    </button>
                  ))}
                </div>
              </Panel>
              <Panel title="Property type">
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((c) => <Chip key={c} active={search.type === c} onClick={() => set("type", c)}>{c}</Chip>)}
                </div>
              </Panel>
              <Panel title="Budget">
                <div className="flex flex-col">
                  {BUDGETS.map((b) => (
                    <button key={b.value} onClick={() => set("budget", b.value)} className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-primary/10">
                      <span className={`h-3.5 w-3.5 shrink-0 rounded-full transition-all ${search.budget === b.value ? "bg-primary ring-4 ring-primary/20" : "bg-cream"}`} />
                      {b.label}
                    </button>
                  ))}
                </div>
              </Panel>
              <Panel title="Bedrooms">
                <Segment options={["1", "2", "3", "4", "5"]} value={search.beds} onPick={(v) => set("beds", v)} suffix="+" />
              </Panel>
              <Panel title="Status">
                <Segment options={["Ready", "Off-plan"]} value={search.status} onPick={(v) => set("status", v)} />
              </Panel>
              <button onClick={() => setMobileOpen(false)} className="mt-2 w-full rounded-full bg-primary text-primary-foreground py-3.5 text-sm lg:hidden">
                Show {list.length} results
              </button>
            </div>
          </aside>

          <section>
            {list.length ? (
              <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((p) => <PropertyCard key={p.id} p={p} />)}
              </div>
            ) : (
              <div className="rounded-[1.5rem] bg-cream p-12 text-center">
                <p className="display-md">No matches — yet.</p>
                <p className="mt-3 text-base text-muted-foreground">Try widening your filters, or ask us about off-market homes.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-[1.25rem] bg-background p-2.5 text-foreground">
      <p className="mb-1.5 px-2.5 pt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Segment({ options, value, onPick, suffix = "" }: { options: string[]; value?: string | undefined; onPick: (v: string) => void; suffix?: string }) {
  return (
    <div className="flex gap-1 rounded-full bg-cream p-1">
      {options.map((o) => (
        <button key={o} onClick={() => onPick(o)} className={`flex-1 rounded-full py-1.5 text-[13px] transition-colors ${value === o ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}>
          {o}{suffix}
        </button>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-2 text-[13px] transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-cream hover:bg-cream"}`}
    >
      {children}
    </button>
  );
}

export { PropertiesPage };
