import { useEffect } from "react";

/** Fade/slide in every [data-reveal] element as it enters the viewport. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 90%" } },
          );
        });
      });
      ScrollTrigger.refresh();
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

type LiquidFn = ((o: Record<string, unknown>) => unknown) & { syncWith?: (o: Record<string, unknown>) => void };

type Lens = { destroy?: () => void };

/**
 * Apply liquidGL (npm `liquid-gl`) glass to every element matching `target`.
 * Lens elements are empty decorative layers, so real content stays visible and clickable even if WebGL fails;
 * their `glass` class doubles as the CSS fallback.
 */
export function useLiquidGlass(target: string, extra: Record<string, unknown> = {}) {
  useEffect(() => {
    let cancelled = false;
    let lenses: Lens[] = [];
    const t = setTimeout(async () => {
      try {
        // Wait for the loader to lift so the glass snapshot never captures its stripes.
        const { introDone } = await import("./PageTransition");
        await introDone;
        // Also wait out any route-change stripes still covering the page.
        for (let i = 0; i < 40; i++) {
          const cover = document.querySelector<HTMLElement>("[data-liquid-ignore]");
          if (!cover || cover.style.visibility === "hidden") break;
          await new Promise((r) => setTimeout(r, 100));
        }
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
        const mod = await import("liquid-gl");
        const liquidGL = ((mod as { default?: unknown }).default ?? mod) as LiquidFn;
        if (cancelled || typeof liquidGL !== "function" || !document.querySelector(target)) return;
        const res = liquidGL({
          snapshot: "body", resolution: 2, refraction: 0.012, bevelDepth: 0.1, bevelWidth: 0.18,
          frost: 3, shadow: false, specular: true, reveal: "fade", ...extra, target,
        });
        lenses = (Array.isArray(res) ? res : res ? [res] : []) as Lens[];
        const { gsap } = await import("gsap");
        const lenis = (window as unknown as { __lenis?: unknown }).__lenis;
        liquidGL.syncWith?.({ gsap, ...(lenis ? { lenis } : {}) });
      } catch (e) {
        console.warn("liquidGL unavailable, using CSS glass", e);
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
      lenses.forEach((l) => l.destroy?.());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
}
