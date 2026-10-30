"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { toast } from "sonner";

export function SmoothScroll() {
  useEffect(() => {
    let lenis: import("lenis").default | undefined;
    let tick: ((t: number) => void) | undefined;
    let gsapRef: typeof import("gsap").gsap | undefined;
    (async () => {
      const Lenis = (await import("lenis")).default;
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      gsapRef = gsap;
      const l = new Lenis({ duration: 1.2, smoothWheel: true });
      lenis = l;
      (window as unknown as { __lenis?: unknown }).__lenis = l;
      l.on("scroll", ScrollTrigger.update);
      tick = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    })();
    return () => {
      if (tick && gsapRef) gsapRef.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);
  return null;
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const link = "rounded-full px-4 py-2 text-sm transition-colors hover:bg-background/60";
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className={`relative mx-auto flex max-w-[1440px] items-center justify-between rounded-full py-2 pl-6 pr-2 transition-colors duration-500 ${scrolled ? "bg-background/45" : "bg-background/70"}`}>
        <span aria-hidden className="lg-nav glass pointer-events-none absolute inset-0 rounded-full" />
        <Link href="/" className="relative z-10 flex items-baseline text-lg font-medium tracking-tight">
          <span className="fancy text-2xl">Najm</span>&nbsp;Estate
        </Link>
        <div className="relative z-10 hidden items-center gap-1 md:flex">
          <Link href="/" className={`${link} ${pathname === "/" ? "bg-background/70" : ""}`}>Home</Link>
          <Link href="/properties" className={`${link} ${pathname.startsWith("/properties") ? "bg-background/70" : ""}`}>Properties</Link>
          <a href="/#vault" className={link}>Invest</a>
          <a href="/#projects" className={link}>Giga Projects</a>
          <Link href="/knowledge" className={`${link} ${pathname === "/knowledge" ? "bg-background/70" : ""}`}>Knowledge Hub</Link>
          <Link href="/about" className={`${link} ${pathname === "/about" ? "bg-background/70" : ""}`}>About</Link>
          <Link href="/contact" className={`${link} ${pathname === "/contact" ? "bg-background/70" : ""}`}>Contact</Link>
        </div>
        <Link href="/contact" className="relative z-10 hidden items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-ink-foreground transition-colors hover:bg-primary md:flex">
          Book a viewing <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button className="relative z-10 rounded-full bg-ink p-2.5 text-ink-foreground md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <div className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-3 rounded-[1.5rem] p-6 text-lg md:hidden">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/properties" onClick={() => setOpen(false)}>Properties</Link>
          <a href="/#vault" onClick={() => setOpen(false)}>Invest</a>
          <Link href="/knowledge" onClick={() => setOpen(false)}>Knowledge Hub</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const cols: { title: string; links: { label: string; href?: string; city?: string }[] }[] = [
      { title: "Explore", links: [
      { label: "Home", href: "/" }, { label: "Properties", href: "/properties" }, { label: "Investment Vault", href: "/#vault" },
      { label: "Giga Projects", href: "/#projects" }, { label: "Knowledge Hub", href: "/knowledge" } ] },
    { title: "Company", links: [{ label: "About us", href: "/about" }, { label: "Contact", href: "/contact" }, { label: "Careers", href: "/about" }, { label: "Press", href: "/about" }] },
    { title: "Cities", links: ["Riyadh", "Jeddah", "Dammam", "AlUla"].map((c) => ({ label: c, city: c })) },
  ];
  const linkCls = "group inline-flex items-center gap-2 text-ink-foreground/80 transition-colors hover:text-ink-foreground";
  const dot = <span className="h-1.5 w-0 rounded-full bg-primary transition-all duration-300 group-hover:w-3" />;
  return (
    <footer className="px-3 pb-3">
      <div className="overflow-hidden rounded-[2rem] bg-ink text-ink-foreground">
        {/* CTA band */}
        <div className="grid gap-8 bg-primary px-6 py-14 text-primary-foreground md:grid-cols-[1.4fr_1fr] md:items-end md:px-12">
          <h2 className="display-lg max-w-2xl">Find the address that <span className="fancy !text-primary-foreground">defines</span> you.</h2>
          <div className="flex flex-col gap-4 md:items-end">
            <p className="max-w-sm text-primary-foreground/80 md:text-right">Speak to an advisor today — private viewings across Riyadh, Jeddah and beyond.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition-transform hover:-translate-y-0.5">Book a consultation</Link>
              <Link href="/properties" className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground transition-transform hover:-translate-y-0.5">Browse homes</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-16 md:px-12">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
            <div>
              <Link href="/" className="text-3xl font-semibold tracking-tight">Najm<span className="fancy !text-primary"> Estate</span></Link>
              <p className="mt-4 max-w-sm text-ink-foreground/60">Curated residences and investment opportunities across the Kingdom.</p>
              <form
                className="mt-8 flex max-w-md items-center gap-2 rounded-full bg-ink-foreground/10 p-1.5"
                onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset(); toast.success("Subscribed — welcome to Najm."); }}
              >
                <input type="email" required placeholder="Email for private listings" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-ink-foreground/50" />
                <button className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-colors hover:bg-ink-foreground hover:text-ink">Subscribe</button>
              </form>
              <div className="mt-8 grid max-w-md grid-cols-2 gap-4 text-sm">
                <a href="tel:+966110000000" className="rounded-2xl bg-ink-foreground/5 p-4 transition-colors hover:bg-ink-foreground/10"><span className="block text-ink-foreground/50">Call</span>+966 11 000 0000</a>
                <a href="mailto:hello@najmestate.sa" className="rounded-2xl bg-ink-foreground/5 p-4 transition-colors hover:bg-ink-foreground/10"><span className="block text-ink-foreground/50">Email</span>hello@najmestate.sa</a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
              {cols.map((c) => (
                <div key={c.title} className="flex flex-col gap-3.5">
                  <p className="mb-1 text-ink-foreground/45">{c.title}</p>
                  {c.links.map((l) => l.city ? (
                    <Link key={l.label} href={`/properties?city=${encodeURIComponent(l.city)}`} className={linkCls}>{dot}{l.label}</Link>
                  ) : l.href ? (
                    <Link key={l.label} href={l.href} className={linkCls}>{dot}{l.label}</Link>
                  ) : null)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 bg-ink py-6 text-sm text-ink-foreground/50" style={{ boxShadow: "0 -1px 0 0 color-mix(in oklab, var(--ink-foreground) 10%, transparent)" }}>
            <p>© 2026 Najm Estate · Licensed by REGA · King Fahd Rd, Riyadh</p>
            <div className="flex gap-2">
              {["Instagram", "LinkedIn", "X"].map((s) => (
                <a key={s} href="#" className="rounded-full bg-ink-foreground/5 px-4 py-2 transition-colors hover:bg-primary hover:text-primary-foreground">{s}</a>
              ))}
            </div>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full bg-ink-foreground/5 px-4 py-2 transition-colors hover:bg-ink-foreground hover:text-ink">Back to top ↑</button>
          </div>
        </div>
        <p className="pointer-events-none -mb-[0.22em] select-none text-center leading-none" style={{ fontSize: "clamp(5rem, 19vw, 18rem)" }}>
          <span className="fancy !text-primary">Najm</span>
        </p>
      </div>
    </footer>
  );
}

export function SectionTitle({ word, rest, eyebrow, className = "" }: { word: string; rest: string; eyebrow?: string; className?: string }) {
  return (
    <div className={className} data-reveal>
      {eyebrow && <p className="mb-3 text-sm text-muted-foreground">{eyebrow}</p>}
      <h2 className="display-lg">
        <span className="fancy">{word}</span>{rest}
      </h2>
    </div>
  );
}
