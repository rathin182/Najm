import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
let resolveIntro: () => void = () => {};
export const introDone: Promise<void> =
  typeof window === "undefined" ? Promise.resolve() : new Promise<void>((r) => (resolveIntro = r));

export const INTRO_KEY = "najm:intro-seen";
const hasSeenIntro = () => {try {return sessionStorage.getItem(INTRO_KEY) === "1"; } catch {return false; }};
const markIntroSeen = () => {try { sessionStorage.setItem(INTRO_KEY, "1");} catch { /* storage blocked */}};
const LABELS: Record<string, string> = {
  "/": "Home", "/properties": "Properties", "/about": "About", "/knowledge": "Knowledge", "/contact": "Contact", "/admin": "Admin",
};
const labelFor = (path: string) => {
  const clean = path.replace(/\/$/, "") || "/";
  if (LABELS[clean]) return LABELS[clean]!;
  if (clean.startsWith("/properties/")) return "Residence";
  if (clean.startsWith("/admin")) return "Admin";
  return "Najm";
};
const STRIPES = ["bg-background", "bg-primary", "bg-background", "bg-primary"];
type BeatTimeline = { kill: () => void; to: (...args: unknown[]) => BeatTimeline };
export function PageTransition() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("Najm");
  const [count, setCount] = useState(0);
  const [intro, setIntro] = useState(true);
  const busy = useRef(false);
  const beat = useRef<BeatTimeline | null>(null);

  const stripes = () => Array.from(root.current?.querySelectorAll<HTMLElement>("[data-stripe]") ?? []);
  const text = () => root.current?.querySelector<HTMLElement>("[data-label]");
  useEffect(() => {
    if (hasSeenIntro()) {
      setIntro(false);
      if (root.current) root.current.style.visibility = "hidden";
      resolveIntro();
      return;
    }

    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;
      const ready = new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })));
      const c = { v: 0 };
      await Promise.all([
        new Promise<void>((r) => gsap.to(c, { v: 100, duration: 1.4, ease: "power2.inOut", onUpdate: () => setCount(Math.round(c.v)), onComplete: r })),
        Promise.race([ready, new Promise((r) => setTimeout(r, 4000))]),
      ]);
      if (cancelled) return;
      await new Promise<void>((r) => gsap.timeline({ onComplete: r })
        .to(text()!, { yPercent: -120, opacity: 0, duration: 0.5, ease: "power3.in" })
        .to(stripes(), { scaleY: 0, transformOrigin: "50% 0%", duration: 0.8, stagger: 0.09, ease: "power4.inOut" }, "-=0.15"));
      setIntro(false);
      root.current!.style.visibility = "hidden";
      markIntroSeen();
      resolveIntro();
    })();
    return () => { cancelled = true; resolveIntro(); };
  }, []);

  useEffect(() => {
    if (!busy.current) return;
    window.scrollTo(0, 0);
    busy.current = false;
  }, [pathname]);

  return (
    <div ref={root} aria-hidden data-page-transition data-html2canvas-ignore="true" data-liquid-ignore className="pointer-events-none fixed inset-0 z-[100] grid grid-cols-4">
      {STRIPES.map((c, i) => <div key={i} data-stripe className={`${c} h-full w-full origin-bottom`} />)}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden text-ink">
        <div data-label className="text-center">
          <p className="fancy !text-ink text-[clamp(4rem,12vw,10rem)]">{intro ? "Najm" : label}</p>
          {intro && <p className="mt-4 text-lg tabular-nums tracking-[0.3em] opacity-70">{String(count).padStart(3, "0")}</p>}
        </div>
      </div>
    </div>
  );
}