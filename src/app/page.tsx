"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, MapPin, Plus, Minus, Search, Wallet, BedDouble, CheckCircle2 } from "lucide-react";
const hero = '/images/hero2.jpg';
const heroCut = '/images/hero2-cut.png';
import { GigaProjects, WhyNajm } from "@/components/site/HomeSections";
import { type Property, formatSAR } from "@/data/properties";
import type { AdminProperty } from "@/lib/admin-store";
import type { HomeSearchOptions } from "@/lib/home-search-options";
// import { CATEGORY_GROUPS, PROPERTY_CATEGORIES } from "@/lib/home-search-options";
// import { CATEGORY_LABELS, type PropertyCategoryKey } from "@/lib/property-categories";
import { CATEGORY_GROUPS } from "@/lib/home-search-options";
import { type PropertyCategoryKey } from "@/lib/property-categories";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SectionTitle } from "@/components/site/Layout";
import { EnquiryForm } from "@/components/site/EnquiryForm";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HeroDropdown, HeroPropertyType, type HeroOption } from "@/components/site/HeroSearchControls";
import { useReveal } from "@/components/site/motion";
import { introDone } from "@/components/site/PageTransition";

// type HeroOption = { value: string; label: string };

// function withAny(options: HeroOption[] | undefined, label: string): HeroOption[] {
//   const seen = new Set<string>();
//   const uniqueOptions = (options ?? []).filter((option) => {
//     const value = option.value.trim();
//     if (!value || seen.has(value.toLowerCase())) return false;
//     seen.add(value.toLowerCase());
//     return true;
//   });
//   return [{ value: "", label }, ...uniqueOptions];
// }

function cleanOptions(options: HeroOption[] | undefined): HeroOption[] {
  const seen = new Set<string>();
  return (options ?? []).filter((option) => {
    const value = option.value.trim();
    if (!value || seen.has(value.toLowerCase())) return false;
    seen.add(value.toLowerCase());
    return true;
  });
}

