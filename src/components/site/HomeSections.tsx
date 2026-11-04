"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatBudget, formatDeadline, type FutureProject } from "@/lib/future-projects";
import { TeamMembers } from "@/components/site/TeamMembers";
import { DEFAULT_WHY_NAJM, splitAccent, type WhyNajmSettingsData } from "@/lib/why-najm";
import { WHY_NAJM_ICONS } from "@/lib/why-najm-icons";
import { CATEGORY_GROUPS, PROPERTY_CATEGORIES, type HomeSearchOptions } from "@/lib/home-search-options";
import { CATEGORY_LABELS, CATEGORY_TYPES } from "@/lib/property-categories";

/** Giga projects: tall sticky stage; vertical scroll progress drives the card track horizontally on desktop (no pinning, so nothing overlaps). */
export function GigaProjects() {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<FutureProject[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const section = outer.current;
    if (!section) return;
    let cancelled = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void fetch("/api/future-projects", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load projects.");
          return response.json() as Promise<FutureProject[]>;
        })
        .then((items) => { if (!cancelled) setProjects(items); })
        .catch(() => { if (!cancelled) setProjects([]); })
        .finally(() => { if (!cancelled) setLoaded(true); });
    }, { rootMargin: "400px" });
    observer.observe(section);
    return () => { cancelled = true; observer.disconnect(); };
  }, []);

  useEffect(() => {
    const el = track.current, sec = outer.current;
    if (!el || !sec) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    let raf = 0;
    const size = () => {
      if (!mq.matches) { sec.style.height = ""; el.style.transform = ""; return; }
      sec.style.height = `${window.innerHeight + Math.max(0, el.scrollWidth - window.innerWidth)}px`;
      update();
    };
    const update = () => {
      if (!mq.matches) return;
      const dist = Math.max(0, el.scrollWidth - window.innerWidth);
      const top = sec.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, -top / Math.max(1, dist)));
      el.style.transform = `translate3d(${-p * dist}px,0,0)`;
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    size();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    mq.addEventListener("change", size);
    const t = setTimeout(size, 600);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", size); mq.removeEventListener("change", size); clearTimeout(t); cancelAnimationFrame(raf); };
  }, [projects]);

  if (loaded && projects.length === 0) return null;

  return (
    <section ref={outer} id="projects" className="relative bg-ink text-ink-foreground">
      <div className="overflow-hidden py-16 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <p className="mb-4 text-lg opacity-60">Upcoming & under construction</p>
          <h2 className="display-lg">The <span className="fancy">Sovereign</span> Giga Projects</h2>
        </div>
        <div ref={track} className="mt-10 flex gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] will-change-transform lg:w-max lg:overflow-visible lg:px-[max(1.5rem,calc((100vw-1440px)/2+1.5rem))]">
          {projects.map((project, index) => (
            <article key={project.id} className="group relative h-[70svh] min-h-[460px] w-[86vw] shrink-0 overflow-hidden rounded-[2.5rem] lg:h-[64svh] lg:w-[min(60rem,70vw)]">
              <img src={project.image} alt={project.imageAlt || project.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
              <p className="absolute left-8 top-6 text-7xl font-medium tracking-tighter text-ink-foreground/85 md:text-8xl">{String(index + 1).padStart(2, "0")}</p>
              <div className="absolute inset-x-3 bottom-3 grid gap-6 rounded-[2rem] bg-ink/35 p-6 backdrop-blur-md md:inset-x-5 md:bottom-5 md:grid-cols-[1.4fr_1fr] md:p-8">
                <div>
                  <p className="text-sm opacity-80">{project.status} · {project.region}</p>
                  <h3 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">{project.name}</h3>
                  <p className="mt-3 max-w-xl text-base opacity-85">{project.text}</p>
                </div>
                <div className="flex flex-col justify-between gap-5">
                  <dl className="grid grid-cols-2 gap-4">
                    <div><dt className="text-sm opacity-70">Est. deadline</dt><dd className="mt-1 text-lg font-medium">{formatDeadline(project)}</dd></div>
                    <div><dt className="text-sm opacity-70">Budget</dt><dd className="mt-1 text-lg font-medium">{project.budget === null ? "Not disclosed" : formatBudget(project.budget)}</dd></div>
                  </dl>
                  <a href="#contact" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base text-primary-foreground transition-colors hover:bg-background hover:text-foreground">
                    Register interest <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
          {!loaded && Array.from({ length: 3 }, (_, index) => (
            <div key={`loading-${index}`} aria-hidden className="h-[70svh] min-h-[460px] w-[86vw] shrink-0 animate-pulse rounded-[2.5rem] bg-ink-foreground/10 lg:h-[64svh] lg:w-[min(60rem,70vw)]" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Title with one accented word, e.g. "Six <promises> behind every deal". */
function AccentTitle({ title, accent, className = "" }: { title: string; accent: string; className?: string }) {
  const [before, match, after] = splitAccent(title, accent);
  return <>{before}{match && <span className={`fancy ${className}`}>{match}</span>}{after}</>;
}

const CATEGORY_IMAGES = { residential: "/images/p2.jpg", commercial: "/images/p3.jpg" } as const;
const MAX_TYPES_SHOWN = 5;

/** Residential / Commercial cards. Their property types come from Admin → Search filters (the homepage Property type options). */
function PropertyTypeCards() {
  const [options, setOptions] = useState<Pick<HomeSearchOptions, "residentialTypes" | "commercialTypes"> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/home-search-options", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<HomeSearchOptions>) : Promise.reject(new Error("Could not load property types."))))
      .then((data) => { if (!cancelled) setOptions(data); })
      .catch((error) => console.error("Property types could not be loaded", error));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PROPERTY_CATEGORIES.map((category) => {
        const items = options
          ? options[CATEGORY_GROUPS[category]]
          : CATEGORY_TYPES[category].map((value) => ({ value, label: value }));
        const extra = items.length - MAX_TYPES_SHOWN;
        const href = `/properties?category=${category}`;
        const pill = "rounded-full bg-background px-4 py-0.5 text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground";
        return (
          <div key={category} className="flex gap-5 rounded-[2rem] bg-cream p-3" data-reveal>
            <Link href={href} aria-label={`Browse ${CATEGORY_LABELS[category]} properties`} className="shrink-0">
              <img src={CATEGORY_IMAGES[category]} alt={CATEGORY_LABELS[category]} loading="lazy" className="h-32 w-32 rounded-[1.5rem] object-cover md:h-40 md:w-40" />
            </Link>
            <div className="flex-1 py-3 pr-3">
              <Link href={href} className="group flex items-center justify-between gap-3 text-xl font-medium">
                {CATEGORY_LABELS[category]}
                <ArrowUpRight className="h-5 w-5 text-primary opacity-60 transition-opacity group-hover:opacity-100" />
              </Link>
              {items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {items.slice(0, MAX_TYPES_SHOWN).map((item) => (
                    <Link key={item.value} href={`${href}&type=${encodeURIComponent(item.value)}`} className={pill}>{item.label}</Link>
                  ))}
                  {extra > 0 && <Link href={href} className={`${pill} text-primary`}>+{extra} more</Link>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Why Najm: green intro + stats, cream service pillars, white features + team. Intro, stats and promises are managed in Admin → Why Najm / Promises. */
export function WhyNajm() {
  const [s, setS] = useState<WhyNajmSettingsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/why-najm", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load Why Najm.");
        return response.json() as Promise<WhyNajmSettingsData>;
      })
      .then((data) => { if (!cancelled) setS(data); })
      .catch((error) => {
        console.error("Why Najm could not be loaded", error);
        if (!cancelled) setS(DEFAULT_WHY_NAJM);
      });
    return () => { cancelled = true; };
  }, []);

  // Hold the space until the admin's content arrives, so default text never flashes first.
  if (!s) return <section id="why-najm" aria-hidden className="min-h-[70vh]" />;

  return (
    <section id="why-najm" className="scroll-mt-24">
      <div className="bg-primary px-6 py-24 text-primary-foreground">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <h2 className="display-lg" data-reveal>
              {s.headingAccent && <><span className="fancy !text-primary-foreground">{s.headingAccent}</span>{" "}</>}{s.heading}
            </h2>
            {s.intro && <p className="text-xl opacity-80" data-reveal>{s.intro}</p>}
          </div>
          {s.stats.length > 0 && (
            <div className="mt-16 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
              {s.stats.map((stat, i) => (
                <div key={`${stat.label}-${i}`} data-reveal>
                  <p className="display-lg">{stat.value}</p>
                  <p className="mt-3 text-lg opacity-75">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {s.pillars.length > 0 && (
        <div className="bg-cream px-6 py-24">
          <div className="mx-auto max-w-[1440px]">
            {s.pillarsTitle && (
              <h3 className="display-md max-w-2xl" data-reveal><AccentTitle title={s.pillarsTitle} accent={s.pillarsAccent} /></h3>
            )}
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {s.pillars.map((p, i) => {
                const Icon = WHY_NAJM_ICONS[p.icon] ?? WHY_NAJM_ICONS.BadgeCheck;
                return (
                  <div key={`${p.title}-${i}`} className="rounded-[2rem] bg-background p-8 transition-transform duration-500 hover:-translate-y-1" data-reveal>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="h-6 w-6" /></span>
                    <h4 className="mt-10 text-2xl font-medium tracking-tight">{p.title}</h4>
                    {p.description && <p className="mt-3 text-base text-muted-foreground">{p.description}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-background px-6 py-12">
        <div className="mx-auto max-w-[1440px]">
          <PropertyTypeCards />

          <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
            <h3 className="display-md" data-reveal>The <span className="fancy">people</span> behind Najm</h3>
            <Link href="/about" className="flex items-center gap-2 text-lg text-primary hover:opacity-70" data-reveal>Meet the full team <ArrowUpRight className="h-5 w-5" /></Link>
          </div>
          <div className="mt-10">
            <TeamMembers />
          </div>
        </div>
      </div>
    </section>
  );
}