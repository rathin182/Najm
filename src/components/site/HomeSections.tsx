"use client";
import { useEffect, useRef } from "react";
import { ArrowUpRight, BadgeCheck, Building2, Handshake, Landmark, LineChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { GIGA_PROJECTS } from "@/data/properties";
import { TEAM } from "@/data/site";
const office = '/images/office.jpg';
const p2 = '/images/p2.jpg';
const p3 = '/images/p3.jpg';

/** Giga projects: tall sticky stage; vertical scroll progress drives the card track horizontally on desktop (no pinning, so nothing overlaps). */
export function GigaProjects() {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

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
  }, []);

  return (
    <section ref={outer} id="projects" className="relative bg-ink text-ink-foreground">
      <div className="overflow-hidden py-16 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <p className="mb-4 text-lg opacity-60">Upcoming & under construction</p>
          <h2 className="display-lg">The <span className="fancy">Sovereign</span> Giga Projects</h2>
        </div>
        <div ref={track} className="mt-10 flex gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] will-change-transform lg:w-max lg:overflow-visible lg:px-[max(1.5rem,calc((100vw-1440px)/2+1.5rem))]">
          {GIGA_PROJECTS.map((g, i) => (
            <article key={g.name} className="group relative h-[70svh] min-h-[460px] w-[86vw] shrink-0 overflow-hidden rounded-[2.5rem] lg:h-[64svh] lg:w-[min(60rem,70vw)]">
              <img src={g.image} alt={g.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
              <p className="absolute left-8 top-6 text-7xl font-medium tracking-tighter text-ink-foreground/85 md:text-8xl">0{i + 1}</p>
              <div className="absolute inset-x-3 bottom-3 grid gap-6 rounded-[2rem] bg-ink/35 p-6 backdrop-blur-md md:inset-x-5 md:bottom-5 md:grid-cols-[1.4fr_1fr] md:p-8">
                <div>
                  <p className="text-sm opacity-80">{g.status} · {g.region}</p>
                  <h3 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">{g.name}</h3>
                  <p className="mt-3 max-w-xl text-base opacity-85">{g.text}</p>
                </div>
                <div className="flex flex-col justify-between gap-5">
                  <dl className="grid grid-cols-2 gap-4">
                    <div><dt className="text-sm opacity-70">Est. deadline</dt><dd className="mt-1 text-lg font-medium">{g.deadline}</dd></div>
                    <div><dt className="text-sm opacity-70">Budget</dt><dd className="mt-1 text-lg font-medium">{g.budget}</dd></div>
                  </dl>
                  <a href="#contact" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base text-primary-foreground transition-colors hover:bg-background hover:text-foreground">
                    Register interest <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { n: "18+", t: "Years of local expertise" },
  { n: "SAR 6B", t: "In property transacted" },
  { n: "2,400+", t: "Families and investors housed" },
  { n: "4.9/5", t: "Average client rating" },
];

const PILLARS = [
  { icon: BadgeCheck, t: "100% verified listings", d: "Every title deed, building permit and developer licence is checked against Ejar and REGA records before a home reaches you." },
  { icon: Landmark, t: "Off-market access", d: "Around a third of our sales never appear online — private releases from developers and families who trust our discretion." },
  { icon: LineChart, t: "Investment intelligence", d: "Yield forecasts, rental comparables and Vision 2030 pipeline data for every property, so decisions rest on numbers." },
  { icon: Handshake, t: "Financing made simple", d: "Sharia-compliant mortgages arranged with leading Saudi banks, including options for eligible non-residents." },
  { icon: ShieldCheck, t: "Legal & handover", d: "REGA-compliant contracts, escrow-protected payments, snagging inspections and utility setup — all handled." },
  { icon: Building2, t: "After-sale care", d: "Property management, leasing and resale support, so your home keeps performing long after the keys change hands." },
];

/** Why Najm: green intro + stats, cream service pillars, white lounge + team. */
export function WhyNajm() {
  return (
    <section>
      <div className="bg-primary px-6 py-24 text-primary-foreground">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <h2 className="display-lg" data-reveal><span className="fancy !text-primary-foreground">Why</span> Najm?</h2>
            <p className="text-xl opacity-80" data-reveal>
              We are a Riyadh-born advisory built for one thing: helping families and investors own the right Saudi address with total confidence — from first viewing to long after handover.
            </p>
          </div>
          <div className="mt-16 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.t} data-reveal>
                <p className="display-lg">{s.n}</p>
                <p className="mt-3 text-lg opacity-75">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-cream px-6 py-24">
        <div className="mx-auto max-w-[1440px]">
          <h3 className="display-md max-w-2xl" data-reveal>Six <span className="fancy">promises</span> behind every deal</h3>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.t} className="rounded-[2rem] bg-background p-8 transition-transform duration-500 hover:-translate-y-1" data-reveal>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><p.icon className="h-6 w-6" /></span>
                <h4 className="mt-10 text-2xl font-medium tracking-tight">{p.t}</h4>
                <p className="mt-3 text-base text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background px-6 py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem]" data-reveal>
              <img src={office} alt="Najm Estate client lounge in Riyadh" loading="lazy" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-5 bottom-5 rounded-[1.75rem] bg-background p-6 md:max-w-md">
                <p className="text-sm text-muted-foreground">Our flagship lounge</p>
                <p className="mt-1 text-xl font-medium tracking-tight">King Fahd Road, Riyadh — private viewings by appointment, seven days a week.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[[p2, "Villa sourcing", "Off-market villas in Al Malqa, Hittin and Diriyah."], [p3, "Coastal homes", "Red Sea and Corniche residences with sea frontage."]].map(([img, t, d]) => (
                <div key={t} className="flex gap-5 rounded-[2rem] bg-cream p-3" data-reveal>
                  <img src={img} alt={t} loading="lazy" className="h-32 w-32 shrink-0 rounded-[1.5rem] object-cover md:h-40 md:w-40" />
                  <div className="py-3 pr-3"><p className="text-xl font-medium">{t}</p><p className="mt-2 text-muted-foreground">{d}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-24 flex flex-wrap items-end justify-between gap-6">
            <h3 className="display-md" data-reveal>The <span className="fancy">people</span> behind Najm</h3>
            <Link href="/about" className="flex items-center gap-2 text-lg text-primary hover:opacity-70" data-reveal>Meet the full team <ArrowUpRight className="h-5 w-5" /></Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m) => (
              <div key={m.name} data-reveal>
                <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-cream">
                  <img src={m.img} alt={m.name} loading="lazy" width={768} height={960} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <p className="mt-4 text-xl font-medium">{m.name}</p>
                <p className="text-muted-foreground">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