function Hero() {
  const router = useRouter();
  const [homeSearchOptions, setHomeSearchOptions] = useState<HomeSearchOptions>({ locations: [], residentialTypes: [], commercialTypes: [], bedrooms: [], budgets: [], statuses: [] });
  const stageRef = useRef<HTMLDivElement>(null);
  // const [loc, setLoc] = useState("");
  // const [type, setType] = useState("");
  // const [category, setCategory] = useState<PropertyCategoryKey>("residential");
  // const [budget, setBudget] = useState("");
  // const [bedrooms, setBedrooms] = useState("");
  // const [status, setStatus] = useState("");
  // const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  // const categoryOptions = homeSearchOptions[CATEGORY_GROUPS[category]];

  const [locs, setLocs] = useState<string[]>([]);
  const [type, setType] = useState("");
  const [category, setCategory] = useState<PropertyCategoryKey | undefined>(undefined);
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [status, setStatus] = useState("");
  
  useEffect(() => {
    let cancelled = false;
    fetch("/api/home-search-options", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<HomeSearchOptions> : Promise.reject(new Error("Could not load homepage search filters.")))
      .then((options) => { if (!cancelled) setHomeSearchOptions(options); })
      .catch((error) => console.error("Homepage search filters could not be loaded", error))
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let ctx: { revert: () => void } | undefined;
    (async () => {
      const [{ gsap }] = await Promise.all([import("gsap"), introDone]);
      if (cancelled || !stageRef.current) return;
      ctx = gsap.context(() => {
        gsap.timeline()
          .fromTo("[data-hero-line]", { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.12, ease: "power4.out", clearProps: "transform" })
          .fromTo("[data-hero-photo]", { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "power3.out", clearProps: "all" }, 0.1)
          .fromTo("[data-hero-cut]", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.6, ease: "power3.out", clearProps: "all" }, 0.3)
          .fromTo("[data-hero-side]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", clearProps: "all" }, 0.6)
          .fromTo("[data-hero-search]", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", clearProps: "all" }, 0.9);
      }, stageRef.current.parentElement ?? undefined);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, []);

  // const sel = "w-full truncate appearance-none bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer md:text-ink-foreground [&>option]:text-foreground";
  const fs = "clamp(2.75rem, min(9.5vw, calc((100svh - 6.5rem) * 0.1377)), 11rem)";

  return (
    <section className="px-3 pb-[17rem] pt-24 md:px-4 md:pb-0">
      <div ref={stageRef} className="relative mx-auto h-[115vw] w-full sm:h-[min(69vw,calc(100svh-6.5rem))]">
        <h1 className="absolute left-[5%] top-0 z-10 font-normal uppercase leading-[0.86] tracking-[-0.035em] sm:left-[23%]" style={{ fontSize: fs }}>
          <span className="block overflow-hidden"><span data-hero-line className="block">Homes</span></span>
          <span className="block overflow-hidden pb-[0.06em]"><span data-hero-line className="block"><span className="fancy normal-case">Beneath</span> the</span></span>
          <span className="block overflow-hidden"><span data-hero-line className="block">Stars</span></span>
        </h1>

        <a href="#featured" aria-label="Scroll to featured homes" data-hero-side className="group absolute left-[6%] top-[19%] z-10 hidden aspect-square w-[10%] items-center justify-center rounded-full bg-cream transition-colors hover:bg-ink sm:flex">
          <ArrowDownRight className="h-[30%] w-[30%] stroke-[1.25] text-foreground transition-colors group-hover:text-ink-foreground" />
        </a>
        <p data-hero-side className="absolute left-[84%] top-[19%] z-10 hidden max-w-[13%] text-[clamp(0.85rem,1.2vw,1.15rem)] leading-snug text-foreground/80 sm:block">
          Curated residences and investment property across the Kingdom.
        </p>

        <div data-hero-photo className="absolute inset-x-0 bottom-0 top-[37.5%] overflow-hidden rounded-[1.75rem]">
          <img src={hero} alt="Najm Estate signature villa at blue hour" width={1920} height={1280} className="absolute inset-x-0 bottom-0 h-[119.2%] w-full object-cover object-top" />
        </div>
        <img data-hero-cut src={heroCut} alt="" aria-hidden width={1920} height={1280} className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[74.5%] w-full object-cover object-top" />

        <form
          data-hero-search
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            // if (loc) params.set("city", loc);
            for (const city of locs) params.append("city", city);
            if (type) params.set("type", type);
            if (category) params.set("category", category);
            if (budget) params.set("budget", budget);
            if (bedrooms) params.set("beds", bedrooms);
            if (status) params.set("status", status.toLowerCase() === "off-plan" ? "Off-plan" : "Ready");
            const query = params.toString();
            router.push(query ? `/properties?${query}` : "/properties");
          }}
          className="absolute inset-x-0 top-full z-30 mx-auto mt-3 max-w-[1400px] md:inset-x-8 md:bottom-8 md:top-auto md:mt-0"
        >
<div className="relative z-10 grid gap-1 rounded-[1.4rem] border border-border/50 bg-cream p-2 shadow-xl shadow-ink/15 md:grid-cols-[1.05fr_0.8fr_1.1fr_1fr_minmax(10rem,1.1fr)_auto] md:items-center md:gap-0 md:rounded-full md:border-white/25 md:bg-ink/55 md:px-2.5 md:py-2 md:shadow-2xl md:backdrop-blur-xl md:backdrop-saturate-150">

  {/* {[
    { label: "Location", icon: MapPin, value: loc, set: setLoc, opts: withAny(homeSearchOptions.locations, "Any location") },
    { label: "Bedrooms", icon: BedDouble, value: bedrooms, set: setBedrooms, opts: withAny(homeSearchOptions.bedrooms, "Any bedrooms") },
    { label: "Price range (SAR)", icon: Wallet, value: budget, set: setBudget, opts: withAny(homeSearchOptions.budgets, "Any price") },
    { label: "Property status", icon: CheckCircle2, value: status, set: setStatus, opts: withAny(homeSearchOptions.statuses, "Any status") },
  ].map((f, i) => (
    <label
      key={f.label}
      className={`group relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-background/60 md:gap-2.5 md:rounded-full md:px-3 md:py-2 md:hover:bg-white/10 ${
        i > 0
          ? "md:before:absolute md:before:left-0 md:before:top-1/4 md:before:h-1/2 md:before:w-px md:before:bg-white/25"
          : ""
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <f.icon className="h-3.5 w-3.5" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="text-[10px] leading-none text-muted-foreground md:text-ink-foreground/75">
          {f.label}
        </span>

        <select
          value={f.value}
          onChange={(e) => f.set(e.target.value)}
          className={`${sel} mt-0.5 text-xs leading-tight`}
          aria-label={f.label}
        >
          {f.opts.map(({ value, label }) => (
              <option key={value || "any"} value={value}>
                {label}
              </option>
            ))}
        </select>
      </span>

      <ChevronDown className="pointer-events-none h-3.5 w-3.5 shrink-0 opacity-70 md:text-ink-foreground" />
    </label>
  ))}

  {/* Property Type 
  <Popover open={propertyTypeOpen} onOpenChange={setPropertyTypeOpen}>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Choose property type"
        aria-expanded={propertyTypeOpen}
        className="group relative flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-background/60 md:rounded-full md:px-3 md:py-2 md:hover:bg-white/10 md:before:absolute md:before:left-0 md:before:top-1/4 md:before:h-1/2 md:before:w-px md:before:bg-white/25"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-primary">
          <HomeIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10px] leading-none text-muted-foreground md:text-ink-foreground/75">Property type</span>
          <span className="mt-1 truncate text-xs font-medium text-foreground md:text-ink-foreground">
            {type || `All ${CATEGORY_LABELS[category].toLowerCase()} types`}
          </span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform md:text-ink-foreground ${propertyTypeOpen ? "rotate-180" : ""}`} />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" sideOffset={10} className="z-[80] w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-xl">
      <div className="grid grid-cols-2 border-b border-border px-3 pt-2">
        {PROPERTY_CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={category === key}
            onClick={() => { setCategory(key); setType(""); }}
            className={`border-b-2 px-3 py-3 text-sm transition-colors ${category === key ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto p-3">
        <button
          type="button"
          aria-pressed={!type}
          onClick={() => { setType(""); setPropertyTypeOpen(false); }}
          className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-left text-sm transition-colors ${!type ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-foreground hover:bg-cream"}`}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${!type ? "border-primary" : "border-border"}`}>
            {!type && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
          <span className="truncate">All {CATEGORY_LABELS[category].toLowerCase()} types</span>
        </button>
        {categoryOptions.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={type === value}
            onClick={() => { setType(value); setPropertyTypeOpen(false); }}
            className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-left text-sm transition-colors ${type === value ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-foreground hover:bg-cream"}`}
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${type === value ? "border-primary" : "border-border"}`}>
              {type === value && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover> */}
  <HeroDropdown icon={MapPin} label="Location" noun="locations" multiple searchable searchPlaceholder="Search location…" separator={false} options={cleanOptions(homeSearchOptions.locations)} anyLabel="Any location" values={locs} onChange={setLocs} />
  <HeroDropdown icon={BedDouble} label="Bedrooms" options={cleanOptions(homeSearchOptions.bedrooms)} anyLabel="Any bedrooms" values={bedrooms ? [bedrooms] : []} onChange={(next) => setBedrooms(next[0] ?? "")} />
  <HeroDropdown icon={Wallet} label="Price range (SAR)" options={cleanOptions(homeSearchOptions.budgets)} anyLabel="Any price" values={budget ? [budget] : []} onChange={(next) => setBudget(next[0] ?? "")} />
  <HeroDropdown icon={CheckCircle2} label="Property status" options={cleanOptions(homeSearchOptions.statuses)} anyLabel="Any status" values={status ? [status] : []} onChange={(next) => setStatus(next[0] ?? "")} />
  <HeroPropertyType category={category} type={type} typesByCategory={{ residential: cleanOptions(homeSearchOptions[CATEGORY_GROUPS.residential]), commercial: cleanOptions(homeSearchOptions[CATEGORY_GROUPS.commercial]) }} onChange={(nextCategory, nextType) => { setCategory(nextCategory); setType(nextType); }} />

  {/* Search Button */}
  <button
    type="submit"
    className="flex items-center justify-center gap-2 self-stretch rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-background hover:text-foreground md:my-0.5 md:mr-0.5 md:self-stretch"
  >
    <Search className="h-4 w-4" />
    <span className="hidden xl:inline">Search</span>
  </button>

</div>

        </form>
      </div>
    </section>
  );
}

