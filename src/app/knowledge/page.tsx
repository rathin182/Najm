"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ARTICLES } from "@/data/site";
import { useReveal } from "@/components/site/motion";


function Knowledge() {
  const cats = ["All", ...Array.from(new Set(ARTICLES.map((a) => a.c)))];
  const [cat, setCat] = useState("All");
  const list = ARTICLES.filter((a) => cat === "All" || a.c === cat);
  const [lead, ...rest] = list;
  useReveal([cat]);
  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="display-xl" data-reveal><span className="fancy">Knowledge</span> Hub</h1>
        <p className="mt-6 max-w-2xl text-xl text-muted-foreground">Clear, practical insight on buying, investing and living in Saudi Arabia.</p>
        <div className="mt-10 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-5 py-2.5 transition-colors ${cat === c ? "bg-primary text-primary-foreground" : "bg-cream hover:bg-primary/10"}`}>{c}</button>
          ))}
        </div>
        {lead && (
          <Link href="/contact" className="group mt-12 grid gap-8 rounded-[2.5rem] bg-cream p-3 md:grid-cols-2" data-reveal>
            <div className="aspect-[4/3] overflow-hidden rounded-[2rem]"><img src={lead.img} alt={lead.t} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
            <div className="flex flex-col justify-center p-6">
              <p className="text-muted-foreground">{lead.c} · {lead.m} min read</p>
              <h2 className="display-md mt-4">{lead.t}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{lead.d}</p>
              <span className="mt-8 flex items-center gap-2 text-lg text-primary">Request the full guide <ArrowUpRight className="h-5 w-5" /></span>
            </div>
          </Link>
        )}
        <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <Link key={a.slug} href="/contact" className="group block" data-reveal>
              <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem]"><img src={a.img} alt={a.t} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
              <p className="mt-5 text-sm text-muted-foreground">{a.c} · {a.m} min read</p>
              <p className="mt-2 text-xl font-medium leading-snug tracking-tight">{a.t}</p>
              <p className="mt-2 text-muted-foreground">{a.d}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Knowledge;
