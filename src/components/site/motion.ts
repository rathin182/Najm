import { useEffect, useRef } from "react";

/** Fade/slide in reveal elements, initializing only nodes added since the last scan. */
// export function useReveal(deps: unknown[] = []) {
//   const initialized = useRef(new WeakSet<HTMLElement>());
//   useEffect(() => {
//     let ctx: { add: (callback: () => void) => void; revert: () => void } | undefined;
//     let cancelled = false;
//     let observer: MutationObserver | undefined;
//     (async () => {
//       const { gsap } = await import("gsap");
//       const { ScrollTrigger } = await import("gsap/ScrollTrigger");
//       if (cancelled) return;
//       gsap.registerPlugin(ScrollTrigger);
//       const initialize = (nodes: Iterable<HTMLElement>) => {
//         const pending = Array.from(nodes).filter((el) => !initialized.current.has(el));
//         if (!pending.length || cancelled) return;
//         ctx ??= gsap.context(() => {});
//         ctx.add(() => {
//           pending.forEach((el) => {
//             initialized.current.add(el);
//             gsap.fromTo(
//               el,
//               { y: 60, opacity: 0 },
//               { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 90%" } },
//             );
//           });
//         });
//         // Refresh only the triggers just added, rather than recalculating every
//         // ScrollTrigger on the page after each filter or pagination update.
//         ScrollTrigger.refresh(true);
//       };
//       const scan = (root: ParentNode) => {
//         const matches = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
//         if (root instanceof HTMLElement && root.matches("[data-reveal]")) matches.unshift(root);
//         initialize(matches);
//       };
//       scan(document);
//       observer = new MutationObserver((records) => {
//         records.forEach((record) => record.addedNodes.forEach((node) => {
//           if (node instanceof HTMLElement) scan(node);
//         }));
//       });
//       observer.observe(document.body, { childList: true, subtree: true });
//     })();
//     return () => {
//       cancelled = true;
//       observer?.disconnect();
//       ctx?.revert();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, deps);
// }

/** Fade/slide in [data-reveal] elements once, when they scroll into view. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        (entry.target as HTMLElement).animate(
          [{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "none" }],
          { duration: 700, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" },
        );
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    const scan = (root: ParentNode) => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (root instanceof HTMLElement && root.matches("[data-reveal]")) nodes.unshift(root);
      nodes.forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
    };
    scan(document);
    // Batched once per frame; only scans nodes that were just added.
    const pending = new Set<HTMLElement>();
    let frame = 0;
    const mo = new MutationObserver((records) => {
      records.forEach((r) => r.addedNodes.forEach((n) => { if (n instanceof HTMLElement) pending.add(n); }));
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; pending.forEach(scan); pending.clear(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); if (frame) cancelAnimationFrame(frame); };
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