export default Home;

const STEPS = [
  { t: "Discover", d: "A private consultation to understand your lifestyle, goals and budget." },
  { t: "Curate", d: "A hand-picked shortlist of verified properties, including off-market homes." },
  { t: "Visit", d: "Chauffeured private viewings — or immersive virtual tours from anywhere." },
  { t: "Own", d: "Negotiation, REGA-compliant contracts, financing and handover, all managed." },
];



const FAQ = [
  { q: "Can foreigners buy property in Saudi Arabia?", a: "Yes. Under the updated real estate ownership law, non-Saudis can own property in designated zones. Our advisors guide you through every eligibility requirement." },
  { q: "Do you help with mortgage financing?", a: "We work with leading Saudi banks to secure competitive, Sharia-compliant financing for residents and eligible non-residents." },
  { q: "What returns can investment properties offer?", a: "Our Investment Vault properties typically yield between 6% and 9% annually, depending on location and property type." },
  { q: "Can I buy off-plan?", a: "Yes — we offer early access to off-plan releases from trusted developers, with escrow-protected payment plans." },
  { q: "Are there any hidden fees?", a: "No. We share a full cost breakdown upfront, including the 5% real estate transaction tax where applicable." },
];

type HomeArticle = {
  id: string;
  title: string;
  categoryLabel: string;
  coverImage: string | null;
  readMinutes: number;
};

