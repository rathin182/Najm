"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TeamMember } from "@/lib/team";

function tenure(joinedAt: string): string {
  if (!joinedAt) return "Tenure not listed";
  const start = new Date(`${joinedAt}T00:00:00`);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0)
    return `Joined ${new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(start)}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0)
    return `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"} at Najm`;
  if (remainingMonths === 0) return `${years} ${years === 1 ? "year" : "years"} at Najm`;
  return `${years} ${years === 1 ? "year" : "years"}, ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"} at Najm`;
}

export function TeamMembers() {
  const section = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<TeamMember | null>(null);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void fetch("/api/team", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) throw new Error("Could not load team.");
            return response.json() as Promise<TeamMember[]>;
          })
          .then((team) => {
            if (!cancelled) setMembers(team);
          })
          .catch(() => {
            if (!cancelled) setMembers([]);
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

  return (
    <div ref={section}>
      {!loaded ? (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Loading team profiles"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              aria-hidden
              className="aspect-[4/5] animate-pulse rounded-[2rem] bg-cream"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">Team profiles are temporarily unavailable.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelected(member)}
              aria-haspopup="dialog"
              aria-label={`View ${member.name}, ${member.role}`}
              className="group min-w-0 text-left"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-cream">
                <img
                  src={member.image}
                  alt={member.imageAlt || member.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-4 text-xl font-medium">{member.name}</p>
              <p className="text-primary">{member.role}</p>
              <p className="mt-2 line-clamp-3 text-muted-foreground">{member.bio}</p>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[1.5rem] p-3 sm:p-5">
          {selected && (
            <div className="grid overflow-hidden rounded-[1.1rem] sm:grid-cols-[minmax(220px,0.8fr)_1.2fr]">
              <div className="aspect-[4/5] max-h-[60vh] overflow-hidden rounded-xl bg-cream sm:max-h-[none]">
                <img
                  src={selected.image}
                  alt={selected.imageAlt || selected.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8">
                <DialogHeader>
                  <p className="text-sm text-primary">{selected.role}</p>
                  <DialogTitle className="text-3xl font-medium">{selected.name}</DialogTitle>
                  <DialogDescription className="sr-only">Team member profile</DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-5">
                  <p className="text-base leading-relaxed text-muted-foreground">{selected.bio}</p>
                  {selected.specialty && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Specialty</p>
                      <p className="mt-1 font-medium">{selected.specialty}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">At Najm</p>
                    <p className="mt-1 font-medium">{tenure(selected.joinedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
