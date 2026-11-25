import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const routeAtLoad = useRef(pathname);
  const root = useRef<HTMLDivElement>(null);
  const routeRoot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("Najm");
  const [count, setCount] = useState(0);
  const [intro, setIntro] = useState(true);
  const busy = useRef(false);
  const beat = useRef<BeatTimeline | null>(null);
  const homeRequestStats = useRef({ started: 0, completed: 0, pending: 0 });
  const previousPath = useRef(pathname);
  const [routeLoading, setRouteLoading] = useState(false);

  useLayoutEffect(() => {
    if (pathname !== "/") return;
    const originalFetch = window.fetch;
    const stats = homeRequestStats.current;
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!url.startsWith("/api/") && !url.startsWith(`${window.location.origin}/api/`)) {
        return originalFetch.call(window, input, init);
      }
      stats.started += 1;
      stats.pending += 1;
      return originalFetch.call(window, input, init).finally(() => {
        stats.completed += 1;
        stats.pending -= 1;
      });
    }) as typeof window.fetch;
    return () => { window.fetch = originalFetch; };
  }, [pathname]);

  const stripes = () => Array.from(root.current?.querySelectorAll<HTMLElement>("[data-stripe]") ?? []);
  const text = () => root.current?.querySelector<HTMLElement>("[data-label]");
  useEffect(() => {
    if (routeAtLoad.current !== "/" && hasSeenIntro()) {
      setIntro(false);
      if (root.current) root.current.style.visibility = "hidden";
      resolveIntro();
      return;
    }

    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;
      if (routeAtLoad.current === "/") {
        let lastStarted = -1;
        let quietSince = 0;
        while (!cancelled) {
          const { started, completed, pending } = homeRequestStats.current;
          if (started !== lastStarted) {
            lastStarted = started;
            quietSince = 0;
          }
          if (started > 0 && pending === 0) {
            if (!quietSince) quietSince = performance.now();
            if (performance.now() - quietSince >= 250) break;
          } else {
            quietSince = 0;
          }
          if (started > 0) setCount((value) => Math.max(value, Math.min(90, Math.floor((completed / (completed + pending)) * 90))));
          await new Promise((resolve) => window.setTimeout(resolve, 50));
        }
        if (cancelled) return;
        setCount(100);
        await new Promise((resolve) => window.setTimeout(resolve, 200));
      } else {
        const c = { v: 0 };
        await new Promise<void>((r) => gsap.to(c, {
          v: 100,
          duration: 0.8,
          ease: "power2.inOut",
          onUpdate: () => setCount(Math.round(c.v)),
          onComplete: r,
        }));
      }
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
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setLabel(labelFor(pathname));
    setRouteLoading(true);
    window.scrollTo(0, 0);

    // The pathname changes when Next has committed the destination route.
    // Keep the overlay visible briefly so the transition reads as intentional.
    const timeout = window.setTimeout(() => {
      const overlay = routeRoot.current;
      if (!overlay) {
        setRouteLoading(false);
        return;
      }
      const animation = overlay.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 260, easing: "ease-out", fill: "forwards" },
      );
      animation.onfinish = () => setRouteLoading(false);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <div ref={root} aria-hidden data-page-transition data-html2canvas-ignore="true" data-liquid-ignore className="pointer-events-none fixed inset-0 z-[100] grid grid-cols-4">
      {STRIPES.map((c, i) => <div key={i} data-stripe className={`${c} h-full w-full origin-bottom`} />)}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden text-ink">
        <div data-label className="text-center">
          <p className="fancy !text-ink text-[clamp(4rem,12vw,10rem)]">{intro ? "Najm" : label}</p>
          {intro && <p className="mt-4 text-lg tabular-nums tracking-[0.3em] opacity-70">{count}</p>}
        </div>
      </div>
      {routeLoading && (
        <div
          ref={routeRoot}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center bg-background/35 text-ink backdrop-blur-xl"
        >
          <div className="rounded-3xl border border-white/50 bg-white/55 px-10 py-8 text-center shadow-xl backdrop-blur-2xl">
            <span className="mx-auto mb-5 block h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
            <p className="fancy text-4xl">Loading</p>
            <p className="mt-2 text-sm tracking-[0.2em] text-muted-foreground">{label}</p>
          </div>
        </div>
      )}
    </div>
  );
}