function Home() {
  useReveal();
  const [articles, setArticles] = useState<HomeArticle[]>([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [otherProperties, setOtherProperties] = useState<Property[]>([]);
  const [vault, setVault] = useState<AdminProperty[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load articles.");
        return response.json() as Promise<HomeArticle[]>;
      })
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) setArticles(rows.slice(0, 4));
      })
      .catch((error) => console.error("Homepage articles could not be loaded", error))
      .finally(() => { if (!cancelled) setArticlesLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/listings/featured", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load properties.");
        return response.json() as Promise<Property[]>;
      })
      .then((listings) => {
        if (!cancelled && Array.isArray(listings)) setFeatured(listings);
      })
      .catch((error) => console.error("Homepage properties could not be loaded", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/listings/explore")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load listings.");
        return response.json() as Promise<Property[]>;
      })
      .then((listings) => {
        if (!cancelled && Array.isArray(listings)) {
          setOtherProperties(listings);
        }
      })
      .catch((error) =>
        console.error("Other homepage properties could not be loaded", error)
      );

    return () => {
      cancelled = true;
    };
  }, []);

  // useEffect(() => {
  //   let cancelled = false;
  //   fetch("/api/listings", { cache: "no-store" })
  //     .then(async (response) => {
  //       if (!response.ok) throw new Error("Could not load listings.");
  //       return response.json() as Promise<Property[]>;
  //     })
  //     .then((listings) => {
  //       if (cancelled || !Array.isArray(listings)) return;
  //       const randomListings = [...listings];
  //       for (let i = randomListings.length - 1; i > 0; i--) {
  //         const j = Math.floor(Math.random() * (i + 1));
  //         [randomListings[i], randomListings[j]] = [randomListings[j]!, randomListings[i]!];
  //       }
  //       setOtherProperties(randomListings.slice(0, 4));
  //     })
  //     .catch((error) => console.error("Other homepage properties could not be loaded", error));
  //   return () => { cancelled = true; };
  // }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/listings/investment-vault", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load investment properties.");
        return response.json() as Promise<AdminProperty[]>;
      })
      .then((listings) => {
        if (!cancelled && Array.isArray(listings)) setVault(listings);
      })
      .catch((error) => console.error("Investment Vault could not be loaded", error));
    return () => { cancelled = true; };
  }, []);

  return (
    <main>
      <Hero />

      {/* Featured */}
      <section id="featured" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionTitle word="Featured" rest=" homes" eyebrow="Hand-picked this season" />
            <Link href="/properties" className="flex items-center gap-2 text-lg hover:text-primary" data-reveal>
              View all properties <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* Investment Vault */}
      {vault.length > 0 && (
      <section id="vault" className="scroll-mt-24 bg-cream px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <SectionTitle word="Investment" rest=" Vault" eyebrow="Income-ready properties" />
            <p className="text-lg text-muted-foreground" data-reveal>
              Tenanted, fully furnished or in high-growth zones — properties selected for strong, dependable returns from day one.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {vault.map((p) => (
              <Link key={p.id} href={`/properties/${p.id}`} data-reveal
                className="group flex items-center gap-6 rounded-[2rem] bg-background p-4 transition-shadow hover:shadow-soft">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.25rem] md:h-32 md:w-32">
                  <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="flex-1">
                  <p className="text-4xl font-medium tracking-tight text-primary">{p.investment!.yield}%</p>
                  <p className="text-sm text-muted-foreground">Est. annual yield · {p.investment!.label}</p>
                  <p className="mt-3 text-lg font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{formatSAR(p.price)} · {p.city}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Est. rent {formatSAR(p.details?.annualRent ?? 0)}/yr
                    {p.details?.priceGrowth5yr != null && <> · {p.details.priceGrowth5yr}% 5-yr growth</>}
                  </p>
                </div>
                <ArrowUpRight className="mr-3 hidden h-7 w-7 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 md:block" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Other properties */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <SectionTitle word="More" rest=" to explore" />
          <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {otherProperties.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* Info statement */}
      <section className="px-6 py-20">
        <p className="display-md mx-auto max-w-5xl text-center" data-reveal>
          Vision 2030 is reshaping the Kingdom. We place you at the heart of it — with homes and investments in the{" "}
          <span className="text-primary">fastest-growing real estate market</span> in the region.
        </p>
      </section>

      <GigaProjects />

      {/* Process */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle word="How" rest=" we work" eyebrow="Four steps to the keys" />
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.t} className="rounded-[2rem] bg-cream p-8" data-reveal>
                <p className="fancy text-5xl">{i + 1}</p>
                <h3 className="mt-10 text-2xl font-medium tracking-tight">{s.t}</h3>
                <p className="mt-3 text-lg text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyNajm />

      {/* Knowledge Hub */}
      <section id="insights" className="scroll-mt-28 px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionTitle word="Knowledge" rest=" Hub" eyebrow="Guides, market reports and buyer insight" />
            <Link href="/knowledge" className="flex items-center gap-2 text-lg hover:text-primary" data-reveal>
              All articles <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          {articlesLoaded && articles.length === 0 ? (
            <p className="mt-16 text-lg text-muted-foreground">New articles are coming soon.</p>
          ) : (
            <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((a) => (
                <Link key={a.id} href={`/knowledge/${a.id}`} className="group block" data-reveal>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-cream">
                    <img src={a.coverImage || "/images/p1.jpg"} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="glass absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-5 text-sm text-muted-foreground">{a.categoryLabel} · {a.readMinutes} min read</p>
                  <p className="mt-2 text-xl font-medium leading-snug tracking-tight">{a.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ + Contact */}
      <section id="contact" className="scroll-mt-28 px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
          <div>
            <SectionTitle word="Questions" rest="" />
            <div className="mt-12 flex flex-col gap-3">
              {FAQ.map((f, i) => (
                <div key={f.q} className="rounded-[1.75rem] bg-cream" data-reveal>
                  <button className="flex w-full items-center justify-between gap-6 p-6 text-left text-lg font-medium" onClick={() => setFaq(faq === i ? null : i)}>
                    {f.q}
                    {faq === i ? <Minus className="h-6 w-6 shrink-0 text-primary" /> : <Plus className="h-6 w-6 shrink-0 text-primary" />}
                  </button>
                  {faq === i && <p className="px-6 pb-6 text-lg text-muted-foreground">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2.5rem] bg-background p-2 lg:pt-0" data-reveal>
            <h2 className="display-lg"><span className="fancy">Talk</span> to us</h2>
            <p className="mb-10 mt-5 text-lg text-muted-foreground">Tell us what you're looking for — a private advisor will be in touch within 24 hours.</p>
            <EnquiryForm cta="Send message" />
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="px-6 pb-28">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 overflow-hidden rounded-[2.5rem] bg-cream p-10 md:flex-row md:items-center md:p-16" data-reveal>
          <h2 className="display-lg max-w-3xl">Your next <span className="fancy">address</span> is waiting.</h2>
          <Link href="/properties" className="flex shrink-0 items-center gap-3 rounded-full bg-ink px-8 py-4 text-lg text-ink-foreground transition-colors hover:bg-primary">
            Browse properties <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}