"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TeamMembers } from "@/components/site/TeamMembers";
import { useReveal } from "@/components/site/motion";
import type { AboutSection } from "@/lib/about-sections";

export function AboutPageSections() {
  const root = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void fetch("/api/about/sections", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) throw new Error("Could not load About sections.");
            return response.json() as Promise<AboutSection[]>;
          })
          .then((items) => {
            if (!cancelled) setSections(items);
          })
          .catch(() => {
            if (!cancelled) setSections([]);
          })
          .finally(() => {
            if (!cancelled) setLoaded(true);
          });
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  useReveal([sections]);

  if (!loaded) {
    return (
      <div ref={root} className="space-y-8" aria-label="Loading About sections">
        <div className="h-20 max-w-4xl animate-pulse rounded-xl bg-cream" />
        <div className="h-7 max-w-2xl animate-pulse rounded-xl bg-cream" />
        <div className="aspect-[16/8] animate-pulse rounded-[2rem] bg-cream" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div ref={root} className="py-16 text-muted-foreground">
        About content is temporarily unavailable.
      </div>
    );
  }

  return (
    <div ref={root} className="space-y-20 md:space-y-28">
      {[...sections]
        .sort((a, b) => a.order - b.order)
        .map((section, index) => {
          const heading =
            section.title &&
            (index === 0 ? (
              <h1 className="display-xl max-w-5xl" data-reveal>
                {section.title}
              </h1>
            ) : (
              <h2 className="display-lg max-w-5xl" data-reveal>
                {section.title}
              </h2>
            ));
          const button =
            section.buttonLabel && section.buttonDestination ? (
              <Link
                href={section.buttonDestination}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-base text-ink-foreground transition-colors hover:bg-primary"
                data-reveal
              >
                {section.buttonLabel}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null;

          if (section.type === "HERO_IMAGE") {
            return (
              <section key={section.id}>
                {heading}
                {section.description && (
                  <p className="mt-8 max-w-2xl text-xl text-muted-foreground" data-reveal>
                    {section.description}
                  </p>
                )}
                <div
                  className={`${section.title || section.description ? "mt-14" : ""} aspect-[16/8] overflow-hidden rounded-[2.5rem] bg-cream`}
                  data-reveal
                >
                  <img
                    src={section.image}
                    alt={section.imageAlt || section.title}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="h-full w-full object-cover"
                  />
                </div>
                {button}
              </section>
            );
          }

          if (section.type === "VALUE_CARDS") {
            return (
              <section key={section.id} id="values" className="scroll-mt-28">
                {heading}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item, itemIndex) => (
                    <article
                      key={`${item.title}-${itemIndex}`}
                      className="rounded-[2rem] bg-cream p-8"
                      data-reveal
                    >
                      <h3 className="display-md text-primary">{item.title}</h3>
                      <p className="mt-4 text-lg text-muted-foreground">{item.description}</p>
                    </article>
                  ))}
                </div>
                {button}
              </section>
            );
          }

          if (section.type === "JOURNEY_TIMELINE") {
            return (
              <section key={section.id} id="journey" className="scroll-mt-28">
                {heading}
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {section.items.map((item, itemIndex) => (
                    <article
                      key={`${item.title}-${itemIndex}`}
                      className="rounded-[2rem] bg-primary p-7 text-primary-foreground"
                      data-reveal
                    >
                      <p className="text-4xl font-medium">{item.title}</p>
                      <p className="mt-6 opacity-80">{item.description}</p>
                    </article>
                  ))}
                </div>
                {button}
              </section>
            );
          }

          if (section.type === "TEAM") {
            return (
              <section key={section.id} id="team" className="scroll-mt-28">
                {heading}
                <div className="mt-10">
                  <TeamMembers />
                </div>
                {button}
              </section>
            );
          }

          return (
            <section
              key={section.id}
              id="about-cta"
              className="flex flex-col items-start justify-between gap-8 rounded-[2.5rem] bg-cream p-8 sm:p-10 md:flex-row md:items-center md:p-16"
            >
              <div>
                {heading}
                {section.description && (
                  <p className="mt-4 max-w-2xl text-lg text-muted-foreground" data-reveal>
                    {section.description}
                  </p>
                )}
              </div>
              {button}
            </section>
          );
        })}
    </div>
  );
}
