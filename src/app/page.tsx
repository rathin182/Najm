"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, MapPin, Plus, Minus, Search, Wallet, BedDouble, CheckCircle2 } from "lucide-react";
const hero = '/images/heroanother.jpeg';
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
  const [homeSearchOptions, setHomeSearchOptions] = useState<HomeSearchOptions>({
    locations: [],
    residentialTypes: [],
    commercialTypes: [],
    bedrooms: [],
    budgets: [],
    statuses: [],
  });

  const [locs, setLocs] = useState<string[]>([]);
  const [type, setType] = useState("");
  const [category, setCategory] = useState<PropertyCategoryKey | undefined>(undefined);
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [status, setStatus] = useState("");

  // Load filter options (unchanged)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/home-search-options", { cache: "no-store" })
      .then((response) =>
        response.ok
          ? (response.json() as Promise<HomeSearchOptions>)
          : Promise.reject(new Error("Could not load homepage search filters."))
      )
      .then((options) => {
        if (!cancelled) setHomeSearchOptions(options);
      })
      .catch((error) => console.error("Homepage search filters could not be loaded", error));
    return () => {
      cancelled = true;
    };
  }, []);

  // Submit search (unchanged logic)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const city of locs) params.append("city", city);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    if (budget) params.set("budget", budget);
    if (bedrooms) params.set("beds", bedrooms);
    if (status) params.set("status", status.toLowerCase() === "off-plan" ? "Off-plan" : "Ready");
    const query = params.toString();
    router.push(query ? `/properties?${query}` : "/properties");
  };

  return (
    <section className="relative isolate flex min-h-[70svh] items-center justify-center overflow-hidden px-4 pb-16 pt-28">
      {/* Background image + dark overlay */}
      <img
        src={hero}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/35 to-black/65" />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <h1 className="text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          Find Home. Invest Smart. Build Wealth.
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
          Curated residences and investment property across the Kingdom.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mt-10 w-full">
          <div className="grid gap-1 rounded-3xl border border-border/50 bg-cream p-2 shadow-xl lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.1fr_auto] lg:items-center lg:gap-0 lg:rounded-full lg:border-white/25 lg:bg-ink/55 lg:px-2.5 lg:py-2 lg:text-left lg:backdrop-blur-xl">
            <HeroDropdown
              icon={MapPin}
              label="Location"
              noun="locations"
              multiple
              searchable
              searchPlaceholder="Search location…"
              separator={false}
              options={cleanOptions(homeSearchOptions.locations)}
              anyLabel="Any location"
              values={locs}
              onChange={setLocs}
            />
            <HeroPropertyType
              category={category}
              type={type}
              typesByCategory={{
                residential: cleanOptions(homeSearchOptions[CATEGORY_GROUPS.residential]),
                commercial: cleanOptions(homeSearchOptions[CATEGORY_GROUPS.commercial]),
              }}
              onChange={(nextCategory, nextType) => {
                setCategory(nextCategory);
                setType(nextType);
              }}
            />
            <HeroDropdown
              icon={BedDouble}
              label="Bedrooms"
              options={cleanOptions(homeSearchOptions.bedrooms)}
              anyLabel="Any bedrooms"
              values={bedrooms ? [bedrooms] : []}
              onChange={(next) => setBedrooms(next[0] ?? "")}
            />
            <HeroDropdown
              icon={Wallet}
              label="Price range (SAR)"
              options={cleanOptions(homeSearchOptions.budgets)}
              anyLabel="Any price"
              values={budget ? [budget] : []}
              onChange={(next) => setBudget(next[0] ?? "")}
            />
            <HeroDropdown
              icon={CheckCircle2}
              label="Property status"
              options={cleanOptions(homeSearchOptions.statuses)}
              anyLabel="Any status"
              values={status ? [status] : []}
              onChange={(next) => setStatus(next[0] ?? "")}
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-background hover:text-foreground lg:my-0.5 lg:mr-0.5"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
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

type DestinationSummary = { id: string; name: string; image: string | null; description: string; views: number; propertyCount: number };
type FeaturedCity = { id: string; name: string; image: string | null };

function Home() {
  useReveal();
  const [articles, setArticles] = useState<HomeArticle[]>([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [featuredCities, setFeaturedCities] = useState<FeaturedCity[]>([]);
  const [topDestinations, setTopDestinations] = useState<DestinationSummary[]>([]);
  const [vault, setVault] = useState<AdminProperty[]>([]);

  const featuredProperties = featured.filter((property) => property.featuredPlacement !== "PROJECTS");
  const featuredProjects = featured.filter((property) => property.featuredPlacement === "PROJECTS");

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
    fetch("/api/locations/featured", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load featured cities.");
        return response.json() as Promise<FeaturedCity[]>;
      })
      .then((cities) => { if (!cancelled && Array.isArray(cities)) setFeaturedCities(cities); })
      .catch((error) => console.error("Homepage featured cities could not be loaded", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/destinations?limit=5")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load destinations.");
        return response.json() as Promise<DestinationSummary[]>;
      })
      .then((destinations) => { if (!cancelled && Array.isArray(destinations)) setTopDestinations(destinations); })
      .catch((error) => console.error("Homepage destinations could not be loaded", error));

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
    <main className="w-full min-w-0 max-w-full overflow-x-clip">
      <Hero />

      {/* Featured */}
      {/* <section id="featured" className="scroll-mt-24 px-6 py-20">
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
      </section> */}

      {/* Featured cities */}
      {featuredCities.length > 0 && <section id="featured-cities" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionTitle word="Featured" rest=" cities" eyebrow="Explore our featured destinations" />
            {/* <Link href="/properties" className="flex items-center gap-2 text-lg hover:text-primary" data-reveal>
              Explore properties <ArrowUpRight className="h-5 w-5" />
            </Link> */}
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCities.map((city) => (
              <Link key={city.id} href={`/properties?city=${encodeURIComponent(city.name)}`} className="group relative block aspect-[5/6] overflow-hidden rounded-[1.75rem] bg-secondary" data-reveal>
                {city.image ? (
                  <img src={city.image} alt={city.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-cream to-secondary"><MapPin className="h-10 w-10 text-primary" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
                  <h3 className="text-2xl font-medium tracking-tight">{city.name}</h3>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight className="h-5 w-5" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>}

      {/* Featured projects */}
      {featuredProjects.length > 0 && <section id="featured-projects" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionTitle word="Featured" rest=" projects" eyebrow="Discover our featured developments" />
            <Link href="/properties" className="flex items-center gap-2 text-lg hover:text-primary" data-reveal>
              View all projects <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProjects.map((p) => <PropertyCard key={`project-${p.id}`} p={p} />)}
          </div>
        </div>
      </section>}

      {/* Featured properties */}
      {featuredProperties.length > 0 && <section id="featured-properties" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionTitle word="Featured" rest=" properties" eyebrow="Hand-picked homes and land" />
            <Link href="/properties" className="flex items-center gap-2 text-lg hover:text-primary" data-reveal>
              View all properties <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProperties.map((p) => <PropertyCard key={`property-${p.id}`} p={p} />)}
          </div>
        </div>
      </section>}

      {/* Investment Vault */}
      {/* {vault.length > 0 && (
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
      )} */}

      {/* Top destinations ranked by combined views across their live properties */}
      {topDestinations.length > 0 && <section className="px-6 py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle word="Explore" rest=" destinations" eyebrow="Ranked by views across their properties" />
            <Link href="/destinations" className="flex items-center gap-2 text-lg hover:text-primary" data-reveal>View all destinations <ArrowUpRight className="h-5 w-5" /></Link>
          </div>
          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {topDestinations.map((destination) => (
              <Link key={destination.id} href={`/destinations/${destination.id}`} className="group block" data-reveal>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-secondary">
                  {destination.image && <img src={destination.image} alt={destination.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-white/75">Explore destination</p>
                      <h3 className="text-3xl font-medium tracking-tight">{destination.name}</h3>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight className="h-5 w-5" /></span>
                  </div>
                </div>
                {destination.description && <p className="mt-4 line-clamp-2 px-1 text-sm text-muted-foreground">{destination.description}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>}

      {/* Info statement */}
      {/* <section className="px-6 py-20">
        <p className="display-md mx-auto max-w-5xl text-center" data-reveal>
          Vision 2030 is reshaping the Kingdom. We place you at the heart of it — with homes and investments in the{" "}
          <span className="text-primary">fastest-growing real estate market</span> in the region.
        </p>
      </section> */}

      <GigaProjects />

      {/* Process */}
      {/* <section className="px-6 py-20">
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
      </section> */}

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
