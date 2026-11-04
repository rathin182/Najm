"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { BUDGETS } from "@/data/properties";
import type { HomeSearchOptions } from "@/lib/home-search-options";
import { CATEGORY_GROUPS } from "@/lib/home-search-options";
import type { Property } from "@/data/properties";
import { PropertyCard } from "@/components/site/PropertyCard";
import { useReveal } from "@/components/site/motion";
import { AreaRangeFilter, MultiSelectDropdown, OptionSelectDropdown, OptionSegment, PropertyTypeFilter } from "@/components/site/PropertyFilterControls";

// type Search = { city?: string; type?: string; budget?: string; beds?: string; status?: string; sort?: string };
// type Search = { city?: string; type?: string; budget?: string; beds?: string; status?: string; sort?: string; transaction?: string; furnishing?: string; areaOp?: string; area?: string };
type Search = { city?: string; type?: string; budget?: string; beds?: string; baths?: string; status?: string; sort?: string; transaction?: string; furnishing?: string; category?: string; areaMin?: string; areaMax?: string };
type ListingPage = { items: Property[]; total: number; hasMore: boolean; cities: string[]; types: string[] };
const PAGE_SIZE = 15;

function PropertiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // const search: Search = Object.fromEntries(["city", "type", "budget", "beds", "status", "sort"].map((key) => [key, searchParams.get(key) || undefined]));
  // const search: Search = Object.fromEntries(["city", "type", "budget", "beds", "status", "sort", "transaction", "furnishing", "areaOp", "area"].map((key) => [key, searchParams.get(key) || undefined]));
    const search: Search = Object.fromEntries(["city", "type", "budget", "beds", "baths", "status", "sort", "transaction", "furnishing", "category", "areaMin", "areaMax"].map((key) => [key, searchParams.get(key) || undefined]));
  const selectedCities = searchParams.getAll("city");
  const queryKey = searchParams.toString();
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [homeOptions, setHomeOptions] = useState<HomeSearchOptions | null>(null);
  // const [types, setTypes] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const requestRef = useRef(0);

  const set = (k: keyof Search, v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (search[k] === v || !v) params.delete(k); else params.set(k, v);
    router.replace(`/properties${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  // Set several URL params at once; an array value becomes repeated params (?city=A&city=B).
  const update = (changes: Record<string, string | string[] | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      params.delete(key);
      for (const item of Array.isArray(value) ? value : value ? [value] : []) params.append(key, item);
    }
    router.replace(`/properties${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const fetchPage = useCallback(async (page: number, append: boolean, requestId: number) => {
    const params = new URLSearchParams(queryKey);
    params.set("paginated", "1");
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (search.budget) {
      const [min, max] = search.budget.split("-").map(Number);
      if (min && min > 0) params.set("minPrice", String(min));
      if (max && max < 999999999) params.set("maxPrice", String(max));
      params.delete("budget");
    }
    if (search.beds) {
      if (search.beds === "0") params.set("studio", "1");
      else params.set("minBeds", search.beds);
      params.delete("beds");
    }
    if (search.baths) {
      params.set("minBaths", search.baths);
      params.delete("baths");
    }
    // if (search.status) { params.set("readiness", search.status === "Off-plan" ? "off-plan" : "ready"); params.delete("status"); }
    if (search.status) { params.set("readiness", search.status.toLowerCase() === "off-plan" ? "off-plan" : "ready"); params.delete("status"); }
    if (search.sort) {
      params.set("sort", search.sort === "low" ? "price-low" : search.sort === "high" ? "price-high" : search.sort === "area" ? "size-large" : search.sort);
    }
    const response = await fetch(`/api/listings?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Properties could not be loaded. Please try again.");
    const data = await response.json() as ListingPage;
    if (requestId !== requestRef.current) return;
    setItems((current) => append ? [...current, ...data.items] : data.items);
    setTotal(data.total);
    setHasMore(data.hasMore);
    setCities(data.cities);
    // setTypes(data.types);
    pageRef.current = page;
  }, [queryKey, search.budget, search.beds, search.baths, search.status, search.sort]);

  useEffect(() => {
    const requestId = ++requestRef.current;
    pageRef.current = 1;
    setLoading(true);
    setLoadingMore(false);
    setError("");
    void fetchPage(1, false, requestId).catch((cause: unknown) => {
      if (requestId === requestRef.current) setError(cause instanceof Error ? cause.message : "Properties could not be loaded.");
    }).finally(() => { if (requestId === requestRef.current) setLoading(false); });
  }, [fetchPage]);

  // Filter options managed in Admin > Homepage Search (same source as the homepage hero).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/home-search-options", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<HomeSearchOptions>) : Promise.reject(new Error("Could not load filter options."))))
      .then((options) => { if (!cancelled) setHomeOptions(options); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const requestId = requestRef.current;
    try { await fetchPage(pageRef.current + 1, true, requestId); }
    catch (cause) { if (requestId === requestRef.current) setError(cause instanceof Error ? cause.message : "More properties could not be loaded."); }
    finally { if (requestId === requestRef.current) setLoadingMore(false); }
  }, [fetchPage, hasMore, loading, loadingMore]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) void loadMore(); }, { rootMargin: "600px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, items.length]);

  useReveal([items.length, queryKey]);
  const hasFilters = Object.values(search).some(Boolean);
  // const cityOptions = useMemo(() => cities, [cities]);
  const cityOptions = useMemo(() => (homeOptions ? homeOptions.locations.map((option) => option.value) : cities), [homeOptions, cities]);
  const typesByCategory = useMemo(() => (homeOptions ? { residential: homeOptions[CATEGORY_GROUPS.residential].map((option) => option.value), commercial: homeOptions[CATEGORY_GROUPS.commercial].map((option) => option.value) } : undefined), [homeOptions]);
  const budgetOptions: { value: string; label: string }[] = homeOptions?.budgets ?? [...BUDGETS];
  const bedroomOptions: { value: string; label: string }[] = homeOptions?.bedrooms ?? ["1", "2", "3", "4", "5"].map((value) => ({ value, label: `${value}+` }));
  const bathroomOptions = ["1", "2", "3", "4", "5"].map((value) => ({ value, label: `${value}+` }));
  const statusOptions: { value: string; label: string }[] = homeOptions?.statuses ?? [{ value: "Ready", label: "Ready" }, { value: "Off-plan", label: "Off-plan" }];

  return (
    <main className="px-4 pb-20 pt-28 md:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="display-xl"><span className="fancy">Properties</span></h1>
            <p className="mt-3 text-base text-muted-foreground">{loading ? "Loading properties…" : `${total} curated ${total === 1 ? "residence" : "residences"} across the Kingdom`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 rounded-full bg-cream px-5 py-3 text-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
            <select aria-label="Sort" value={search.sort ?? ""} onChange={(e) => set("sort", e.target.value)} className="field w-auto bg-cream pr-10 text-sm">
              <option value="">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="area">Largest first</option>
            </select>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
          <aside data-lenis-prevent className={`${mobileOpen ? "fixed inset-0 z-[60] overflow-y-auto bg-background p-4" : "hidden"} lg:sticky lg:top-28 lg:block lg:h-[calc(100dvh-8rem)] lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain scrollbar-hidden lg:pr-1`}>
            <div className="rounded-[1.75rem] bg-cream p-2.5 text-foreground">
              <div className="flex items-center justify-between px-3 pb-1 pt-3"><p className="font-sans text-lg font-semibold tracking-tight">Filters</p><div className="flex items-center gap-3">{hasFilters && <button onClick={() => router.replace("/properties", { scroll: false })} className="text-xs text-primary hover:underline">Clear all</button>}<button onClick={() => setMobileOpen(false)} className="lg:hidden" aria-label="Close filters"><X className="h-5 w-5" /></button></div></div>
              {/* <Panel title="Location"><div className="flex flex-col">{cityOptions.map((city) => <button key={city} onClick={() => set("city", city)} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${search.city === city ? "bg-primary text-primary-foreground" : "hover:bg-cream"}`}>{city}<span className={search.city === city ? "opacity-80" : "text-muted-foreground"} /></button>)}</div></Panel> */}
              <Panel title="Location"><div className="px-1 pb-1"><MultiSelectDropdown options={cityOptions} selected={selectedCities} onChange={(next) => update({ city: next })} placeholder="All locations" noun="locations" /></div></Panel>
              {/* <Panel title="Property type"><div className="grid grid-cols-2 gap-2">{typeOptions.map((type) => <Chip key={type} active={search.type?.toLowerCase() === type.toLowerCase()} onClick={() => set("type", type)}>{type}</Chip>)}</div></Panel> */}
              {/* <Panel title="Property type"><div className="px-1 pb-1"><SingleSelectDropdown label="Property type" options={typeOptions} value={typeOptions.find((type) => type.toLowerCase() === search.type?.toLowerCase()) ?? search.type ?? ""} onChange={(value) => set("type", value)} placeholder="All property types" /></div></Panel> */}
              {/* <Panel title="Property type"><PropertyTypeFilter category={search.category} type={search.type} onChange={(category, type) => update({ category, type })} /></Panel> */}
              <Panel title="Property type"><PropertyTypeFilter category={search.category} type={search.type} typesByCategory={typesByCategory} onChange={(category, type) => update({ category, type })} /></Panel>  
              <Panel title="Budget"><div className="flex flex-col">{budgetOptions.map((budget) => <button key={budget.value} onClick={() => set("budget", budget.value)} className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-primary/10"><span className={`h-3.5 w-3.5 shrink-0 rounded-full transition-all ${search.budget === budget.value ? "bg-primary ring-4 ring-primary/20" : "bg-cream"}`} />{budget.label}</button>)}</div></Panel>
              {/* <Panel title="Bedrooms"><Segment options={["1", "2", "3", "4", "5"]} value={search.beds} onPick={(value) => set("beds", value)} suffix="+" /></Panel> */}
              <Panel title="Bedrooms"><div className="px-1 pb-1"><OptionSelectDropdown label="Bedrooms" options={bedroomOptions} value={search.beds} placeholder="Any number of bedrooms" onChange={(value) => set("beds", value)} /></div></Panel>
              <Panel title="Bathrooms"><div className="px-1 pb-1"><OptionSelectDropdown label="Bathrooms" options={bathroomOptions} value={search.baths} placeholder="Any number of bathrooms" onChange={(value) => set("baths", value)} /></div></Panel>
              {/* <Panel title="Status"><Segment options={["Ready", "Off-plan"]} value={search.status} onPick={(value) => set("status", value)} /></Panel> */}
              <Panel title="Status">
                <div className="flex flex-col gap-2">
                  {/* <Segment options={["Ready", "Off-plan"]} value={search.status} onPick={(value) => set("status", value)} /> */}
                  <OptionSegment options={statusOptions} value={search.status} onPick={(value) => set("status", value)} />
                  <OptionSegment options={[{ value: "buy", label: "For Sale" }, { value: "rent", label: "For Rent" }]} value={search.transaction} onPick={(value) => set("transaction", value)} />
                </div>
              </Panel>
              <Panel title="Furnishing"><OptionSegment options={[{ value: "furnished", label: "Furnished" }, { value: "semi", label: "Semi furnished" }]} value={search.furnishing} onPick={(value) => set("furnishing", value)} /></Panel>
              {/* <Panel title="Area"><div className="px-1 pb-1"><AreaFilter op={search.areaOp} value={search.area} onChange={(areaOp, area) => update({ areaOp: area ? areaOp : undefined, area: area || undefined })} /></div></Panel> */}
              <Panel title="Area (m²)"><AreaRangeFilter min={search.areaMin} max={search.areaMax} onChange={(areaMin, areaMax) => update({ areaMin: areaMin || undefined, areaMax: areaMax || undefined })} /></Panel>
              <button onClick={() => setMobileOpen(false)} className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm text-primary-foreground lg:hidden">Show {total} results</button>
            </div>
          </aside>

          <section>
            {error && <div role="alert" className="mb-6 rounded-2xl bg-destructive/10 p-5 text-sm text-destructive">{error}<button onClick={() => { const requestId = ++requestRef.current; setError(""); setLoading(true); void fetchPage(1, false, requestId).catch((cause) => setError(cause instanceof Error ? cause.message : "Properties could not be loaded.")).finally(() => setLoading(false)); }} className="ml-3 underline">Retry</button></div>}
            {items.length ? <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">{items.map((property) => <PropertyCard key={property.id} p={property} />)}</div> : !loading && !error ? <div className="rounded-[1.5rem] bg-cream p-12 text-center"><p className="display-md">No matches — yet.</p><p className="mt-3 text-base text-muted-foreground">Try widening your filters, or ask us about off-market homes.</p></div> : loading && <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/3.4] animate-pulse rounded-[1.75rem] bg-cream" />)}</div>}
            {items.length > 0 && <div ref={sentinel} className="flex min-h-24 items-center justify-center text-sm text-muted-foreground" aria-live="polite">{loadingMore ? "Loading more properties…" : hasMore ? "Scroll to discover more" : `Showing all ${total} properties`}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mt-2 rounded-[1.25rem] bg-background p-2.5 text-foreground"><p className="mb-1.5 px-2.5 pt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>{children}</div>; }
function Segment({ options, value, onPick, suffix = "" }: { options: string[]; value: string | undefined; onPick: (v: string) => void; suffix?: string }) { return <div className="flex gap-1 rounded-full bg-cream p-1">{options.map((option) => <button key={option} onClick={() => onPick(option)} className={`flex-1 rounded-full py-1.5 text-[13px] transition-colors ${value === option ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}>{option}{suffix}</button>)}</div>; }
// function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`rounded-lg px-2 py-2 text-[13px] transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-cream hover:bg-cream"}`}>{children}</button>; }

export { PropertiesPage };
